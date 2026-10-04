---
name: UMKM Digital Platform
description: Paper-and-navy marketing surface for Indonesian small businesses, with mint fields, coral emphasis, and Archivo display type over Manrope body.
colors:
  navy: "#0B2545"
  navy-deep: "#061629"
  mint: "#C7F5DF"
  mint-deep: "#8FE7C4"
  coral: "#E8442A"
  coral-deep: "#C2341D"
  paper: "#FBFAF7"
  mute: "#53657A"
  card: "#FFFFFF"
  border: "color-mix(in oklab, #0B2545 14%, transparent)"
  ring: "#E8442A"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 6.5vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-lead:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body-strong:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  card: "1rem"
  tile: "0.75rem"
  pill: "999px"
spacing:
  gutter: "1.5rem"
  section: "clamp(4.5rem, 10vw, 8.75rem)"
  card: "1.5rem"
  card-lg: "2.25rem"
  grid-gap: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.75rem"
    height: "3.25rem"
    typography: "{typography.body-strong}"
  button-primary-hover:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    typography: "{typography.body-strong}"
  button-accent:
    backgroundColor: "{colors.coral}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.75rem"
    height: "3.25rem"
    typography: "{typography.body-strong}"
  button-accent-hover:
    backgroundColor: "{colors.coral-deep}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    typography: "{typography.body-strong}"
  button-secondary:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.75rem"
    height: "3.25rem"
    typography: "{typography.body-strong}"
  button-secondary-hover:
    backgroundColor: "{colors.mint-deep}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    typography: "{typography.body-strong}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.75rem"
    height: "3.25rem"
    typography: "{typography.body-strong}"
  button-on-dark:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "0.75rem 1.75rem"
    height: "3.25rem"
    typography: "{typography.body-strong}"
  button-on-dark-hover:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    typography: "{typography.body-strong}"
  badge:
    backgroundColor: "transparent"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
    typography: "{typography.label}"
  badge-accent:
    backgroundColor: "{colors.coral}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.navy}"
    rounded: "{rounded.card}"
    padding: "1.5rem 1.5rem"
  card-mint:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.navy}"
    rounded: "{rounded.card}"
    padding: "1.5rem 1.5rem"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.navy}"
    rounded: "{rounded.card}"
---

# Design System: UMKM Digital Platform

## Overview

**Creative North Star: "The Honest Blueprint"**

A paper-and-ink storefront for Indonesian UMKM owners who have been burned by vague offers. The system reads like a well-set working document: warm paper ground (#FBFAF7), deep navy structure (#0B2545) carrying the weight, mint fields (#C7F5DF) marking where a decision happens, and coral (#E8442A) reserved for the one word or number that must land. Archivo 700 sets the headline voice — tight, industrial, slightly negative-tracked — while Manrope carries every sentence a person actually reads.

Density is generous and the seams are hard: full-bleed color bands alternate (mint hero, navy fact strip, paper problems, paper bento, navy workflow, paper pricing, mint proof, paper FAQ, navy-deep close) with one shared vertical rhythm so the page feels sectioned rather than scrolled. Depth comes from a small, consistent shadow vocabulary under cards and primary actions, plus offset card layers in the hero, never from gradients.

Key Characteristics:
- Paper ground, navy structure, mint decision fields, coral emphasis — four roles, no fifth accent.
- Archivo 700 display over Manrope 400–800 body; no third family.
- Full-bleed color bands with one shared section rhythm.
- Pill actions with a soft lifted shadow; cards lift at rest, not on hover.
- Honest placeholders: synthetic and pending data is labelled on the page, never dressed as real.

## Colors

The palette is role-locked: paper is the reading ground, navy is structure and text, mint is the field where a decision is made, coral is emphasis. Nothing else appears.

### Primary
- **Deep Navy** (`#0B2545`): body text, section headings on paper, all dark bands (fact strip, workflow), primary button fills, card text.
- **Navy Deep** (`#061629`): closing CTA band, footer, scrollbar track, primary button hover fill.

### Secondary
- **Field Mint** (`#C7F5DF`): hero background, pricing card fill, secondary button fill, proof section band, icon wells in the bento grid, selection background base.
- **Mint Deep** (`#8FE7C4`): mint hover states, hero backdrop bloom, hero card offset layer border, text selection fill.

### Tertiary
- **Signal Coral** (`#E8442A`): one emphasized phrase per headline, step numerals, bento tile spec lines, accordion chevrons and hover, focus ring, accent button fill, wordmark separator dot.
- **Coral Deep** (`#C2341D`): coral button hover.

### Neutral
- **Warm Paper** (`#FBFAF7`): page background, text on dark bands, on-dark button fill.
- **Slate Mute** (`#53657A`): secondary body text, FAQ answers, captions, footer meta.
- **Card White** (`#FFFFFF`): card and testimonial surfaces on paper and mint bands.
- **Hairline Border** (`color-mix(in oklab, #0B2545 14%, transparent)`): every divider, card border, and section seam. Section rules use the same mix at 15% over mint fields.

### Named Rules
**The Coral Spot Rule.** Coral appears as a single spot per composition: one phrase in a headline, one numeral run, one spec line. It is never a background band, never body text on paper, and never a second accent competing beside mint in the same cell.
**The Honest-Data Rule.** Any figure or quote without product evidence ships visibly labelled ("Data sintetis", "Placeholder — menunggu aturan harga"). A label beats an invented number, always.

## Typography

**Display Font:** Archivo (700 only, `system-ui` fallback) — loaded as `--font-archivo`.
**Body Font:** Manrope (400/500/700/800, `system-ui` fallback) — loaded as `--font-manrope`.
**Label/Mono Font:** none. Labels use Manrope 800 uppercase; no mono face is in use.

**Character:** Archivo compresses the headline voice (0.95 line-height, -0.03em tracking) so big statements read as one block; Manrope opens back up at 1.625 for the sentences that must be read slowly on a phone.

### Hierarchy
- **Display** (Archivo 700, `clamp(2.5rem, 6.5vw, 4.5rem)`, 0.95): hero H1 only.
- **Headline** (Archivo 700, `clamp(2rem, 5vw, 3.5rem)`, 0.95): every section H2; closing CTA runs `clamp(2.25rem, 6vw, 4.5rem)`.
- **Title** (Archivo 700, 1.5–2.25rem, 0.95): card titles, plan names, step titles, bento lead tile heading.
- **Body** (Manrope 400, 1rem, 1.625): paragraphs, list rows, FAQ answers. Lead paragraphs use 1.125rem; body copy caps near 46–58ch.
- **Label** (Manrope 800, 0.6875rem, 0.08em tracking, uppercase): badges, tile spec lines, card row keys, footer meta. Utility class `.label`.
- **Nav/CTA text** (Manrope 700, 0.875–1rem): header links, buttons.

### Named Rules
**The Two-Face Rule.** Archivo sets headings, plan names, step titles and the wordmark; Manrope sets everything read as a sentence. No third family and no display face for prose.
**The Tight-Headline Rule.** Every Archivo heading ships at line-height 0.95 with -0.03em tracking and `text-wrap: balance`. Loosening either turns the block into a stack of lines.

## Layout

Container: `max-width: 72rem`, centered, 1.5rem inline padding; the footer uses 72rem/1.5rem–1.5rem equivalents (max-w-6xl, px-4/6). Section rhythm is one class for every band: `padding-block: clamp(4.5rem, 10vw, 8.75rem)`.

Hero is `min-height: 100svh`, mint, with a desktop two-column grid at `45fr / 55fr` (2.25rem gap) — promise and actions left, synthetic planner card right — collapsing to a single column with stacked actions below `md`. Ambient mint bloom is a 28rem blurred circle parked off the top-right corner.

Bento features: 3-column grid at `md`, 1rem gap, one navy lead tile spanning 2×2 with 2.25rem padding, two wide tiles spanning 2 columns, remainder single cells. Workflow: 1 column → 2 at `sm` → 4 at `lg`, each step topped by a 1px paper/25% rule. Pricing: `lg` split at `1fr / 1.1fr`. Testimonials: 3 columns at `md`. Problem list and FAQ are single-column with 1px hairline rows.

Responsive behavior is breakpoint-driven, mobile-first; `overflow-x: hidden` on body plus `overflow-wrap: anywhere` guarantees no horizontal scroll at 390px.

### Named Rules
**The One-Rhythm Rule.** Every section seam uses the same `clamp(4.5rem, 10vw, 8.75rem)` block padding. Only the bento section may subtract the top pad when it directly follows the problem list.

## Elevation & Depth

Hybrid: tonal banding does most of the work (alternating paper/mint/navy bands are the primary depth cue), with a small lifted-shadow vocabulary for the objects that sit on top of a band. Shadows are soft, low-opacity navy, always with a wide negative spread — never hard offsets, never colored glows.

### Shadow Vocabulary
- **Button lift** (`box-shadow: 0 10px 24px -12px rgb(6 22 41 / 0.55)`): primary and ghost-navy actions; coral variant uses `rgb(194 52 29 / 0.6)`.
- **Card float** (`box-shadow: 0 24px 60px -32px rgb(6 22 41 / 0.35)`): every `Card` at rest.
- **Layer offset**: hero planner card sits on a `rotate(2deg)` white/60% mint-bordered sheet inset 2rem from its edges — depth by layering, not by shadow.
- **Focus ring** (`outline: 3px solid #E8442A; outline-offset: 3px`): global `:focus-visible`; buttons additionally carry a 2px coral ring with 2px offset in their own layer.

### Named Rules
**The Lift-on-Action Rule.** Resting surfaces do not animate. Cards keep one fixed shadow; only actions move — `-2px` translate on hover, `+1px` and shadow-off on active.

## Shapes

Corners are soft but not pill-round for surfaces: cards, bento tiles and the hero planner card use a 16px radius (`--radius: 1rem`); icon wells use 12px; every action — buttons, badges, the plan-confirmation strip — is a full pill (999px). Borders are 1px hairlines at 14% navy everywhere a surface meets another surface; bento tiles and testimonials sit on white with that hairline, the lead tile needs no border because navy does the separating. No clipped corners, no notches, no hard 0-radius boxes outside full-bleed bands.

## Components

### Buttons
- **Shape:** full pill (999px), 3.25rem min height default, `0.75rem 1.75rem` padding (sm `2.5rem`/`1rem`; lg `3.5rem`/`2.25rem`), Manrope 700 at 1rem.
- **Primary:** navy fill, paper text, button-lift shadow; hover → navy-deep with `-2px` translate (0.18s, `cubic-bezier(0.16, 1, 0.3, 1)`); active → `+1px`, shadow removed.
- **Accent:** coral fill, white text, coral-tinted lift shadow; hover → coral-deep, `-2px`. Used sparingly.
- **Secondary:** mint fill, navy text; hover → mint-deep. This is the action on navy bands.
- **Outline:** transparent, 1.5px navy/35% border; hover → navy fill with paper text.
- **On dark:** paper fill, navy text; hover → mint fill. Reserved for navy-deep bands.
- **Ghost:** transparent with 1.5px navy/35% inset ring; hover → navy fill.
- **Focus:** 2px coral ring, 2px offset; global `:focus-visible` 3px coral outline with 3px offset stands behind it.

### Chips / Badges
- **Style:** pill, Manrope 800 0.75rem/0.75rem padding, `text-xs font-bold tracking-wide`.
- **Variants:** default (navy fill, paper text), secondary (mint fill, navy text), outline (transparent, 25% navy border), accent (coral fill, white text), muted (mute/14% fill). Used to mark synthetic or placeholder data as well as status.

### Cards / Containers
- **Corner style:** 16px (`--radius`).
- **Background:** white by default; mint variant for the pricing panel; navy for the bento lead tile (no border, paper text).
- **Shadow strategy:** card float at rest (see Elevation).
- **Border:** 1px `color-mix` 14% navy.
- **Internal padding:** header `1.5rem`/`2rem` at `sm`, content `1.5rem`/`2rem` (pt-0); bento tiles `1.5rem`, `1.75rem` at `sm`, lead tile `2.25rem`.

### Inputs / Fields
- **Style:** white surface, 16px radius, 1px 14% navy border, navy text, slate-mute placeholder — matches `--color-input` (20% navy mix).
- **Focus:** global 3px coral outline with 3px offset; no glow.
- **Error / Disabled:** destructive `#B3261E` on white; disabled at 50% opacity with pointer events off (buttons).

### Navigation
- **Style:** sticky header, 88% paper with `backdrop-blur-md`, 1px bottom hairline; wordmark in Archivo 700 with a coral separator dot.
- **Links:** Manrope 700 0.875rem, slate-mute at rest → coral on hover.
- **Action:** default-size primary pill, right-aligned (`ml-auto`).
- **Mobile:** anchor links hidden below `md`, wordmark plus primary action remain; body has a skip link that reveals at top-left on focus.

### Signature: Synthetic Plan Card
The hero object: white card (16px, card-float shadow) titled in Archivo with an outline "Data sintetis" badge, four label/value rows split by hairlines, closed by a mint pill strip with a coral check icon. It sits over a rotated white/60% sheet offset 2rem — the one place the system layers surfaces. Every value is explicitly non-claiming; keep the label as-is whenever this pattern is reused.

### Accordion (FAQ)
Single-column, hairline top rule and per-item bottom rules, no card chrome. Trigger: Manrope 700 1.125rem, `1.5rem` block padding, chevron turns coral and rotates 180° on open, question text shifts to coral on hover. Content: slate-mute, `1.625` line-height, max 68ch, `1.5rem` bottom padding. Radix primitives keep keyboard behavior intact.

## Do's and Don'ts

### Do:
- **Do** keep the four color roles: paper ground, navy structure, mint decision fields, coral emphasis.
- **Do** set every heading in Archivo 700 at 0.95 line-height and -0.03em tracking with balanced wrapping.
- **Do** use `clamp(4.5rem, 10vw, 8.75rem)` block padding on every section band.
- **Do** make every action a 999px pill with min-height 3.25rem and Manrope 700.
- **Do** mark synthetic or pending content on the page itself — badges like "Data sintetis" or "Placeholder — menunggu aturan harga".
- **Do** give cards the 16px radius, 1px 14% navy hairline, and the fixed card-float shadow.
- **Do** handle `prefers-reduced-motion: reduce`: kill animation and transition duration, drop smooth scrolling.

### Don't:
- **Don't** add a fifth accent color or use coral as a full-band background.
- **Don't** set body copy in Archivo or headings in Manrope.
- **Don't** hardcode prices, counts, or testimonials — pricing and feature lists come from planner-engine rules.
- **Don't** put coral text on paper for running copy; it is for spots, numerals, and interactive states.
- **Don't** hard-offset shadows, neon glows, or gradients; depth is tonal banding plus the two soft shadows above.
- **Don't** ship off-brand display faces, icon fonts, or kicker/eyebrow label rows above headings — the label style belongs on badges and spec lines only.
