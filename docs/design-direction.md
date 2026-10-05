# AllShip AI — Design direction

Status: agreed direction (Yaroslav, 2026-10-04) · Visual language: Google product style (Material Design 3)

Goal: usable, fast, simple, familiar. The product should feel like a Google product: white surfaces, clear hierarchy, Google Sans, tonal color, generous touch targets, predictable components. The existing multicolor AllShip logo fits this language as-is.

## Typography
- **Google Sans** (variable, published on Google Fonts under the SIL Open Font License) for everything. Self-hosted with `next/font/local` from `src/assets/fonts` (Latin subset, `wght` 400–700, normal + italic), so builds never depend on fetching fonts.
- **Google Sans Code** for load IDs, money amounts and tabular data.
- The old `Google-Sans` TTF files from the legacy repo are not used; the OFL release replaces them with the same design and a clean license (`src/assets/fonts/OFL.txt`).
- Material 3 type scale (size/line-height): Display L 57/64 · M 45/52 · S 36/44 · Headline L 32/40 · M 28/36 · S 24/32 · Title L 22/28 · M 16/24 · S 14/20 · Body L 16/24 · M 14/20 · S 12/16 · Label L 14/20 · M 12/16 · S 11/16. Marketing pages may go above Display L for heroes.

## Color
- Generated with `@material/material-color-utilities` from the logo blue `#3F8BF3` as source color → full light and dark schemes as CSS variables (M3 color roles: `primary`, `on-primary`, `primary-container`, `secondary`, `tertiary`, `surface`, `surface-container-lowest…highest`, `on-surface`, `on-surface-variant`, `outline`, `outline-variant`, `error`, `inverse-*`).
- Logo colors used as semantic accents with M3 tonal containers: green = success / delivered / paid, yellow = warning / awaiting payment, red = error / disputed, blue = primary / in progress.
- Load status chips map to these roles (open = primary-container, awaiting_payment = yellow container, booked/assigned = secondary-container, in_transit = primary, delivered/completed = green container, cancelled/expired = surface-variant, disputed = error-container).
- Elevation by tonal surface containers first, shadows only for menus, dialogs, FAB.
- Dark theme supported in the app from day one (system preference + toggle).

## Shape (M3 shape scale)
none 0 · extra-small 4 (text fields, chips' inner) · small 8 (chips, snackbars) · medium 12 (cards, list containers) · large 16 (side sheets, navigation drawer) · extra-large 28 (dialogs, bottom sheets) · full (buttons, FAB, search bar, segmented buttons) — as in Google products.

## Layout
- M3 window size classes: compact < 600 · medium 600–839 · expanded 840–1199 · large 1200–1599 · extra-large ≥ 1600.
- App shell: bottom navigation (compact) → navigation rail (medium/expanded) → navigation drawer (large+). Top app bar with search, AI assistant entry and account menu.
- 4 px base grid, 8 px spacing rhythm; content max width 1280 on marketing pages.
- Marketing pages follow Google product-page patterns: white ground, large Google Sans headlines, one idea per section, real product screenshots, clear primary button, no decorative noise.

## Components
Own component library on Tailwind CSS v4 tokens + Radix primitives, implemented to M3 specs: buttons (filled, tonal, outlined, text, elevated, FAB / extended FAB), icon buttons, outlined and filled text fields with supporting text, chips (assist, filter, input, suggestion), segmented buttons, cards (filled / outlined / elevated), lists, navigation rail / drawer / bar, top app bar, tabs, menus, dialogs, bottom and side sheets, snackbars, progress indicators, date/time pickers, data tables, search.
- MUI is not used (Material 2 heritage, heavy runtime). Material Web (`@material/web`) is in maintenance mode, so it is not used either.
- State layers (hover 8%, focus 10%, pressed 10%, dragged 16%) and visible focus rings on every interactive element.

## Icons
Material Symbols Rounded (variable font, self-hosted, subset to used glyphs), weight 400, fill 0/1 for active states, optical size matched to 20/24 px.

## Motion
M3 easing: standard `cubic-bezier(0.2, 0, 0, 1)`, emphasized decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)`, emphasized accelerate `cubic-bezier(0.3, 0, 0.8, 0.15)`. Durations: short 100–200 ms (state), medium 250–400 ms (containers, sheets), long 450–600 ms (page transitions). Motion only to communicate state; respects `prefers-reduced-motion`.

## Product tours (Driver.js)
Popovers styled as M3 rich tooltips: surface-container, 12 px radius, Title S heading, Body M text, text buttons "Back" / "Next", filled "Done", step counter in Label M.

## Accessibility
WCAG 2.2 AA: M3 color roles guarantee contrast for on-* pairs; 48×48 px minimum touch targets; keyboard navigation for every component; labels on all inputs; `aria-live` for snackbars and realtime updates.
