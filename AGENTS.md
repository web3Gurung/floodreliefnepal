# Flood Relief Nepal

Static public site at floodreliefnepal.com. It explains the government's one-door system for Bhotekoshi flood relief and points people to official channels. This project does not collect money.

## Before you change anything

Always `git pull` on the branch you will edit before making changes. If you already have local commits, `git pull --rebase`. Do not start from a stale checkout.

## How it works

One homepage, built as static HTML. English at `/`, Nepali at `/np/`, Simplified Chinese at `/zh/`.

1. Hero. Name, a path into the rest of the page, and a Nepal Himalaya photo in `src/assets/hero.jpg`. Centered stack, photo under the copy, on every viewport.
2. Situation. What is known about the Bhotekoshi flood, without publishing a death or missing count.
3. Policy. What the one-door rule is, and that private collection drives are not allowed. The private-collection sentence is yellow-marked.
4. Give. Four-option switcher: UPI, Alipay+, Card, and Wise/Remitly. Default is UPI. Tiles set `data-pay` in JS. Do not use `:target` hashes; those scroll the page. Do not put links inside `.give-option` buttons. UPI and Alipay+ show official portal screenshots (`src/assets/pmdrf-fonepay.jpg`, `src/assets/pmdrf-nepalpay.jpg`) and send people to `https://pmdrf.nchl.com.np/`. The Chinese Alipay tab is labelled 支付宝/ Alipay+. Its FAQ jump lives in the panel eyebrow, not in the tab. Card is fiat and crypto, same portal, with the Himalayan Bank USD gateway as a callout. Wise/Remitly shows the SWIFT table from `swiftAccounts`. Source line is the Nepal Embassy, India post. Fund total sits under the switcher, rupees plus a dollar conversion.
5. Verify. Short scam checks. The two official payment domains are bold.
6. Supplies. What responders are handing out, then the three government drop-off points with contacts.
7. Questions. Short FAQ. The Alipay+ apps answer copies NCHL's NepalPAY list at `https://nchl.com.np/alipay-mobile-payments-partner/`. Do not copy the global Alipay+ directory.
8. Share. Copyable post and share image (`public/og.png`).
9. Sources. Two-column list of notices and reporting used for the copy.

All URLs, hub names, phones, source links, SWIFT rows, and most copy live in `src/data/site.ts`. Nepali copy is `src/data/site.np.ts`. Simplified Chinese copy is `src/data/site.zh.ts`. Phrase highlighting uses `splitBy` in `src/data/copy.ts`. Edit those files to change content. Do not invent account numbers, extra QR codes, or SWIFT rows. Do not host embassy tweet photos or bank QRs from the PMO PDF. Change `swiftAccounts` only when a teammate PR lands verified figures.

Pages:

- `src/pages/index.astro` is `/`
- `src/pages/np/index.astro` is `/np/`
- `src/pages/zh/index.astro` is `/zh/`
- `src/pages/404.astro` is the not-found page

Layout and chrome:

- `src/layouts/Layout.astro` wraps every page (fonts, metadata, header, footer)
- Components sit in `src/components/`
- Shared Tailwind classes sit in `src/styles/global.css` under `@layer components` (`wrap`, `chapter`, `btn`, and similar)

## Tech stack

- Astro, static output (`astro build` writes `dist/`)
- Tailwind CSS v4 through `@tailwindcss/vite`
- `@astrojs/sitemap`
- Outfit, Noto Sans Devanagari, and Noto Sans SC via Astro's `fonts` config
- Light mode only. Do not add a dark theme or `prefers-color-scheme: dark`. Canvas is `#f6f6f4`. Tokens live in `src/styles/global.css`. `color-scheme: light` is set on `:root` and in `Layout.astro`.
- Cloudflare: connect the GitHub repo. Build command `npx astro build`. Output `dist`. `wrangler.jsonc` is set for Workers static assets. `public/_headers` caches hashed `/_astro/` files for a year. Leave HTML on the default short cache so a deploy still shows up. Compression is Cloudflare's job. Do not gzip files in the repo.
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
```
