# Flood Relief Nepal

Static public site at floodreliefnepal.com. It explains the government's one-door system for Bhotekoshi flood relief and points people to official channels. This project does not collect money.

## How it works

One homepage, built as static HTML.

1. Hero. Name and a button to the government card portal.
2. Policy. What the one-door rule is, and that private collection drives are not allowed.
3. Give. Cash via `https://pmdrf.nchl.com.np/`. Bank-transfer numbers are not on the page yet.
4. Supplies. Three government drop-off points, with contacts.
5. Questions. Short FAQ.
6. Sources. Links to the notices and reporting used for the copy.

All URLs, hub names, phones, and source links live in `src/data/site.ts`. Edit that file to change content. Do not invent account numbers, QR codes, or SWIFT details. Do not add them until a teammate PR lands verified figures.

Pages:

- `src/pages/index.astro` is `/`
- `src/pages/404.astro` is the not-found page

Layout and chrome:

- `src/layouts/Layout.astro` wraps every page (fonts, metadata, header, footer)
- Components sit in `src/components/`
- Shared Tailwind classes sit in `src/styles/global.css` under `@layer components` (`wrap`, `chapter`, `btn`, and similar)

## Tech stack

- Astro, static output (`astro build` writes `dist/`)
- Tailwind CSS v4 through `@tailwindcss/vite`
- `@astrojs/sitemap`
- Inter and Noto Sans Devanagari via Astro's `fonts` config
- Cloudflare: connect the GitHub repo. Build command `npx astro build`. Output `dist`. `wrangler.jsonc` is set for Workers static assets.

Node 22.12 or newer.

## Do not publish

Keep these out of git: `.agents/`, `.claude/`, `.opencode/`, `.grok/`, `skills-lock.json`. They are gitignored.

`AGENTS.md` and `CLAUDE.md` may be committed.

## Integrations and packages

Official Astro integrations: `npx astro add <name>`. Do not hand-edit `package.json` for those.

Other packages: install with npm.

Check current Astro docs before using fonts, sitemap, or adapters.

## Copy

- Hero title is Flood Relief Nepal
- Sentence case headings
- No em dashes
- No curly quotes
- Primary cash button always goes to `https://pmdrf.nchl.com.np/`

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```
