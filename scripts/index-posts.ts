/**
 * Refetches the like and reply counts for the posts in src/data/media.ts.
 *
 * `npm run index:posts`. Node strips the types. No credential: the endpoint is
 * the same public one X's own embed script calls, so this needs nothing from
 * `.env.local` and works on any checkout.
 *
 * It does not write the file. It prints what changed and leaves the edit to a
 * person, because `media.ts` also holds verbatim quotes and hand written alt
 * text that no script should be able to touch. Paste the numbers in, move
 * `countsAsOf` to today, and commit.
 *
 * Counts on the page are frozen on the day they were fetched, and the card says
 * that date next to them. If you refresh the numbers, move the date too, or the
 * page starts asserting something it cannot support.
 *
 * X publishes likes as `favorite_count` and replies as `conversation_count`.
 * It does not publish a bookmark, repost or view count here, which is why the
 * card shows two counts and not five.
 */

import { media } from '../src/data/media.ts';

const ENDPOINT = 'https://cdn.syndication.twimg.com/tweet-result';

type TweetResult = {
	favorite_count?: number;
	conversation_count?: number;
	user?: { is_blue_verified?: boolean; screen_name?: string };
};

/** The status id is the last path segment of the canonical x.com URL. */
function statusIdOf(url: string): string | undefined {
	return url.match(/\/status\/(\d+)/)?.[1];
}

async function fetchCounts(id: string): Promise<TweetResult | undefined> {
	const url = `${ENDPOINT}?id=${id}&token=a`;
	const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
	if (!response.ok) {
		console.error(`  HTTP ${response.status} for ${id}`);
		return undefined;
	}
	return (await response.json()) as TweetResult;
}

const today = new Date().toISOString().slice(0, 10);
let changed = 0;

console.log(`\nRefetching counts. Today is ${today}.\n`);

for (const item of media) {
	if (item.type !== 'post') continue;

	const id = statusIdOf(item.postUrl ?? item.link);
	if (!id) {
		console.error(`${item.source}: no status id in ${item.postUrl ?? item.link}`);
		continue;
	}

	const result = await fetchCounts(id);
	if (!result) continue;

	const likes = result.favorite_count;
	const replies = result.conversation_count;
	const verified = result.user?.is_blue_verified ?? false;

	const moved = likes !== item.likes || replies !== item.replies || verified !== item.verified;
	if (moved) changed += 1;

	console.log(`${item.source}${moved ? '  CHANGED' : ''}`);
	console.log(`  likes      ${item.likes} -> ${likes}`);
	console.log(`  replies    ${item.replies} -> ${replies}`);
	console.log(`  verified   ${item.verified} -> ${verified}`);
	console.log(`  countsAsOf ${item.countsAsOf} -> ${today}`);
	console.log('');
}

console.log(
	changed === 0
		? 'Nothing moved. Leave media.ts alone.'
		: `${changed} entr${changed === 1 ? 'y' : 'ies'} moved. Edit media.ts by hand, including countsAsOf.`,
);
