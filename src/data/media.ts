/**
 * ============================================================================
 * PLACEHOLDER DATA. NONE OF THIS IS REAL COVERAGE.
 * ============================================================================
 *
 * Every entry below is invented, marked `placeholder: true`, and written so a
 * reader who somehow sees it cannot mistake it for a real post or a real
 * headline. The accounts, the publications and the links are all fictional.
 *
 * Replace them with real items before this page goes live. Delete the
 * `placeholder` flag as you go. While any entry still carries the flag, the
 * section prints a notice saying so, and nothing here is presented as coverage
 * that happened.
 *
 * An empty list renders no section at all.
 *
 * Quotes are never translated. A post said what it said, in the language it was
 * said in, so `quote` is copied verbatim and `lang` tells a screen reader which
 * voice to use. Everything around the quote comes from the page copy and does
 * translate.
 *
 * For a post, `link` and `postUrl` are the same canonical x.com status URL.
 * X's widget script hydrates the blockquote by reading that URL, and if the
 * script never arrives the quote below stays on the page in our own type.
 */

export type MediaItem = {
	/** A post gets an X embed with a written fallback. An article never does. */
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
	/** Invented. Remove once a real item takes its place. */
	placeholder?: true;
};

export const media: readonly MediaItem[] = [
	{
		type: 'post',
		quote:
			'Placeholder text standing in for a real post about the relief drive. It runs to about the length of a short post so the layout can be judged before real coverage arrives.',
		lang: 'en',
		author: 'Placeholder account one',
		source: '@placeholder_one',
		date: '2026-08-30',
		link: 'https://x.com/placeholder_one/status/1',
		postUrl: 'https://x.com/placeholder_one/status/1',
		placeholder: true,
	},
	{
		type: 'article',
		quote: 'Placeholder headline standing in for real reporting on the relief drive',
		lang: 'en',
		author: '',
		source: 'Placeholder Publication',
		date: '2026-08-30',
		link: 'https://example.com/placeholder-article',
		placeholder: true,
	},
	{
		type: 'post',
		quote:
			'Placeholder text standing in for a second post. This one runs longer, so the section can be checked with items of different heights sitting next to each other in the same row.',
		lang: 'en',
		author: 'Placeholder account two',
		source: '@placeholder_two',
		date: '2026-08-31',
		link: 'https://x.com/placeholder_two/status/2',
		postUrl: 'https://x.com/placeholder_two/status/2',
		placeholder: true,
	},
	{
		type: 'article',
		quote: 'Second placeholder headline, standing in for coverage from another publication',
		lang: 'en',
		author: 'Placeholder Byline',
		source: 'Second Placeholder Publication',
		date: '2026-08-31',
		link: 'https://example.com/second-placeholder-article',
		placeholder: true,
	},
];
