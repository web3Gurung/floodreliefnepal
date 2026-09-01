# Flood Relief Nepal

See `AGENTS.md` for stack, content rules, and commands.

Always `git pull` on the branch you will edit before making changes. If you already have local commits, `git pull --rebase`.

This is a static Astro site with Tailwind. Light mode only. Outfit for type, Noto Sans Devanagari on `/np/`, Noto Sans SC on `/zh/`. It is an independent public guide, not a government website. It lists official channels after the Bhotekoshi disaster. It does not collect money.

Cash: `https://pmdrf.nchl.com.np/` (card, Fonepay/UPI, NepalPAY/Alipay+). Second government gateway, quotes in USD: `https://pmrelieffund.himalayanbank.com/`. SWIFT table is on the Wise/Remitly panel, sourced from the Nepal Embassy, India post. Alipay+ apps that can scan NepalPAY QR come from NCHL: `https://nchl.com.np/alipay-mobile-payments-partner/`.

Content (links, drop-off hubs, SWIFT rows, sources, English copy): `src/data/site.ts`. Nepali copy: `src/data/site.np.ts`. Simplified Chinese copy: `src/data/site.zh.ts`. Phrase highlights: `splitBy` in `src/data/copy.ts`. English is `/`, Nepali is `/np/`, Chinese is `/zh/`. Chinese brand is 尼泊尔洪灾救济. Footer made-by is Ronak and Ayushman.

Official outbound links open in a new tab. Yellow marker is only for the named high-stakes phrases in `AGENTS.md`. Recalculate the dollar conversion of the fund total from the NRB USD buying rate on the amount's `asOf` date.

Photos live in `src/assets/`, not `public/`. Hero: `<Picture />` with AVIF/WebP. Portal QR shots: `<Picture />` with WebP plus a high-quality JPEG fallback. `npm run build` (`astro build`) emits the resized files into `dist/_astro/`. Do not hand-convert, do not commit `dist/`, and do not add AP, Reuters, AFP, or Getty photos. Do not host extra bank QRs or embassy tweet photos. Share image is `public/og.png` (1200x630). Title on one line, button "See how to donate". Rebuild it in HTML, not with an image model.

CSS is inlined (`build.inlineStylesheets: 'always'`). Do not split it back out. `public/_headers` caches hashed `/_astro/` files for a year. Leave HTML on the short cache so a deploy still shows up. Compression is Cloudflare. Do not gzip files in the repo. Cloudflare Web Analytics, if it is on, is a dashboard setting. It is not a script in this repo.

Deploy as Worker `floodreliefnepal` with static assets, not Pages. Production is `floodreliefnepal.com`. Push to `main` builds and deploys. Keep the Wrangler `name` as `floodreliefnepal`. `dist/` is gitignored build output. `npm run deploy` builds then `wrangler deploy`. No Worker script, cron, or secrets yet. Secrets: `wrangler secret put`. `www` redirects to the apex in Cloudflare, not in this repo. Do not reattach the domain to Pages.

Do not invent SWIFT rows, extra account numbers, or extra QR codes. Change `swiftAccounts` only when a teammate PR brings verified details.

Do not commit `.agents/`, `.claude/`, `.opencode/`, or skill lockfiles.
