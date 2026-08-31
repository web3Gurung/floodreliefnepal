# Flood Relief Nepal

Static public site at floodreliefnepal.com. It explains the government's one-door system for Bhotekoshi flood relief and points people to official channels. This project does not collect money.

Open question, unresolved on purpose. The sentence above and the homepage copy both
say this site collects nothing, and the transparency page reports a donation drive
that does. Nobody should quietly reword either side. The team is deciding whether
the transparency page moves to nepalrelief.org instead. Until that lands, leave the
homepage copy and the private collection warnings exactly as they are.

## How it works

Two pages, each in English and Nepali, built as static HTML.

The guide is the homepage.

1. Hero. Name, a path into the rest of the page, and a Nepal Himalaya photo in `src/assets/hero.jpg`.
2. Policy. What the one-door rule is, and that private collection drives are not allowed.
3. Give. Cash via `https://pmdrf.nchl.com.np/`. Bank-transfer numbers are not on the page yet.
4. Supplies. Three government drop-off points, with contacts.
5. Questions. Short FAQ.
6. Sources. Links to the notices and reporting used for the copy.

The transparency page reports the Nepal Relief crypto donation drive. It reads
`src/data/ledger.json` at build time and shows the total received in USD, the
donation count, anything excluded from the total, and a table of donations that
links each one to Etherscan.

All URLs, hub names, phones, source links, and page copy live in `src/data/site.ts`
and `src/data/site.np.ts`. Edit those files to change content. Do not invent account
numbers, QR codes, or SWIFT details. Do not add them until a teammate PR lands
verified figures. The receiving address in `receiving` is verified and may stay.

Pages:

- `src/pages/index.astro` is `/`, `src/pages/np/index.astro` is `/np/`
- `src/pages/transparency.astro` is `/transparency`, `src/pages/np/transparency.astro` is `/np/transparency`
- `src/pages/404.astro` is the not-found page

Every page exists in both languages. `routes` in `src/data/site.ts` holds both
URLs of each page, and `Layout.astro` takes a `pageRoutes` pair so the language
switcher and the canonical alternates follow the page being rendered.

Layout and chrome:

- `src/layouts/Layout.astro` wraps every page (fonts, metadata, header, footer)
- Components sit in `src/components/`
- Shared Tailwind classes sit in `src/styles/global.css` under `@layer components` (`wrap`, `chapter`, `btn`, and similar)

## Deploying

**Pushing to GitHub deploys nothing.** The Cloudflare git build uploads `dist` and
nothing else, so it would replace the Worker with an assets only version and
silently kill the cron. The git build must stay turned off in the Cloudflare
dashboard. The only way to ship is:

```bash
npm run deploy
```

which runs `astro build` and then `wrangler deploy`, so the assets and the Worker
always go out together.

Locally the Worker runs through
`npx wrangler dev --local --env-file .env.local`, which reads the keys from
`.env.local` and simulates KV. Visiting `/__scheduled` fires the cron by hand when
started with `--test-scheduled`.

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
- Outfit and Noto Sans Devanagari via Astro's `fonts` config
- Light mode only. Do not add a dark theme or `prefers-color-scheme: dark`. Canvas is `#f6f6f4`. Tokens live in `src/styles/global.css`. `color-scheme: light` is set on `:root` and in `Layout.astro`.
- Cloudflare: connect the GitHub repo. Build command `npx astro build`. Output `dist`. `wrangler.jsonc` is set for Workers static assets.
- Photos: keep sources in `src/assets/`. Use Astro `<Picture />` with `formats={['avif', 'webp']}`. `astro build` writes the resized AVIF/WebP/JPEG files into `dist/_astro/`. That is the conversion step. Do not put large JPEGs in `public/`. Do not commit files from `dist/`. Do not add AP, Reuters, AFP, or Getty photos.

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
- Hero title is Flood Relief Nepal
- Sentence case headings
- No em dashes
- No curly quotes
- On the transparency page, no dashes of any kind as punctuation. Sentence case,
  active voice, and say what a thing is rather than what it is not
- Never show a number the data does not support
- The government card portal is one channel, not the whole identity of the site
- Header Give is a real button. The pmdrf link in the money section is a real button.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run index:donations
npm run deploy
```
