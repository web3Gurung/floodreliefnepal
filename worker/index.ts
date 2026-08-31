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

/**
 * Longest the stored payload may claim to be, while the cron is healthy.
 *
 * Writing only when the figures change is right for KV's free write budget, but
 * on its own it means a quiet night leaves `updated_at` frozen, the age climbs,
 * and the page calls a perfectly healthy feed dead. So a run also writes when
 * the stored copy is older than this, which bounds the age at roughly half an
 * hour and still costs about 48 writes a day.
 */
const REFRESH_FLOOR_MS = 30 * 60 * 1000;
const CACHE_CONTROL = 'public, max-age=30, stale-while-revalidate=300';

/**
 * Every answer carries how old it is. A dead cron and a healthy one return the
 * same body for hours, so the age is the only thing that tells them apart from
 * outside. `x-ledger-source` says where the body came from, `x-ledger-age`
 * says how many seconds ago the chain was actually read.
 */
function ledgerResponse(body: string, source: string, updatedAt: string | null): Response {
	const headers: Record<string, string> = {
		'content-type': 'application/json; charset=utf-8',
		'cache-control': CACHE_CONTROL,
		'x-ledger-source': source,
	};

	const read = updatedAt ? Date.parse(updatedAt) : Number.NaN;
	if (!Number.isNaN(read)) {
		headers['x-ledger-updated-at'] = new Date(read).toISOString();
		headers['x-ledger-age'] = String(Math.max(0, Math.round((Date.now() - read) / 1000)));
	}

	return new Response(body, { headers });
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
	const storedAge = stored ? Date.now() - Date.parse(stored.updated_at) : Number.POSITIVE_INFINITY;
	const write = changed || storedAge > REFRESH_FLOOR_MS;

	// The timestamp goes in the metadata as well, so serving a response can
	// report the age without parsing the whole blob.
	if (write) {
		await env.LEDGER.put(LEDGER_KEY, JSON.stringify(payload), {
			metadata: { updatedAt: payload.updated_at },
		});
	}

	console.log(
		`indexed blocks ${stats.startBlock} to ${stats.headBlock}, ` +
			`${stats.inserted} new rows, ${stats.backfilled} priced, ` +
			`${payload.totals.donation_count} donations, ${payload.totals.usd_received} USD, ` +
			`kv ${write ? (changed ? 'written, figures moved' : 'written, keeping the age honest') : 'unchanged'}`,
	);

	return { changed: write, payload };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/api/ledger') {
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
			}

			const stored = await env.LEDGER.getWithMetadata<{ updatedAt?: string }>(LEDGER_KEY, 'text');
			if (stored.value) {
				// The cron always writes the timestamp into the metadata. An entry
				// put there by hand has none, and an answer with no age is the one
				// thing this endpoint must not give, so fall back to the body.
				let updatedAt = stored.metadata?.updatedAt ?? null;
				if (!updatedAt) {
					try {
						updatedAt = (JSON.parse(stored.value) as LedgerPayload).updated_at ?? null;
					} catch {
						updatedAt = null;
					}
				}
				return ledgerResponse(stored.value, 'kv', updatedAt);
			}
			return ledgerResponse(JSON.stringify(buildTimeLedger), 'build', buildTimeLedger.updated_at);
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
