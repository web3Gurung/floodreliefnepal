# Nepal Relief transparency dashboard, phase 1 build spec

Paste this into Claude Code at the root of the `floodreliefnepal` repo.

`RECEIVING_ADDRESS` is `0xA891BB5abf91aBf1796074a1303E75754AF1823D` on Ethereum mainnet.

Fill these three blanks before you run it:

- `ETHERSCAN_API_KEY` = free key from etherscan.io/apis
- Supabase project URL and service role key
- Cloudflare account with Workers and KV enabled

---

## Prompt

You are building a public transparency page for Nepal Relief, a crypto donation drive whose funds are collected onchain by Engage Nepal, a US 501(c)(3), and passed to Nepal's Prime Minister Disaster Relief Fund.

Phase 1 covers inbound donations only. The bank leg comes later. Build so that adding it later requires no redesign.

### Stack

- Frontend: new Astro page in this repo at `/transparency`, plus `/np/transparency` and `/zh/transparency`. Reuse the existing layout, header, footer, and language switcher. Do not introduce a new design system.
- One client island for the visualization. Preact or React, whichever the repo already has. If neither, use Preact.
- Indexer: Cloudflare Worker with a cron trigger, every 60 seconds.
- Store: Supabase Postgres.
- Public read: the same Worker serves `GET /api/ledger` from Cloudflare KV.

### Why this shape

The frontend must never call Etherscan. The key stays server side, the page loads from a cached blob, and a traffic spike costs nothing.

---

## Part 1: the indexer

### Source

Etherscan V2, base `https://api.etherscan.io/v2/api`, always `chainid=1`.

Poll three actions against `RECEIVING_ADDRESS`, each with `startblock` set to the last indexed block plus one, `sort=asc`, `offset=1000`:

| action | catches |
|---|---|
| `txlist` | native ETH sent straight to the address |
| `tokentx` | USDC and every other ERC-20 arriving |
| `txlistinternal` | ETH forwarded through a router contract |

Also poll `action=balance` for native ETH held, and `action=tokenbalance` for USDC held.

Discard any row where the address is the sender. Phase 1 records inflows only. Keep outbound rows in a separate table, unpopulated for now, so phase 2 is a query change not a migration.

### Rate budget

Four calls per minute is 5,760 per day against a 100,000 per day free quota. Do not poll faster than 60 seconds. Ethereum blocks are 12 seconds, so anything under 30 seconds wastes quota for no freshness.

Note the July 2026 Etherscan change: max records per request is now 1,000 on the free plan, and internal transactions by block range left the free tier. Address level internal transactions still work, which is what this uses.

### Route labelling

Do not hardcode router contract addresses. Derive the label:

1. If the ERC-20 `from` is the zero address, the token was minted to the address. That means it arrived over Circle CCTP, which is how Trails settles cross chain. Label `routed`.
2. Otherwise call `eth_getCode` on the `from` address once and cache the result. Non empty code means a contract sent it, so label `routed`. Empty means a person's wallet sent it directly, so label `direct`.
3. Store the raw `from` either way.

This is deliberately heuristic and needs no maintenance when Trails changes contracts. Origin chain and origin token enrichment via the Trails API is phase 3. Leave the columns nullable now.

### Pricing

Be honest rather than complete.

- USDC, USDT, DAI: value at 1.00 USD.
- ETH: fetch the price at the transaction's day from CoinGecko free tier and store it. Cache per day so one lookup covers many transactions.
- Anything else: store `usd_at_receipt` as null and surface the token amount only. Never guess a price.

Track `unpriced_count` in the public payload and show it on the page. A total that quietly omits assets is worse than a total that says what it excludes.

### Schema

```sql
create table inflows (
  tx_hash text not null,
  log_index int not null default 0,
  block_number bigint not null,
  block_time timestamptz not null,
  from_address text not null,
  token_symbol text not null,
  token_address text,
  amount_raw numeric not null,
  amount_token numeric not null,
  usd_at_receipt numeric,
  route text not null check (route in ('direct','routed')),
  origin_chain text,
  origin_token text,
  batch_id text,
  primary key (tx_hash, log_index)
);

create table outflows (
  tx_hash text primary key,
  block_time timestamptz not null,
  to_address text not null,
  amount_usdc numeric not null,
  batch_id text
);

create table indexer_state (
  key text primary key,
  value text not null
);

create table contract_cache (
  address text primary key,
  is_contract boolean not null
);
```

The composite primary key on `(tx_hash, log_index)` is what makes the indexer idempotent. Upsert on conflict do nothing, so overlapping polls and replays are safe.

Store the last indexed block in `indexer_state`. On a cold start with no state, backfill from block 0 with `sort=asc` and page until fewer than 1,000 rows come back.

### Public payload

After each successful poll, if any row changed, write this to KV under `ledger` and only then. Serve it from `GET /api/ledger` with `Cache-Control: public, max-age=30, stale-while-revalidate=300`.

```json
{
  "updated_at": "2026-08-31T09:12:00Z",
  "address": "0x...",
  "totals": {
    "usd_received": 41822.50,
    "donation_count": 214,
    "unpriced_count": 2,
    "balance_usdc": 41822.50,
    "balance_eth": 0.0,
    "usd_sent_onward": 0
  },
  "routes": [
    { "route": "direct", "usd": 18400.00, "count": 96 },
    { "route": "routed", "usd": 23422.50, "count": 118 }
  ],
  "recent": [
    {
      "tx_hash": "0x...",
      "block_time": "2026-08-31T08:55:12Z",
      "from_address": "0x...",
      "token_symbol": "USDC",
      "amount_token": 250.0,
      "usd_at_receipt": 250.0,
      "route": "routed"
    }
  ],
  "all": []
}
```

`recent` holds the latest 50. `all` holds every row, trimmed to the fields the mosaic needs, so the page can render the full history without a second request. Split them into two endpoints only if the blob passes 500KB.

---

## Part 2: the page

### Structure, top to bottom

1. **Headline number.** Total received in USD, with donation count under it. One line stating what is excluded if `unpriced_count` is above zero.
2. **The merge.** The signature visual. Spec below.
3. **The pipeline explainer.** Six steps, each with what happens and what proof exists.
4. **Recent donations.** A table.
5. **The mosaic.** Every donation as a tile.
6. **Verify it yourself.** Address, Etherscan link, and how to check the number without trusting this page.

### The merge, the signature visual

An SVG, left to right, full width of the content column, roughly 3:1 aspect on desktop and 4:3 stacked on mobile.

**Left third.** Entry points, one per origin route. Phase 1 has two: donations sent straight from a wallet, and donations routed in through a swap. Each is a labelled node.

**Middle.** A ribbon leaves each entry point and curves into a single channel. Ribbon width is proportional to that route's share of USD received, so the picture reads correctly at a glance. The channel ends in one node, the collection wallet, drawn as a pool whose fill height maps to total received.

**Right third.** Reserved, drawn at low opacity, labelled with what will appear once the first transfer to the fund goes out. Do not hide it. An explicitly empty slot teaches more than a cropped canvas, and it commits publicly to filling it.

**Motion.** Each donation is a dot that travels its ribbon and drops into the pool. Use SVG `animateMotion` along the ribbon path, not a JS animation loop. On first load, animate the most recent 20 in sequence over about three seconds, then stop. When the poll returns a new donation, animate that one dot only. Respect `prefers-reduced-motion` by rendering dots at rest in the pool with no travel.

**Interaction.** Click any dot or any ribbon to open a small panel with the transaction: what arrived, when, which route, and a link to Etherscan. Keyboard reachable.

The pool never empties in phase 1. In phase 2, outflow drains the pool while a separate delivered total climbs and never falls. Build the pool fill as a function of `balance` and the delivered total as a function of `usd_sent_onward`, so phase 2 is data, not code.

### The mosaic

Every donation as a tile in a wrapping grid, oldest first. Tile area scales with USD amount, floor at a tappable size. Colour distinguishes route, not amount. Hover or tap shows the transaction.

Its job is not analysis. Its job is to make 200 small donations look like 200 people instead of one number, and to be worth screenshotting.

### The pipeline explainer

Six steps: donor wallet, then the swap for routed donations, then the collection address held by Engage Nepal, then the offramp, then the bank transfer, then the fund's account.

For each step give one sentence on what happens and one on what proof exists. Then state plainly that the first three steps are verifiable by anyone right now with no permission, and the last three depend on a document the team publishes.

That contrast is the point of the page. Do not soften it. It teaches exactly what a public ledger solves and where trust still lives, and readers who came in sceptical will trust the rest of the page more for it.

Mark steps four to six as not yet live in phase 1.

---

## Part 3: design and copy

Read the existing global stylesheet and layout in this repo first and pull colours, type, spacing, and radius from there. Do not invent a palette. The site is light, sober, and information first, and this page must look like the same publication.

Two departures are allowed, both earned by the content:

- The merge needs colour to separate routes. Take it from the existing accent, one hue per route, no gradients.
- The headline number can be larger than anything else on the site, since it is the reason the page exists.

Copy rules:

- No dashes anywhere. No em dash, no en dash, no hyphen used as punctuation. Hyphenated words are fine.
- Sentence case. Plain verbs. Active voice. No corporate padding.
- Say what a thing is, not what it is not.
- Every number that could be misread carries the qualifier next to it, not in a footnote.
- Write English and Nepali copy for every string. Nepali is a full translation, not a subset.

Empty state, before the first donation lands: state that the address is live and no donations have arrived yet, and show the address. Do not render an empty chart with zeroes.

Failure state, if `/api/ledger` does not respond: show the last known figures with the timestamp they were fetched, and say the live feed is unreachable. Never show zero as if it were a reading.

---

## Part 4: build order

1. Schema and Supabase project.
2. Worker with cron, three Etherscan actions, upsert, `indexer_state`. Verify against the live address and confirm the totals match Etherscan by hand.
3. Pricing and the KV payload.
4. `/api/ledger` with cache headers.
5. Astro page, headline number, recent donations table. Ship this. It is already a working transparency page.
6. The merge.
7. The mosaic and the explainer.
8. Nepali translation.

Stop after step 5 and show me the page before building the visualization.

## Cost

Etherscan free, Supabase free, Cloudflare Workers and KV free, CoinGecko free. Do not put the cron on Vercel Hobby, which allows one execution per day.
