/**
 * Nepal Relief inbound donation indexer, phase 1a.
 *
 * Runs locally: `npm run index:donations`. The Cloudflare Worker and its cron
 * come later. Everything here is plain fetch and Node 24 type stripping, so the
 * site keeps its four dependencies.
 *
 * Reads ETHERSCAN_API_KEY, SUPABASE_URL and SUPABASE_SECRET_KEY from
 * `.env.local` through `node --env-file`. Never log a key or a request URL,
 * because the Etherscan key travels in the query string.
 *
 * Idempotent. Rows are inserted with on conflict do nothing against the
 * (tx_hash, log_index) primary key, so a second run inserts nothing.
 *
 * The run ends by writing the public payload to src/data/ledger.json. That file
 * is committed, so the site builds without any credential.
 */

import { writeFile } from 'node:fs/promises';

// ---------------------------------------------------------------- constants

const RECEIVING_ADDRESS = '0xA891BB5abf91aBf1796074a1303E75754AF1823D';
const ADDRESS = RECEIVING_ADDRESS.toLowerCase();
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const CHAIN_ID = '1';
const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';
const LLAMA_BASE = 'https://coins.llama.fi';
const PAYLOAD_PATH = new URL('../src/data/ledger.json', import.meta.url);

/** The free plan caps a request at 1000 records and 5 calls a second. */
const PAGE_SIZE = 1000;
const ETHERSCAN_MIN_INTERVAL_MS = 260;
const LLAMA_MIN_INTERVAL_MS = 220;

const STATE_KEY = 'last_indexed_block';
const RECENT_LIMIT = 50;

/** Priced at 1.00 USD. Anything absent from this set needs a real lookup. */
const STABLE_SYMBOLS = new Set(['USDC', 'USDT', 'DAI']);

/** DefiLlama returns a confidence with every price. Below this we publish none. */
const MIN_PRICE_CONFIDENCE = 0.9;

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

// ---------------------------------------------------------------- env

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(`Missing ${name}. Run npm run index:donations, which loads .env.local.`);
		process.exit(1);
	}
	return value;
}

const ETHERSCAN_API_KEY = requireEnv('ETHERSCAN_API_KEY');
const SUPABASE_URL = requireEnv('SUPABASE_URL').replace(/\/$/, '');
const SUPABASE_SECRET_KEY = requireEnv('SUPABASE_SECRET_KEY');

// ---------------------------------------------------------------- helpers

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Exact decimal arithmetic. Token amounts must not touch binary floats. */
function formatUnits(raw: string, decimals: number): string {
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
 * Recovers a token's decimals from the two amounts already stored, so the
 * reconciliation can format a balance without a decimals column and without
 * assuming six.
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

// ---------------------------------------------------------------- etherscan

type EtherscanBody = { status?: string; message?: string; result?: unknown };

let lastEtherscanCall = 0;

async function etherscan(params: Record<string, string | number>): Promise<EtherscanBody> {
	const url = new URL(ETHERSCAN_BASE);
	url.searchParams.set('chainid', CHAIN_ID);
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
	url.searchParams.set('apikey', ETHERSCAN_API_KEY);

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
 * cannot drift apart while the run is in flight. That is what makes the stored
 * last indexed block safe to advance.
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

// ---------------------------------------------------------------- supabase

async function supabase(path: string, init: RequestInit = {}): Promise<Response> {
	const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
		...init,
		headers: {
			apikey: SUPABASE_SECRET_KEY,
			Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
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

// ---------------------------------------------------------------- rows

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

type NativeTx = {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	from: string;
	to: string;
	value: string;
	isError?: string;
	txreceipt_status?: string;
};

type InternalTx = {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	from: string;
	to: string;
	value: string;
	isError?: string;
};

type TokenTx = {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	from: string;
	to: string;
	value: string;
	contractAddress: string;
	tokenSymbol: string;
	tokenDecimal: string;
	statusRep?: string;
};

// ---------------------------------------------------------------- route labels

/**
 * The route column stays in the database and stays populated, and it reaches
 * neither the payload nor the page. A smart contract wallet is a contract, so
 * this label cannot carry a public claim about how someone gave.
 */
const contractCache = new Map<string, boolean>();
const newContractCacheRows: { address: string; is_contract: boolean }[] = [];

async function loadContractCache(): Promise<void> {
	const rows = await supabaseJson<{ address: string; is_contract: boolean }[]>(
		'contract_cache?select=address,is_contract',
	);
	for (const row of rows) contractCache.set(row.address.toLowerCase(), row.is_contract);
}

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

// ---------------------------------------------------------------- pricing

/**
 * DefiLlama, one source, no key and no fallback chain. It prices any ERC-20 by
 * contract address, so there is no token to id map to maintain, and it returns
 * a confidence with every answer. Below MIN_PRICE_CONFIDENCE the row stays
 * unpriced and gets counted, because a number we do not trust is worse on this
 * page than a gap we describe.
 */
type PriceOutcome = {
	usd: string | null;
	reason: 'stable' | 'priced' | 'low_confidence' | 'no_price';
	confidence?: number;
};

type LlamaCoin = { price?: number; confidence?: number; symbol?: string };

const priceCache = new Map<string, { price: number; confidence: number } | null>();
const pricingNotes: string[] = [];
let lastLlamaCall = 0;

function coinKey(tokenAddress: string | null): string {
	return `ethereum:${tokenAddress ?? ZERO_ADDRESS}`;
}

async function llamaPrice(
	tokenAddress: string | null,
	unixSeconds: number,
): Promise<{ price: number; confidence: number } | null> {
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
		const body = (await response.json()) as { coins?: Record<string, LlamaCoin> };
		const coin = body.coins?.[coinKey(tokenAddress)];
		if (coin && typeof coin.price === 'number') {
			result = { price: coin.price, confidence: typeof coin.confidence === 'number' ? coin.confidence : 0 };
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
	if (quote.confidence < MIN_PRICE_CONFIDENCE) {
		return { usd: null, reason: 'low_confidence', confidence: quote.confidence };
	}
	return { usd: multiplyDecimal(amountToken, quote.price), reason: 'priced', confidence: quote.confidence };
}

/** Why each currently unpriced row is unpriced, keyed by primary key. */
const unpricedReason = new Map<string, 'low_confidence' | 'no_price'>();

function rowKey(txHash: string, logIndex: number): string {
	return `${txHash}:${logIndex}`;
}

function recordOutcome(txHash: string, logIndex: number, outcome: PriceOutcome): void {
	const key = rowKey(txHash, logIndex);
	if (outcome.reason === 'low_confidence' || outcome.reason === 'no_price') {
		unpricedReason.set(key, outcome.reason);
	} else {
		unpricedReason.delete(key);
	}
}

// ---------------------------------------------------------------- collect

const dropped = { failedNative: 0, failedInternal: 0, failedToken: 0, outbound: 0 };

async function collectInflows(startBlock: number, endBlock: number): Promise<InflowRow[]> {
	const native = await fetchAccountRows<NativeTx>('txlist', startBlock, endBlock);
	const internal = await fetchAccountRows<InternalTx>('txlistinternal', startBlock, endBlock);
	const tokens = await fetchAccountRows<TokenTx>('tokentx', startBlock, endBlock);

	console.log(
		`  fetched ${native.length} txlist, ${internal.length} txlistinternal, ${tokens.length} tokentx`,
	);

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

// ---------------------------------------------------------------- write

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

async function saveContractCache(): Promise<void> {
	if (newContractCacheRows.length === 0) return;
	await supabase('contract_cache?on_conflict=address', {
		method: 'POST',
		headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
		body: JSON.stringify(newContractCacheRows),
	});
}

async function readState(): Promise<number | null> {
	const rows = await supabaseJson<{ value: string }[]>(
		`indexer_state?key=eq.${STATE_KEY}&select=value`,
	);
	return rows.length > 0 ? Number(rows[0].value) : null;
}

async function writeState(block: number): Promise<void> {
	await supabase('indexer_state?on_conflict=key', {
		method: 'POST',
		headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
		body: JSON.stringify([{ key: STATE_KEY, value: String(block) }]),
	});
}

/**
 * A row can be unpriced because a lookup failed or because confidence was low,
 * not because the token has no price, so every run gives the stored nulls
 * another try and re-derives why each one is still empty.
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

// ---------------------------------------------------------------- payload

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

async function readStoredRows(): Promise<StoredRow[]> {
	const select =
		'tx_hash,log_index,block_time,from_address,token_symbol,token_address,amount_raw::text,amount_token::text,usd_at_receipt::text';
	return supabaseJson<StoredRow[]>(`inflows?select=${select}&order=block_time.asc,log_index.asc`);
}

async function balanceOf(symbol: string, tokenAddress: string | null, decimals: number): Promise<string> {
	const body = tokenAddress
		? await etherscan({ module: 'account', action: 'tokenbalance', address: ADDRESS, contractaddress: tokenAddress, tag: 'latest' })
		: await etherscan({ module: 'account', action: 'balance', address: ADDRESS, tag: 'latest' });
	return formatUnits(String(body.result), decimals);
}

async function buildPayload(rows: StoredRow[]) {
	const priced = rows.filter((row) => row.usd_at_receipt !== null);
	const excluded = rows.filter((row) => row.usd_at_receipt === null);

	// Two disjoint reasons, so the page can add them and state one honest line.
	// No price at all is a different thing from a price we decided not to trust.
	const lowConfidence = excluded.filter(
		(row) => unpricedReason.get(rowKey(row.tx_hash, row.log_index)) === 'low_confidence',
	);
	const unpriced = excluded.filter(
		(row) => unpricedReason.get(rowKey(row.tx_hash, row.log_index)) !== 'low_confidence',
	);

	// Grouped by token symbol, which is what the chain says and needs no
	// interpretation. Route never leaves the database.
	const symbols = [...new Set(rows.map((row) => row.token_symbol))];
	const byToken = [];
	for (const symbol of symbols) {
		const subset = rows.filter((row) => row.token_symbol === symbol);
		const sample = subset[0];
		const decimals = inferDecimals(sample.amount_raw, sample.amount_token);
		const subsetPriced = subset.filter((row) => row.usd_at_receipt !== null);
		byToken.push({
			token_symbol: symbol,
			token_address: sample.token_address,
			donation_count: subset.length,
			amount_received: sumDecimals(subset.map((row) => row.amount_token)),
			usd_received: round2(sumDecimals(subsetPriced.map((row) => row.usd_at_receipt as string), 6)),
			unpriced_count: subset.length - subsetPriced.length,
			balance_held: await balanceOf(symbol, sample.token_address, decimals),
		});
	}

	const entries = rows.map((row) => ({
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
		chain: 'Ethereum mainnet',
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
			usd_sent_onward: 0,
		},
		by_token: byToken,
		recent: entries.slice(-RECENT_LIMIT).reverse(),
		all: entries,
	};
}

// ---------------------------------------------------------------- report

function reportOn(payload: Awaited<ReturnType<typeof buildPayload>>): void {
	console.log('\n================ reconciliation ================');
	console.log(`address ${payload.address} on ${payload.chain}`);
	console.log(`donations: ${payload.totals.donation_count}`);

	console.log('\nBy token, amount received against balance held now');
	for (const token of payload.by_token) {
		console.log(
			`  ${token.token_symbol.padEnd(8)} received ${token.amount_received.padEnd(20)} balance ${token.balance_held.padEnd(20)} ${String(token.donation_count).padStart(3)} donations  ${token.usd_received.toFixed(2)} USD`,
		);
	}

	console.log('\nUSD total, valued at receipt');
	console.log(`  ${payload.totals.usd_received.toFixed(2)} USD`);
	console.log(`  source ${payload.pricing.source}, ${payload.pricing.basis}, stablecoins at 1.00`);
	console.log(`  minimum confidence accepted ${payload.pricing.min_confidence}`);

	console.log(`\nExcluded from the total: ${payload.totals.excluded_count} of ${payload.totals.donation_count}`);
	console.log(`  no price available   ${payload.totals.unpriced_count}${payload.totals.unpriced_tokens.length > 0 ? ` (${payload.totals.unpriced_tokens.join(', ')})` : ''}`);
	console.log(`  price below ${payload.pricing.min_confidence} confidence  ${payload.totals.low_confidence_count}${payload.totals.low_confidence_tokens.length > 0 ? ` (${payload.totals.low_confidence_tokens.join(', ')})` : ''}`);

	console.log('\nRows dropped before storage');
	console.log(`  failed transactions   ${dropped.failedNative + dropped.failedInternal + dropped.failedToken} (txlist ${dropped.failedNative}, internal ${dropped.failedInternal}, token ${dropped.failedToken})`);
	console.log(`  outbound, address was the sender  ${dropped.outbound}`);

	if (pricingNotes.length > 0) {
		console.log('\nPricing notes');
		for (const note of [...new Set(pricingNotes)]) console.log(`  ${note}`);
	}
	console.log('================================================\n');
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
	console.log(`Indexing inflows to ${RECEIVING_ADDRESS} on Ethereum mainnet`);

	await loadContractCache();
	console.log(`  contract cache holds ${contractCache.size} addresses`);

	const head = await headBlock();
	const last = await readState();
	const startBlock = last === null ? 0 : last + 1;
	console.log(`  scanning blocks ${startBlock} to ${head}${last === null ? ' (cold start, full backfill)' : ''}`);

	const rows = await collectInflows(startBlock, head);
	console.log(`  ${rows.length} inbound rows to write`);

	const inserted = await upsertInflows(rows);
	await saveContractCache();
	await writeState(head);
	console.log(`  inserted ${inserted} new rows, ignored ${rows.length - inserted} already present`);

	const filled = await backfillPrices();
	if (filled > 0) console.log(`  priced ${filled} rows that were stored unpriced earlier`);

	const payload = await buildPayload(await readStoredRows());
	await writeFile(PAYLOAD_PATH, `${JSON.stringify(payload, null, '\t')}\n`, 'utf8');
	console.log(`  wrote src/data/ledger.json`);

	reportOn(payload);
}

await main();
