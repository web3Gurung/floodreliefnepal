/**
 * Cloudflare Worker for floodreliefnepal.com.
 *
 * Two jobs.
 *
 * 1. A cron every 60 seconds runs the indexer and, when anything a reader would
 *    see has changed, writes the payload to KV under `ledger`.
 * 2. `GET /api/ledger` serves that payload. Everything else falls through to the
 *    static assets Astro built.
 *
 * The frontend never calls Etherscan. The keys stay here, the page loads from a
 * cached blob, and a traffic spike costs nothing.
 *
 * `buildTimeLedger` is the copy committed in the repo. It is what the Astro page
 * renders at build time, and it is what this endpoint serves until the first
 * cron tick fills KV, so a cold namespace answers with real figures rather than
 * an error or a zero.
 */

import buildTimeLedger from '../src/data/ledger.json';
import { payloadChanged, runIndexer, type LedgerPayload } from './indexer.ts';

// `Env` comes from worker-configuration.d.ts, which `npx wrangler types`
// generates from wrangler.jsonc. Declaring it by hand here would let the two
// drift apart the first time a binding changes.

const LEDGER_KEY = 'ledger';
const CACHE_CONTROL = 'public, max-age=30, stale-while-revalidate=300';

function json(payload: unknown, source: string): Response {
	return new Response(JSON.stringify(payload), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': CACHE_CONTROL,
			// Says whether this answer came from the cron or from the committed
			// build time copy, so a reader can tell a stale namespace from a
			// live one without guessing.
			'x-ledger-source': source,
		},
	});
}

async function refresh(env: Env): Promise<{ changed: boolean; payload: LedgerPayload }> {
	const { payload, stats } = await runIndexer({
		etherscanApiKey: env.ETHERSCAN_API_KEY,
		supabaseUrl: env.SUPABASE_URL,
		supabaseSecretKey: env.SUPABASE_SECRET_KEY,
		log: (message) => console.log(message),
	});

	const stored = (await env.LEDGER.get<LedgerPayload>(LEDGER_KEY, 'json')) ?? null;
	const changed = payloadChanged(stored, payload);

	// Write only when something moved. An unchanged payload with a fresh
	// timestamp is not new information, and rewriting it every minute would
	// churn KV for nothing.
	if (changed) await env.LEDGER.put(LEDGER_KEY, JSON.stringify(payload));

	console.log(
		`indexed blocks ${stats.startBlock} to ${stats.headBlock}, ` +
			`${stats.inserted} new rows, ${stats.backfilled} priced, ` +
			`${payload.totals.donation_count} donations, ${payload.totals.usd_received} USD, ` +
			`kv ${changed ? 'written' : 'unchanged'}`,
	);

	return { changed, payload };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/api/ledger') {
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
			}

			const stored = await env.LEDGER.get(LEDGER_KEY, 'text');
			if (stored) {
				return new Response(stored, {
					headers: {
						'content-type': 'application/json; charset=utf-8',
						'cache-control': CACHE_CONTROL,
						'x-ledger-source': 'kv',
					},
				});
			}
			return json(buildTimeLedger, 'build');
		}

		return env.ASSETS.fetch(request);
	},

	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		ctx.waitUntil(
			refresh(env).catch((error: unknown) => {
				// A failed tick leaves the previous payload in place. Serving the
				// last good figures beats serving nothing.
				console.error('indexer run failed:', error instanceof Error ? error.message : error);
			}),
		);
	},
};
