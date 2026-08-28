# Flood Relief Nepal

Static public site at floodreliefnepal.com. It explains the government's one-door system for Bhotekoshi flood relief and points people to official channels. This project does not collect money.

## Before you change anything

Always `git pull` on the branch you will edit before making changes. If you already have local commits, `git pull --rebase`. Do not start from a stale checkout.

## How it works

One homepage, built as static HTML. English at `/`, Nepali at `/np/`.

1. Hero. Name, a path into the rest of the page, and a Nepal Himalaya photo in `src/assets/hero.jpg`. Centered stack, photo under the copy, on every viewport.
2. Situation. What is known about the Bhotekoshi flood, without publishing a death or missing count.
3. Policy. What the one-door rule is, and that private collection drives are not allowed. The private-collection sentence is yellow-marked.
4. Give. Two cards: card/fiat and crypto, both to `https://pmdrf.nchl.com.np/`. Himalayan Bank USD gateway sits under the cards as a callout. The reported fund total shows rupees and a dollar conversion. Bank-transfer numbers are not on the page yet.
5. Verify. Short scam checks. The two official payment domains are bold.
6. Supplies. What responders are handing out, then the three government drop-off points with contacts.
7. Questions. Short FAQ.
8. Share. Copyable post and share image.
9. Sources. Two-column list of notices and reporting used for the copy.

All URLs, hub names, phones, source links, and most copy live in `src/data/site.ts`. Nepali copy is `src/data/site.np.ts`. Phrase highlighting uses `splitBy` in `src/data/copy.ts`. Edit those files to change content. Do not invent account numbers, QR codes, or SWIFT details. Do not add them until a teammate PR lands verified figures.

Pages:

- `src/pages/index.astro` is `/`
- `src/pages/np/index.astro` is `/np/`
- `src/pages/404.astro` is the not-found page

Layout and chrome:

- `src/layouts/Layout.astro` wraps every page (fonts, metadata, header, footer)
- Components sit in `src/components/`
- Shared Tailwind classes sit in `src/styles/global.css` under `@layer components` (`wrap`, `chapter`, `btn`, and similar)

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
- The government card portal is one channel, not the whole identity of the site
- Header Give is a real button. The pmdrf links in the money section are real buttons. The Himalayan Bank domain in the USD callout is a real button.
- Official outbound links open in a new tab (`target="_blank"` plus `rel="noopener noreferrer"`). Same-page jumps, language switch, skip link, 404 home, and `tel:` stay in this tab.
- Yellow marker (`.mark-brush`) is only for a few high-stakes phrases: KAST, Solflare, RedotPay, "quotes in USD" / "अमेरिकी डलरमा", and the private-collection ban. Do not mark every sentence.
- The dollar figure next to the fund total is a conversion of the rupee amount at the Nepal Rastra Bank USD buying rate on the `asOf` date. Recalculate it when the rupee figure changes. Do not invent a new total.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```
