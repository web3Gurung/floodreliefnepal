# Flood Relief Nepal

Public site for official Nepal flood relief after the Bhotekoshi disaster.

It does not collect donations. Cash goes to the government's portal. Supplies go to the three drop-off points named by the Prime Minister's Office.

- Cash: [pmdrf.nchl.com.np](https://pmdrf.nchl.com.np/)
- Content: `src/data/site.ts`
- How the repo is laid out: `AGENTS.md`

## Stack

Astro (static HTML) and Tailwind CSS v4. Deploy from GitHub on Cloudflare. Build command `npx astro build`, output directory `dist`.

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
