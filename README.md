# Flood Relief Nepal

Independent public guide for Bhotekoshi flood relief. Not a government website.

It does not collect donations. It lists where to send money, where to drop supplies, and how to skip scams.

- Cash: [pmdrf.nchl.com.np](https://pmdrf.nchl.com.np/) (card, Fonepay/UPI, NepalPAY/Alipay+)
- USD gateway: [pmrelieffund.himalayanbank.com](https://pmrelieffund.himalayanbank.com/)
- Alipay+ wallets that can scan NepalPAY QR: [NCHL partner list](https://nchl.com.np/alipay-mobile-payments-partner/)
- SWIFT and remittance apps: table on the Wise/Remitly panel, sourced from the [Nepal Embassy, India post](https://x.com/EONIndia/status/2093249597858828784)
- Content: `src/data/site.ts` (English), `src/data/site.np.ts` (Nepali), and `src/data/site.zh.ts` (Simplified Chinese at `/zh/`)
- How the repo is laid out: `AGENTS.md`

## Stack

Astro (static HTML) and Tailwind CSS v4. Light mode only. Outfit for type. Cloudflare Worker with static assets. Build command `npx astro build`, output directory `dist`. CSS is inlined. Hashed `/_astro/` files cache for a year via `public/_headers`. Site routes stay the same (`/`, `/np/`, `/zh/`, custom `404.html`). This is not an SPA.

Photos: `src/assets/hero.jpg` plus official portal screenshots `src/assets/pmdrf-fonepay.jpg` and `src/assets/pmdrf-nepalpay.jpg`. `astro build` turns them into resized AVIF/WebP/JPEG. Do not put the originals in `public/`. Share image: `public/og.png`.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Worker

Local Worker after a build:

```bash
npm run preview:worker
```

The Worker `floodreliefnepal` is connected to this GitHub repo. A push to `main` runs `npx astro build` then `npx wrangler deploy`. Other branches upload a preview version.

Manual deploy:

```bash
npm run deploy
```

That publishes to `*.workers.dev`. Production is `floodreliefnepal.com` (`floodreliefnepal.com/*` in `wrangler.jsonc`). Keep the Worker name `floodreliefnepal`. `dist/` is build output only; it is gitignored and is not a public URL.

`www.floodreliefnepal.com` 301s to `floodreliefnepal.com`. That redirect is a Cloudflare rule, not app code.

No Worker script, cron, or secrets yet. Add those in `src/worker.ts` and `wrangler.jsonc` when the indexer lands. Do not put secrets in git (`npx wrangler secret put NAME`). Do not reattach the domain to Pages.
