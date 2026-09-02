/**
 * Cloudflare Worker for floodreliefnepal.com.
 *
 * `GET /api/ledger` serves the payload. Everything else falls through to the
 * static assets Astro built.
 *
 * Three things can run the indexer. For a long time only two of them worked,
 * because Cloudflare's cron never once invoked this Worker: three separate
 * Workers on this account, one written entirely in the dashboard, all
 * registered a schedule that Cloudflare accepted, reported back and displayed,
 * and none of them ever fired. It fires now. That is good news that arrived as
 * an outage, because the three had been sized on the assumption that the cron
 * was dead, and the moment it woke up they added up to about 65 runs an hour
 * and spent the KV free plan's whole daily write budget by nine in the morning.
 * So the order below is now a hierarchy rather than three equal chances.
 *
 * 1. The cron, every ten minutes. This is the one that runs, and the interval
 *    is a KV write budget rather than a freshness judgement. See wrangler.jsonc.
 * 2. `POST /api/refresh`, called by an outside scheduler every five minutes.
 *    The standby. While the cron is healthy every POST arrives inside
 *    REFRESH_MIN_INTERVAL_MS and is skipped for one KV read; if the cron stops
 *    the window lapses and this picks the cadence back up within five minutes.
 * 3. A `GET /api/ledger` that finds the data older than five minutes starts a
 *    refresh behind the response. Every page load fetches that endpoint for the
 *    freshness line, so readers keep the figures current by reading them. A
 *    ten-minute cron keeps the data inside that window, so this too now costs
 *    nothing until both of the others are gone.
 *
 * Each covers a gap the one above it has: the cron was dead for months without
 * saying so, the scheduler is a third party that can quietly die, and traffic
 * driven refresh does nothing at four in the morning.
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

/** Secrets are not in wrangler.jsonc, so the generated Env does not know them. */
type WorkerEnv = Env & { REFRESH_TOKEN?: string };

const LEDGER_KEY = 'ledger';

/**
 * When the last indexer run started, written before the run rather than after,
 * so a run that dies still holds the others off instead of inviting a retry
 * storm.
 *
 * This one key does two jobs. It rate limits `POST /api/refresh`, and it is the
 * lock that stops concurrent readers all starting their own refresh. KV reads
 * are eventually consistent and can be served from an edge cache, so within a
 * propagation window two visitors can both see a stale value and both start a
 * run. That is acceptable here: the indexer is idempotent against the
 * (tx_hash, log_index) primary key, so the cost of a double run is a little
 * wasted Etherscan quota, never wrong data.
 */
const LAST_RUN_KEY = 'last-run';

/**
 * When the chain was last read *successfully*, written only after the indexer
 * returns. `last-run` records an attempt and is written before the work, which
 * is what makes it a usable lock, and is exactly why it must not be the thing
 * the page reports. An indexer failing on every attempt still advances an
 * attempt, and a page saying "last read the chain a minute ago" on the back of
 * that would be a lie of the same shape as the two this feature already had.
 */
const LAST_OK_KEY = 'last-ok';

/**
 * A caller may not force a run more often than this.
 *
 * Set just under the cron's ten minutes, which turns the outside scheduler
 * from a second cron into a standby. At thirty seconds its five-minute POST
 * almost always fell outside the window and did the work again, so the two
 * schedules added up and together they cost more KV writes a day than the free
 * plan allows. Now, while the cron is firing, every POST lands inside the
 * window and is skipped for the price of one KV read. If the cron stops, the
 * window lapses and the next POST runs, so the floor is still a floor and it
 * comes back within five minutes.
 */
const REFRESH_MIN_INTERVAL_MS = 9 * 60 * 1000;

/**
 * Older than this and the next reader's request starts a refresh behind it.
 *
 * Must stay comfortably above the cron interval or it inverts: at five minutes
 * against a ten minute cron, `last-run` is stale for most of every cycle and
 * ordinary page loads start firing their own runs at two KV writes each, which
 * would put the write budget straight back over the free plan's daily cap. At
 * fifteen it only fires once the cron has missed about one and a half ticks,
 * which is the case it exists for.
 */
const REFRESH_STALE_AFTER_MS = 15 * 60 * 1000;

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
function ledgerResponse(
	body: string,
	source: string,
	updatedAt: string | null,
	lastRun: number,
): Response {
	const headers: Record<string, string> = {
		'content-type': 'application/json; charset=utf-8',
		'cache-control': CACHE_CONTROL,
		'x-ledger-source': source,
	};

	// Two different clocks, and conflating them is what made a healthy feed
	// report itself as stale. `updated_at` is when these figures were produced,
	// and it only moves when a run finds something worth writing. This is when
	// the chain was last read, which is the one that answers "is the feed
	// alive". A run that reads the chain and finds nothing new moves this and
	// not the other.
	if (lastRun > 0) {
		headers['x-ledger-last-run'] = new Date(lastRun).toISOString();
		headers['x-ledger-last-run-age'] = String(Math.max(0, Math.round((Date.now() - lastRun) / 1000)));
	}

	const read = updatedAt ? Date.parse(updatedAt) : Number.NaN;
	if (!Number.isNaN(read)) {
		headers['x-ledger-updated-at'] = new Date(read).toISOString();
		headers['x-ledger-age'] = String(Math.max(0, Math.round((Date.now() - read) / 1000)));
	}

	return new Response(body, { headers });
}

/**
 * Deduplicates refreshes inside one isolate.
 *
 * The KV timestamp alone does not do it. Three concurrent readers all read the
 * old value before any of them writes the new one, so all three start a run,
 * which is exactly what happened when this was tested. An isolate lives across
 * requests, so a promise handle here collapses a burst into one run.
 *
 * Deliberate use of isolate state, unlike the counters in the indexer, which
 * live inside the run precisely because an isolate outlives it. This holds a
 * handle to work in progress, which is the one thing that should be shared.
 *
 * Two isolates in two locations can still race. The KV timestamp bounds that,
 * and the indexer is idempotent, so the cost is a little Etherscan quota.
 */
let inFlight: Promise<unknown> | null = null;

function startRefresh(env: WorkerEnv, ctx: ExecutionContext, reason: string): void {
	if (!inFlight) {
		inFlight = refresh(env)
			.catch((error: unknown) => {
				console.error(`${reason} refresh failed:`, error instanceof Error ? error.message : error);
			})
			.finally(() => {
				inFlight = null;
			});
	}
	ctx.waitUntil(inFlight);
}

async function timestampAt(env: WorkerEnv, key: string): Promise<number> {
	const raw = await env.LEDGER.get(key);
	const at = raw ? Date.parse(raw) : Number.NaN;
	return Number.isNaN(at) ? 0 : at;
}

/** Last attempt. Gates the rate limit and the traffic refresh. */
const lastRunAt = (env: WorkerEnv) => timestampAt(env, LAST_RUN_KEY);

/** Last success. The only one the page is allowed to call a read. */
const lastOkAt = (env: WorkerEnv) => timestampAt(env, LAST_OK_KEY);

/**
 * Constant time compare, so a caller cannot learn the token one byte at a time
 * from how long the comparison takes. Length is compared first and does leak,
 * which is standard and harmless for a random token.
 */
function tokenMatches(provided: string, expected: string): boolean {
	const encoder = new TextEncoder();
	const a = encoder.encode(provided);
	const b = encoder.encode(expected);
	if (a.byteLength !== b.byteLength) return false;
	return crypto.subtle.timingSafeEqual(a, b);
}

async function refresh(env: WorkerEnv): Promise<{ changed: boolean; payload: LedgerPayload }> {
	// Claim the slot before doing any work, so the three callers cannot pile up.
	await env.LEDGER.put(LAST_RUN_KEY, new Date().toISOString());

	const { payload, stats } = await runIndexer({
		etherscanApiKey: env.ETHERSCAN_API_KEY,
		supabaseUrl: env.SUPABASE_URL,
		supabaseSecretKey: env.SUPABASE_SECRET_KEY,
		log: (message) => console.log(message),
	});

	// Past this line the chain really was read, so this is safe to publish.
	await env.LEDGER.put(LAST_OK_KEY, new Date().toISOString());

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
	async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// The floor. An outside scheduler posts here every five minutes.
		if (url.pathname === '/api/refresh') {
			if (request.method !== 'POST') {
				// GET is refused outright, which rules out the whole class of
				// accidental triggering by crawlers, prefetchers and previews.
				return new Response('Method not allowed', {
					status: 405,
					headers: { allow: 'POST' },
				});
			}

			const expected = env.REFRESH_TOKEN;
			if (!expected) {
				// Fail closed. A missing secret must never mean an open endpoint.
				console.error('POST /api/refresh called but REFRESH_TOKEN is not set');
				return new Response('Refresh is not configured', { status: 503 });
			}

			const provided = request.headers.get('x-refresh-token');
			if (!provided || !tokenMatches(provided, expected)) {
				return new Response('Unauthorized', { status: 401 });
			}

			const since = Date.now() - (await lastRunAt(env));
			if (since < REFRESH_MIN_INTERVAL_MS) {
				// Still caps what a leaked token is worth at one run every thirty
				// seconds, but answers 200. Schedulers count any non 2xx as a
				// failure and some disable a job after enough of them, so a
				// correctly skipped tick must not look like a broken one. The
				// caller is told plainly that nothing ran.
				return Response.json({
					ok: true,
					skipped: 'ran recently',
					seconds_since_last_run: Math.round(since / 1000),
				});
			}

			// Awaited rather than backgrounded, so the scheduler's own alerting
			// sees a real status code and a real summary instead of an instant
			// 202 that hides a failing indexer.
			try {
				const { changed, payload } = await refresh(env);
				return Response.json({
					ok: true,
					changed,
					updated_at: payload.updated_at,
					donation_count: payload.totals.donation_count,
					usd_received: payload.totals.usd_received,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error('refresh failed:', message);
				return Response.json({ ok: false, error: message }, { status: 500 });
			}
		}

		if (url.pathname === '/api/ledger') {
			if (request.method !== 'GET' && request.method !== 'HEAD') {
				return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
			}

			// Every page load hits this endpoint for the freshness line, so a
			// reader arriving at stale data starts the refresh that fixes it.
			// The response below is not held up for it.
			// Gated on the last attempt, so an indexer that is failing is retried
			// on a schedule rather than by every single reader.
			const lastRun = await lastRunAt(env);
			if (Date.now() - lastRun > REFRESH_STALE_AFTER_MS) startRefresh(env, ctx, 'traffic');
			const lastOk = await lastOkAt(env);

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
				return ledgerResponse(stored.value, 'kv', updatedAt, lastOk);
			}
			return ledgerResponse(
				JSON.stringify(buildTimeLedger),
				'build',
				buildTimeLedger.updated_at,
				lastOk,
			);
		}

		return env.ASSETS.fetch(request);
	},

	/**
	 * The primary. Registered in wrangler.jsonc, dead for months, and firing
	 * again since early September, which is why the other two callers are now
	 * gated behind intervals wide enough to stay out of its way.
	 */
	async scheduled(_event: ScheduledController, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
		// A failed tick leaves the previous payload in place. Serving the last
		// good figures beats serving nothing.
		startRefresh(env, ctx, 'cron');
	},
};
