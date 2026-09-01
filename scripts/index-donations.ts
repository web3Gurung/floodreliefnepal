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

const result = await runIndexer({
	etherscanApiKey: requireEnv('ETHERSCAN_API_KEY'),
	supabaseUrl: requireEnv('SUPABASE_URL'),
	supabaseSecretKey: requireEnv('SUPABASE_SECRET_KEY'),
	log: (message) => console.log(message),
});

await writeFile(PAYLOAD_PATH, `${JSON.stringify(result.payload, null, '\t')}\n`, 'utf8');
console.log('  wrote src/data/ledger.json');

report(result);
