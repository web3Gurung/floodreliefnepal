# Flood Relief Nepal

Independent public guide for Bhotekoshi flood relief. Not a government website.

It does not collect donations. It lists where to send money, where to drop supplies, and how to skip scams.

- Cash: [pmdrf.nchl.com.np](https://pmdrf.nchl.com.np/) (card, Fonepay/UPI, NepalPAY/Alipay+)
- USD gateway: [pmrelieffund.himalayanbank.com](https://pmrelieffund.himalayanbank.com/)
- SWIFT and remittance apps: table on the Wise/Remitly panel, sourced from the [Nepal Embassy, India post](https://x.com/EONIndia/status/2093249597858828784)
- Content: `src/data/site.ts` (English) and `src/data/site.np.ts` (Nepali)
- How the repo is laid out: `AGENTS.md`

## Stack

Astro (static HTML) and Tailwind CSS v4. Light mode only. Outfit for type. Deploy from GitHub on Cloudflare. Build command `npx astro build`, output directory `dist`. CSS is inlined. Hashed `/_astro/` files cache for a year via `public/_headers`.

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
