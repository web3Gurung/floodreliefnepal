# Flood Relief Nepal

Independent public guide for Bhotekoshi flood relief. Not a government website.

It does not collect donations. It lists where to send money, where to drop supplies, and how to skip scams.

- Cash: [pmdrf.nchl.com.np](https://pmdrf.nchl.com.np/)
- USD gateway: [pmrelieffund.himalayanbank.com](https://pmrelieffund.himalayanbank.com/)
- Content: `src/data/site.ts` (English) and `src/data/site.np.ts` (Nepali)
- How the repo is laid out: `AGENTS.md`

## Stack

Astro (static HTML) and Tailwind CSS v4. Light mode only. Outfit for type. Deploy from GitHub on Cloudflare. Build command `npx astro build`, output directory `dist`.

Hero photo: `src/assets/hero.jpg`. `astro build` turns it into AVIF and WebP. Do not put the original in `public/`.

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
