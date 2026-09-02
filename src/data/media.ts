/**
 * Posts and news headlines about the donation drive, written by people outside
 * the project. Its job is to show a reader that this happened in public.
 *
 * Quotes are copied verbatim from the posts, straight from the API rather than
 * retyped, including the line breaks, the emoji and the curly apostrophes. The
 * no curly quotes rule in AGENTS.md governs copy we write, not words somebody
 * else said. Never paraphrase and never invent an entry: the card renders this
 * text as that person's words, and fabricated coverage would be the one thing
 * on this page that is not checkable.
 *
 * An empty list renders no section and no heading.
 *
 * Nothing here is an embed. The site loads no third party script and makes no
 * third party request: the card is ours, and every part of it, the avatar, the
 * badge, the image, the counts, is committed data rendered in our own markup.
 * That is why this file carries fields X's widget used to supply.
 *
 * Quotes are never translated. A post said what it said, in the language it was
 * said in, so `quote` is copied verbatim and `lang` tells a screen reader which
 * voice to use. Everything around the quote comes from the page copy and does
 * translate.
 *
 * Everything below came from X's public syndication endpoint on `countsAsOf`,
 * not from a person retyping it:
 *
 *   https://cdn.syndication.twimg.com/tweet-result?id=<status id>&token=a
 *
 * `npm run index:posts` refetches the counts and prints what changed. Nothing
 * on this page updates itself, so a count is true as of the day it was fetched
 * and the card says that date out loud rather than implying it is live.
 *
 * A post's own image only. Never the image of a post it quotes, and never the
 * quoted post itself. Three of the four posts here quote the same Solana post,
 * which is already the first card, so rendering the quote would put the same
 * graphic on the page four times and say nothing new.
 */

export type MediaItem = {
	/** A post gets the post card. An article gets a headline and a byline. */
	type: 'post' | 'article';
	/** Verbatim. The post's text, or the article's headline. */
	quote: string;
	/** BCP 47 tag for the quote, so a screen reader reads it in its own voice. */
	lang: string;
	/** Person who posted, or the byline. Empty when a publication has no byline. */
	author: string;
	/** The @handle for a post, the publication name for an article. */
	source: string;
	/** ISO date, the day it was published. */
	date: string;
	/** Where to read the original. */
	link: string;
	/** Canonical x.com status URL. Posts only. */
	postUrl?: string;

	/**
	 * Key into the avatar and image maps in `Media.astro`. The files live in
	 * `src/assets/media/`, because the build resizes them and `public/` would
	 * ship them untouched. A post with no key renders initials instead, so a
	 * new entry is never blocked on somebody finding a picture.
	 */
	assetKey?: string;
	/**
	 * Whether X showed a verification badge on `countsAsOf`. This records what
	 * X displayed on that date. It is not us vouching for anyone, which is why
	 * it is a fetched flag and not a hand set one.
	 */
	verified?: boolean;
	/** Alt text for the post's own image. Written by us, describing the image. */
	imageAlt?: string;
	/** Likes on `countsAsOf`. */
	likes?: number;
	/** Replies on `countsAsOf`. X's endpoint calls this `conversation_count`. */
	replies?: number;
	/**
	 * ISO date the counts were fetched. Rendered next to them, because a number
	 * that stopped moving should say when it stopped. No `countsAsOf`, no counts.
	 */
	countsAsOf?: string;
};

export const media: readonly MediaItem[] = [
	{
		type: 'post',
		quote: "We're selling ad space on the Solana logo.\n\n9 spots, with 100% of proceeds donated to Nepal flood relief. Win and your logo or artwork sits on our PFP and pinned post for a week.\n\n24 hours to bid and donate: https://nepal.mallow.art\n\nPowered by @mallowdotart",
		lang: 'en',
		author: 'Solana',
		source: '@solana',
		date: '2026-09-01',
		link: 'https://x.com/solana/status/2094775606475124877',
		postUrl: 'https://x.com/solana/status/2094775606475124877',
		assetKey: 'solana',
		verified: true,
		imageAlt:
			'Nine numbered slots laid over the three bars of the Solana logo, on black. Captioned advertising space segmentation for Solana logo, and all proceeds to Nepal.',
		likes: 3412,
		replies: 830,
		countsAsOf: '2026-09-02',
	},
	{
		type: 'post',
		quote: 'BREAKING: Rs. 19.4M has been raised in less than 4 hours 🇳🇵\n\n100% of the proceeds go directly to the Prime Minister’s Disaster Relief Fund.\n\nInternet capital markets on @solana can do more than move money faster. It can help people instantly when it matters the most.\n\nThe auction is live for another 20 hours. Go bid and contribute:',
		lang: 'en',
		author: 'Superteam Nepal Pop-Up',
		source: '@SuperteamNPL',
		date: '2026-09-01',
		link: 'https://x.com/SuperteamNPL/status/2094829854462218677',
		postUrl: 'https://x.com/SuperteamNPL/status/2094829854462218677',
		assetKey: 'superteamnpl',
		verified: true,
		imageAlt:
			'A Solana and Superteam graphic reading support the Nepal relief fund, with $127,777.44 raised and the auction ending in 20 hours 50 minutes. Powered by mallow.',
		likes: 74,
		replies: 8,
		countsAsOf: '2026-09-02',
	},
	{
		type: 'post',
		quote: 'To my Nepali friends who never understood and were fed into a narrative of what crypto is. \n\nLet me tell you, it is @solana , it is internet capital markets that allow you to raise $110k for victims of the flood for the country nepal, all over internet in less than an hour.\n\nThe next time we have this conversation, I want you to remember this.',
		lang: 'en',
		author: 'Ronak',
		source: '@Ronak0010',
		date: '2026-09-01',
		link: 'https://x.com/Ronak0010/status/2094796825693683811',
		postUrl: 'https://x.com/Ronak0010/status/2094796825693683811',
		assetKey: 'ronak0010',
		verified: true,
		likes: 132,
		replies: 12,
		countsAsOf: '2026-09-02',
	},
	{
		type: 'post',
		quote: 'Solana Foundation is auctioning ad space on its X profile and says 100% of proceeds will go to Nepal’s PM Disaster Relief Fund. Welcome to see global communities stepping up. \n\nFor anyone donating directly, the official accounts and QR codes are on the official site beware of fake QRs circulating on social media.\n\nDonate :',
		lang: 'en',
		author: 'Niraj Bhusal',
		source: '@nirajbhusal',
		date: '2026-09-01',
		link: 'https://x.com/nirajbhusal/status/2094797732410228967',
		postUrl: 'https://x.com/nirajbhusal/status/2094797732410228967',
		assetKey: 'nirajbhusal',
		verified: true,
		likes: 84,
		replies: 8,
		countsAsOf: '2026-09-02',
	},
];
