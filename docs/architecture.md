# AllShip AI — Architecture (v2, rebuild from zero)

Status: draft for review · Owner: Yaroslav · Date: 2026-10-04

Source of truth for the rebuild. Old repos (`allship-be`, `allshipai-da`, `allshipai-la`) are reference only — no code is reused. Product behaviour comes from `product-map.md`, copy and assets from `content-inventory.md`.

## 1. Decisions

| Area | Decision |
|---|---|
| App | One Next.js 16 app (App Router, RSC, Server Actions, Turbopack), TypeScript strict, pnpm |
| Hosting | Vercel (Fluid compute). Preview deployments per PR |
| DB | Supabase Postgres, accessed only from the server through Drizzle ORM over the Supavisor pooler (transaction mode, `prepare: false`) |
| Supabase Data API | Disabled for app tables. RLS enabled with deny-all on every table as defence in depth — the browser never queries tables directly |
| Realtime | Supabase Realtime private channels (Broadcast + Presence). Our server mints a short-lived Realtime JWT after checking membership; RLS on `realtime.messages` re-checks topic access |
| Storage | Supabase Storage, private buckets, signed URLs (short TTL), image transforms for avatars/media |
| Auth | Better Auth + Drizzle adapter: email/password (verification + reset), Google OAuth, magic link + email OTP, TOTP 2FA, passkeys, organization plugin. Sessions in httpOnly Secure SameSite=Lax cookies. 2FA mandatory for admins |
| Payments | Stripe Connect (Express accounts for carriers), separate charges and transfers = escrow. Every money state change comes from a verified, idempotent webhook |
| AI | Vercel AI SDK with the OpenAI provider (`OPENAI_MODEL` env). Server-side tools scoped to the session user |
| Product tours | Driver.js, themed with our tokens, started by onboarding or by the AI assistant via a tool call |
| Jobs | Inngest (durable, retries, step functions) + Vercel Cron for schedules |
| Email | Resend + React Email templates |
| Admin alerts | Telegram bot → private admin chat (no PII in messages, deep links to admin instead) |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) on auth, AI, public forms, webhooks fan-out |
| Bot protection | Cloudflare Turnstile on public forms (quote, contact, sign-up) |
| Maps | Google Maps Platform: Places Autocomplete (New) in browser with referrer-restricted key; Routes API server-side with a separate IP-unrestricted server key kept in env |
| i18n | next-intl, `en-US` only at launch; units/currency through formatters (`mi`, `USD`), ready for more locales |
| Validation | Zod everywhere (forms, actions, route handlers, env, JSONB load details) |
| Forms | React Hook Form + Zod resolver |
| Data fetching | RSC for reads, Server Actions (next-safe-action) for writes, TanStack Query only for live client widgets |
| UI | Google product style (Material Design 3): Google Sans + Google Sans Code, M3 color roles generated from the logo blue, Tailwind CSS v4 tokens, Radix primitives, own M3 components, Material Symbols — see design-direction.md |
| Observability | Sentry (errors + tracing), Vercel Analytics + Speed Insights, structured logs (pino) |
| Quality | ESLint (flat) + Prettier, Vitest (unit/integration against a Supabase branch DB), Playwright (e2e per role), GitHub Actions CI: lint, typecheck, test, build |
| Marketing | GTM container with Consent Mode v2, GA4, Google Ads conversions (+ enhanced conversions), Microsoft Clarity behind consent |

## 2. Repository layout

```
allship-ai/
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/            public site, SSG/ISR, no session read in layout
│  │  │  ├─ page.tsx             /
│  │  │  ├─ ship/ moving/ ...    all marketing routes (see seo-plan.md)
│  │  │  ├─ blog/[[...]]         index, category, post
│  │  │  └─ legal/...
│  │  ├─ (auth)/                 sign-in, sign-up, verify, magic, reset, 2fa
│  │  ├─ (app)/app/              authenticated product, dynamic
│  │  │  ├─ layout.tsx           session guard + role shell
│  │  │  ├─ page.tsx             role home
│  │  │  ├─ loads/ bids/ trips/ messages/ fleet/ payouts/ billing/ settings/ assistant/
│  │  ├─ (admin)/admin/          admin console, admin + 2FA only
│  │  ├─ api/
│  │  │  ├─ auth/[...all]/       Better Auth handler
│  │  │  ├─ stripe/webhook/      signed webhook
│  │  │  ├─ ai/chat/             streaming assistant
│  │  │  ├─ realtime/token/      Realtime JWT mint
│  │  │  ├─ inngest/             Inngest handler
│  │  │  └─ og/                  dynamic OG images
│  │  ├─ sitemap.ts  robots.ts  manifest.ts  opengraph-image.tsx
│  ├─ server/
│  │  ├─ db/ (client.ts, schema/*.ts, migrations/)
│  │  ├─ auth/ (auth.ts, session.ts, guards.ts)
│  │  ├─ policies/ (load.ts, bid.ts, chat.ts, trip.ts ...)
│  │  ├─ services/ (loads, bids, pricing, payments, payouts, chat, trips, reviews, notifications, blog, fmcsa)
│  │  ├─ ai/ (assistant.ts, tools/*.ts, prompts/*.ts)
│  │  ├─ jobs/ (inngest functions)
│  │  └─ integrations/ (stripe.ts, resend.ts, telegram.ts, google-maps.ts, supabase-admin.ts, ratelimit.ts)
│  ├─ features/                  client-side feature modules (components + hooks per domain)
│  ├─ components/ui/             design-system primitives
│  ├─ components/marketing/      section components used by marketing pages
│  ├─ content/                   static marketing copy as typed TS (FAQs, category data, legal)
│  ├─ lib/                       formatters, money, ids, env (t3-env), utils
│  ├─ styles/                    tokens.css, globals.css
│  └─ emails/                    React Email templates
├─ supabase/ (config.toml, migrations for RLS/realtime policies only)
├─ tools/mongo-export/           one-off read-only export
├─ scripts/migrate-legacy.ts     Mongo JSON → Postgres import
├─ tests/ (unit, integration, e2e)
└─ docs/
```

Rules: `server/*` is `import "server-only"`. Client components never import from `server/`. Every Server Action goes through one factory that enforces session, role, Zod input and rate limit.

## 3. Roles and tenancy

| Role | Who | Tenancy |
|---|---|---|
| `shipper` | Person or business posting loads | Individual user; optional business profile |
| `carrier` | Trucking company | Better Auth **organization**. Members: `owner`, `dispatcher`, `driver` |
| `driver` | Member of a carrier org with role `driver` | Sees only trips assigned to them |
| `admin` | AllShip staff | Global; 2FA required; every action audited |

A user has one `accountType` (`shipper` | `carrier`). AllShip staff are flagged by the Better Auth admin plugin (`role = "admin"`), independent of account type. Drivers are users whose only membership is `driver` in a carrier org; they are invited by email (magic link), never given generated passwords.

Authorization is layered:
1. `proxy.ts` (Next 16 middleware) — cheap redirect for unauthenticated users on `/app` and `/admin` (cookie presence only).
2. Layout guards — load session on the server, redirect by role.
3. **Policies** — every service call checks `can(actor, action, resource)` with the resource loaded from DB (ownership, org membership, load status). This is the real gate.
4. Postgres RLS deny-all — protects against an accidentally exposed Data API.

## 4. Domain model (Drizzle, Postgres)

IDs: `uuid` v7 primary keys. Human-readable public IDs where users see them (`AS-7K3F9Q` for loads). Money: integer cents + `currency char(3)`. Timestamps `timestamptz`.

### Identity (Better Auth tables + extensions)
- `user` — + `firstName`, `lastName`, `phone` (E.164), `accountType`, `avatarKey`, `onboardingCompletedAt`, `locale`, `legacyId`
- `session`, `account`, `verification`, `two_factor`, `passkey` — Better Auth managed
- `organization`, `member`, `invitation` — Better Auth org plugin (carrier companies)

### Carrier
- `carrier_profile` — `orgId` PK/FK, `legalName`, `dbaName`, `usdotNumber`, `mcNumber`, `fmcsaStatus` (`unverified|verified|failed|manual_review`), `fmcsaCheckedAt`, `insuranceExpiresAt`, `insuranceDocKey`, `serviceStates text[]`, `equipment text[]`, `categories load_category[]`, `about`, `yearsInBusiness`, `stripeAccountId`, `payoutsEnabled`, `chargesEnabled`
- `carrier_rate_tier` — `orgId`, `fromMiles`, `toMiles`, `ratePerCuFtCents` (explicit unit, fixes the old ambiguity), max 5 per org
- `carrier_service_rates` — `orgId`, `packingPerCuFtCents`, `unpackingPerCuFtCents`, `storagePerCuFtMonthCents`

### Loads
- `load` — `id`, `publicId`, `shipperId`, `category load_category` (23 values: the 21 legacy forms + long-distance moving + truck with driver), `title`, `status load_status`, `pickup jsonb` (address, placeId, lat, lng, windowStart, windowEnd, floor, notes), `dropoff jsonb` (same), `distanceMiles numeric`, `details jsonb` (category-specific, validated by `loadDetailsSchema[category]`, with `detailsVersion`), `targetPriceCents`, `estimatedVolumeCuFt`, `publishedAt`, `biddingClosesAt`, `acceptedBidId`, `carrierOrgId`, `driverId`, `source` (`dashboard|landing_quote|assistant|legacy`), `cancelledReason`, timestamps, `legacyId`
  - indexes: `(status, publishedAt)`, `(shipperId, status)`, `(carrierOrgId, status)`, `(driverId)`, GIN on `details` only if needed
- `load_media` — `loadId`, `kind` (`photo|document|pod_photo|pod_signature`), `storageKey`, `uploadedBy`, `createdAt`
- `load_event` — append-only timeline: `loadId`, `type` (status change, bid accepted, driver assigned, location note, payment events), `actorId`, `payload jsonb`, `createdAt`

### Bids
- `bid` — `loadId`, `carrierOrgId`, `createdBy`, `amountCents` (carrier price), `estimatedPickupAt`, `estimatedDeliveryAt`, `message` (≥ 80 chars), `status bid_status` (`active|withdrawn|accepted|declined|expired`), `aiAssisted boolean` (carrier used the AI draft — disclosed, but the bid is still made by a human), timestamps. Unique active bid per `(loadId, carrierOrgId)`

### Money
- `payment` — `loadId`, `bidId`, `shipperId`, `stripePaymentIntentId` unique, `amountCents` (shipper total), `carrierAmountCents`, `platformFeeCents`, `status` (`requires_payment|processing|succeeded|refunded|partially_refunded|disputed|failed`), timestamps
- `payout` — `loadId`, `carrierOrgId`, `stripeTransferId` unique, `amountCents`, `status` (`pending|scheduled|paid|reversed`), `releaseAfter`, timestamps
- `ledger_entry` — double-entry-lite journal for every money movement (`account`: `shipper_cash|escrow|platform_revenue|carrier_payable`, `amountCents`, `refType`, `refId`)
- `stripe_event` — `id` (Stripe event id, PK) for idempotency, `type`, `processedAt`

No card data is ever stored. Saved payment methods live in Stripe (Customer + SetupIntent).

### Trips and tracking
- `driver_location` — `loadId`, `driverId`, `lat`, `lng`, `accuracyM`, `recordedAt` (history, pruned after delivery + 30 days); latest position also broadcast on Realtime
- Status changes by the driver are `load_event` rows with optional photo/signature media

### Messaging
- `conversation` — `loadId` unique, `shipperId`, `carrierOrgId`, `createdAt` (created when a bid is accepted; pre-booking questions use `bid` thread messages, see below)
- `message` — `conversationId`, `senderId`, `body`, `attachments jsonb`, `createdAt`, `editedAt`
- `conversation_read` — `conversationId`, `userId`, `lastReadAt`
- Pre-acceptance Q&A: `conversation` rows can also be keyed by `(loadId, carrierOrgId)` with `kind = 'inquiry'` so a carrier can ask questions before bidding; only the shipper and that carrier see it

### Trust
- `review` — `loadId` unique, `shipperId`, `carrierOrgId`, `rating 1–5`, `body`, `createdAt`, `carrierReply`. Only possible after `completed`. Carrier rating = real average, shown with count; carriers with zero reviews show "New on AllShip"

### Notifications and AI
- `notification` — `userId`, `type`, `title`, `body`, `href`, `readAt`, `createdAt`
- `notification_preference` — `userId`, `channel` (`in_app|email`), `type`, `enabled` (actually read before sending)
- `ai_thread` — `userId`, `title`, `createdAt`, `updatedAt`
- `ai_message` — `threadId`, `role`, `parts jsonb` (AI SDK UI message parts incl. tool calls), `createdAt`

### Content and leads
- `post` — `slug` unique, `title`, `excerpt`, `body jsonb` (Tiptap/ProseMirror JSON rendered server-side), `coverKey`, `coverAlt`, `categoryId`, `authorId`, `status` (`draft|scheduled|published`), `publishedAt`, `seoTitle`, `seoDescription`, `canonicalUrl`, `faq jsonb`, `readingMinutes`
- `post_category`, `post_tag`, `post_to_tag`
- `lead` — public forms (contact, partner, quote without account): `type`, `name`, `email`, `phone`, `payload jsonb`, `utm jsonb`, `gclid`, `status`, `createdAt`
- `newsletter_subscriber` — `email` unique, `confirmedAt` (double opt-in)

### Platform
- `audit_log` — `actorId`, `action`, `entity`, `entityId`, `diff jsonb`, `ip`, `userAgent`, `createdAt`
- `legacy_map` — `collection`, `mongoId`, `newId` (migration traceability)

## 5. Load lifecycle

```
draft ──publish──► open ──shipper accepts bid──► awaiting_payment ──webhook: payment_intent.succeeded──► booked
  │                 │                                   │                                              │
  └─delete          ├─biddingClosesAt passes──► expired  └─30 min timeout / cancel──► open             ├─carrier assigns driver──► assigned
                    └─shipper cancels──► cancelled                                                     │
assigned ──driver: start──► en_route_to_pickup ──driver: picked up (photos)──► in_transit ──driver: delivered (POD photo + signature)──► delivered
delivered ──shipper confirms OR 72h auto──► completed ──► payout released (transfer)
any of booked..delivered ──dispute opened──► disputed ──admin resolves──► completed | refunded
booked/assigned ──cancel by policy──► cancelled (+ refund per policy)
```

Transitions live in one table (`server/services/loads/transitions.ts`): `{ from, to, actor: role[], guard(), effects[] }`. Every transition runs in a DB transaction, writes `load_event`, then enqueues side effects (notifications, emails, Realtime broadcast) through Inngest so a failed email never rolls back a state change.

## 6. Money flow (Stripe Connect escrow)

Model: **separate charges and transfers**.

1. Carrier onboarding: Express account via Account Links. A carrier can bid only when `chargesEnabled`/`payoutsEnabled` are true and FMCSA status is verified.
2. Shipper accepts a bid → server computes amounts (never from the client):
   - `carrierAmount = bid.amountCents`
   - `platformFee = round(carrierAmount × SHIPPER_FEE_RATE)` (default 10%)
   - `shipperTotal = carrierAmount + platformFee`
3. Server creates a PaymentIntent (`transfer_group = load.id`, metadata: loadId, bidId) and returns `client_secret`; Stripe Payment Element collects payment (cards, Apple Pay, Google Pay, ACH/Link).
4. `payment_intent.succeeded` webhook (signature verified, event id stored for idempotency) → in one transaction: payment `succeeded`, ledger `escrow +total`, bid `accepted`, other bids `declined`, load `booked`, conversation created.
5. Funds stay in the platform balance until `completed`.
6. On `completed` → Inngest job creates a Transfer to the carrier's connected account (`transfer_group = load.id`, idempotency key = load id) → payout `paid`, ledger moves `escrow → carrier_payable → paid` and `escrow → platform_revenue`.
7. Refunds/cancellations follow a written cancellation policy; disputes (`charge.dispute.created`) freeze the payout.

Open product question for Yaroslav: the old copy also mentions a 5.5% carrier dispatch fee. Default plan = shipper pays +10%, carrier receives 100% of their bid. Alternative = split fee. Configurable via env either way.

## 7. Realtime

Channels (all `private: true`):
- `conversation:{id}` — new messages, typing (Broadcast), presence
- `load:{id}` — status changes, driver location (Broadcast, throttled to 1 msg / 15 s from the driver page)
- `user:{id}` — notifications badge

Flow: client calls `POST /api/realtime/token` → server validates session and returns a JWT (5 min TTL, `sub = user.id`, `role = authenticated`, custom claim `topics`) signed with the Supabase JWT signing key → `supabase.realtime.setAuth(token)`. RLS policy on `realtime.messages` allows `select/insert` only when `realtime.topic()` is in the token's `topics` claim. Messages are persisted by our Server Action first, then broadcast from the server — the client never writes to the DB through Realtime.

## 8. AI assistant

One assistant, role-aware ("AllShip AI"). System prompt = product knowledge (categories, statuses, fees, how-to) + user context (role, org, counts). It never sees other users' data because every tool calls the same service layer with the session actor.

Tools:

| Tool | Roles | Effect |
|---|---|---|
| `listMyLoads`, `getLoad` | shipper, carrier, driver | read, policy-scoped |
| `estimatePrice` | all | deterministic estimator (distance × volume × market rate table) + explanation; clearly labelled as estimate |
| `createLoadDraft` | shipper | creates a `draft` load from conversation; user reviews and publishes in the form |
| `compareBids` | shipper | ranks bids by price, ETA, rating, FMCSA status — with reasons |
| `searchOpenLoads` | carrier | matches by service states, categories, equipment |
| `draftBidMessage` | carrier | drafts a bid message; the carrier edits and submits |
| `getTripStatus`, `nextStep` | driver | what to do next on the active trip |
| `startTour(tourId)` | all | returns a tour id; client runs Driver.js |
| `navigate(path)` | all | suggests in-app navigation (allow-listed paths) |

Guardrails: rate limit per user (Upstash), max tool steps, token budget per day, no write tool executes without an explicit user confirmation UI (`createLoadDraft` creates drafts only), prompt-injection hygiene (tool results are data; user-generated text like bid messages is quoted, never followed).

Tours (Driver.js): `shipper-first-load`, `shipper-compare-bids`, `carrier-onboarding`, `carrier-first-bid`, `carrier-assign-driver`, `driver-trip`, `admin-overview`. Tour steps target `data-tour="..."` attributes, never CSS classes. Completion stored per user.

## 9. Security checklist (baseline for "11/10")

- All secrets in Vercel env; `@t3-oss/env-nextjs` validates at build. Nothing secret with `NEXT_PUBLIC_`
- Old secrets considered compromised: new Mongo/Supabase passwords, new Google/ORS/Telegram/R2/SMTP keys
- Session cookies httpOnly, Secure, SameSite=Lax; CSRF protection from Better Auth + Server Actions origin check
- Strict CSP with nonces (GTM/Stripe/Google Maps allow-listed), HSTS preload, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (geolocation only on driver trip page)
- Password hashing scrypt/argon2 (Better Auth); legacy bcrypt hashes verified once then rehashed
- Rate limits: sign-in 5/min/IP+email, OTP 3/10min, AI 30/hour/user, public forms 5/hour/IP + Turnstile
- Upload rules: MIME sniffing, size caps, image re-encode, private bucket, signed URLs
- Webhooks: signature verification, idempotency table, replay-safe handlers
- Audit log for admin actions and money events
- No PII in Telegram/admin alerts; logs scrub emails/phones
- Dependency scanning (Dependabot), `pnpm audit` in CI, Sentry PII scrubbing
- Legal pages reviewed by a lawyer before launch (old texts are generic and are not used as-is)

## 10. Performance and SEO budget

- Marketing pages: static (SSG/ISR), zero session reads, LCP < 1.8 s on 4G, CLS < 0.05, JS < 90 KB gzip on first load for content pages
- Images: `next/image`, AVIF/WebP, every legacy SVG with embedded raster converted to optimized raster; hero video replaced by poster + lazy video ≤ 1.5 MB
- Fonts: `next/font` self-hosted, subset, 2 families max
- Third-party scripts only after consent, via GTM, `strategy="afterInteractive"`/`lazyOnload`
- Lighthouse ≥ 95 on all four categories for every marketing template (checked in CI with Lighthouse CI)

## 11. Legacy data migration

1. `tools/mongo-export` dumps every collection to `.migration/raw` (read-only, run locally by Yaroslav).
2. `scripts/migrate-legacy.ts` (idempotent, dry-run mode, report):
   - users → `user` (+ `account` with bcrypt hash marked legacy); plain-text passwords are discarded and those users get a reset email on first login attempt
   - carriers → `organization` + `carrier_profile` (+ rate tiers, service costs); FMCSA status `unverified`
   - drivers → users + `member(role=driver)` in their carrier org
   - loads → `load` with `category` mapped from `subType`, details validated against the new schema; unknown fields go to `details.legacyExtra`
   - bids → only `aiMadeBid !== true`
   - chats → `conversation` + `message`
   - transactions → `payment` with `status = 'legacy'` (no Stripe ids), excluded from payouts
   - reviews/abouts generated by GPT → **not migrated**
   - cards → **not migrated** (raw PAN/CVV)
3. Every row gets a `legacy_map` entry; a report lists skipped/invalid records.
