/**
 * Nepal Relief inbound donation indexer.
 *
 * Runtime agnostic on purpose. It reads only fetch, URL, BigInt and JSON, so the
 * same code runs under Node for `npm run index:donations` and inside the
 * Cloudflare Worker on its cron. Nothing here reads an environment variable, a
 * file, or a console: callers pass credentials in and take the payload out.
 *
 * Every piece of per run state lives inside `runIndexer`. A Worker isolate
 * survives between invocations, so module level counters would accumulate
 * across runs and report numbers from a previous cron tick.
 */

// ---------------------------------------------------------------- constants

export const RECEIVING_ADDRESS = '0xA891BB5abf91aBf1796074a1303E75754AF1823D';

const ADDRESS = RECEIVING_ADDRESS.toLowerCase();
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const CHAIN_ID = '1';
const CHAIN_LABEL = 'Ethereum mainnet';
const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';
const LLAMA_BASE = 'https://coins.llama.fi';

/** The free plan caps a request at 1000 records and 5 calls a second. */
const PAGE_SIZE = 1000;
const ETHERSCAN_MIN_INTERVAL_MS = 260;
const LLAMA_MIN_INTERVAL_MS = 220;

const STATE_KEY = 'last_indexed_block';
const RECONCILE_KEY = 'last_full_reconcile';
const RECENT_LIMIT = 50;

/**
 * Where a scan stops, measured back from the node tip.
 *
 * `eth_blockNumber` is the head of Etherscan's node. The account indexes the
 * three list actions read from (`tokentx` above all) are a separate pipeline
 * that trails that head, by a few blocks most of the time and by minutes under
 * load. Measured on 3 September: `tokentx` for an address that moves tokens
 * every block sat frozen 5 to 11 blocks behind the tip across a minute while
 * `txlist` stayed within one. A scan bounded at the tip asks for rows the
 * index does not hold yet, gets an honest empty answer, and if the stored
 * watermark then advances to the tip those rows are never asked for again.
 * That is how a $50,000 USDC transfer and a $0.94 one went missing on
 * 2 September: both landed in the gap between the token index and the tip at
 * the moment a run happened.
 *
 * Etherscan publishes no "indexed up to" figure, so the lag cannot be read;
 * it can only be allowed for. Twelve blocks is about two and a half minutes at
 * twelve seconds a block, several times the lag observed. It is not the whole
 * defence, see OVERLAP_BLOCKS.
 */
const SAFETY_LAG_BLOCKS = 12;

/**
 * How far behind the stored watermark each scan starts.
 *
 * Re-reading is free: the (tx_hash, log_index) primary key makes every upsert
 * idempotent, and the address has had 25 donations in five days, so the
 * window costs the same three Etherscan calls it always did. Nine hundred
 * blocks is about three hours. A transfer is lost only if the token index
 * stays more than three hours behind the tip for every run across those three
 * hours, which the daily reconcile below would then catch and repair anyway.
 */
const OVERLAP_BLOCKS = 900;

/**
 * Once a day a run scans from block zero instead of the window, compares the
 * chain's full inbound list against the table, inserts anything missing and
 * says so loudly. This is the check that would have caught the September loss
 * on the day it happened.
 */
const RECONCILE_EVERY_MS = 24 * 60 * 60 * 1000;

/** Priced at 1.00 USD. Anything absent from this set needs a real lookup. */
const STABLE_SYMBOLS = new Set(['USDC', 'USDT', 'DAI']);

/** DefiLlama returns a confidence with every price. Below this we publish none. */
export const MIN_PRICE_CONFIDENCE = 0.9;

/**
 * Etherscan returns no log index on any of the three account actions, and the
 * primary key needs one that is stable across runs. Each source gets a disjoint
 * range, offset by the row's position inside its own transaction. Etherscan
 * returns those rows in a fixed order, so the same row gets the same key every
 * time.
 */
const LOG_INDEX_NATIVE = 0;
const LOG_INDEX_INTERNAL_BASE = 1_000_000;
const LOG_INDEX_TOKEN_BASE = 2_000_000;

// ---------------------------------------------------------------- types

export type IndexerConfig = {
	etherscanApiKey: string;
	supabaseUrl: string;
	supabaseSecretKey: string;
	/** Optional progress sink. The Worker passes console.log, the script prints. */
	log?: (message: string) => void;
	/**
	 * Scan from block zero and reconcile the whole table against the chain,
	 * regardless of when that last happened. `npm run index:donations:full`.
	 */
	fullRescan?: boolean;
};

export type LedgerIntegrityIssue =
	| {
			kind: 'balance_mismatch';
			token_symbol: string;
			amount_received: string;
			sent_onward: string;
			expected_balance: string;
			balance_held: string;
			difference: string;
	  }
	| { kind: 'rows_missing'; count: number; tx_hashes: string[] }
	| { kind: 'rows_not_on_chain'; count: number; tx_hashes: string[] };

/**
 * Whether the figures add up. `ok` is false when the balance an asset's
 * contract reports for the address is not what the recorded donations, minus
 * recorded outflows, say it should be, or when a full reconcile found rows the
 * chain and the table disagree on. The page withholds the total while this is
 * false rather than publish a number known to be wrong.
 */
export type LedgerIntegrity = {
	ok: boolean;
	checked_at: string;
	/** When the whole table was last compared against the chain from block zero. */
	last_reconciled_at: string | null;
	issues: LedgerIntegrityIssue[];
};

export type LedgerEntry = {
	tx_hash: string;
	block_time: string;
	from_address: string;
	token_symbol: string;
	amount_token: string;
	usd_at_receipt: number | null;
};

export type LedgerTokenTotal = {
	token_symbol: string;
	token_address: string | null;
	donation_count: number;
	amount_received: string;
	usd_received: number;
	unpriced_count: number;
	balance_held: string;
};

export type LedgerPayload = {
	updated_at: string;
	address: string;
	chain: string;
	pricing: {
		source: string;
		basis: string;
		stablecoins_at_one: string[];
		min_confidence: number;
	};
	totals: {
		usd_received: number;
		donation_count: number;
		unpriced_count: number;
		unpriced_tokens: string[];
		low_confidence_count: number;
		low_confidence_tokens: string[];
		excluded_count: number;
		usd_sent_onward: number;
	};
	by_token: LedgerTokenTotal[];
	integrity: LedgerIntegrity;
	/**
	 * The most recent RECENT_LIMIT donations, newest first, and deliberately
	 * the only rows in the payload.
	 *
	 * This used to sit beside an `all` holding every donation ever. The page
	 * never rendered it; it read `all.length` for one count that
	 * `totals.donation_count` already gives. Meanwhile the blob is what goes
	 * into KV, at roughly 630 bytes a donation, and KV caps a value at 25 MB.
	 * Carrying `all` made the cache grow without bound to answer a question it
	 * was already answering. Supabase `inflows` is the full record, and it
	 * stays the full record.
	 */
	recent: LedgerEntry[];
};

export type ReconcileResult = {
	/** Inbound rows the chain has and the table did not, before this run wrote. */
	missing: { tx_hash: string; token_symbol: string; amount_token: string; block_number: number }[];
	/** Rows the table has and the chain does not. Never deleted here, only reported. */
	unknown: { tx_hash: string; token_symbol: string; amount_token: string }[];
	chainRows: number;
	tableRowsBefore: number;
};

export type IndexerStats = {
	startBlock: number;
	/** Last block asked for. `headBlock` minus the safety lag. */
	endBlock: number;
	headBlock: number;
	coldStart: boolean;
	/** True when this run scanned from block zero and reconciled the table. */
	fullScan: boolean;
	reconcile: ReconcileResult | null;
	fetched: { native: number; internal: number; token: number };
	inbound: number;
	inserted: number;
	ignored: number;
	backfilled: number;
	dropped: { failedNative: number; failedInternal: number; failedToken: number; outbound: number };
	pricingNotes: string[];
};

export type IndexerResult = { payload: LedgerPayload; stats: IndexerStats };

// ---------------------------------------------------------------- pure helpers

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Exact decimal arithmetic. Token amounts must not touch binary floats. */
export function formatUnits(raw: string, decimals: number): string {
	const digits = raw.padStart(decimals + 1, '0');
	const whole = digits.slice(0, digits.length - decimals);
	const fraction = decimals > 0 ? digits.slice(digits.length - decimals).replace(/0+$/, '') : '';
	return fraction ? `${whole}.${fraction}` : whole;
}

function scaleDecimal(value: string, scale: number): bigint {
	const [whole, fraction = ''] = value.split('.');
	return BigInt((whole === '' ? '0' : whole) + fraction.padEnd(scale, '0').slice(0, scale));
}

function sumDecimals(values: string[], scale = 18): string {
	let total = 0n;
	for (const value of values) total += scaleDecimal(value, scale);
	return formatUnits(total.toString(), scale);
}

function multiplyDecimal(amount: string, price: number, scale = 6): string {
	// The price arrives from an API as a float, so the product is a float too.
	// Scale and round once here, then keep the result as a string from now on.
	const product = Number(amount) * price;
	const fixed = (Math.round(product * 10 ** scale) / 10 ** scale).toFixed(scale);
	return fixed.replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Recovers a token's decimals from the two amounts already stored, so a balance
 * can be formatted without a decimals column and without assuming six.
 */
function inferDecimals(amountRaw: string, amountToken: string): number {
	for (let decimals = 0; decimals <= 36; decimals += 1) {
		if (scaleDecimal(amountToken, decimals).toString() === amountRaw) return decimals;
	}
	return 18;
}

function round2(value: string | number): number {
	return Math.round(Number(value) * 100) / 100;
}

/** Exact `a - b` on decimal strings. Negative results keep their sign. */
function subtractDecimals(a: string, b: string, scale = 18): string {
	const difference = scaleDecimal(a, scale) - scaleDecimal(b, scale);
	const sign = difference < 0n ? '-' : '';
	return `${sign}${formatUnits((difference < 0n ? -difference : difference).toString(), scale)}`;
}

/** Exact equality on decimal strings, so "50000" and "50000.000000" agree. */
function sameDecimal(a: string, b: string, scale = 18): boolean {
	return scaleDecimal(a, scale) === scaleDecimal(b, scale);
}

/**
 * True when two payloads differ in anything a reader would see. `updated_at`
 * moves on every run, so comparing it would rewrite KV on every cron tick.
 */
export function payloadChanged(before: LedgerPayload | null, after: LedgerPayload): boolean {
	if (!before) return true;
	// `integrity.checked_at` moves on every run too. The verdict and the issues
	// are what a reader sees; the clock is not.
	const strip = (payload: LedgerPayload) =>
		JSON.stringify({
			...payload,
			updated_at: '',
			integrity: payload.integrity ? { ...payload.integrity, checked_at: '' } : undefined,
		});
	return strip(before) !== strip(after);
}

// ---------------------------------------------------------------- run

export async function runIndexer(config: IndexerConfig): Promise<IndexerResult> {
	const log = config.log ?? (() => {});

	const dropped = { failedNative: 0, failedInternal: 0, failedToken: 0, outbound: 0 };
	const pricingNotes: string[] = [];
	const contractCache = new Map<string, boolean>();
	const newContractCacheRows: { address: string; is_contract: boolean }[] = [];
	const priceCache = new Map<string, { price: number; confidence: number } | null>();
	const unpricedReason = new Map<string, 'low_confidence' | 'no_price'>();
	let lastEtherscanCall = 0;
	let lastLlamaCall = 0;

	// ------------------------------------------------------------ etherscan

	type EtherscanBody = { status?: string; message?: string; result?: unknown };

	async function etherscan(params: Record<string, string | number>): Promise<EtherscanBody> {
		const url = new URL(ETHERSCAN_BASE);
		url.searchParams.set('chainid', CHAIN_ID);
		for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
		url.searchParams.set('apikey', config.etherscanApiKey);

		for (let attempt = 1; attempt <= 4; attempt += 1) {
			const wait = ETHERSCAN_MIN_INTERVAL_MS - (Date.now() - lastEtherscanCall);
			if (wait > 0) await sleep(wait);
			lastEtherscanCall = Date.now();

			const response = await fetch(url, { headers: { accept: 'application/json' } });
			const body = (await response.json()) as EtherscanBody;
			const throttled =
				typeof body.result === 'string' && body.result.toLowerCase().includes('rate limit');

			if (response.ok && !throttled) return body;
			if (attempt === 4) {
				// The URL carries the key, so report the action only.
				throw new Error(`Etherscan ${params.action} failed after 4 attempts, http ${response.status}`);
			}
			await sleep(attempt * 1200);
		}
		throw new Error('unreachable');
	}

	async function headBlock(): Promise<number> {
		const body = await etherscan({ module: 'proxy', action: 'eth_blockNumber' });
		return Number.parseInt(String(body.result), 16);
	}

	/**
	 * Every account action is bounded by the same endblock, so the three lists
	 * cannot drift apart while the run is in flight. That is what makes the
	 * stored last indexed block safe to advance.
	 */
	async function fetchAccountRows<T>(action: string, startBlock: number, endBlock: number): Promise<T[]> {
		const rows: T[] = [];
		for (let page = 1; ; page += 1) {
			const body = await etherscan({
				module: 'account',
				action,
				address: ADDRESS,
				startblock: startBlock,
				endblock: endBlock,
				page,
				offset: PAGE_SIZE,
				sort: 'asc',
			});

			if (body.status !== '1') {
				const message = String(body.message ?? '');
				if (message.startsWith('No transactions found') || message.startsWith('No records found')) break;
				throw new Error(`Etherscan ${action}: ${message}`);
			}

			const batch = (body.result ?? []) as T[];
			rows.push(...batch);
			if (batch.length < PAGE_SIZE) break;
		}
		return rows;
	}

	// ------------------------------------------------------------ supabase

	async function supabase(path: string, init: RequestInit = {}): Promise<Response> {
		const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, {
			...init,
			headers: {
				apikey: config.supabaseSecretKey,
				Authorization: `Bearer ${config.supabaseSecretKey}`,
				'Content-Type': 'application/json',
				...(init.headers ?? {}),
			},
		});
		if (!response.ok) {
			throw new Error(
				`Supabase ${init.method ?? 'GET'} ${path}: ${response.status} ${(await response.text()).slice(0, 400)}`,
			);
		}
		return response;
	}

	async function supabaseJson<T>(path: string, init: RequestInit = {}): Promise<T> {
		return (await (await supabase(path, init)).json()) as T;
	}

	// ------------------------------------------------------------ route labels

	/**
	 * The route column stays in the database and stays populated, and it reaches
	 * neither the payload nor the page. A smart contract wallet is a contract,
	 * and one sender here is an EIP-7702 delegated wallet, so this label cannot
	 * carry a public claim about how someone gave.
	 */
	async function isContract(address: string): Promise<boolean> {
		const key = address.toLowerCase();
		const cached = contractCache.get(key);
		if (cached !== undefined) return cached;

		const body = await etherscan({ module: 'proxy', action: 'eth_getCode', address: key, tag: 'latest' });
		const code = typeof body.result === 'string' ? body.result : '0x';
		const flag = code.length > 2;

		contractCache.set(key, flag);
		newContractCacheRows.push({ address: key, is_contract: flag });
		return flag;
	}

	async function routeFor(from: string, mintedFromZero: boolean): Promise<'direct' | 'routed'> {
		if (mintedFromZero) return 'routed';
		return (await isContract(from)) ? 'routed' : 'direct';
	}

	// ------------------------------------------------------------ pricing

	type PriceOutcome = {
		usd: string | null;
		reason: 'stable' | 'priced' | 'low_confidence' | 'no_price';
	};

	function coinKey(tokenAddress: string | null): string {
		return `ethereum:${tokenAddress ?? ZERO_ADDRESS}`;
	}

	/**
	 * DefiLlama, one source and no fallback chain. It prices any ERC-20 by
	 * contract address, so there is no token to id map to maintain, and it
	 * returns a confidence with every answer.
	 */
	async function llamaPrice(tokenAddress: string | null, unixSeconds: number) {
		const key = `${coinKey(tokenAddress)}@${unixSeconds}`;
		const cached = priceCache.get(key);
		if (cached !== undefined) return cached;

		const wait = LLAMA_MIN_INTERVAL_MS - (Date.now() - lastLlamaCall);
		if (wait > 0) await sleep(wait);
		lastLlamaCall = Date.now();

		let result: { price: number; confidence: number } | null = null;
		try {
			const url = `${LLAMA_BASE}/prices/historical/${unixSeconds}/${encodeURIComponent(coinKey(tokenAddress))}`;
			const response = await fetch(url, { headers: { accept: 'application/json' } });
			if (!response.ok) throw new Error(`http ${response.status}`);
			const body = (await response.json()) as {
				coins?: Record<string, { price?: number; confidence?: number }>;
			};
			const coin = body.coins?.[coinKey(tokenAddress)];
			if (coin && typeof coin.price === 'number') {
				result = {
					price: coin.price,
					confidence: typeof coin.confidence === 'number' ? coin.confidence : 0,
				};
			}
		} catch (error) {
			pricingNotes.push(`DefiLlama lookup failed for ${coinKey(tokenAddress)}: ${(error as Error).message}.`);
		}

		priceCache.set(key, result);
		return result;
	}

	/** Never guess. An unknown or untrusted price stores a null and gets counted. */
	async function priceOf(
		symbol: string,
		tokenAddress: string | null,
		amountToken: string,
		unixSeconds: number,
	): Promise<PriceOutcome> {
		if (STABLE_SYMBOLS.has(symbol)) return { usd: amountToken, reason: 'stable' };

		const quote = await llamaPrice(tokenAddress, unixSeconds);
		if (!quote) return { usd: null, reason: 'no_price' };
		if (quote.confidence < MIN_PRICE_CONFIDENCE) return { usd: null, reason: 'low_confidence' };
		return { usd: multiplyDecimal(amountToken, quote.price), reason: 'priced' };
	}

	const rowKey = (txHash: string, logIndex: number) => `${txHash}:${logIndex}`;

	function recordOutcome(txHash: string, logIndex: number, outcome: PriceOutcome): void {
		const key = rowKey(txHash, logIndex);
		if (outcome.reason === 'low_confidence' || outcome.reason === 'no_price') {
			unpricedReason.set(key, outcome.reason);
		} else {
			unpricedReason.delete(key);
		}
	}

	// ------------------------------------------------------------ collect

	type InflowRow = {
		tx_hash: string;
		log_index: number;
		block_number: number;
		block_time: string;
		from_address: string;
		token_symbol: string;
		token_address: string | null;
		amount_raw: string;
		amount_token: string;
		usd_at_receipt: string | null;
		route: 'direct' | 'routed';
		origin_chain: null;
		origin_token: null;
		batch_id: null;
	};

	type NativeTx = { blockNumber: string; timeStamp: string; hash: string; from: string; to: string; value: string; isError?: string; txreceipt_status?: string };
	type InternalTx = { blockNumber: string; timeStamp: string; hash: string; from: string; to: string; value: string; isError?: string };
	type TokenTx = { blockNumber: string; timeStamp: string; hash: string; from: string; to: string; value: string; contractAddress: string; tokenSymbol: string; tokenDecimal: string; statusRep?: string };

	const fetched = { native: 0, internal: 0, token: 0 };

	async function collectInflows(startBlock: number, endBlock: number): Promise<InflowRow[]> {
		const native = await fetchAccountRows<NativeTx>('txlist', startBlock, endBlock);
		const internal = await fetchAccountRows<InternalTx>('txlistinternal', startBlock, endBlock);
		const tokens = await fetchAccountRows<TokenTx>('tokentx', startBlock, endBlock);

		fetched.native = native.length;
		fetched.internal = internal.length;
		fetched.token = tokens.length;
		log(`  fetched ${native.length} txlist, ${internal.length} txlistinternal, ${tokens.length} tokentx`);

		const rows: InflowRow[] = [];
		const ordinal = new Map<string, number>();
		const nextOrdinal = (hash: string, base: number) => {
			const key = `${base}:${hash}`;
			const index = ordinal.get(key) ?? 0;
			ordinal.set(key, index + 1);
			return base + index;
		};

		const push = async (
			hash: string,
			logIndex: number,
			block: string,
			timestamp: string,
			from: string,
			symbol: string,
			tokenAddress: string | null,
			raw: string,
			decimals: number,
			mintedFromZero: boolean,
		) => {
			const amount = formatUnits(raw, decimals);
			const seconds = Number(timestamp);
			const outcome = await priceOf(symbol, tokenAddress, amount, seconds);
			recordOutcome(hash, logIndex, outcome);

			rows.push({
				tx_hash: hash,
				log_index: logIndex,
				block_number: Number(block),
				block_time: new Date(seconds * 1000).toISOString(),
				from_address: from,
				token_symbol: symbol,
				token_address: tokenAddress,
				amount_raw: raw,
				amount_token: amount,
				usd_at_receipt: outcome.usd,
				route: await routeFor(from, mintedFromZero),
				origin_chain: null,
				origin_token: null,
				batch_id: null,
			});
		};

		for (const tx of native) {
			if (tx.from.toLowerCase() === ADDRESS) { dropped.outbound += 1; continue; }
			if (tx.to.toLowerCase() !== ADDRESS) continue;
			if (tx.isError === '1' || tx.txreceipt_status === '0') { dropped.failedNative += 1; continue; }
			if (tx.value === '0') continue;
			await push(tx.hash.toLowerCase(), LOG_INDEX_NATIVE, tx.blockNumber, tx.timeStamp, tx.from.toLowerCase(), 'ETH', null, tx.value, 18, false);
		}

		for (const tx of internal) {
			if (tx.from.toLowerCase() === ADDRESS) { dropped.outbound += 1; continue; }
			if (tx.to.toLowerCase() !== ADDRESS) continue;
			if (tx.isError === '1') { dropped.failedInternal += 1; continue; }
			if (tx.value === '0') continue;
			const hash = tx.hash.toLowerCase();
			await push(hash, nextOrdinal(hash, LOG_INDEX_INTERNAL_BASE), tx.blockNumber, tx.timeStamp, tx.from.toLowerCase(), 'ETH', null, tx.value, 18, false);
		}

		for (const tx of tokens) {
			if (tx.from.toLowerCase() === ADDRESS) { dropped.outbound += 1; continue; }
			if (tx.to.toLowerCase() !== ADDRESS) continue;
			if (tx.statusRep === '0') { dropped.failedToken += 1; continue; }
			if (tx.value === '0') continue;
			const hash = tx.hash.toLowerCase();
			await push(
				hash,
				nextOrdinal(hash, LOG_INDEX_TOKEN_BASE),
				tx.blockNumber,
				tx.timeStamp,
				tx.from.toLowerCase(),
				tx.tokenSymbol || 'UNKNOWN',
				tx.contractAddress.toLowerCase(),
				tx.value,
				Number(tx.tokenDecimal || '0'),
				tx.from.toLowerCase() === ZERO_ADDRESS,
			);
		}

		return rows;
	}

	// ------------------------------------------------------------ store

	async function upsertInflows(rows: InflowRow[]): Promise<number> {
		if (rows.length === 0) return 0;
		let inserted = 0;
		for (let start = 0; start < rows.length; start += 500) {
			const written = await supabaseJson<unknown[]>('inflows?on_conflict=tx_hash,log_index', {
				method: 'POST',
				headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
				body: JSON.stringify(rows.slice(start, start + 500)),
			});
			inserted += written.length;
		}
		return inserted;
	}

	/**
	 * A row can be unpriced because a lookup failed or because confidence was
	 * low, not because the token has no price, so every run gives the stored
	 * nulls another try and re-derives why each one is still empty.
	 */
	async function backfillPrices(): Promise<number> {
		type Pending = {
			tx_hash: string;
			log_index: number;
			token_symbol: string;
			token_address: string | null;
			amount_token: string;
			block_time: string;
		};
		const pending = await supabaseJson<Pending[]>(
			'inflows?usd_at_receipt=is.null&select=tx_hash,log_index,token_symbol,token_address,amount_token::text,block_time',
		);

		let filled = 0;
		for (const row of pending) {
			const seconds = Math.floor(new Date(row.block_time).getTime() / 1000);
			const outcome = await priceOf(row.token_symbol, row.token_address, row.amount_token, seconds);
			recordOutcome(row.tx_hash, row.log_index, outcome);
			if (outcome.usd === null) continue;
			await supabase(`inflows?tx_hash=eq.${row.tx_hash}&log_index=eq.${row.log_index}`, {
				method: 'PATCH',
				headers: { Prefer: 'return=minimal' },
				body: JSON.stringify({ usd_at_receipt: outcome.usd }),
			});
			filled += 1;
		}
		return filled;
	}

	// ------------------------------------------------------------ payload

	type StoredRow = {
		tx_hash: string;
		log_index: number;
		block_time: string;
		from_address: string;
		token_symbol: string;
		token_address: string | null;
		amount_raw: string;
		amount_token: string;
		usd_at_receipt: string | null;
	};

	async function balanceOf(tokenAddress: string | null, decimals: number): Promise<string> {
		const body = tokenAddress
			? await etherscan({ module: 'account', action: 'tokenbalance', address: ADDRESS, contractaddress: tokenAddress, tag: 'latest' })
			: await etherscan({ module: 'account', action: 'balance', address: ADDRESS, tag: 'latest' });
		return formatUnits(String(body.result), decimals);
	}

	/**
	 * What has left the address, per token, from the outflows table. Phase 2
	 * records the onward transfers there; until it does the table is empty and
	 * every asset's expected balance is simply what arrived. The table records
	 * USDC only, so any other asset sent onward will show up as a balance
	 * mismatch until the schema grows a token column, which is the right
	 * outcome: an untracked outflow is exactly the kind of thing the flag is for.
	 */
	async function sentOnwardByToken(): Promise<Map<string, string>> {
		const outflows = await supabaseJson<{ amount_usdc: string }[]>('outflows?select=amount_usdc::text');
		return new Map([['USDC', sumDecimals(outflows.map((row) => row.amount_usdc), 6)]]);
	}

	/**
	 * The invariant: for every asset, what the chain says the address holds must
	 * equal what the table says arrived minus what the table says left. Both
	 * sides come from the same run. A gap means the table is missing rows, has
	 * rows the chain does not, or an outflow went unrecorded, and in every one of
	 * those cases the total is wrong and must not be published as fact.
	 *
	 * ETH is the one asset where a gap can also mean gas: if the address ever
	 * sends anything, the fee leaves the balance without appearing as an
	 * outflow. It has never sent, so today the check holds exactly. When phase 2
	 * lands, outflows for ETH will need to carry the fee.
	 */
	function checkBalances(
		byToken: LedgerTokenTotal[],
		sentOnward: Map<string, string>,
	): LedgerIntegrityIssue[] {
		const issues: LedgerIntegrityIssue[] = [];
		for (const token of byToken) {
			const sent = sentOnward.get(token.token_symbol) ?? '0';
			const expected = subtractDecimals(token.amount_received, sent);
			if (sameDecimal(expected, token.balance_held)) continue;
			issues.push({
				kind: 'balance_mismatch',
				token_symbol: token.token_symbol,
				amount_received: token.amount_received,
				sent_onward: sent,
				expected_balance: expected,
				balance_held: token.balance_held,
				difference: subtractDecimals(token.balance_held, expected),
			});
		}
		return issues;
	}

	async function buildPayload(
		rows: StoredRow[],
		reconcile: ReconcileResult | null,
		lastReconciledAt: string | null,
	): Promise<LedgerPayload> {
		const priced = rows.filter((row) => row.usd_at_receipt !== null);
		const excluded = rows.filter((row) => row.usd_at_receipt === null);

		// Two disjoint reasons, so the page can add them and state one honest
		// line. No price at all is a different thing from a price we distrust.
		const lowConfidence = excluded.filter(
			(row) => unpricedReason.get(rowKey(row.tx_hash, row.log_index)) === 'low_confidence',
		);
		const unpriced = excluded.filter(
			(row) => unpricedReason.get(rowKey(row.tx_hash, row.log_index)) !== 'low_confidence',
		);

		// Grouped by token symbol, which is what the chain says and needs no
		// interpretation. Route never leaves the database.
		const symbols = [...new Set(rows.map((row) => row.token_symbol))];
		const byToken: LedgerTokenTotal[] = [];
		for (const symbol of symbols) {
			const subset = rows.filter((row) => row.token_symbol === symbol);
			const sample = subset[0];
			const subsetPriced = subset.filter((row) => row.usd_at_receipt !== null);
			byToken.push({
				token_symbol: symbol,
				token_address: sample.token_address,
				donation_count: subset.length,
				amount_received: sumDecimals(subset.map((row) => row.amount_token)),
				usd_received: round2(sumDecimals(subsetPriced.map((row) => row.usd_at_receipt as string), 6)),
				unpriced_count: subset.length - subsetPriced.length,
				balance_held: await balanceOf(
					sample.token_address,
					inferDecimals(sample.amount_raw, sample.amount_token),
				),
			});
		}

		const sentOnward = await sentOnwardByToken();
		const issues = checkBalances(byToken, sentOnward);

		// A full scan inserts what it found missing in the same run, so by the
		// time this runs those rows are in `rows`. Anything still absent, or
		// present in the table with no counterpart on chain, is reported.
		if (reconcile) {
			const held = new Set(rows.map((row) => row.tx_hash.toLowerCase()));
			const stillMissing = reconcile.missing.filter((row) => !held.has(row.tx_hash));
			if (stillMissing.length > 0) {
				issues.push({
					kind: 'rows_missing',
					count: stillMissing.length,
					tx_hashes: stillMissing.map((row) => row.tx_hash),
				});
			}
			if (reconcile.unknown.length > 0) {
				issues.push({
					kind: 'rows_not_on_chain',
					count: reconcile.unknown.length,
					tx_hashes: reconcile.unknown.map((row) => row.tx_hash),
				});
			}
		}

		// Only the tail is mapped. The payload never carries more than
		// RECENT_LIMIT rows, so the work and the blob are both flat in the
		// number of donations.
		const entries: LedgerEntry[] = rows.slice(-RECENT_LIMIT).map((row) => ({
			tx_hash: row.tx_hash,
			// Postgres hands back +00:00, the payload uses Z throughout.
			block_time: new Date(row.block_time).toISOString(),
			from_address: row.from_address,
			token_symbol: row.token_symbol,
			amount_token: row.amount_token,
			usd_at_receipt: row.usd_at_receipt === null ? null : Number(row.usd_at_receipt),
		}));

		return {
			updated_at: new Date().toISOString(),
			address: RECEIVING_ADDRESS,
			chain: CHAIN_LABEL,
			pricing: {
				source: 'DefiLlama',
				basis: 'price at the transaction timestamp',
				stablecoins_at_one: [...STABLE_SYMBOLS],
				min_confidence: MIN_PRICE_CONFIDENCE,
			},
			totals: {
				usd_received: round2(sumDecimals(priced.map((row) => row.usd_at_receipt as string), 6)),
				donation_count: rows.length,
				unpriced_count: unpriced.length,
				unpriced_tokens: [...new Set(unpriced.map((row) => row.token_symbol))],
				low_confidence_count: lowConfidence.length,
				low_confidence_tokens: [...new Set(lowConfidence.map((row) => row.token_symbol))],
				excluded_count: excluded.length,
				// USDC is the only onward asset the outflows table records, at 1.00.
				usd_sent_onward: round2(sentOnward.get('USDC') ?? '0'),
			},
			by_token: byToken,
			integrity: {
				ok: issues.length === 0,
				checked_at: new Date().toISOString(),
				last_reconciled_at: lastReconciledAt,
				issues,
			},
			recent: entries.reverse(),
		};
	}

	// ------------------------------------------------------------ sequence

	const cached = await supabaseJson<{ address: string; is_contract: boolean }[]>(
		'contract_cache?select=address,is_contract',
	);
	for (const row of cached) contractCache.set(row.address.toLowerCase(), row.is_contract);
	log(`  contract cache holds ${contractCache.size} addresses`);

	const head = await headBlock();
	// Stop short of the tip. See SAFETY_LAG_BLOCKS.
	const endBlock = Math.max(0, head - SAFETY_LAG_BLOCKS);

	const stateRows = await supabaseJson<{ key: string; value: string }[]>(
		`indexer_state?key=in.(${STATE_KEY},${RECONCILE_KEY})&select=key,value`,
	);
	const state = new Map(stateRows.map((row) => [row.key, row.value]));
	const lastValue = state.get(STATE_KEY);
	const last = lastValue === undefined ? null : Number(lastValue);
	const lastReconciledAt = state.get(RECONCILE_KEY) ?? null;
	const reconcileDue =
		lastReconciledAt === null || Date.now() - Date.parse(lastReconciledAt) > RECONCILE_EVERY_MS;

	// A full scan is the cold start, the daily reconcile, or an operator asking.
	// Otherwise the window starts OVERLAP_BLOCKS behind the watermark.
	const fullScan = config.fullRescan === true || last === null || reconcileDue;
	const startBlock = fullScan ? 0 : Math.max(0, last + 1 - OVERLAP_BLOCKS);
	log(
		`  scanning blocks ${startBlock} to ${endBlock} (tip ${head}, lag ${SAFETY_LAG_BLOCKS})` +
			(last === null
				? ' (cold start, full backfill)'
				: fullScan
					? ` (full reconcile${config.fullRescan ? ', requested' : ', daily'})`
					: ` (overlap ${OVERLAP_BLOCKS} behind watermark ${last})`),
	);

	const rows = await collectInflows(startBlock, endBlock);
	log(`  ${rows.length} inbound rows to write`);

	// On a full scan, compare what the chain has against what the table held
	// before this run wrote anything, so a repaired gap is still reported.
	let reconcile: ReconcileResult | null = null;
	if (fullScan) {
		type Held = { tx_hash: string; token_address: string | null; amount_raw: string; token_symbol: string; amount_token: string };
		const held = await supabaseJson<Held[]>(
			'inflows?select=tx_hash,token_address,amount_raw::text,token_symbol,amount_token::text',
		);
		const keyOf = (row: { tx_hash: string; token_address: string | null; amount_raw: string }) =>
			`${row.tx_hash.toLowerCase()}|${row.token_address ?? 'native'}|${row.amount_raw}`;
		const heldKeys = new Set(held.map(keyOf));
		const chainKeys = new Set(rows.map(keyOf));
		reconcile = {
			missing: rows
				.filter((row) => !heldKeys.has(keyOf(row)))
				.map((row) => ({
					tx_hash: row.tx_hash,
					token_symbol: row.token_symbol,
					amount_token: row.amount_token,
					block_number: row.block_number,
				})),
			unknown: held
				.filter((row) => !chainKeys.has(keyOf(row)))
				.map((row) => ({ tx_hash: row.tx_hash, token_symbol: row.token_symbol, amount_token: row.amount_token })),
			chainRows: rows.length,
			tableRowsBefore: held.length,
		};
		if (reconcile.missing.length > 0 || reconcile.unknown.length > 0) {
			// Loud on purpose. This line is the alarm.
			log(
				`RECONCILE MISMATCH: chain has ${reconcile.chainRows} inbound rows, table held ${reconcile.tableRowsBefore}. ` +
					`Missing from table: ${reconcile.missing.length}` +
					reconcile.missing.map((row) => ` [${row.token_symbol} ${row.amount_token} ${row.tx_hash}]`).join('') +
					`. In table but not on chain: ${reconcile.unknown.length}` +
					reconcile.unknown.map((row) => ` [${row.token_symbol} ${row.amount_token} ${row.tx_hash}]`).join(''),
			);
		} else {
			log(`  reconcile clean: ${reconcile.chainRows} inbound rows on chain, all present in the table`);
		}
	}

	const inserted = await upsertInflows(rows);

	if (newContractCacheRows.length > 0) {
		await supabase('contract_cache?on_conflict=address', {
			method: 'POST',
			headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
			body: JSON.stringify(newContractCacheRows),
		});
	}

	// The watermark is the last block asked for, not the tip.
	const now = new Date().toISOString();
	const stateWrites = [{ key: STATE_KEY, value: String(endBlock) }];
	if (fullScan) stateWrites.push({ key: RECONCILE_KEY, value: now });
	await supabase('indexer_state?on_conflict=key', {
		method: 'POST',
		headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
		body: JSON.stringify(stateWrites),
	});
	log(`  inserted ${inserted} new rows, ignored ${rows.length - inserted} already present`);

	const backfilled = await backfillPrices();
	if (backfilled > 0) log(`  priced ${backfilled} rows that were stored unpriced earlier`);

	const select =
		'tx_hash,log_index,block_time,from_address,token_symbol,token_address,amount_raw::text,amount_token::text,usd_at_receipt::text';
	const stored = await supabaseJson<StoredRow[]>(
		`inflows?select=${select}&order=block_time.asc,log_index.asc`,
	);
	const payload = await buildPayload(stored, reconcile, fullScan ? now : lastReconciledAt);
	if (!payload.integrity.ok) {
		log(`INTEGRITY FAILED: ${JSON.stringify(payload.integrity.issues)}`);
	}

	return {
		payload,
		stats: {
			startBlock,
			endBlock,
			headBlock: head,
			coldStart: last === null,
			fullScan,
			reconcile,
			fetched,
			inbound: rows.length,
			inserted,
			ignored: rows.length - inserted,
			backfilled,
			dropped,
			pricingNotes,
		},
	};
}
