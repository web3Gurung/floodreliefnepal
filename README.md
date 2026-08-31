# Flood Relief Nepal

Independent public guide for Bhotekoshi flood relief. Not a government website.

It does not collect donations. It lists where to send money, where to drop supplies, and how to skip scams.

- Cash: [pmdrf.nchl.com.np](https://pmdrf.nchl.com.np/)
- Content: `src/data/site.ts`
- How the repo is laid out: `AGENTS.md`

## Stack

Astro (static HTML) and Tailwind CSS v4. Light mode only. Outfit for type. A
Cloudflare Worker serves the static output, answers `GET /api/ledger`, and runs the
donation indexer on a cron.

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

## Deploy

Pushing to GitHub deploys nothing. The Cloudflare git build is off on purpose,
because it uploads `dist` alone and would replace the Worker with an assets only
version, which stops the indexer. Ship with:

```bash
npm run deploy
```

That builds the site and deploys the Worker together. `AGENTS.md` covers the
secrets and the KV namespace.
