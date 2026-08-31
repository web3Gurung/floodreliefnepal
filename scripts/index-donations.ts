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
 */

// ---------------------------------------------------------------- constants

const RECEIVING_ADDRESS = '0xA891BB5abf91aBf1796074a1303E75754AF1823D';
const ADDRESS = RECEIVING_ADDRESS.toLowerCase();
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const CHAIN_ID = '1';
const ETHERSCAN_BASE = 'https://api.etherscan.io/v2/api';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

/** The free plan caps a request at 1000 records and 5 calls a second. */
const PAGE_SIZE = 1000;
const ETHERSCAN_MIN_INTERVAL_MS = 260;

const STATE_KEY = 'last_indexed_block';

/** Priced at 1.00 USD. Anything absent from this map needs a real lookup. */
const STABLE_SYMBOLS = new Set(['USDC', 'USDT', 'DAI']);

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
	// Price comes from an API as a float, so the product is a float too. Scale
	// and round once, then keep the result as a string from there on.
	const product = Number(amount) * price;
	return (Math.round(product * 10 ** scale) / 10 ** scale).toFixed(scale).replace(/0+$/, '').replace(/\.$/, '');
}

function dayOf(unixSeconds: number): string {
	return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- etherscan

type EtherscanBody = { status?: string; message?: string; result?: unknown; error?: unknown };

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

/** The column is nullable and hand backfilled later, so absence is survivable. */
async function hasUsdRealisedColumn(): Promise<boolean> {
	type Spec = { definitions?: Record<string, { properties?: Record<string, unknown> }> };
	const spec = await supabaseJson<Spec>('');
	return Boolean(spec.definitions?.inflows?.properties?.usd_realised);
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

/**
 * A zero address sender means the token was minted to us, which is how Circle
 * CCTP settles a cross chain swap. Everything else is decided by whether code
 * lives at the sender. No router address is hardcoded, so nothing breaks when
 * Trails redeploys.
 */
async function routeFor(from: string, mintedFromZero: boolean): Promise<'direct' | 'routed'> {
	if (mintedFromZero) return 'routed';
	return (await isContract(from)) ? 'routed' : 'direct';
}

// ---------------------------------------------------------------- pricing

const pricingNotes: string[] = [];
const ethPriceByDay = new Map<string, number | null>();

/** One CoinGecko lookup per day covers every ETH transaction on that day. */
async function ethPriceOn(day: string): Promise<number | null> {
	const cached = ethPriceByDay.get(day);
	if (cached !== undefined) return cached;

	const [year, month, date] = day.split('-');
	const url = `${COINGECKO_BASE}/coins/ethereum/history?date=${date}-${month}-${year}&localization=false`;

	let price: number | null = null;
	try {
		const response = await fetch(url, { headers: { accept: 'application/json' } });
		if (!response.ok) throw new Error(`http ${response.status}`);
		const body = (await response.json()) as { market_data?: { current_price?: { usd?: number } } };
		const usd = body.market_data?.current_price?.usd;
		if (typeof usd === 'number') price = usd;
		else pricingNotes.push(`CoinGecko returned no USD price for ETH on ${day}.`);
	} catch (error) {
		pricingNotes.push(`CoinGecko lookup for ETH on ${day} failed: ${(error as Error).message}.`);
	}

	ethPriceByDay.set(day, price);
	await sleep(1500); // free tier, no key, roughly 5 to 15 calls a minute
	return price;
}

/** Never guess. An unknown token stores a null and gets counted, not priced. */
async function priceOf(symbol: string, amountToken: string, day: string): Promise<string | null> {
	if (STABLE_SYMBOLS.has(symbol)) return amountToken;
	if (symbol === 'ETH') {
		const price = await ethPriceOn(day);
		return price === null ? null : multiplyDecimal(amountToken, price);
	}
	return null;
}

// ---------------------------------------------------------------- collect

const dropped = { failedNative: 0, failedInternal: 0, failedToken: 0, outbound: 0 };

async function collectInflows(startBlock: number, endBlock: number): Promise<InflowRow[]> {
	const [native, internal, tokens] = [
		await fetchAccountRows<NativeTx>('txlist', startBlock, endBlock),
		await fetchAccountRows<InternalTx>('txlistinternal', startBlock, endBlock),
		await fetchAccountRows<TokenTx>('tokentx', startBlock, endBlock),
	];

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

	for (const tx of native) {
		if (tx.from.toLowerCase() === ADDRESS) { dropped.outbound += 1; continue; }
		if (tx.to.toLowerCase() !== ADDRESS) continue;
		if (tx.isError === '1' || tx.txreceipt_status === '0') { dropped.failedNative += 1; continue; }
		if (tx.value === '0') continue;

		const day = dayOf(Number(tx.timeStamp));
		const amount = formatUnits(tx.value, 18);
		rows.push({
			tx_hash: tx.hash.toLowerCase(),
			log_index: LOG_INDEX_NATIVE,
			block_number: Number(tx.blockNumber),
			block_time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
			from_address: tx.from.toLowerCase(),
			token_symbol: 'ETH',
			token_address: null,
			amount_raw: tx.value,
			amount_token: amount,
			usd_at_receipt: await priceOf('ETH', amount, day),
			route: await routeFor(tx.from, false),
			origin_chain: null,
			origin_token: null,
			batch_id: null,
		});
	}

	for (const tx of internal) {
		if (tx.from.toLowerCase() === ADDRESS) { dropped.outbound += 1; continue; }
		if (tx.to.toLowerCase() !== ADDRESS) continue;
		if (tx.isError === '1') { dropped.failedInternal += 1; continue; }
		if (tx.value === '0') continue;

		const day = dayOf(Number(tx.timeStamp));
		const amount = formatUnits(tx.value, 18);
		rows.push({
			tx_hash: tx.hash.toLowerCase(),
			log_index: nextOrdinal(tx.hash.toLowerCase(), LOG_INDEX_INTERNAL_BASE),
			block_number: Number(tx.blockNumber),
			block_time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
			from_address: tx.from.toLowerCase(),
			token_symbol: 'ETH',
			token_address: null,
			amount_raw: tx.value,
			amount_token: amount,
			usd_at_receipt: await priceOf('ETH', amount, day),
			route: await routeFor(tx.from, false),
			origin_chain: null,
			origin_token: null,
			batch_id: null,
		});
	}

	for (const tx of tokens) {
		if (tx.from.toLowerCase() === ADDRESS) { dropped.outbound += 1; continue; }
		if (tx.to.toLowerCase() !== ADDRESS) continue;
		if (tx.statusRep === '0') { dropped.failedToken += 1; continue; }
		if (tx.value === '0') continue;

		const decimals = Number(tx.tokenDecimal || '0');
		const amount = formatUnits(tx.value, decimals);
		const day = dayOf(Number(tx.timeStamp));
		const mintedFromZero = tx.from.toLowerCase() === ZERO_ADDRESS;

		rows.push({
			tx_hash: tx.hash.toLowerCase(),
			log_index: nextOrdinal(tx.hash.toLowerCase(), LOG_INDEX_TOKEN_BASE),
			block_number: Number(tx.blockNumber),
			block_time: new Date(Number(tx.timeStamp) * 1000).toISOString(),
			from_address: tx.from.toLowerCase(),
			token_symbol: tx.tokenSymbol || 'UNKNOWN',
			token_address: tx.contractAddress.toLowerCase(),
			amount_raw: tx.value,
			amount_token: amount,
			usd_at_receipt: await priceOf(tx.tokenSymbol, amount, day),
			route: await routeFor(tx.from, mintedFromZero),
			origin_chain: null,
			origin_token: null,
			batch_id: null,
		});
	}

	return rows;
}

// ---------------------------------------------------------------- write

async function upsertInflows(rows: InflowRow[], keepUsdRealised: boolean): Promise<number> {
	if (rows.length === 0) return 0;
	let inserted = 0;
	for (let start = 0; start < rows.length; start += 500) {
		const chunk = rows.slice(start, start + 500).map((row) =>
			keepUsdRealised ? { ...row, usd_realised: null } : row,
		);
		const written = await supabaseJson<unknown[]>('inflows?on_conflict=tx_hash,log_index', {
			method: 'POST',
			headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
			body: JSON.stringify(chunk),
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
 * A row can be unpriced because a lookup failed rather than because the token
 * has no price, so every run gives the stored nulls another try.
 */
async function backfillPrices(): Promise<number> {
	type Pending = {
		tx_hash: string;
		log_index: number;
		token_symbol: string;
		amount_token: string;
		block_time: string;
	};
	const pending = await supabaseJson<Pending[]>(
		'inflows?usd_at_receipt=is.null&select=tx_hash,log_index,token_symbol,amount_token::text,block_time',
	);

	let filled = 0;
	for (const row of pending) {
		const day = row.block_time.slice(0, 10);
		const usd = await priceOf(row.token_symbol, row.amount_token, day);
		if (usd === null) continue;
		await supabase(`inflows?tx_hash=eq.${row.tx_hash}&log_index=eq.${row.log_index}`, {
			method: 'PATCH',
			headers: { Prefer: 'return=minimal' },
			body: JSON.stringify({ usd_at_receipt: usd }),
		});
		filled += 1;
	}
	return filled;
}

// ---------------------------------------------------------------- report

type StoredRow = {
	token_symbol: string;
	token_address: string | null;
	amount_token: string;
	usd_at_receipt: string | null;
	usd_realised?: string | null;
	route: 'direct' | 'routed';
};

async function reconcile(hasRealised: boolean): Promise<void> {
	const select = [
		'token_symbol',
		'token_address',
		'amount_token::text',
		'usd_at_receipt::text',
		hasRealised ? 'usd_realised::text' : null,
		'route',
	]
		.filter(Boolean)
		.join(',');

	const rows = await supabaseJson<StoredRow[]>(`inflows?select=${select}&order=block_number.asc`);

	console.log('\n================ reconciliation ================');
	console.log(`address ${RECEIVING_ADDRESS} on Ethereum mainnet`);
	console.log(`rows in inflows: ${rows.length}`);

	// Token amounts, the correctness test.
	const byToken = new Map<string, { address: string | null; amounts: string[] }>();
	for (const row of rows) {
		const entry = byToken.get(row.token_symbol) ?? { address: row.token_address, amounts: [] };
		entry.amounts.push(row.amount_token);
		byToken.set(row.token_symbol, entry);
	}

	console.log('\nAmount received per token, summed from the stored rows');
	for (const [symbol, entry] of byToken) {
		console.log(`  ${symbol.padEnd(8)} ${sumDecimals(entry.amounts).padEnd(24)} across ${entry.amounts.length} transfers`);
	}

	// Current balances, straight from Etherscan.
	console.log('\nCurrent balance held, read from Etherscan now');
	const ethBalance = await etherscan({ module: 'account', action: 'balance', address: ADDRESS, tag: 'latest' });
	console.log(`  ETH      ${formatUnits(String(ethBalance.result), 18)}`);
	for (const [symbol, entry] of byToken) {
		if (!entry.address) continue;
		const balance = await etherscan({
			module: 'account',
			action: 'tokenbalance',
			address: ADDRESS,
			contractaddress: entry.address,
			tag: 'latest',
		});
		const decimals = symbol === 'USDC' || symbol === 'USDT' ? 6 : 18;
		console.log(`  ${symbol.padEnd(8)} ${formatUnits(String(balance.result), decimals)} (assumes ${decimals} decimals)`);
	}

	// USD, with the basis named.
	const priced = rows.filter((row) => row.usd_at_receipt !== null || (row.usd_realised ?? null) !== null);
	const unpriced = rows.filter((row) => row.usd_at_receipt === null && (row.usd_realised ?? null) === null);
	const realised = rows.filter((row) => (row.usd_realised ?? null) !== null);

	const headline = sumDecimals(
		priced.map((row) => (row.usd_realised ?? row.usd_at_receipt) as string),
		6,
	);
	const realisedTotal = sumDecimals(realised.map((row) => row.usd_realised as string), 6);

	console.log('\nUSD total, valued at receipt');
	console.log(`  headline total          ${Number(headline).toFixed(2)} USD`);
	console.log(`  confirmed by a swap     ${Number(realisedTotal).toFixed(2)} USD across ${realised.length} rows`);
	console.log(`  estimated from a price  ${(Number(headline) - Number(realisedTotal)).toFixed(2)} USD across ${priced.length - realised.length} rows`);
	console.log('  basis: usd_realised where set, otherwise CoinGecko daily close for the transaction day, stablecoins at 1.00');

	const unpricedTokens = [...new Set(unpriced.map((row) => row.token_symbol))];
	console.log(`\nUnpriced rows: ${unpriced.length}${unpricedTokens.length > 0 ? ` (${unpricedTokens.join(', ')})` : ''}`);
	console.log('  Unpriced rows are excluded from the headline total.');

	console.log('\nDonations by route');
	for (const route of ['direct', 'routed'] as const) {
		const subset = rows.filter((row) => row.route === route);
		const usd = sumDecimals(
			subset
				.filter((row) => row.usd_at_receipt !== null || (row.usd_realised ?? null) !== null)
				.map((row) => (row.usd_realised ?? row.usd_at_receipt) as string),
			6,
		);
		console.log(`  ${route.padEnd(8)} ${String(subset.length).padStart(4)} donations  ${Number(usd).toFixed(2)} USD`);
	}

	console.log('\nRows dropped');
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

	const hasRealised = await hasUsdRealisedColumn();
	if (!hasRealised) {
		console.log(
			'\n  Note: inflows.usd_realised is missing. The indexer never writes it, so nothing\n' +
				'  here is wrong, but the payload cannot mark confirmed rows until it exists. Add it with:\n' +
				'    alter table inflows add column usd_realised numeric;\n',
		);
	}

	await loadContractCache();
	console.log(`  contract cache holds ${contractCache.size} addresses`);

	const head = await headBlock();
	const last = await readState();
	const startBlock = last === null ? 0 : last + 1;
	console.log(`  scanning blocks ${startBlock} to ${head}${last === null ? ' (cold start, full backfill)' : ''}`);

	const rows = await collectInflows(startBlock, head);
	console.log(`  ${rows.length} inbound rows to write`);

	const inserted = await upsertInflows(rows, hasRealised);
	await saveContractCache();
	await writeState(head);
	console.log(`  inserted ${inserted} new rows, ignored ${rows.length - inserted} already present`);

	const filled = await backfillPrices();
	if (filled > 0) console.log(`  priced ${filled} rows that were stored unpriced earlier`);

	await reconcile(hasRealised);
}

await main();
