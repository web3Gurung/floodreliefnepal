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

Astro (static HTML) and Tailwind CSS v4. Light mode only. Outfit for type. CSS is inlined. Hashed `/_astro/` files cache for a year via `public/_headers`.

A Cloudflare Worker serves that output, answers `GET /api/ledger`, and runs the donation indexer on a cron. Deploy from GitHub on Cloudflare, which runs `npx astro build` and then `npx wrangler deploy`, so a merge to `main` ships the Worker and its cron along with the site.

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

## Deploy

Merging to `main` deploys. The Cloudflare git build runs `npx astro build` then
`npx wrangler deploy`, so the site and the Worker go out together.

Two things must already be in place when a change to the Worker merges, or the
deploy ships an indexer that cannot run: the KV namespace id committed in
`wrangler.jsonc`, and the three secrets pushed with `wrangler secret put`.
`AGENTS.md` has the detail.

To deploy by hand from a machine that is logged in:

```bash
npm run deploy
```
