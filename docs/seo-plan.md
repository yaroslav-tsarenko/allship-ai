# AllShip AI — Site map, SEO, Ads and blog plan

Status: draft for review · Date: 2026-10-04 · Market: United States (en-US), i18n-ready

Principles: every page answers one search intent, has one primary action, its own layout composition and real copy. No fabricated stats, reviews or logos (also a Google Ads "Misrepresentation" risk). Social proof comes only from live data (verified carriers, completed loads, reviews after completed loads) and is hidden until the numbers are real.

## 1. Information architecture

Legend: **U** = unique layout composition, **T** = shared template with page-specific content, **noindex** = excluded from search.

### Core (shippers)
| # | Route | Intent / primary keyword | Layout idea | Old route (301) |
|---|---|---|---|---|
| 1 | `/` | shipping & moving marketplace | U — instant-estimate console above the fold (from/to/what), live "how it works" timeline, category index as a typographic list, carrier verification explainer | `/` |
| 2 | `/how-it-works` | how freight marketplace works | U — vertical 6-step lifecycle with real UI fragments of each step, escrow money diagram | new |
| 3 | `/services` | shipping services | U — dense index/table of all 22 categories grouped (Vehicles, Moving, Freight, Heavy, Truck), filters | `/all` |
| 4 | `/ship` | ship anything / get shipping quotes | U — split: left editorial explanation, right sticky quote form; comparison of booking vs calling brokers | `/ship` |
| 5 | `/moving` | moving services / movers near me | U — move-size selector (studio → 5+ bedrooms) driving price ranges + cubic-feet table | `/moving`, `/moving-load` |
| 6 | `/vehicle-transport` | car shipping / vehicle transport | U — vehicle type rail (car, moto, boat, RV, trailer…), open vs enclosed comparison table | `/vehicle-load` |
| 7 | `/freight` | freight shipping / LTL FTL | U — spec-sheet style: dimensions, weight, freight class explainer, pallet calculator | `/freight-load` |
| 8 | `/heavy-equipment` | heavy equipment transport | U — oversize/permit explainer with dimension diagram, equipment list | `/heavy-load` |
| 9 | `/truck-rental` | rent a truck / box truck rental | U — truck size comparison table (10/16/26 ft) + request form | `/rent-truck` |
| 10 | `/truck-with-driver` | truck with driver / man with a van | U — hourly vs flat explainer, use-case list | `/truck-with-driver` |
| 11 | `/pricing` | shipping cost / marketplace fees | U — transparent fee breakdown (carrier price + 10% service fee, what's included), typical price ranges by category, estimator | `/pricing`, `/why-choose-us` |
| 12 | `/ai` | AI shipping assistant | U — conversation transcript as the page (real assistant capabilities, tool list), try-it prompt | `/ai` |
| 13 | `/safety` | safe shipping / verified carriers | U — verification pipeline (USDOT/MC via FMCSA, insurance, payouts after delivery), escrow protection | `/safety` |
| 14 | `/loads` | load board (public) | T — public list of open loads with coarse location only; CTA "Sign up to bid" | new |
| 15 | `/loads/[publicId]` | individual load | T — load summary without PII; `noindex` once booked | `/load/[id]` |
| 16 | `/quote` | get a quote | U — full-screen multi-step quote (category → route → details → contact), progress saved | new |

### Category landing pages (programmatic, 23)
`/services/[category]` — **T**, one strong template with category data from `content/categories.ts`: hero with category photo, what carriers need to know, required details checklist (from the typed form schema), typical price range, FAQ, related categories, CTA into the pre-filled quote. Categories: car-or-light-truck, motorcycle, powerboat, sailboat, personal-watercraft, atv-powersports, commercial-truck, vehicle-parts, trailer, rv, local-moving, long-distance-moving, business-moving, heavy-lifting, household-items, office-moving, corporate-relocation, student-moving, military-moving, freight, heavy-equipment, truck-rental, truck-with-driver.

### Carriers
| # | Route | Intent | Layout idea | Old |
|---|---|---|---|---|
| 17 | `/carriers` | find loads / load board for carriers | U — earnings-first: how bidding works, payout timing, requirements checklist, live open-load ticker | `/partners` |
| 18 | `/carriers/requirements` | USDOT MC requirements | U — document checklist with FMCSA lookup demo | new |
| 19 | `/carriers/dispatch` | truck dispatch service | U — fee explainer, what dispatch covers | `/partners` section |
| 20 | `/drivers` | for drivers of carrier companies | U — phone-first: what the driver app does on a trip | new |

### Company and support
| # | Route | Layout idea | Old |
|---|---|---|---|
| 21 | `/about` | U — editorial long-read: why the marketplace, how it makes money, company facts (ALLSHIP AI INC, Newark DE) | `/about` |
| 22 | `/contact` | U — channels table (support email, phone, hours), contact form, company address | `/contact-us` |
| 23 | `/faq` | U — searchable FAQ grouped by audience (all 6 old FAQ sets merged and rewritten) | new |
| 24 | `/help` | T — help center index (articles from blog with `help` category) | new |
| 25 | `/compare/uship-alternative` | U — honest feature comparison table (only verifiable facts) | new |
| 26 | `/tools/moving-cost-calculator` | U — calculator (bedrooms → ft³ → range) | new |
| 27 | `/tools/car-shipping-cost-calculator` | U — calculator by distance/vehicle/open-enclosed | new |
| 28 | `/tools/cubic-feet-calculator` | U — room-by-room inventory calculator | new |
| 29 | `/tools/freight-class-calculator` | U — density → NMFC class | new |
| 30 | `/blog` + `/blog/[slug]` + `/blog/category/[slug]` + `/blog/author/[slug]` | U index (editorial grid with lead story), T post | `/blog/*` |
| 31 | `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/carrier-agreement`, `/legal/cancellation-refunds`, `/legal/do-not-sell` | T — long-form legal template with TOC | old legal routes |

`/time-schedule` and `/lead-generate` were AI filler essays → 301 to `/how-it-works` and `/carriers`. `/add-article` is removed (blog editor lives in `/admin/blog`).

### Paid traffic landing pages (`noindex`)
`/lp/moving-quote`, `/lp/car-shipping`, `/lp/freight-quote`, `/lp/heavy-equipment`, `/lp/carriers-join` — **U** each, single goal, no main nav (logo + phone + CTA only), headline message-matched to the ad group via a whitelisted `?h=` variant key (never raw query text), quote form above the fold on mobile, trust row (Stripe escrow, FMCSA verification, real review count when available), short FAQ, sticky mobile CTA.

### App and auth (all `noindex`, disallowed in robots)
`/sign-in`, `/sign-up`, `/verify`, `/reset-password`, `/app/**`, `/admin/**`, `/api/**`.

## 2. Technical SEO

- **Metadata:** one `buildMetadata()` helper → title template `%s · AllShip AI`, unique description (140–160 chars), canonical, OG + Twitter, `alternates.languages` ready for locales. Every page has its own copy, never a generic fallback.
- **OG images:** `opengraph-image.tsx` per route group generated with `next/og` in brand style (title, category, route line).
- **Sitemaps:** `app/sitemap.ts` with `generateSitemaps()` → `static`, `services`, `blog`, `loads` (open loads only, `lastModified` from DB); images included for blog/services. Revalidated on publish.
- **robots.ts:** allow marketing, disallow `/app`, `/admin`, `/api`, `/lp`, auth routes; points to sitemap index.
- **Structured data (JSON-LD):** `Organization` (legal name, address, phone, sameAs socials), `WebSite`, `Service` + `Offer` price ranges on service pages, `BreadcrumbList` everywhere, `BlogPosting` + `Person` author, `FAQPage` (semantic value; Google shows FAQ rich results only for limited sites now), `SoftwareApplication` on `/ai`, `AggregateRating` **only** from real reviews.
- **Rendering:** all marketing pages static/ISR; no cookies/headers in marketing layouts; blog uses `revalidateTag('post:'+slug)` on publish.
- **Redirects:** 301 map for every old URL in `next.config.ts`; `www` → apex.
- **Internal linking:** category ↔ blog cluster links, breadcrumbs, related categories, "next step" blocks.
- **Core Web Vitals budget:** LCP < 1.8 s (4G), INP < 150 ms, CLS < 0.05; Lighthouse CI gate ≥ 95.
- **Media:** legacy 1–5 MB SVGs (embedded raster) re-exported as AVIF/WebP at needed sizes; videos re-encoded (H.264 + AV1), poster-first, lazy.
- **Accessibility:** WCAG 2.2 AA (contrast, focus, landmarks, forms labels, reduced motion).

## 3. Google Ads readiness

- **Tagging:** GTM (single container) → GA4 + Google Ads conversion linker; server-validated events pushed to `dataLayer`.
- **Consent:** CMP banner with Google Consent Mode v2 (default denied for ads/analytics where required), US state privacy: "Do Not Sell or Share" link + Global Privacy Control respected.
- **Conversions:** `quote_started`, `quote_submitted` (primary lead), `sign_up` (role), `load_published`, `bid_accepted` (value = platform fee), `carrier_onboarded`, `click_to_call`. Enhanced conversions with hashed email/phone on lead submit (consent-gated).
- **Click IDs:** capture `gclid`/`gbraid`/`wbraid` + UTMs into first-party cookie → stored on `lead`/`user` → later offline conversion upload (bid accepted / completed) via Google Ads API job.
- **Policy fit:** visible business identity (name, address, phone), privacy policy, terms, cancellation & refund policy, no unverifiable superlatives, no fake reviews, prices shown as ranges with clear basis.
- **Landing page quality:** message match, fast mobile LCP, form above the fold, click-to-call, no intrusive interstitials.
- **Remarketing:** GA4 audiences (quote started not submitted, carrier visitors), consent-gated.

## 4. Conversion and marketing mechanics (honest)

- Instant estimate widget on home, `/ship`, category pages → pre-fills `/quote`.
- Multi-step quote with saved progress and email capture at step 2 (with explicit consent), abandoned-quote reminder email (1 reminder, consented).
- Calculators as SEO + lead magnets (4 tools above).
- Live, real trust signals: count of FMCSA-verified carriers, completed loads, real reviews — each shown only past a threshold.
- Escrow guarantee messaging: "Your payment is released to the carrier only after delivery."
- Carrier acquisition: public load board + "first bid in 5 minutes" onboarding, referral link for carriers (phase 2).
- Newsletter with double opt-in (shippers: moving checklists; carriers: load market notes).
- Click-to-call with business hours, call conversion tracking.
- Exit-intent popups, fake countdowns and fake scarcity are **not** used.

## 5. Blog — clusters and first 30 article proposals

Pillars link to their cluster; each post has: target keyword, intent, author, updated date, FAQ block, internal links to a service page and a tool.

**Pillar A — Car shipping** (`/vehicle-transport`)
1. How much does it cost to ship a car across the country? (cost guide with a range table)
2. Open vs enclosed auto transport: which one is worth it
3. How to prepare your car for transport: a 12-point checklist
4. Shipping a car to another state: timeline, documents and insurance
5. Motorcycle shipping: crates, pallets and enclosed carriers explained
6. Boat transport guide: trailer, cradle, height limits and permits
7. RV transport vs driving it yourself: cost and risk comparison

**Pillar B — Moving** (`/moving`)
8. Moving cost by home size: studio to 5-bedroom (cubic-feet method)
9. Long-distance moving timeline: an 8-week plan
10. How to verify a moving company's USDOT and MC numbers (FMCSA lookup step by step)
11. Moving scams: 9 red flags and how escrow payment protects you
12. Released value vs full value protection: moving insurance explained
13. Military PCS move checklist: DPS, personally procured moves and what to track
14. Student moving on a budget: dorm to apartment
15. Office relocation checklist for small businesses
16. Best and worst times of the year to move (price seasonality)

**Pillar C — Freight & heavy** (`/freight`, `/heavy-equipment`)
17. LTL vs FTL: how to choose and what it costs
18. Freight class (NMFC) explained with a density calculator
19. Bill of lading explained: fields, types, mistakes
20. Shipping pallets: dimensions, weight limits and packaging rules
21. Heavy equipment transport: oversize permits by state, escorts, trailers
22. Hotshot trucking vs full truckload: when each makes sense

**Pillar D — Carriers** (`/carriers`)
23. How to win more loads on a load board: bid strategy that works
24. How carriers price per mile in 2026: building a rate table
25. Owner-operator authority: getting USDOT and MC numbers
26. Getting paid faster: escrow, quick pay and factoring compared
27. Truck dispatch service: what it covers and what it costs

**Pillar E — AI & product** (`/ai`, `/how-it-works`)
28. How AllShip AI estimates a shipping price (methodology, limits)
29. Comparing carrier bids: price, ETA, rating and authority status
30. Escrow payments for shipping: how your money is protected step by step

Cadence proposal: 2 posts/week for the first 3 months (pillar + cluster interlinking first), then 1/week; every post reviewed for factual accuracy (FMCSA/DOT facts linked to official sources).

## 6. Copy policy for the rewrite

- Reuse the meaning of old copy, rewrite in concrete language; remove "seamless / revolutionize / cutting-edge" filler.
- Fix all typos listed in `content-inventory.md §9.1`, unify brand spelling as **AllShip AI**.
- Remove all fabricated testimonials, stats and partner ratings (`content-inventory.md §6, §9.2`); remove leftover "openship.ai".
- Moving price tiers (Basic → Elite) are shown as "typical market ranges", not as AllShip packages, because AllShip is a marketplace.
- Legal texts are rewritten for a marketplace with escrow and must be reviewed by a US lawyer before launch.
