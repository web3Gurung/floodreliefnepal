/**
 * Movements of our own money that are not donations.
 *
 * The address is a faithful record of the chain and the `inflows` table keeps
 * every row the chain has. Not every inbound transfer is a gift, though. When
 * funds leave this address and later come back, the chain shows an outbound
 * transfer and an inbound one, and counting the inbound as a donation adds the
 * same money to the total twice.
 *
 * That is not hypothetical. It happened once, and it doubled the published
 * figure: 175,990 USDC left on 17 October and the identical amount returned
 * nine days later, so a drive that had raised about 176,000 reported 352,000.
 *
 * The balance check cannot catch this on its own. Counting both legs leaves the
 * same remainder as counting neither, because the pair cancels. The evidence is
 * the timeline: the outbound was a round figure that emptied the address, the
 * inbound restored it to the base unit, and nothing else arrived in the nine
 * days between them.
 *
 * This list is deliberately hand written rather than inferred. A rule like
 * "an inbound that matches an earlier outbound is a return" would silently
 * swallow a real donation that happened to be the same size. Every entry names
 * both legs by transaction hash, so anyone can check both on Etherscan and see
 * for themselves that it is the same money.
 *
 * Both legs are excluded. The inbound is not a donation, and the outbound is
 * not money sent onward, because it came back.
 */
export type RoundTrip = {
	/** Transaction hash of the leg that left the address. */
	out: string;
	/** Transaction hash of the leg that brought the same amount back. */
	back: string;
	token: string;
	/** Exact amount, identical on both legs. */
	amount: string;
	/** Why this is our own money and not a gift. */
	note: string;
};

export const roundTrips: readonly RoundTrip[] = [
	{
		out: '0x8e576091f4202d81fe7eb483eecd8a08f65819456e1acb9d2a6ea3c2f523e0ca',
		back: '0xfafaba351abfb16cd2c28331e61542dd0e165f02854fde11dfa412977aac7cd1',
		token: 'USDC',
		amount: '175990',
		note:
			'The address held 175996.884710 USDC on 17 October 2026 when 175990.000000 left it, ' +
			'which is a round figure that emptied it down to 6.884710. The same amount to the base unit, ' +
			'175990000000, came back on 26 October, and no donation arrived in between. The return came from ' +
			'a different address than the outbound went to, which is what a service refunding from its own ' +
			'wallet looks like. The money left again on 3 November as 175999.39.',
	},
];

/** Lower case hashes of inbound legs, for lookup while building the payload. */
export const returnedInboundHashes: ReadonlySet<string> = new Set(
	roundTrips.map((trip) => trip.back.toLowerCase()),
);

/** Lower case hashes of outbound legs, which never count as money sent onward. */
export const returnedOutboundHashes: ReadonlySet<string> = new Set(
	roundTrips.map((trip) => trip.out.toLowerCase()),
);
