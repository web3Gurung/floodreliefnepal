# Flood Relief Nepal

See `AGENTS.md` for stack, content rules, and commands.

This is a static Astro site with Tailwind. Light mode only. Outfit for type. It is an independent public guide, not a government website. It lists official channels after the Bhotekoshi disaster. It does not collect money.

Cash: `https://pmdrf.nchl.com.np/`

Content (links, drop-off hubs, sources): `src/data/site.ts`

Photos live in `src/assets/`, not `public/`. Use `<Picture />` from `astro:assets`. `npm run build` (`astro build`) emits AVIF and WebP into `dist/_astro/`. Do not hand-convert, do not commit `dist/`, and do not add AP, Reuters, AFP, or Getty photos.

Do not add SWIFT codes, bank account numbers, or QR codes until a teammate PR brings verified details.

Do not commit `.agents/`, `.claude/`, `.opencode/`, or skill lockfiles.
