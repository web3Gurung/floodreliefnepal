/**
 * Runs the indexer locally and writes src/data/ledger.json.
 *
 * `npm run index:donations`. Node 24 strips the types, `--env-file` loads
 * `.env.local`, and the shared logic lives in `worker/indexer.ts` so this script
 * and the Cloudflare cron cannot drift apart.
 *
 * Keep this working. It is how the payload gets regenerated for a commit and how
 * the reconciliation gets read by a person.
 */

import { writeFile } from 'node:fs/promises';
import { runIndexer, type IndexerResult } from '../worker/indexer.ts';

const PAYLOAD_PATH = new URL('../src/data/ledger.json', import.meta.url);

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		console.error(`Missing ${name}. Run npm run index:donations, which loads .env.local.`);
		process.exit(1);
	}
	return value;
}

function report({ payload, stats }: IndexerResult): void {
	console.log('\n================ reconciliation ================');
	console.log(`address ${payload.address} on ${payload.chain}`);
	console.log(`donations: ${payload.totals.donation_count}`);
	console.log(
		`scanned blocks ${stats.startBlock} to ${stats.endBlock}, tip ${stats.headBlock}${stats.fullScan ? ', full scan from block zero' : ', window behind the watermark'}`,
	);

	if (stats.reconcile) {
		const { reconcile } = stats;
		console.log('\nChain against table, row for row');
		console.log(`  inbound rows on chain     ${reconcile.chainRows}`);
		console.log(`  rows in table before run  ${reconcile.tableRowsBefore}`);
		console.log(`  missing from table        ${reconcile.missing.length}${reconcile.missing.length > 0 ? '  (inserted by this run)' : ''}`);
		for (const row of reconcile.missing) {
			console.log(`    block ${row.block_number}  ${row.token_symbol.padEnd(6)} ${row.amount_token.padStart(18)}  ${row.tx_hash}`);
		}
		console.log(`  in table, not on chain    ${reconcile.unknown.length}`);
		for (const row of reconcile.unknown) {
			console.log(`    ${row.token_symbol.padEnd(6)} ${row.amount_token.padStart(18)}  ${row.tx_hash}`);
		}
	}

	console.log('\nBy token, amount received against balance held now');
	for (const token of payload.by_token) {
		const exact = token.amount_received === token.balance_held ? 'exact' : 'DIFFERS';
		console.log(
			`  ${token.token_symbol.padEnd(8)} received ${token.amount_received.padEnd(20)} balance ${token.balance_held.padEnd(20)} ${exact.padEnd(8)} ${String(token.donation_count).padStart(3)} donations  ${token.usd_received.toFixed(2)} USD`,
		);
	}

	console.log(`\nIntegrity: ${payload.integrity.ok ? 'OK, balances equal receipts minus outflows for every asset' : 'FAILED'}`);
	console.log(`  checked ${payload.integrity.checked_at}, last full reconcile ${payload.integrity.last_reconciled_at ?? 'never'}`);
	for (const issue of payload.integrity.issues) console.log(`  ${JSON.stringify(issue)}`);

	console.log('\nUSD total, valued at receipt');
	console.log(`  ${payload.totals.usd_received.toFixed(2)} USD`);
	console.log(`  source ${payload.pricing.source}, ${payload.pricing.basis}, stablecoins at 1.00`);
	console.log(`  minimum confidence accepted ${payload.pricing.min_confidence}`);

	console.log(`\nExcluded from the total: ${payload.totals.excluded_count} of ${payload.totals.donation_count}`);
	console.log(`  no price available   ${payload.totals.unpriced_count}${payload.totals.unpriced_tokens.length > 0 ? ` (${payload.totals.unpriced_tokens.join(', ')})` : ''}`);
	console.log(`  price below ${payload.pricing.min_confidence} confidence  ${payload.totals.low_confidence_count}${payload.totals.low_confidence_tokens.length > 0 ? ` (${payload.totals.low_confidence_tokens.join(', ')})` : ''}`);

	const { dropped } = stats;
	console.log('\nRows dropped before storage');
	console.log(`  failed transactions   ${dropped.failedNative + dropped.failedInternal + dropped.failedToken} (txlist ${dropped.failedNative}, internal ${dropped.failedInternal}, token ${dropped.failedToken})`);
	console.log(`  outbound, address was the sender  ${dropped.outbound}`);

	if (stats.pricingNotes.length > 0) {
		console.log('\nPricing notes');
		for (const note of [...new Set(stats.pricingNotes)]) console.log(`  ${note}`);
	}
	console.log('================================================\n');
}

// `--full` rescans from block zero and reconciles the whole table. This is the
// backfill switch: run it after any suspected gap, and after this fix shipped.
const fullRescan = process.argv.includes('--full');

const result = await runIndexer({
	etherscanApiKey: requireEnv('ETHERSCAN_API_KEY'),
	supabaseUrl: requireEnv('SUPABASE_URL'),
	supabaseSecretKey: requireEnv('SUPABASE_SECRET_KEY'),
	log: (message) => console.log(message),
	fullRescan,
});

await writeFile(PAYLOAD_PATH, `${JSON.stringify(result.payload, null, '\t')}\n`, 'utf8');
console.log('  wrote src/data/ledger.json');

report(result);

// A person ran this to read the reconciliation. A failing invariant is the one
// thing they must not miss, so it is also the exit code.
if (!result.payload.integrity.ok) process.exit(2);
