# AllShip AI — Development guide

Freight, vehicle and moving marketplace: shippers post loads, FMCSA-verified carriers bid, payments sit in Stripe escrow until delivery. One Next.js 16 app for the marketing site, the dashboard for every role and the API.

The project overview is in [README.md](README.md). Design and planning docs live in [`docs/`](docs): architecture, SEO plan, design direction (Material Design 3, Google Sans), product map of the legacy app and the legacy data report.

## Stack

Next.js 16 (App Router, RSC, Server Actions) · TypeScript strict · Tailwind CSS v4 with Material 3 tokens · Radix primitives · Supabase Postgres + Drizzle ORM · Better Auth (email + password, Google, magic link, email code, TOTP, passkeys, organizations) · Resend + React Email · Stripe Connect · OpenAI Responses API · Supabase Realtime and Storage · GSAP, Lenis, WebGL2 · Driver.js · Sentry

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm legacy:import
pnpm content:seed
pnpm dev
```

`.env.local` needs at least `DATABASE_URL`, `DATABASE_URL_MIGRATIONS` and `BETTER_AUTH_SECRET` (`openssl rand -hex 32`). Without `RESEND_API_KEY`, emails are printed to the terminal in development.

## Database

- Schema: `src/server/db/schema/*`. After changing it run `pnpm db:generate`, review the SQL in `drizzle/`, then `pnpm db:migrate`.
- `DATABASE_URL` is the Supabase transaction pooler (port 6543) used by the app. `DATABASE_URL_MIGRATIONS` is the session pooler (port 5432) used by migrations and scripts.
- All public tables have RLS enabled and no grants for `anon`/`authenticated`: the browser never reads tables directly.

## Legacy data

`pnpm legacy:import` reads `.migration/parsed/users.json` (made from the old Mongo dump, gitignored) and imports the real accounts: users with their bcrypt hashes, carrier companies with rate tiers and drivers. Bot sign-ups, AI bids, fake transactions and stored cards are skipped. Safe to run more than once. Add `--dry-run` to preview.

## Production services

Everything runs locally without keys: payments are simulated, uploads go to `.uploads/`, live updates fall back to polling. In production configure:

- **Stripe**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, webhook endpoint `/api/stripe/webhook` with events `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created` (`STRIPE_WEBHOOK_SECRET`) and a Connect webhook with `account.updated` (`STRIPE_CONNECT_WEBHOOK_SECRET`).
- **Supabase Storage**: create a private bucket `load-media`. Uploads use signed upload URLs created with `SUPABASE_SERVICE_ROLE_KEY`.
- **Blog media**: create a public Supabase Storage bucket `blog-media` (images only, 8 MB limit). The admin blog editor uploads covers and inline images there with signed upload URLs and stores the public object URL; locally they go to `.uploads/blog/` and are served from `/media/blog/*`.
- **Supabase Realtime**: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` (Project Settings → API → JWT secret, legacy HS256). Clients subscribe to private broadcast channels with a short-lived token from `/api/realtime/token`; migration `0003_realtime_policies` adds the RLS policy that limits each token to its own topics. In Realtime settings turn off "Allow public access".
- **Google Maps** (optional): `NEXT_PUBLIC_GOOGLE_MAPS_KEY` restricted to your domain enables the live map; without it a route diagram is shown.
- **Cron**: `CRON_SECRET`; Vercel calls `/api/cron/marketplace` every 10 minutes (expires stale loads and payments, auto-completes deliveries after 72 hours, retries payouts) and `/api/cron/blog` every 15 minutes (marks due scheduled posts as published and refreshes blog caches; due posts are already visible without it).
- **FMCSA**: `FMCSA_WEB_KEY` for automatic USDOT checks; without it carriers go to manual review in the admin console.
- Never set `ALLOW_UNVERIFIED_CARRIERS` in production.

## Observability

- **Sentry** (`@sentry/nextjs`) is off unless a DSN is set, and the SDK is not in any page bundle then. Set `SENTRY_DSN` (server and edge) and `NEXT_PUBLIC_SENTRY_DSN` (browser). `SENTRY_TRACES_SAMPLE_RATE` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` default to `0.1`. Session replay is off. The browser SDK loads lazily after the page is idle, so it does not add to first-load JS.
- Source maps are uploaded only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` and `SENTRY_PROJECT` are set at build time; they are generated as hidden maps and deleted from the build output after upload.
- What is captured: server rendering, route handler and server action errors (`onRequestError` in `src/instrumentation.ts`, `handleServerError` in `src/server/actions/safe-action.ts`; `ActionError` messages shown to users are not reported), client errors caught by the error boundaries, and anything logged with `log.error`.
- Scrubbing: `sendDefaultPii` is off; `beforeSend` (`src/lib/sentry-options.ts`) keeps only the user id, drops cookies, auth and IP headers, and masks emails, phone numbers, addresses, passwords and tokens in messages, request data and breadcrumbs. Stripe ids are kept.
- **Logs**: `src/lib/log.ts` writes one JSON object per line in production (`level`, `time`, `msg`, fields) and readable output in development. Use `log.info/warn/error(msg, { scope, err, ...fields })`, `log.child({...})`, or `await requestLogger()` inside a request to include the request id (`x-request-id` or `x-vercel-id`). The same redaction applies. `LOG_LEVEL` overrides the default (`info` in production, `debug` locally).
- **Health check**: `GET /api/health` (and `HEAD`) runs `select 1` with a 2.5 s timeout and returns `200 {"status":"ok"}` or `503 {"status":"degraded"}` with the deployed commit (`VERCEL_GIT_COMMIT_SHA`). It is never cached and contains no secrets; point an uptime monitor at it.
- Error pages: each route group has its own `error.tsx` (retry, support contact and the error reference that matches the server log `digest`), plus `global-error.tsx`. Unknown URLs and missing posts, categories and loads return a real 404 with `noindex`.

## Security headers

- **Two CSPs** built by `src/lib/security/csp.ts`. Marketing pages stay static/ISR and get a header CSP from `next.config.ts` (`script-src 'self' 'unsafe-inline'` plus the exact GTM/Google Ads/Turnstile/Stripe/Maps hosts). Dynamic surfaces (`/app`, `/admin`, auth pages, `/invite`, `/blog/preview`) get a per-request nonce from `src/proxy.ts` with `'strict-dynamic'` and the SHA-256 hashes of the root layout's inline scripts (`src/lib/security/inline-scripts.ts`), so those scripts run without reading the nonce in the root layout. A new inline script in the root layout must be added to `layoutInlineScripts`, and a new dynamic surface to `NONCE_ROUTE_PREFIXES` (its route must render dynamically).
- **`style-src 'self' 'unsafe-inline'`** on both policies: GSAP, Driver.js, Radix, Recharts-style charts and Google Maps write `style` attributes and inject `<style>` at runtime, and React `style={}` props need inline styles too. Nonces cannot cover style attributes, and inline CSS cannot run script, so script-src carries the XSS protection.
- Violations are reported to `POST /api/csp-report` (size-capped, rate limited, logged as `csp violation` without query strings). Zod's JIT probe is disabled by an inline boot script so `new Function` never trips `script-src`.
- `X-Robots-Tag: noindex` on `/app`, `/admin`, `/api`, `/invite`, `/blog/preview` and on every Vercel preview deployment. HSTS is sent only in production; `upgrade-insecure-requests` only when `NEXT_PUBLIC_APP_URL` is https.
- Extra Better Auth origins (e.g. a preview domain) go in `BETTER_AUTH_TRUSTED_ORIGINS`, comma-separated.

## Privacy

- **Download my data** (Settings → Your data) streams a JSON file from `GET /api/account/export`: profile, sign-in methods, sessions, companies, loads with history, bids, payments, messages sent, reviews, disputes, notifications, assistant conversations and form submissions. Limited to 3 per hour per user and written to `audit_log` (`account.export`).
- **Delete account** asks for the password (or a sign-in less than 10 minutes old for Google and passkey accounts) and is blocked, with the reason shown, while the user has active loads, processing or disputed payments, trips in progress as a driver, or is the only owner of a carrier with trips in progress, pending payouts or other team members. Admin accounts cannot delete themselves.
- Deletion anonymizes rather than removes the user row: loads, payments, ledger, payouts, reviews and messages stay for tax and dispute records, attributed to "Deleted user". Name, email, phone, photo, sessions, linked accounts, passkeys, 2FA, AI threads, notifications, preferences, driver GPS points, team memberships, pending invitations, newsletter subscription and contact details on form submissions are deleted. Open bids are withdrawn and drafts cancelled. The row is banned so it cannot sign in again, and the action is written to `audit_log` (`account.delete`). Code: `src/server/account/*`, `src/server/actions/account.ts`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Quality checks (also run in CI) |
| `pnpm db:generate` / `pnpm db:migrate` / `pnpm db:studio` | Drizzle migrations and studio |
| `pnpm content:seed` | Load the guides in `content/blog/*.md` into the blog (safe to re-run) |
| `pnpm demo:seed --yes` / `pnpm demo:reset --yes` | Create or remove the demo accounts and their data (see "Demo accounts") |
| `pnpm tokens` | Regenerate Material 3 color tokens from the brand color |
| `pnpm icons` | Regenerate Material Symbols icon paths |
| `pnpm email:dev` | Preview email templates |

## Demo accounts

`scripts/seed-demo.ts` fills any database (local or Supabase, `NODE_ENV` doesn't matter) with ready-to-use accounts and a marketplace in every state, so each role can be tested end to end. It writes rows directly with Drizzle over `DATABASE_URL_MIGRATIONS ?? DATABASE_URL`. Passwords are hashed with Better Auth's own hasher, and no emails, Stripe or OpenAI calls are made.

```bash
pnpm demo:seed                          # shows what it will do and the target database, changes nothing
pnpm demo:seed --yes                    # create or update (safe to re-run, no duplicates)
pnpm demo:seed --refresh-locations --yes  # move the live GPS trails back to "1 min ago"
pnpm demo:reset --yes                   # delete only the demo data
```

**Password:** every account uses `AllshipDemo2026!`, or `DEMO_PASSWORD` if set (10–128 characters). All emails are on `@allship.test`, a reserved domain that can never receive mail.

| Role | Email | What to try |
|---|---|---|
| Shipper (Emily Carter, Chicago) | `demo.shipper@allship.test` | Compare 3 bids on AS-DEM3BD (one is an instant quote) and accept one with simulated payment; confirm delivery on AS-DEM9DL; live tracking on AS-DEM7ER and AS-DEM8TR; review on AS-DEMCMP; dispute on AS-DEMDSP; messages, notifications |
| Shipper (Jordan Alvarez, Houston) | `demo.shipper2@allship.test` | Two open loads; AS-DEMB2A already has a bid from Demo Freight Lines |
| Carrier owner, Demo Freight Lines LLC | `demo.carrier@allship.test` | Board and bidding, assign a driver on AS-DEM5BK, trips, team with a pending invite, payouts, reviews and reply, instant quote pricing |
| Dispatcher, Demo Freight Lines | `demo.dispatcher@allship.test` | Same as the owner without team management |
| Drivers, Demo Freight Lines | `demo.driver1@` / `demo.driver2@` / `demo.driver3@allship.test` | driver1: start AS-DEM6AS (pickup tomorrow); driver2: confirm pickup on AS-DEM7ER; driver3: confirm delivery on AS-DEM8TR |
| Carrier owner, Lone Star Movers Inc | `demo.carrier2@allship.test` | Competing bids on AS-DEM3BD and AS-DEM4CL, pre-booking chat. Its driver is `demo.driver5@allship.test` (no trips, empty states) |
| Carrier owner, Prairie Line Logistics LLC | `demo.carrier3@allship.test` | Third bidder on AS-DEM3BD |
| Admin | `demo.admin@allship.test` | Admin console with 2FA: open dispute on AS-DEMDSP, payments, carriers, loads, users |

**Admin 2FA.** Admin actions require two-step verification, so the admin is created with TOTP on. At the end of every run the script prints the `otpauth://` URI, the setup key and 10 backup codes. Add the key to an authenticator app once. Re-running keeps the same secret, and `demo:reset` followed by `demo:seed` creates a new one. The secret is encrypted with `BETTER_AUTH_SECRET` (or `BETTER_AUTH_SECRETS`), so run the script with the same value the app uses.

**What gets created.** 3 verified carriers (FMCSA status set to verified with a snapshot marked as demo, USDOT 9900101/9900202/9900303) and 14 loads: AS-DEM2DR draft, AS-DEM3BD open with 3 bids, AS-DEM4CL open with bidding closing in about 20 hours, AS-DEM5BK booked without a driver, AS-DEM6AS assigned, AS-DEM7ER on the way to pickup, AS-DEM8TR in transit on I-55, AS-DEM9DL delivered and waiting for confirmation, AS-DEMCMP completed with payout and a 5-star review, AS-DEMDSP disputed for damage, AS-DEMCXL cancelled, AS-DEMEXP expired, plus AS-DEMB2A and AS-DEMB2B from the second shipper. Each load has a timeline event for every transition, and every booked load has a succeeded payment whose ledger entries follow `escrow.ts` and `payouts.ts`. Load details are validated against `src/features/loads/spec.ts`, and the script stops if any are invalid.

**Notes**
- **GPS ages.** The trails on AS-DEM7ER and AS-DEM8TR end 1–2 minutes before the run. Use `--refresh-locations --yes` to bring them back to now.
- **Tours.** Welcome tours are left unfinished on purpose, so each account shows its tour on first visit.
- **Photos.** Without Supabase Storage keys, photos are copied from `public/images` into `.uploads/loads/<id>/`. With `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set, they are uploaded to the `load-media` bucket. In production without those keys, photos are skipped.
- **Payments.** Payments are simulated (no PaymentIntents), and the carriers show payouts enabled without a Stripe account. With real Stripe keys, a new payout to a demo carrier is held because there's no connected account.
- **Email.** When `RESEND_API_KEY` is set, the demo addresses are added to `email_suppression` so the app never emails `@allship.test`. Magic links, OTP and invite emails then don't send for them, so sign in with the password. The pending invite for `demo.driver4@allship.test` is there to show the Team page's invite state, and its link is printed.
- **Public pages.** Demo carriers are verified and Demo Freight Lines takes instant quotes, so they appear on the public `/moving` matcher, and demo open loads appear on `/loads`. Run `pnpm demo:reset --yes` before real customers use that database.
- **Safety.** Every demo user and company is tagged in `legacy_map` (collections `demo` and `demo_org`). The script refuses to run if a demo email, slug, USDOT number or load ID belongs to anything without that tag. `demo:reset` deletes only tagged rows and the loads of demo shippers, and refuses if demo accounts are linked to real data (for example a real shipper paid a demo carrier, or the demo admin wrote a blog post).
