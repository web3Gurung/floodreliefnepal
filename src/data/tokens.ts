/**
 * One hue in three weights, handed out in order of USD received, then muted.
 * The merge and the mosaic both colour by asset, so the assignment lives here
 * rather than in each of them, where the two could quietly disagree about which
 * asset is which colour.
 */
export type TokenTotal = {
	token_symbol: string;
	token_address: string | null;
	donation_count: number;
	amount_received: string;
	usd_received: number;
	unpriced_count: number;
	balance_held: string;
};

export type WeightedToken = TokenTotal & {
	weight: string;
	share: number;
	priced: boolean;
};

const WEIGHTS = ['accent', 'accent-mid', 'accent-soft'] as const;

export function weightTokens(byToken: readonly TokenTotal[]): WeightedToken[] {
	const ranked = [...byToken].sort((a, b) => b.usd_received - a.usd_received);
	const total = ranked.reduce((sum, token) => sum + token.usd_received, 0);

	return ranked.map((token, index) => ({
		...token,
		weight: index < WEIGHTS.length ? WEIGHTS[index] : 'muted',
		share: total > 0 ? token.usd_received / total : 0,
		// An asset nobody can price has no share to draw, and says so instead of
		// borrowing a size it has not earned.
		priced: token.usd_received > 0,
	}));
}

/** A stable pseudo random number in [0, 1) taken from a transaction hash. */
export function hashNoise(hash: string, salt: number): number {
	let value = 2166136261 ^ salt;
	for (let i = 2; i < hash.length; i += 1) {
		value ^= hash.charCodeAt(i);
		value = Math.imul(value, 16777619);
	}
	return ((value >>> 0) % 1000) / 1000;
}
