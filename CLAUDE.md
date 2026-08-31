# Flood Relief Nepal

See `AGENTS.md` for stack, content rules, and commands.

This is a static Astro site with Tailwind. Light mode only. Outfit for type. It is an independent public guide, not a government website. It lists official channels after the Bhotekoshi disaster. It does not collect money.

That last sentence and the transparency page disagree, and the disagreement is open
on purpose. See the note at the top of `AGENTS.md`. Do not resolve it by editing the
homepage copy or the private collection warnings.

Two pages, each in English and Nepali: the guide at `/` and `/np/`, and the
transparency page at `/transparency` and `/np/transparency`.

Cash: `https://pmdrf.nchl.com.np/`

Content and page copy: `src/data/site.ts` and `src/data/site.np.ts`

Donation figures: `src/data/ledger.json`. Generated and committed, so the site builds
with no credential. `scripts/index-donations.ts` writes it, run with
`npm run index:donations`. Never hand edit it. Never guess a price: below 0.9
confidence a row stays unpriced, out of the total, and counted on the page.

Photos live in `src/assets/`, not `public/`. Use `<Picture />` from `astro:assets`. `npm run build` (`astro build`) emits AVIF and WebP into `dist/_astro/`. Do not hand-convert, do not commit `dist/`, and do not add AP, Reuters, AFP, or Getty photos.

The receiving address for the crypto drive is verified and lives in `receiving` in
`src/data/site.ts`. Do not add SWIFT codes, bank account numbers, or QR codes until a
teammate PR brings verified details.

Do not commit `.agents/`, `.claude/`, `.opencode/`, or skill lockfiles.

`.env.local` holds the Etherscan key and the Supabase credentials. It is gitignored.
Never print it, never commit it, never inline a key into source.
