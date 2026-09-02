# Flood Relief Nepal

Static public site at floodreliefnepal.com. It explains the government's one-door system for Bhotekoshi flood relief and points people to official channels. This project does not collect money.

Open question, unresolved on purpose. The sentence above and the homepage copy both
say this site collects nothing, and the transparency page reports a donation drive
that does. Nobody should quietly reword either side. The team is deciding whether
the transparency page moves to nepalrelief.org instead. Until that lands, leave the
homepage copy and the private collection warnings exactly as they are.

## Before you change anything

Always `git pull` on the branch you will edit before making changes. If you already have local commits, `git pull --rebase`. Do not start from a stale checkout.

## How it works

Two pages, built as static HTML.

The guide is the homepage. English at `/`, Nepali at `/np/`, Simplified Chinese at `/zh/`.

The transparency page is at `/transparency` and `/np/transparency`. It exists in
English and Nepali only, on purpose: nobody here reads Chinese well enough to
publish a page about money in it. The switcher on that page offers two languages
rather than linking a third to a different page, and its hreflang alternates say
the same thing.

1. Hero. Name, a path into the rest of the page, and a Nepal Himalaya photo in `src/assets/hero.jpg`. Centered stack, photo under the copy, on every viewport.
2. Situation. What is known about the Bhotekoshi flood, without publishing a death or missing count.
3. Policy. What the one-door rule is, and that private collection drives are not allowed. The private-collection sentence is yellow-marked.
4. Give. Four-option switcher: UPI, Alipay+, Card, and Wise/Remitly. Default is UPI. Tiles set `data-pay` in JS. Do not use `:target` hashes; those scroll the page. Do not put links inside `.give-option` buttons. UPI and Alipay+ show official portal screenshots (`src/assets/pmdrf-fonepay.jpg`, `src/assets/pmdrf-nepalpay.jpg`) and send people to `https://pmdrf.nchl.com.np/`. The Chinese Alipay tab is labelled 支付宝/ Alipay+. Its FAQ jump lives in the panel eyebrow, not in the tab. Card is fiat and crypto, same portal, with the Himalayan Bank USD gateway as a callout. Wise/Remitly shows the SWIFT table from `swiftAccounts`. Source line is the Nepal Embassy, India post. Fund total sits under the switcher, rupees plus a dollar conversion.
5. Verify. Short scam checks. The two official payment domains are bold.
6. Supplies. What responders are handing out, then the three government drop-off points with contacts.
7. Questions. Short FAQ. The Alipay+ apps answer copies NCHL's NepalPAY list at `https://nchl.com.np/alipay-mobile-payments-partner/`. Do not copy the global Alipay+ directory.
8. Share. Copyable post and share image (`public/og.png`).
9. Sources. Two-column list of notices and reporting used for the copy.

The transparency page reports the Nepal Relief crypto donation drive. It reads
`src/data/ledger.json` at build time and shows the total received in USD, the
donation count, anything excluded from the total, a table of donations linking each
one to Etherscan, the merge visualisation, the mosaic, the six step pipeline
explainer, and posts and headlines from outside the project.

All URLs, hub names, phones, source links, SWIFT rows, and most copy live in `src/data/site.ts`. Nepali copy is `src/data/site.np.ts`. Simplified Chinese copy is `src/data/site.zh.ts`. Phrase highlighting uses `splitBy` in `src/data/copy.ts`, and `{name}` slots use `fill` in the same file. Edit those files to change content. Do not invent account numbers, extra QR codes, or SWIFT rows. Do not host embassy tweet photos or bank QRs from the PMO PDF. Change `swiftAccounts` only when a teammate PR lands verified figures. The receiving address in `receiving` is verified and may stay.

Pages:

- `src/pages/index.astro` is `/`
- `src/pages/np/index.astro` is `/np/`
- `src/pages/zh/index.astro` is `/zh/`
- `src/pages/transparency.astro` is `/transparency`, `src/pages/np/transparency.astro` is `/np/transparency`
- `src/pages/404.astro` is the not-found page

Every page exists in both languages. `routes` in `src/data/site.ts` holds both
URLs of each page, and `Layout.astro` takes a `pageRoutes` pair so the language
switcher and the canonical alternates follow the page being rendered.

Layout and chrome:

- Visual rules live in `DESIGN.md`. Read it before changing layout, type, colour, motion, or components. It is the design counterpart to this file.
- `src/layouts/Layout.astro` wraps every page (fonts, metadata, header, footer)
- Components sit in `src/components/`
- Shared Tailwind classes sit in `src/styles/global.css` under `@layer components` (`wrap`, `chapter`, `btn`, and similar). Tokens in that file are the source of truth for the values named in `DESIGN.md`.

## Deploying

**Merging to `main` deploys.** The Cloudflare git build runs `npx astro build` and
then `npx wrangler deploy`, so the site and the Worker go out together. There is no
separate step and no assets only path that could strand the Worker.

Pull requests do not go to `floodreliefnepal.com`. A push to any other branch runs
`npx astro build` then `npx wrangler versions upload`, which uploads a Worker
version and returns a preview URL. The stable one is
`https://<branch>-floodreliefnepal.gurungbuilds.workers.dev`. Cloudflare attaches
it to the GitHub check on that commit.

Two dashboard facts that live outside this repo, and that are easy to forget:

- **Builds for non-production branches** must be on. Worker, Settings, Build,
  Branch control. If that box is off, PRs get no build and no preview.
- Preview URLs themselves are opt-in. `preview_urls: true` is already in
  `wrangler.jsonc`. Do not remove it. Do not reattach the domain to Pages to get
  previews back.

That makes two things prerequisites of the merge rather than jobs for afterwards.
If either is missing when a Worker change lands, the deploy succeeds and ships an
indexer that cannot run.

- The KV namespace id is committed in `wrangler.jsonc`. Create the namespace with
  `npx wrangler kv namespace create LEDGER` and paste the id. It is an identifier,
  not a credential, and belongs in the repo.
- The three secrets are pushed with `npx wrangler secret put`: `ETHERSCAN_API_KEY`,
  `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. They live only in the Cloudflare account
  and never in the repo. `npx wrangler secret list` shows the names.
- `keep_vars: true` must stay in `wrangler.jsonc`. Wrangler treats that file as the
  source of truth for a Worker's variables and deletes anything it does not find
  there, which is what wiped the three secrets on the deploy of 1 September. The
  flag is the only thing standing between a routine merge and an indexer that
  cannot authenticate. Do not remove it.

To deploy by hand from a machine that is logged in:

```bash
npm run deploy
```

Locally the Worker runs through
`npx wrangler dev --local --env-file .env.local`, which reads the keys from
`.env.local` and simulates KV. Visiting `/__scheduled` fires the cron by hand when
started with `--test-scheduled`.

### The cron does not fire, so three things can run the indexer

Cloudflare's Cron Trigger has never invoked this Worker. Three separate Workers
on this account registered a `* * * * *` schedule that Cloudflare accepted,
reported back through its own API and displayed in the dashboard, and none of
them ever fired. One of those three was written entirely in the dashboard editor,
so it is not our code and not our tooling.

The indexer therefore has three ways to run, and the cron is the least of them.

- **`POST /api/refresh`**, every five minutes from an outside scheduler. This is
  the floor and it works when nobody is reading. It needs the `REFRESH_TOKEN`
  secret in an `x-refresh-token` header, refuses `GET` outright, compares the
  token in constant time, refuses a second run within thirty seconds, and fails
  closed with a 503 if the secret is missing.
- **Traffic.** A `GET /api/ledger` that finds the last run older than five
  minutes starts a refresh behind the response. Every page load hits that
  endpoint for the freshness line, so readers keep the figures current by
  reading them. The response is not held up: it is served in about four
  milliseconds while the refresh runs in `waitUntil`.
- **The cron**, still registered and still wired to the same code, so the day
  Cloudflare starts firing it we get the cadence back with no change.

`last-run` in KV is written before each run, not after, so a run that dies still
holds the others off. It rate limits the endpoint and gates the traffic path. It
does not stop a stampede on its own: three concurrent readers all read the old
value before any writes the new one, which is exactly what happened in testing.
An in-isolate promise handle collapses a burst into one run. Two isolates in two
locations can still race, and that is fine, because the indexer is idempotent.

### The page updates itself

The baked `ledger.json` is the first paint and the fallback, not the answer. On
load the page fetches `/api/ledger` and replaces the headline, the donation
count, the timestamp line and the table rows with what the feed reports, because
donations keep arriving after a deploy and a frozen number is the one thing this
page must not show.

The merge and the mosaic stay as drawn at build time. When the feed is ahead,
each prints one line saying how many donations have arrived since.

The baked figures survive as the answer for a reader with no JavaScript, and as
the fallback when the feed does not respond, and in that case the page says the
feed is not answering rather than leaving a stale number unexplained.

The script never localises a date. The browser has no Nepali locale data,
`Intl.DateTimeFormat.supportedLocalesOf('ne-NP')` comes back empty and it
silently answers in English in the wrong field order, so month names and the
field order are handed to it from the server.

Three timestamps, and they are not interchangeable. `updated_at` is when the
figures were produced and only moves on a write. `last-run` is when a run was
last attempted, written before the work so it can act as a lock and a rate
limit. `last-ok` is when the chain was last read successfully, written only
after the indexer returns, and it is the only one the page may call a read. An
indexer failing on every attempt still advances an attempt, so reporting that as
a read would be a lie.

### Telling a dead cron from a healthy one

This was the failure mode worth designing against: when the indexer dies,
`/api/ledger` keeps serving the last good payload and the page keeps rendering the
committed one, so nothing looks wrong. Three things now prevent that.

- Every `/api/ledger` response carries `x-ledger-age` in seconds,
  `x-ledger-updated-at`, and `x-ledger-source`, which says whether the body came
  from KV or from the committed copy.
- The page asks the feed how it is doing and says so in words. Fresh and agreeing
  with the page, ahead of the page, behind by hours, or not answering at all, each
  gets its own line, and the last three are marked visibly.
- A run writes to KV when the figures change **or** when the stored copy is older
  than thirty minutes. Writing only on change would freeze `updated_at` through a
  quiet night and make a healthy feed look dead.

## The donation ledger

`src/data/ledger.json` is the public payload for the transparency page. It is
generated, and it is committed so the site builds without any credential.

`scripts/index-donations.ts` writes it. Run `npm run index:donations`, which loads
`.env.local` through `node --env-file`. The script reads three Etherscan V2 account
actions for the receiving address, labels each inflow, prices it through DefiLlama,
upserts into Supabase, and writes the payload. It is idempotent: a replay from
block 0 inserts nothing.

Rules for anything that touches these figures:

- Never hand edit `ledger.json`. Re-run the indexer.
- A price below 0.9 confidence leaves the row unpriced. Never guess a price.
- Unpriced rows stay out of the total and are counted on the page.
- `.env.local` holds the Etherscan key and the Supabase credentials. It is
  gitignored. Never print it, never commit it, never inline a key into source.
- The `route` column stays in the database and reaches neither the payload nor
  the page. A smart contract wallet is also a contract, so that label cannot
  carry a public claim about how someone gave.

## Tech stack

- Astro, static output (`astro build` writes `dist/`)
- Tailwind CSS v4 through `@tailwindcss/vite`
- `@astrojs/sitemap`
- Outfit, Noto Sans Devanagari, and Noto Sans SC via Astro's `fonts` config
- Light mode only. Do not add a dark theme or `prefers-color-scheme: dark`. Canvas is `#f6f6f4`. Tokens live in `src/styles/global.css`. `color-scheme: light` is set on `:root` and in `Layout.astro`.
- Cloudflare: Worker `floodreliefnepal` with static assets, not Pages. Production is `floodreliefnepal.com` (`floodreliefnepal.com/*` in `wrangler.jsonc`). GitHub `main` runs `npx astro build` then `npx wrangler deploy`. Keep `"name": "floodreliefnepal"`. `not_found_handling` is `404-page` (not an SPA). `dist/` is gitignored build output, not a public URL. The Worker script is `worker/index.ts` with the indexer in `worker/indexer.ts`, and its cron, KV binding and route are in `wrangler.jsonc`. Secrets: `wrangler secret put`, never git, and they must be pushed before a Worker change merges. `www.floodreliefnepal.com` 301s to the apex via a Cloudflare redirect; do not reimplement in app code. Do not reattach the domain to Pages. Manual deploy: `npm run deploy`. `public/_headers` caches hashed `/_astro/` files for a year. Leave HTML on the default short cache so a deploy still shows up. Compression is Cloudflare's job. Do not gzip files in the repo.
- Photos: keep sources in `src/assets/`. Hero uses Astro `<Picture />` with `formats={['avif', 'webp']}` and mid quality. Portal QR screenshots use `<Picture />` with `formats={['webp']}`, JPEG fallback, and high quality so they still scan. `astro build` writes the resized files into `dist/_astro/`. That is the conversion step. Do not put large JPEGs in `public/`. Do not commit files from `dist/`. Do not add AP, Reuters, AFP, or Getty photos.
- Share image is `public/og.png`, 1200x630. Title is one line. Subtitle is "A public guide for Bhotekoshi flood relief". Button says "See how to donate". Alt text in `Layout.astro` matches. Rebuild it in HTML, do not generate it with an image model.
- CSS is inlined (`build.inlineStylesheets: 'always'`). The sheet is small. Do not split it back out into a render-blocking file.
- Cloudflare Web Analytics, if it is on, is a dashboard setting. It is not a script in this repo. Do not add a beacon to kill the Lighthouse chain. Turn it off in the dashboard if you do not want it.

Node 22.12 or newer.

## Do not publish

Keep these out of git: `.agents/`, `.claude/`, `.opencode/`, `.grok/`, `skills-lock.json`. They are gitignored.

`AGENTS.md` and `CLAUDE.md` may be committed.

## Integrations and packages

Official Astro integrations: `npx astro add <name>`. Do not hand-edit `package.json` for those.

Other packages: install with npm.

Check current Astro docs before using fonts, sitemap, or adapters.

## Copy

- This is an independent public guide, not an official government site. Do not say otherwise.
- Hero title is Flood Relief Nepal. Chinese brand is 尼泊尔洪灾救济.
- Sentence case headings
- No em dashes
- No curly quotes
- On the transparency page, no dashes of any kind as punctuation. Sentence case,
  active voice, and say what a thing is rather than what it is not
- Never show a number the data does not support
- The government card portal is one channel, not the whole identity of the site
- Header Donate is a real button. The pmdrf links in the money section are real buttons. The Himalayan Bank domain in the USD callout is a real button.
- Official outbound links open in a new tab (`target="_blank"` plus `rel="noopener noreferrer"`). Same-page jumps, language switch, skip link, 404 home, and `tel:` stay in this tab.
- Yellow marker (`.mark-brush`) is only for a few high-stakes phrases: KAST, Solflare, RedotPay, "quotes in USD" / "अमेरिकी डलरमा" / "以美元计价", the private-collection ban, and the USD cell in the SWIFT table. Do not mark the whole Himalayan row. Do not mark every sentence.
- Remittance source on the page is the Nepal Embassy, India post. Do not put the PMO PDF on Give, FAQ, or Sources.
- Alipay+ apps that can scan NepalPAY QR come from NCHL (`site.official.alipayPartners`). Cite that page in Sources. Do not add wallets NCHL does not list.
- Footer made-by is Ronak and Ayushman. Do not add extra makers unless a maintainer asks.
- The dollar figure next to the fund total is a conversion of the rupee amount at the Nepal Rastra Bank USD buying rate on the `asOf` date. Recalculate it when the rupee figure changes. Do not invent a new total.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run preview:worker
npm run index:donations
npm run deploy
```
