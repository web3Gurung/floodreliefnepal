# Flood Relief Nepal

See `AGENTS.md` for stack, content rules, and commands.

Always `git pull` on the branch you will edit before making changes. If you already have local commits, `git pull --rebase`.

This is a static Astro site with Tailwind. Light mode only. Outfit for type. It is an independent public guide, not a government website. It lists official channels after the Bhotekoshi disaster. It does not collect money.

Cash: `https://pmdrf.nchl.com.np/`. Second government gateway, quotes in USD: `https://pmrelieffund.himalayanbank.com/`

Content (links, drop-off hubs, sources, English copy): `src/data/site.ts`. Nepali copy: `src/data/site.np.ts`. Phrase highlights: `splitBy` in `src/data/copy.ts`.

Official outbound links open in a new tab. Yellow marker is only for the named high-stakes phrases in `AGENTS.md`. Recalculate the dollar conversion of the fund total from the NRB USD buying rate on the amount's `asOf` date.

Photos live in `src/assets/`, not `public/`. Use `<Picture />` from `astro:assets`. `npm run build` (`astro build`) emits AVIF and WebP into `dist/_astro/`. Do not hand-convert, do not commit `dist/`, and do not add AP, Reuters, AFP, or Getty photos.

Do not add SWIFT codes, bank account numbers, or QR codes until a teammate PR brings verified details.

Do not commit `.agents/`, `.claude/`, `.opencode/`, or skill lockfiles.
