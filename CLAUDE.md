# Flood Relief Nepal

See `AGENTS.md` for stack, content rules, and commands. See `DESIGN.md` for how pages should look and feel. Read it before changing layout, type, colour, motion, or components.

Always `git pull` on the branch you will edit before making changes. If you already have local commits, `git pull --rebase`.

This is a static Astro site with Tailwind. Light mode only. Outfit for type, Noto Sans Devanagari on `/np/`, Noto Sans SC on `/zh/`. Tokens and shared classes live in `src/styles/global.css`. Do not invent a second palette or typeface.

It is an independent public guide, not a government website. It lists official channels after the Bhotekoshi disaster. It does not collect money.

That last sentence and the transparency page disagree, and the disagreement is open
on purpose. See the note at the top of `AGENTS.md`. Do not resolve it by editing the
homepage copy or the private collection warnings.

The guide is at `/`, `/np/` and `/zh/`. The transparency page is at `/transparency`
and `/np/transparency`, in English and Nepali only, on purpose.

Cash: `https://pmdrf.nchl.com.np/` (card, Fonepay/UPI, NepalPAY/Alipay+). Second government gateway, quotes in USD: `https://pmrelieffund.himalayanbank.com/`. SWIFT table is on the Wise/Remitly panel, sourced from the Nepal Embassy, India post. Alipay+ apps that can scan NepalPAY QR come from NCHL: `https://nchl.com.np/alipay-mobile-payments-partner/`.

Donation figures: `src/data/ledger.json`. Generated and committed, so the site builds
with no credential. `scripts/index-donations.ts` writes it, run with
`npm run index:donations`. Never hand edit it. Never guess a price: below 0.9
confidence a row stays unpriced, out of the total, and counted on the page.

Merging to `main` deploys the site and the Worker together. The KV namespace id must
be committed and the three secrets pushed before a Worker change merges.

Content (links, drop-off hubs, SWIFT rows, sources, English copy): `src/data/site.ts`. Nepali copy: `src/data/site.np.ts`. Simplified Chinese copy: `src/data/site.zh.ts`. Phrase highlights: `splitBy` in `src/data/copy.ts`. English is `/`, Nepali is `/np/`, Chinese is `/zh/`. Chinese brand is 尼泊尔洪灾救济. Footer made-by is Ronak and Ayushman.

The receiving address for the crypto drive is verified and lives in `receiving` in
`src/data/site.ts`. Do not add other bank account numbers or QR codes until a
teammate PR brings verified details.

Official outbound links open in a new tab. Yellow marker is only for the named high-stakes phrases in `AGENTS.md`. Recalculate the dollar conversion of the fund total from the NRB USD buying rate on the amount's `asOf` date.

Photos live in `src/assets/`, not `public/`. Hero: `<Picture />` with AVIF/WebP. Portal QR shots: `<Picture />` with WebP plus a high-quality JPEG fallback. `npm run build` (`astro build`) emits the resized files into `dist/_astro/`. Do not hand-convert, do not commit `dist/`, and do not add AP, Reuters, AFP, or Getty photos. Do not host extra bank QRs or embassy tweet photos. Share image is `public/og.png` (1200x630). Title on one line, button "See how to donate". Rebuild it in HTML, not with an image model.

CSS is inlined (`build.inlineStylesheets: 'always'`). Do not split it back out. `public/_headers` caches hashed `/_astro/` files for a year. Leave HTML on the short cache so a deploy still shows up. Compression is Cloudflare. Do not gzip files in the repo. Cloudflare Web Analytics, if it is on, is a dashboard setting. It is not a script in this repo.

Deploy as Worker `floodreliefnepal` with static assets, not Pages. Production is `floodreliefnepal.com`. Merging to `main` deploys: the Cloudflare git build runs `astro build` then `wrangler deploy`, so the site and the Worker go out together. Other branches upload a preview version with `wrangler versions upload` and do not touch production. That needs **Builds for non-production branches** in the Worker dashboard (Settings, Build, Branch control) and `preview_urls: true` in `wrangler.jsonc`. The stable preview is `https://<branch>-floodreliefnepal.gurungbuilds.workers.dev`. Keep the Wrangler `name` as `floodreliefnepal`. `dist/` is gitignored build output. `npm run deploy` builds then `wrangler deploy`. The Worker script is `worker/index.ts`, its cron and KV binding are in `wrangler.jsonc`, and its three secrets live only in the Cloudflare account. Secrets: `wrangler secret put`. `keep_vars: true` in `wrangler.jsonc` is what keeps them through a deploy: Wrangler treats that file as the source of truth and deletes any variable it does not find there, which is how the three keys were wiped on 1 September. Do not remove it. `www` redirects to the apex in Cloudflare, not in this repo. Do not reattach the domain to Pages.

Do not invent SWIFT rows, extra account numbers, or extra QR codes. Change `swiftAccounts` only when a teammate PR brings verified details.

Do not commit `.agents/`, `.claude/`, `.opencode/`, or skill lockfiles.

`.env.local` holds the Etherscan key and the Supabase credentials. It is gitignored.
Never print it, never commit it, never inline a key into source.
