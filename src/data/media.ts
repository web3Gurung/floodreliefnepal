/**
 * Posts and news headlines about the donation drive, written by people outside
 * the project. Its job is to show a reader that this happened in public.
 *
 * Empty until real coverage exists. An empty list renders no section, no
 * heading, and no request to X. Never fill it with invented entries: this page
 * asks a reader to trust its numbers, and fabricated coverage would be the one
 * thing on it that is not checkable.
 *
 * Quotes are never translated. A post said what it said, in the language it was
 * said in, so `quote` is copied verbatim and `lang` tells a screen reader which
 * voice to use. Everything around the quote comes from the page copy and does
 * translate.
 *
 * For a post, `link` and `postUrl` are the same canonical x.com status URL.
 * X's widget script hydrates the blockquote by reading that URL, and if the
 * script never arrives the quote stays on the page in our own type.
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
};

export const media: readonly MediaItem[] = [];
