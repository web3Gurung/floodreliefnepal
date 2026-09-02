# Design System

This is the design counterpart to `AGENTS.md`. Agents read it before changing layout, type, colour, motion, or components. Tokens live in `src/styles/global.css`. Shared classes live there under `@layer components`. Do not invent a second palette, a dark theme, or a new typeface.

Content facts (URLs, SWIFT rows, copy, what not to publish) stay in `AGENTS.md` and `src/data/`. This file is how the pages should look and feel.

---

## Overview

A quiet public publication, not a product dashboard and not a charity campaign site. Light paper, ink type, hairline rules. It should feel like a well-set notice that someone can trust with money: calm, specific, and a little severe.

Density is moderate. Chapters breathe. Information is set in a readable measure, not packed into cards for their own sake. Variance is low. Pages share one grid, one radius, one accent. The homepage hero is a centered stack with a photograph underneath. That centered hero is the identity of the guide, not a mistake to "fix" into an asymmetric split.

Motion is restrained. Buttons press. Hovers are gated to real pointers. The merge visualisation on `/transparency` is the one place motion may explain something. Everywhere else, stillness is the default.

Light mode only. `color-scheme: light` on `:root` and in `Layout.astro`. Do not add `prefers-color-scheme: dark`.

The site is an independent public guide. It does not dress as a government property, and it does not dress as a crypto app. Government portals, bank tables, and the onchain ledger all sit in the same publication voice.

---

## Colors

Named tokens, not one-off hex in components.

- **Canvas** (`#f6f6f4`) — Page background. Warm paper, not pure white, not cream-for-its-own-sake.
- **Surface** (`#ffffff`) — Cards, tables, the give switcher tray, FAQ panels.
- **Ink** (`#1a1a18`) — Primary text, primary buttons, focus rings, hairline emphasis. Off-black. Never `#000000`.
- **Muted** (`#5e5e5a`) — Secondary text, eyebrows, captions, timestamps, proof lines, inactive chrome.
- **Line** (`#e4e4e0`) — 1px borders, chapter hairlines, table rows, the pipeline break.
- **Accent** (`#165767`) — Teal, used only where colour carries meaning: the merge ribbons, mosaic tiles, pool fill, and the rare onchain badge. 7.48:1 on canvas. Do not use it as a marketing stripe, a hero wash, or a primary button.
- **Accent mid** (`#3d7a87`) — Second ribbon/tile weight, assigned by USD share.
- **Accent soft** (`#6a95a0`) — Third ribbon/tile weight. Fills only, never text. 3.02:1 on canvas.
- **Marker** (`#fff27a` to `#ffe445`) — `.mark-brush` yellow. High-stakes phrases only. See `AGENTS.md` for the allowed list.

A fourth token in the merge falls back to muted. Do not add a fifth hue as more assets arrive.

Shadow is a hairline, not a drop: `--shadow-border` (1px ring plus a 1–2px whisper). Use it on the give switcher tray. Cards use a 1px `line` border on `surface`, not a shadow.

---

## Typography

- **English display and body:** Outfit, 400 / 500 / 600. Fallback Helvetica Neue, system-ui, sans-serif.
- **Nepali:** Noto Sans Devanagari, 400 / 500, on `html.lang-np`. Line-height 1.75. No letter-spacing on display sizes. Eyebrows stay sentence case. Tracking on Devanagari breaks conjuncts.
- **Simplified Chinese:** Noto Sans SC, 400 / 500, on `html.lang-zh`. Same tracking and eyebrow rules as Nepali.
- **Mono:** System ui-monospace stack, only for addresses, account numbers, and SWIFT codes. 0.85rem for the receiving address. `user-select: all` on copyable values.
- **Numerals:** Latin tabular numerals in all three languages wherever a figure will be checked against Etherscan or a bank table. `dateLocaleFor` in `src/data/copy.ts` pins the numbering system for Nepali and Chinese so a figure on the page matches the one on Etherscan character for character.

Body is 1.0625rem, line-height 1.6, ink on canvas. Lede is 1.125rem, muted, max-width 38rem. Quiet captions are 0.95rem muted.

### Scale

Use the existing classes. Do not invent a fourth heading size.

| Role | Class | Size | Tracking | Max width |
| --- | --- | --- | --- | --- |
| Page title, hero | `.display` | `clamp(2.15rem, 5vw, 3.5rem)` | `-0.035em` | 14ch, 18ch on the transparency title |
| Chapter heading | `.chapter-title` | `clamp(1.75rem, 3.2vw, 2.4rem)` | `-0.03em` | 18ch, `max-w-none` when the line needs to run |
| Quiet heading | `.quiet-title` | `clamp(1.45rem, 2.4vw, 1.85rem)` | `-0.025em` | 20ch |
| Card heading | `.card-title` | 1.5rem | `-0.02em` | — |
| Raised figure (homepage fund) | `.raised` | `clamp(1.85rem, 3.4vw, 2.75rem)` | `-0.03em` | — |
| Transparency total | dedicated | `clamp(3.25rem, 12vw, 7rem)` | `-0.045em` | — |
| Eyebrow | `.eyebrow` | 0.75rem, weight 500, muted, uppercase, `0.14em` tracking | — | — |

`.display` is the hero voice. On `/transparency` it is the page `h1` only. Chapter `h2`s use `.chapter-title`. The dollar total is allowed to be larger than anything else on the site because it is the reason that page exists.

Sentence case headings. No title case. No em dashes. No curly quotes. On `/transparency`, no dash of any kind as punctuation.

---

## Layout

- **Canvas width:** `.wrap` is `min(calc(100% - 2.5rem), 68rem)`, 5rem side padding from the `md` breakpoint. Do not widen past 68rem.
- **Chapters:** `.chapter` is `py-16` / `md:py-24`. `.chapter-peak` is a touch taller for Verify. Separate chapters with `.hairline` (1px `line` on the top).
- **Split:** `.split` is one column, then two equal columns from `md` with 4rem gap. Used for Situation, Policy, Sources, and the transparency verify block. Heading on the left, body on the right.
- **Centered block:** `.center-block` max 40rem, used for the homepage hero, Verify, FAQ, and Share. The homepage hero is a centered stack on every viewport, photograph under the copy. Do not convert it to a split.
- **Body measure:** 38rem for ledes and long prose. Do not set article text full-bleed across 68rem.
- **Grid:** Prefer CSS grid. Pipeline on desktop is `1fr auto 1fr auto 1fr` so arrows occupy their own columns. Mosaic is a dense auto-fill of 44px cells.
- **Breakpoints in use:** `md` 48rem, `lg` 64rem. Mobile is a single column. No horizontal page scroll. Tables may scroll inside `.data-table-wrap`.
- **Touch:** Interactive controls are at least 44px (`min-h-11` or `min-h-14`). Focus is a 2px ink outline, 2px offset.

---

## Shape

- Cards, tables, callouts: 10px radius.
- Buttons: 6px radius.
- Give switcher tray: 18px radius around the 10px tiles.
- Mosaic tiles: 3px radius.
- Marker: irregular 0.12em / 0.38em / 0.16em / 0.3em, so it reads as a highlighter, not a pill.
- Do not mix 999px pills with 10px cards. Do not go square-brutalist. Do not go squircle-app.

---

## Components

Reuse the classes in `global.css`. New UI should look like it was printed in the same shop.

**Primary button (`.btn`)**
Ink fill, canvas text, 6px radius, `px-5 py-3`, medium weight, min-height 44px. Hover (fine pointer only): opacity 0.88. Active: `scale(0.96)` in 150ms ease-out. Header Donate, portal links, Himalayan Bank, Share copy.

**Outline button (`.btn-outline`)**
1px ink border, transparent fill, smaller padding. Hover: 6% ink wash. Same press scale. Used in the header.

**Text link**
Underline on hover, `underline-offset: 0.18em`. Official outbound links: `target="_blank"` plus `rel="noopener noreferrer"`. Same-page jumps, language switch, skip link, 404 home, and `tel:` stay in this tab.

**Card (`.card`)**
Surface on canvas, 1px line, 10px radius, `p-7` / `md:p-9`. Use when a block is a discrete object (share post, empty ledger, pipeline step). Do not card every paragraph.

**Eyebrow**
Small, muted, uppercase, wide tracking. Section kicker, table column headers, "Not live yet". Never uppercase in Nepali or Chinese.

**Give switcher**
2x2 tiles in a surface tray with `--shadow-border`. Inactive tiles sit on canvas. The selected tile is ink on canvas-text. Do not put links inside `.give-option` buttons. Do not use `:target` hashes to switch panels.

**Data table (`.data-table-wrap` / `.data-table`)**
Surface, 1px line, 10px radius, internal horizontal scroll. Uppercase muted headers. Body 0.95–1rem. Right-align amounts. This is the SWIFT table and the donations table. Do not invent a second table skin.

**FAQ**
Stacked `<details>`. Hairline between items. Plus/minus, not a chevron animation. Open from the URL hash.

**Marker (`.mark-brush`)**
Yellow highlighter on a few high-stakes phrases only. Never on a whole Himalayan row, never on every sentence.

**Copyable value**
The receiving address is the click target. It looks like mono text. JS promotes it to a button, shows "Copy address", then "Copied" for two seconds. If clipboard is missing, it stays selectable text. Same idea as Share, which reveals a Copy button only when JS runs.

**Pipeline**
Six steps, two rows of three. Real gaps, not a 1px bento. A muted SVG arrow between cards in a row, rotated down on mobile. A labelled hairline, "Public record stops here", between the live row and the pending row. Live steps have no badge. Pending steps get the eyebrow "Not live yet". Number is large muted tabular, title is medium, one sentence of what happens, proof quieter underneath.

**Merge**
The signature visual on `/transparency`. SVG, two layouts (wide and stacked), no client island. Ribbon width follows USD share. Accent weights by token. Empty reserved slot for the onward transfer stays visible at low opacity. Travelling dots are SMIL `animateMotion`, about three seconds on first load, then stop. `prefers-reduced-motion` shows resting dots only.

**Post card (`/transparency`, "Watched from outside")**
Ours, not an embed. The site loads no third party script and makes no third party request, and this section is the one that used to. It borrows X's proportions so a reader recognises what it is, but not X's typeface: 40px avatar with the `.photo` hairline, name at medium weight, X's blue check where `media.ts` records that X showed one, X's mark top right, handle and counts muted. Body clamped to four lines, visual only, full text stays in the DOM. A post's own image only, 8px radius, never the image of a post it quotes. Avatar, name and handle are one link to the post. No eyebrow: the avatar, handle and X mark already say what it is. Footer pinned with `margin-top: auto` so dates line up across a row. Likes and replies are frozen on the day `media.ts` says they were fetched. No bookmark or repost count: X does not publish one.

**Mosaic**
One tile per donation, oldest first, area from USD, 44px floor. Colour follows route/token weight, not amount. Each tile is an ordinary link. Hover opacity 0.72 on fine pointers. Active `scale(0.97)`.

---

## Motion

Default curve: `ease-out`, 150–160ms. Specify the properties (`transform`, `opacity`, `background-color`). Never `transition: all`.

Pressable things scale to 0.96 or 0.97 on `:active`. Hover effects live inside `@media (hover: hover) and (pointer: fine)`.

Do not animate keyboard-driven actions. Do not animate from `scale(0)`. Do not add page-load staggers, scroll-pinned theatre, or looping decoration. The merge is allowed to explain the flow once. Respect `prefers-reduced-motion`: drop transform, keep colour and opacity if they help.

---

## Pages

**Homepage (`/`, `/np/`, `/zh/`)**
Hero (centered), Situation, Policy, Give, Verify, Supplies, Questions, Share, Sources. Voice: a public guide to official channels. The one-door warning and "this site does not collect money" stay as they are until the team decides otherwise.

**Transparency (`/transparency`, `/np/transparency`, `/zh/transparency`)**
English, Nepali and Simplified Chinese. Headline number, merge, six-step pipeline, donations table, mosaic, verify-it-yourself, outside media. The merge is the one loud thing. Everything around it uses the quieter chapter register of the homepage. Do not restyle this page as a crypto dashboard.

Freshness copy is relative once JS can ask the feed ("This page last read the chain 4 hours ago"), so it reads the same for everyone. The absolute UTC stamp is the no-JS fallback and the line used when the feed is behind, stale, or down. Do not replace the relative line with a clock time as the happy path.

---

## Do's

- Read `src/styles/global.css` and this file before adding a class.
- Keep one accent, used where colour means something.
- Keep the homepage hero centered, photo under the copy, on every viewport.
- Put official outbound links in a new tab.
- Recalculate the homepage dollar conversion from the NRB USD buying rate when the rupee total changes.
- Write English and Nepali together for transparency strings, then Chinese. Chinese prose on the transparency page wants a Chinese reader before it ships. See `AGENTS.md`.
- Prefer a quieter line over a new component.

## Don'ts

- No dark theme, no `prefers-color-scheme: dark`.
- No Inter, no generic serif, no extra display face.
- No pure black, no neon, no purple glow, no gradient text, no glassmorphism.
- No emojis in headings or chrome.
- No em dashes, no curly quotes. No dash punctuation on `/transparency`.
- No title-case headings.
- No yellow marker except the phrases listed in `AGENTS.md`.
- No second table style, no second button style, no second card radius.
- No links inside `.give-option` buttons, no `:target` for the give switcher.
- Do not card the whole page. Do not turn the pipeline into a `gap-px` dashboard tile wall.
- Do not put `.display` on every `h2`.
- Do not invent SWIFT rows, account numbers, QR codes, or Alipay apps NCHL does not list.
- Do not add AP, Reuters, AFP, or Getty photos. Photos live in `src/assets/`, not `public/`.
- Do not host embassy tweet photos or extra bank QRs from the PMO PDF.
- Do not split the inlined CSS back into a render-blocking file.
- Do not add an analytics beacon.
- Do not quietly reword the homepage into a crypto fundraising site.
