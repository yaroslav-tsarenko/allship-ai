# AllShip AI — Product Map (as built)

Source of truth: `allshipai-da` (Next.js dashboard), `allship-be` (Express + Mongo), plus the booking/auth pieces of `allshipai-la` (landing) that hand off into the dashboard. This describes what the product *does* (and fails to do) so it can be rebuilt. Endpoints are relative to the backend base URL.

Legend: **[works]** behaves as intended, **[broken]** wired but fails, **[stub]** UI only, no effect, **[dead]** code exists, never reached.

---

## 0. Actors and surfaces

| Role (`User.role`) | Called in UI | Gets into the dashboard how |
|---|---|---|
| `customer` | Shipper / Customer | Landing sign-up with email code (`/auth/register-and-auth` → `/auth/verify-code`) |
| `carrier` | Carrier | No working path in code: both carrier sign-up forms drop `role`, so the account becomes `customer`. Only an admin `$set` (`/admin/update-user`) or a DB edit makes a carrier |
| `driver` | Driver | Created by a carrier (`/user/add-user-driver`). Cannot log in (see §7) |
| `admin` | Admin | Promoted via "Make Admin" in the users table |

Surfaces: landing `allship.ai` (booking form, matched carriers, auth), dashboard `dashboard.allship.ai`, backend with REST + a single WebSocket server, a cron job that runs **every minute**, a public Telegram channel, Resend email, Square payment links, Zoho CRM, OpenAI GPT-4, OpenRouteService, Cloudflare R2 (served as `cdn.allship.ai`), Google Maps JS.

Auth: a JWT (7 days) in a `token` cookie on `.allship.ai` plus a `Bearer` header. **Only `GET /user/get-user` checks it.** Every other endpoint trusts the `userId`, `email` or `carrierId` sent in the body or query, admin endpoints included. Admin pages are guarded only in the client (`ProtectedPage` redirects non-admins away from `/all-loads`, `/all-users`, `/income`).

---

## 1. Screens per role

### 1.1 Sidebar per role (`components/sidebar/Sidebar.tsx`)

| Customer | Carrier | Driver | Admin |
|---|---|---|---|
| **Create Load** button → `/create-load` | **Add Driver** button → `/drivers` | Dashboard AI → `/dashboard` | Metrics → `/dashboard` |
| Dashboard AI → `/dashboard` | Dashboard AI → `/dashboard` | Assigned Loads → `/assigned-loads` | Users & Roles → `/all-users` |
| My Loads → `/my-loads` (red "+1" badge if `localStorage.bidExist`) | Take Load → `/take-load` | Settings → `/settings` | Income → `/income` |
| Chat with Carrier → `/chat` | Chat with Shipper → `/chat` | | All Loads → `/all-loads` |
| Payments → `/payments` (red "+1" badge if `localStorage.transactionNotification`) | Drivers & Equip → `/drivers` | | |
| Settings → `/settings` | Payments → `/payments` | | |
| | Settings → `/settings` | | |

Logout (all roles) clears the cookie client-side and sends the user to the landing page. The mobile drawer duplicates this list, but its admin menu wrongly shows the customer items, and its Create Load and Add Driver buttons have no click handler.

Header (`Header.tsx`): page title per route; search icon opens an empty dialog **[stub]**; user name, role tooltip and a "verified" tick; a notifications menu with three toggles (Carrier, Driver, AI) that only flips local state and shows a toast **[stub]**; a quick menu (Dashboard, My Loads, My Profile, Chat, Payments, Settings, Logout).

Global behaviour inside `ProtectedPage` (wraps every authed page):
- A carrier with `carrierEnteredAdditionalInfo=false` gets a modal "Additional Information Required" that cannot be dismissed, containing the pricing form (§2.7).
- A customer with a `bookingData` cookie gets a modal "Processing Your Request…" that cannot be dismissed. The page auto-POSTs `/load/create-load-from-cookie`, deletes the cookie and redirects to `/my-loads` after 2.5 s (§2.1b).
- `GetLocation` (mounted in the dashboard shell) sends a driver's browser geolocation to `POST /user/update-location` every **60 s**.

### 1.2 Routes (`src/app`)

| Route | Roles | Displays | Actions → endpoint |
|---|---|---|---|
| `/` | all | Spinner | After 1 s redirects to `/dashboard` (if user) or to landing `/sign-in` |
| `/sign-in` | public | Email, password, "Remember me" (does nothing) | `POST /auth/login` |
| `/sign-up` | public | Tabs Individual / Business (company name, URL, est. shipments/month, US phone `+1XXXXXXXXXX`), SMS opt-in checkbox | `POST /auth/register-and-auth` **[broken]**: no verify-code step on this screen; it expects a token that the API no longer returns |
| `/carrier-sign-up` | public | 4-step wizard: Get Started (name, second name, phone, email) → Authority (DOT, MC, required) → Company (name, URL) → Account (password with live checklist) | `POST /auth/register-and-auth` **[broken]**: role, DOT, MC and company are all dropped; no verification step |
| `/dashboard` | customer, carrier, driver | Three ring widgets: **Service Rating / Service Agreement / Service Activity** (raw `User` numbers shown as %, never computed); **AllShip AI chat** ("Genesis"); **DynamicMap**: list of the user's own loads, clicking one draws the route plus the assigned driver's avatar marker. Mobile: tabs Chat / Statistics / Map | AI: `POST /ai/create-ai-chat`, `POST /ai/send-message`, `GET /ai/get-all-chats`, `GET /ai/get-selected-ai-chat`, `POST /ai/rename-chat`, `DELETE /ai/delete-chat`. Loads: `GET /load/get-all-user-loads?userId` |
| `/dashboard` | admin | Admin metrics (§2.9) | `GET /admin/metrics` |
| `/create-load` | customer | 4-step wizard (§2.1a) | `POST /load/create-load` (multipart) |
| `/my-loads` | customer | One card per load (§2.3); filter and sort icons **[stub]**; floating "+" → `/create-load` | `GET /load/get-all-user-loads`, `DELETE /load/delete-load-by-id/:loadId`, `POST /load/pay-load` |
| `/view-load` | customer (any) | Status stepper `Pending → Active → Applied → Booked → Dispatched → Picked Up → Delivered → Completed`; subtype, title, Load ID, route with times, vehicle make/model/year, image slider, bids list with Apply | `GET /load/get-load-by-id/:loadId` (id read from `localStorage.loadId`) |
| `/take-load` | carrier | Filter panel plus a list of Active loads (§2.2) | `GET /load/get-all-loads-for-carriers`, `POST /load/make-bid` |
| `/chat` | customer, carrier | Chat list (search **[stub]**), conversation, status-driven action bar, tips, assign-driver dialog (§2.5) | `GET /chat/get-all-chats?userId`, WebSocket, `POST /load/update-load-status`, `POST /load/pay-load`, `POST /load/assign-driver` |
| `/drivers` | carrier | Driver cards: avatar, name, email, phone, lat/lng, "Assigned Load" (always empty), map pin; card menu "Request Location Update" / "Remove Driver" **[stub]**; filter and sort **[stub]**; Add Driver dialog | `GET /user/get-all-drivers?carrierId`, `POST /user/add-user-driver` |
| `/assigned-loads` | driver | **One** card: `user.assignedLoads[0]` only. Title, subtype, route with times, subtype details, map, "Start Trip" | `GET /load/get-load-by-id/:id` |
| `/trip` | driver | Map (pickup→delivery, or "my location"→next stop), straight-line distance in miles and ETA at 50 mph, "Transit Update" **[stub]**, status button (§2.6), Exit | `POST /load/update-load-status` |
| `/payments` | customer, carrier | Transaction history (avatar "You", purpose, date, time, `-X$` for payment, `+X$` for refund) sortable Newest / Oldest / Cheapest / Most Expensive. **Cards UI is not rendered** (`CreditCard` is unused) | `GET /user/get-all-transactions?userId` |
| `/settings` | customer, carrier, driver | Tabs Account / Password / Notifications / Help (§2.8) | `/user/update-user`, `/user/update-password`, `/user/update-notifications`, `/user/create-form` |
| `/profile` | any (header link only) | Name, email, phone, reviews list | (user from session) |
| `/confirm-payment/[loadId]` | Square return URL | Fake progress text "Checking payment… → Payed!" | `POST /load/confirm-payment` → redirect `/my-loads` |
| `/load-payed` | legacy return | "Please wait…" | `POST /load/confirm-payment` with the wrong payload **[dead]** |
| `/bid-applied` | legacy PayPal return | "We are processing your request" | `PATCH /load/apply-bid`, reading cookie `applyingBidData`, **which nothing sets** **[dead]** |
| `/payment-success` | legacy PayPal return | "Payment Completed!" | `POST /user/continue-payment-functionality` (**endpoint does not exist**) **[dead]** |
| `/success` | — | Checkmark plus `localStorage.successTitle`, redirect after 3 s | — |
| `/all-users` | admin | Users table (§2.9) | `/admin/get-all-users`, `/admin/update-role`, `/admin/update-user`, `/admin/delete-user/:id` |
| `/all-loads` | admin | Loads table (§2.9) | `/admin/get-all-loads`, `/admin/update-load`, `/admin/delete-load/:id` |
| `/income` | admin | "Coming soon..." **[stub]** | — |

---

## 2. End-to-end flows

### 2.1a Shipper creates a load manually (dashboard)
1. **Step 1, type:** Vehicle Load, Moving, Freight, Heavy Equipment, Truck With Driver.
2. **Step 2, location and time:** pickup location (at least 10 chars, not only digits), pickup datetime, delivery location, delivery datetime. Stops (up to 5) exist in code but are commented out. A distance badge is meant to show here, but it never computes.
3. **Step 3, subtype** (Vehicle and Moving only):
   - Vehicle: Car or Light Truck, Moto Equipment, Powerboats, Sailboats, Personal watercrafts, ATVs & Power Sports, Commercial Truck, Parts, Trailer & Other Vehicles, RV.
   - Moving: Local Moving (less than **50** miles), Commercial / Business, Heavy Lifting and Moving Only, Household item, Office, Corporate, Student, Military, Long Distance.
   - Freight, Heavy Equipment and Truck With Driver skip straight to the form.
4. **Step 4, subtype form** (22 forms; e.g. Car: title, year, make, model, open/enclosed/both trailer, convertible, modified, inoperable; Freight: title, weight, L/W/H; Household: residence type, bedrooms, boxes, furniture, appliances, fragile, special handling, packing, disassembly, storage, supplies). Plus up to **5 files** and **5 photos**, and "Additional Details".
5. `POST /load/create-load` (multipart). The backend drops every falsy or empty field, generates `loadId` = `49-0013-NNNN-NNNN`, uploads files to R2 as `load-{loadId}-file-N` / `-photo-N`, and saves `status: "Pending"`. It emails the shipper and posts to Telegram.
6. Within one minute the cron flips **every** `Pending` load to `Active`. There is no review or payment gate.

Data loss on this path: "Additional Details" is sent as `details` (the schema has `description`). Corporate Moving, Long Distance Moving and Truck With Driver fields mostly aren't in the schema, so Mongo silently drops them. `type` (the category) is never sent. `price`, `milesTrip` and `totalLoadPrice` are never set.

### 2.1b Booking from the landing page (cookie handoff)
1. The landing booking form collects move type, from, to, bedrooms (1–8, which maps to volume **300 / 600 / 950 / 1300 / 1650 / 2000 / 2300 / 2600 ft³**), pickup date, delivery date, full / half / quarter packing (→ `packingLevel` 1 / 0.5 / 0.25), unpacking, storage plus amount, climate-controlled, insurance, long-term. Values mirror into `localStorage.bookingForm` and a `bookingData` cookie.
2. `POST /user/find-matched-carriers` (client retries 3× with a 1.5 s gap) returns up to 6 carrier cards (§3.2). Results are blurred until the visitor is authenticated.
3. The visitor picks a carrier → confirm dialog → the cookie `bookingData` = form + `chosenCarrier` (carrier `_id`) + `totalLoadPrice` is set on `.allship.ai` → redirect to `dashboard/my-loads`. If they sign up instead, `verify-code` success copies `bookingForm` into the `bookingData` cookie for 1 h.
4. In the dashboard, `ProtectedPage` (customers only) normalises `packingLevel` and POSTs `{bookingData, userId, email}` to `/load/create-load-from-cookie`.
5. The backend:
   - computes distance via ORS (§3.4);
   - sets `subType` = `"Local Moving (less than 150 miles)"` if under 150 mi, else `"Long Distance Moving"`;
   - dedupes on `bookingHash` (sha256 of the payload);
   - creates a **Chat** immediately, even with no carrier (it is then named "Unknown Carrier");
   - creates the Load with `status: "Inactive"`, `title` "Moving from X to Y", the carrier's `totalLoadPrice`, `distance`, `chosenCarrier {companyName, chatId}`;
   - sends the email "Your load has been created!".
6. The cookie is cleared and the user is sent to `/my-loads`. The card shows **Pay $max(10% × totalLoadPrice, $100)** (§2.4).

### 2.2 Carriers see loads and bid
- `/take-load` lists **all** loads with `status === "Active"` (no matching by geography or equipment).
- Card: Avg Price (mean of bids), subtype, pickup and delivery stepper with times, Load ID, shipment title, "N Bids", **Quick Bid** (or a disabled "Submitted" if this carrier already bid), "Show More" (expands to the literal text "test test test"), Google route map.
- Filters (applied on "Save Changes"):
  - pickup / delivery location: substring match **[works]**
  - pickup / delivery radius sliders 0–10,000 mi **[stub]**: the field doesn't exist
  - weight 0–20,000 lb: lives in local state only, never applied **[stub]**
  - Load Type (FTL, LTL, Container, Flatbed, Refrigerated, Oversized), Pricing Type (Fixed, Per Mile, Per Kg, Per Pallet, Dynamic, Custom Quote), Location Type (Domestic, International, Terminal-to-Terminal, Door-to-Door, Port Pickup, Warehouse Delivery): these fields don't exist on loads, so choosing any of them hides everything **[broken]**
  - tabs Location / Along Route / None, and sort by date / price **[stub]**
- **Bid dialog fields:** Cover Letter (required, **at least 150 chars**), Estimated Delivery Time (datetime), Bid $ (number). The UI stores `bidPrice = input × 1.10`, i.e. the 10 % fee is added *on top*. The copy says "fee of service is 10%, so shipper will receive bid – X$".
- `POST /load/make-bid {loadId, carrierId, carrierCompanyName: "Carrier Company" (hard-coded), bidPrice, letter, title, subType, estimatedDeliveryTime}`. The backend pushes the bid, recomputes `bidsQuantity` and `avgPrice`, emails the shipper and posts to Telegram. There is no check of role, duplicates or load status.
- AI auto-bids also land here (§3.3).

### 2.3 Shipper reviews bids (`/my-loads` card, `LoadEntity`)
- The card shows the route stepper, Status, Title (actually the subtype), Load ID, subtype-specific details, and a map.
- Menu: View load page, More / Less details, Delete load (no confirm).
- If `Inactive`: **Pay $X** button plus an "Attention Required" box (copy differs depending on whether a carrier was pre-chosen).
- Else **View Bids**: only when `Active` it shows two groups, **"AI Suggested Bids"** (`aiMadeBid=true`) and **"Bids from Carriers"**. Each bid card shows a company initials avatar, company name, Bid Price, Estimated Delivery Time and Carrier Letter, plus **Apply Bid**. `Pending` shows "wait to become Active". Any other status shows "You already applied bid…".
- Apply Bid → dialog "pay the 100$ service fee… load will have the status Payed, then a chat will be created" → **Apply Bid & Pay 100$** → `POST /load/pay-load {loadId}` → redirect to Square.

### 2.4 Payment (Square) — the only live payment rail
1. `POST /load/pay-load {loadId, serviceFee?}`. If `serviceFee` is absent, the server uses `round(10% × (totalLoadPrice || price), 2)`. If both are missing, it answers `400 INVALID_TOTAL_LOAD_PRICE`.
2. A Square quick-pay link is created for the **fee only** (USD, `referenceId = loadId`), redirecting to `/confirm-payment/{loadId}`.
3. `/confirm-payment` calls `POST /load/confirm-payment {loadId, userId}`. The server **does not verify payment** (`isPaid = true` is hard-coded). It sets `status = "Payed"` and creates a `Transaction {purpose: "Payment for load {id}", amount: 10% (no $100 minimum), type: payment}`. It also sets `localStorage.transactionNotification`, which drives the Payments badge.
4. The carrier is never paid through the platform; only the platform fee is collected.

Result per path:
- Landing booking (`Inactive`, has `totalLoadPrice`, chat already exists): Pay → **Payed** **[works, unverified]**.
- Manual load with bids: `price` and `totalLoadPrice` are empty, so pay-load returns 400 **[broken]**. Even if payment succeeded, `apply-bid` (which creates the chat and sets `chosenCarrier`) is never called. The only caller is `/bid-applied`, which reads a cookie nobody writes. The bid flow cannot reach the chat stage.

### 2.5 Chat
- The list comes from `GET /chat/get-all-chats?userId`: a customer gets chats where `shipperId = userId`, a carrier where `carrierId = userId`, and drivers and admins get **403**. Each item shows the counterpart name, title, subtype, bid price and time. Selecting one stores `chatId`, `nickname`, `loadId` and `bidPrice` in localStorage.
- Messages go over one WebSocket. The client sends `{chatId, carrierId|shipperId, role, names, messageText}`. The server appends to `chat.chatHistory` and **broadcasts to every connected socket** (no rooms, no auth); clients append every incoming message to whatever chat is open. Enter sends; the attach and send icons do nothing. The WS URL is hard-coded to the Render host.
- The action bar is driven by `load.status`:
  - **Customer:** default → "Accept" (→ `Applied by Customer`); `Applied by Carrier` → "pay {10% of bidPrice}$" (calls pay-load expecting `checkoutUrl`; the API returns `approvalUrl`, so this is **[broken]**); `Payed` → "Waiting for driver assignment"; `Dispatched` → "waiting for pickup"; `Inactive` → banner with "Pay Load".
  - **Carrier:** `Applied by Customer` → "Accept" (→ `Applied by Carrier`); `Applied by Carrier` → "Waiting for shipper's payment"; `Payed` → **assign** (opens the driver list → Assign); `Dispatched` → "waiting for pickup"; default → "waiting for shipper's approval".
- Tips (ChatTip) are shown for `Applied`, `Applied by Customer`, `Applied by Carrier`, `Payed`, `Dispatched`.
- Defect: the load shown in chat is fetched once on mount from `localStorage.loadId`, which the page clears on mount, so the action bar is usually stale or empty until a reload.

### 2.6 Carrier assigns driver → driver trip
1. In chat (status `Payed`), the carrier clicks Assign on a driver → `POST /load/assign-driver {loadId, driverId}`. This copies the driver's current `lat`, `lng` and `avatar` into `load.assignedDriver` and pushes `loadId` into `driver.assignedLoads`. The UI then calls `update-load-status → "Dispatched"`. The dialog promises the driver an email, but **none is sent**.
2. The driver's `/assigned-loads` shows only `assignedLoads[0]`. "Start Trip" stores `loadId` and opens `/trip`.
3. `/trip` button by status: default (`Dispatched`) → **Start Trip** → `In Transit` (map: my location → pickup) → **Picked Up** (map: my location → delivery) → **Delivered** → disabled "This Load is Completed".
4. Location: the driver's browser posts lat/lng every 60 s to `User`. `load.assignedDriver.lat/lng` is a one-time snapshot, so the shipper's map marker never moves.

### 2.7 Carrier sign-up and "additional info"
- Sign-up as built: see §1.2. In practice carriers are created by an admin or seeded.
- **Additional info modal** (forced while `carrierEnteredAdditionalInfo=false`):
  - **5 mileage tiers**, each with `From (miles)`, `To (miles)`, `Price ($)`
  - `Packing Cost ($)`, `Unpacking Cost ($)`, `Storage Cost ($)`
  - Validation: "at least one field filled". Empty tiers are saved as `{0,0,0}`.
  - `POST /user/add-additional-info {userId, mileagePricing[], serviceCosts{}}` sets `carrierEnteredAdditionalInfo=true`.
  - Meaning used by the pricing engine (§3.2): the tier `price` is **$ per cubic foot** for that distance band, not $ per mile. Packing, unpacking and storage are $ / ft³ (storage also × `storageAmount`).
- DOT / MC: collected in the form but never persisted (`dotNumber`, `mcNumber`, `datNumber`, `dot`, `usDot` exist in the schema but are unused).

### 2.8 Settings
- **Account:** change avatar (uploaded to R2 as `avatar-{userId}-{ts}`) **[works]**; Delete Avatar (local only); First / Second Name (sent as `firstName`, but the schema field is `name`, so the first name is never updated); "Delete Account" button **[stub]**. `POST /user/update-user` merges *any* body field into the user (role included).
- **Password:** old and new (at least 8 chars, an uppercase letter, a digit and one of `!@#$%^&*`, different from old) → `POST /user/update-password`. It compares plain text against a bcrypt hash and then stores the new one in plain text, so it effectively always fails, and if it ever succeeded it would lock the user out **[broken]**.
- **Notifications:** toggles `notificationsEnabled, aiNotifications, carrierNotifications, loadNotifications, driverNotifications, updateNotifications` → `POST /user/update-notifications`. Stored, but **never read** by any sender.
- **Help:** email plus message (at least 150 chars, rejects junk repeats) → `POST /user/create-form` → `HelpQuote` doc plus Telegram post.

### 2.9 Admin
- **Users & Roles** (MUI DataGrid): Avatar, Name, Second Name, Email, Phone, Role, Company, City, Joined, and Actions. Actions are Edit (dialog: first name, second name, email, phone, company name, city, state → `/admin/update-user`), Make Admin / Make User (`/admin/update-role`), Delete (no confirm). There is no "make carrier" or "make driver" action.
- **All Loads** (DataGrid): Load ID, Title, Email, From → To, Price ($), Bids (count), Status chip, Created, Updated, plus Edit and Delete. Edit is a generic editor over every field of the load document (nested objects expanded).
- **Metrics** (`GET /admin/metrics`):
  - Server computes: `totalUsers`, `totalLoads`, `activeLoads` (status Active), `payedLoads` (status Payed), `totalRevenue` (sum of `payment` transactions in the **last 30 days**), `totalRefunds` (same, refunds; nothing ever creates refunds).
  - UI also wants `averageRevenuePerUser`, `loadsGrowth`, `revenueByDay`, `topStates`, `carriersPerformance`. The server never returns these, so the charts say "No data". On any request error the UI swaps in **hard-coded mock numbers** (FedEx / UPS / DHL etc.).
  - UI pies: Load Distribution (Payed / Active / Other), Revenue vs Refunds, Users vs Loads.
  - A second, fully hard-coded `components/all-metrics/AllMetrics.tsx` exists **[dead]**.
- **Income:** "Coming soon".

### 2.10 Driver creation by carrier
- Dialog: avatar (sent as `image`, ignored by the API), email, phone, name, second name, plus a data-processing disclaimer.
- `POST /user/add-user-driver {name, secondName, phone, email, carrierId}`. It rejects a duplicate phone or email, generates a 10-char password (1 lowercase, 1 uppercase, 1 digit, 1 symbol, then 6 random), and saves `role: driver` with **the password in plain text** and **no `verificated` flag**.
- Email "Welcome to the team!" contains the email and password in clear text. The API response also returns the password.
- Login then fails twice over: bcrypt compare against plain text, and "Email not verified" (403).

### 2.11 Transactions and cards
- Transactions are created **only** by `confirm-payment`. Carriers have none.
- Cards (backend only, no UI to add): `POST /user/add-card` stores the **full card number and CVV in plain text**, max **5** cards per user, colour picked at random from the 6 unused of `grey, blue, green, yellow, purple, red`, network = `visa` if the number starts with 4, `mastercard` if 5, else `unknown`. Also `select-card` (one selected) and `get-selected-card`. Nothing charges these cards.

---

## 3. AI features

### 3.1 AllShip AI chat ("Genesis") — `ai.controller.sendMessage`
- Model **gpt-4**, temperature 0.7, no tools, no streaming.
- The user is looked up **by email from the request body** (no auth, so anyone can pull anyone's context by knowing their email).
- Context JSON is embedded in the system prompt:
  - `profile`: the full user doc minus password, reset token and verification code. Still includes phone, lat/lng, card ref and everything else.
  - `loadsSummary`: `{id, from, to, status, price, date}`. `from`, `to` and `price` don't exist on manual loads, so they are mostly undefined.
  - `transactionsSummary`: `{id, purpose, amount, type, date}`.
  - `recentChats`: queried by `Chat.userId`, a field that doesn't exist, so always empty.
  - `aiChatCount`.
- System prompt: "AI assistant for AllShip.ai… help manage loads, transactions, communication strictly inside AllShip.ai"; tasks are creating, editing and tracking loads, chatting with carriers and drivers, payment history and invoices, KPIs, and navigating the dashboard (referencing "Dashboard", "My Loads", "Payments", "Chat"); short actionable steps. Rules: never reveal the internal JSON, stay on platform features, no unrelated topics, be direct, ask clarifying questions.
- History: the client sends the whole message array. The server appends `{sender:user}` and `{sender:bot}` to `AIChat.messages`. A new chat is seeded with a placeholder message `"No data"/"No data"`, and named `"New Chat"` / `"New Chat N"`.
- UI: greeting "Hello, {name}", a random welcome line, **19 suggested-question chips** (My profile, Carriers and shippers, Creating a load, Track a shipment, Cost of shipping, Best shipping method, Reduce transport cost, Insurance for cargo, Customs clearance, Packaging for safety, Container sizes, Prohibited items, Calculate weight, Vehicle load limits, Types of carriers, Choosing a carrier, Shipment tracking, Freight classes, Load boards). The sidebar lists chats with rename and delete. Footer: "Genesis can make mistakes".

### 3.2 `findMatchedCarriers` (landing quote engine)
- Candidate carriers: `role=carrier` with non-empty `carrierMileagePricing`, `carrierServiceCosts` and non-empty `reviews`. There is **no geographic, equipment or availability filter**.
- `distance = getDistanceMiles(from, to)` (§3.4).
- Per carrier, with `volume` in ft³ from bedrooms:
  - `rate = getMileageRate(tiers, distance)`: the first tier with `from ≤ d ≤ to`, else the **last tier's price**, else **2.5**.
  - `distanceCharge = volume × rate`
  - `packingCharge = volume × packingCost × packingLevel` (0 / 0.25 / 0.5 / 1)
  - `unpackingCharge = unpacking ? volume × unpackingCost : 0`
  - `storageCharge = storage ? volume × storageCost × storageAmount : 0`
  - `totalPrice` = sum (2 dp)
  - `rating` = average of `reviews.rate`, but **if below 4.6 it is replaced with a random 4.6–5.0**
  - `pastOrders` = **random 40–150**
  - `experience` = `"{serviceActivity} years"`
- Drop `totalPrice ≤ 0`, sort ascending by price, keep **top 6**. **"Greenland Logistics" is forced to position 1 and badged "Best Match"** if present; otherwise the cheapest gets the badge.
- Insurance, climate control and long-term are collected but **never priced**.

### 3.3 Auto-bids (cron, every minute: `autoBidForAllLoads`)
- Targets every `Active` load with **zero bids** and both locations set. Bidders are every carrier with tiers, service costs, reviews and `serviceActivity`.
- Same formula as §3.2, with `volume = totalSquareFootage || 600` and packing / unpacking / storage taken from the load.
- **Every eligible carrier bids on every such load** (`aiMadeBid: true`). The bid comes with a template letter ("We are {company}. With over {N} years…", where N = random 1–6 because it reads a non-existent sub-field, and the rating is always "5.0" because it reads `r.rating` instead of `rate`), and an ETA of today + random 1–7 days.
- Fee: the auto-bid price is **not** marked up 10 %, unlike human bids.
- Dead helpers: `isCarrierSuitable` (state substring + rating ≥ 4), `calculateBidPrice` (tier price by `milesTrip`, else `milesTrip × 2.5` with a 100-mile default), `generateBidLetter` (GPT-4, 350+ words).

### 3.4 Distance via OpenRouteService
- Geocode each address (`/geocode/search`, first hit), then `/v2/matrix/driving-car` in metres → miles = `round(m / 1609.34)`, **minimum 30 mi**. 3 attempts with 1.2 s gaps and a 6 s timeout; **fallback 50 mi** on failure.
- Cached per `"from_to"`: forever in an in-memory Map (load controller), 1 h in NodeCache (user controller).
- The dashboard's step-2 badge uses ORS directions client-side (never actually triggered). The trip page uses Nominatim plus a haversine straight line and 50 mph.

### 3.5 Other GPT-4 jobs (cron, every minute)
- `fillCarrierReviews`: any carrier with no reviews gets **7–10 fabricated positive reviews** (rate 4–5) with randomuser.me avatars.
- `fillCarrierAbouts`: any carrier with an empty `about` gets a 3–5 sentence generated "About" (years of experience estimated if unknown).
- These fabricated reviews are what make a carrier eligible for matching and auto-bidding.

---

## 4. Notifications

### 4.1 Emails (Resend, from `MAIL_USER` or `noreply@allship.ai`, branded HTML wrapper)
| Trigger | To | Subject |
|---|---|---|
| Register | user | Verify your AllShipAI account 🚀 (6-digit code, valid 15 min) |
| Forgot password | user | Reset Your AllShipAI Password (JWT link `/reset-password/{token}`, 15 min) |
| Manual load created | shipper | Congratulations🎉 |
| Booking load created | shipper | Your load has been created! |
| New bid (human only) | shipper | New bid on your load🚚 ("…maybe it's your destiny") |
| Load deleted | shipper | Load deleted successfully (**broken**: the recipient passed is an object, not an email) |
| apply-bid | shipper / carrier | Your bid has been applied / A shipper accepted your bid (**dead path**) |
| Driver added | driver | Welcome to the team! (plain-text credentials) |
| Footer subscribe | subscriber | Thanks for subscribing! |
| Contact form | sender | Thanks for contacting us! |
| Moving quote | requester | Your Moving Quote Request |
| (dead dup of cookie flow) | shipper | Order {loadId} Created Successfully ("pay $100") |

Never sent: payment confirmations, driver assigned, status changes, chat messages. Notification preferences are ignored.

### 4.2 Telegram (bot posting to the **public channel `@allshipai`**)
- NEW LOAD POST (email, id, subtype, title, status, from, to, description, public link `allship.ai/load/{id}`)
- NEW REQUEST FOR RENT TRUCK (**contact email and phone**)
- NEW BID FOR LOAD (company, price, ETA, letter)
- New help quote (**name, email, phone, role**, message)
- New subscriber (email)
- Contact Form Request (name, email, message)
- New Moving Quote Request (name, phone, email, route, date, home size, contact times)
- A second, unrelated bot in `notifications.controller` posts leads for a different business (`landing.ua`) to `@landingua_notifications` and emails them via SMTP. This is not part of AllShip and should not be carried over.

### 4.3 Zoho CRM leads (`createZohoLead`, Lead_Status "Not Contacted", Lead_Source "Website", triggers Zoho workflow)
- `POST /user/contact-us-request` → company "AllShip Contact Form"
- `POST /user/submit-moving-quote` → company "Moving Quote Request" (no caller found in dashboard or landing; presumably an external form)
- Not created for sign-ups, bookings or loads.

---

## 5. Data entities

### User
Used: `name, secondName, email, phone, password (bcrypt, except drivers), role, avatar, companyName, about (AI), carrierId (driver → carrier link), notifications{6 booleans} (stored only), assignedLoads[], lat, lng, carrierEnteredAdditionalInfo, carrierMileagePricing[{fromMiles,toMiles,price}], carrierServiceCosts{packingCost,unpackingCost,storageCost}, reviews[{name,secondName,rate,text,avatar,reviewsCount,role}], verificationCode/Expires, verificated, resetPasswordToken/Expires, serviceRating/serviceAgreement/serviceActivity (displayed; never computed, `serviceActivity` reused as "years of experience"), city/state (admin edit only), createdAt`.
Dead or never written by the product: `companyUrl, estShipmentsPerMonth, dotNumber, datNumber, mcNumber, dot, usDot, card, truck, drivingCategory, insurance, insuranceExpires, addedByCarrier, company, address, currentLocation, currentLocationTime`. The frontend `User` type also declares wallets, balance, tariff, referralCode and telegram (left over from another project).

### Load
Core used: `userId, email, loadId, subType, title, status, pickupLocation, pickupTime, deliveryLocation, deliveryTime, pickupDate/deliveryDate (booking only), bids[{carrierId, carrierCompanyName, bidPrice (string), aiMadeBid, letter, estimatedDeliveryTime, createdAt}], bidsQuantity, avgPrice, assignedDriver{driverId,lat,lng,avatar}, images[], chosenCarrier{carrierCompanyName, carrierAvatarUrl (cron-filled by company-name lookup), chatId}, totalLoadPrice, distance, bookingHash, numberOfBedrooms, totalSquareFootage, packingLevel, packingUnpackingServices, unpacking, storageNeeds, storageAmount`, plus about 120 subtype-specific form fields (vehicle, moving, office, military, student, heavy equipment…).
Dead: `type` (never sent), `price` (never set by UI, but the admin table and pay-load read it), `milesTrip`, `description` (form sends `details`), `typeOfPackaging, loadTypeOfTrailer, typeUnits, stops` (UI commented out), `climateControlled, insurance, longTerm` (stored, never priced).
Written by code but **silently dropped** (not in schema): `squareOrderId, payedAt, createdFrom, chosenCarrier.carrierId`, bid `title/subType`, and most Corporate / Long-Distance / Truck-With-Driver fields.

### Chat
`carrierId, shipperId, loadId, carrierCompanyName, shipperName, bidPrice, title (req), subType (req), chatHistory[{carrierCompanyName, shipperName, carrierId, shipperId, role, message, createdAt}], timestamps`. A pre-save hook stamps names on messages. `role` is never saved by the WS server. `createdFrom` is dropped.

### AIChat
`userId, name, messages[{sender, text}], createdAt`.

### Transaction
`purpose, amount (string), type: payment|refund, date, userId`. Only `payment` is ever created.

### Card
`cardNumber, cardHolder, expiryDate, cvv, paymentSystem, color, userId, selected`. Raw PAN and CVV; no UI.

### HelpQuote
`userId, email, message, createdAt`.

---

## 6. Business rules and magic numbers

- **Platform fee 10 %**, applied in three inconsistent ways:
  - Human bids: displayed and stored price = carrier input × **1.10**.
  - Square charge: **10 % of `totalLoadPrice || price`**, with a **$100 minimum** in the My Loads Pay button (the server has no minimum).
  - Chat pay button: 10 % of `bidPrice`.
  - Copy in several places promises a flat **$100** fee.
- Transaction amount recorded = 10 % without the $100 floor.
- Load ID format `49-0013-NNNN-NNNN` (random, collision-checked).
- Cron interval **1 minute**: Pending → Active, auto-bid, fake reviews, fake abouts, carrier avatar sync.
- Local vs long-distance threshold: **150 mi** (booking flow) vs **"less than 50 miles"** label (manual flow).
- Distance: minimum **30 mi**, fallback **50 mi**, 3 retries, 1.2 s backoff, 6 s timeout, 1 h cache.
- Default volume **600 ft³** when unknown. Bedroom → volume table 300…2600.
- Packing levels **1 / 0.5 / 0.25**.
- Default mileage rate **$2.5** (per ft³ in the live formula).
- Matched carriers: **top 6**; rating floor faked to **4.6–5.0**; pastOrders random **40–150**; **"Greenland Logistics" pinned first**.
- Auto-bid ETA: today + **1–7** days; years of experience shown as random **1–6**.
- Fake reviews: **7–10**, rate **4–5**.
- Bid cover letter at least **150** chars; help message at least **150** chars.
- Max **5** files + **5** photos per load; max **5** cards; **5** mileage tiers.
- Verification code: 6 digits, valid **15 min**; reset link valid **15 min**; JWT and cookie **7 days**.
- Driver password: **10** chars with at least one lowercase, uppercase, digit and symbol.
- Driver location ping every **60 s**; trip ETA at **50 mph**.
- Admin revenue window: **last 30 days**.
- Status `Pending` is shown to the shipper as "wait to become Active" (auto within a minute).

### Load statuses found in code
`Pending` (default) · `Active` · `Inactive` · `Applied` · `Applied by Customer` · `Applied by Carrier` · `Payed` · `Dispatched` · `In Transit` · `Picked Up` · `Delivered`. `Booked` and `Completed` appear only in the view-load stepper and are never set.

Transitions actually implemented:
```
manual create ─► Pending ──cron 1 min──► Active ──(bids)──► [Apply Bid → Square] ──confirm──► Payed
booking cookie ─► Inactive ──Square fee──► confirm ──► Payed
chat (legacy):  (any) ─Accept(customer)─► Applied by Customer ─Accept(carrier)─► Applied by Carrier ─pay (broken)─► …
Payed ──carrier assigns driver──► Dispatched ──driver Start Trip──► In Transit ──► Picked Up ──► Delivered
admin: any field, any value
```
There are no server-side guards: `POST /load/update-load-status` accepts any status from anyone.

---

## 7. Gaps a rebuild must fix (product level)

1. **No real auth or authorization.** Every endpoint except `get-user` trusts client IDs; admin APIs are open; the AI endpoint leaks any user's profile by email. Role checks must be server-side.
2. **Carriers can't sign up and drivers can't log in.** The role is dropped at registration; dashboard sign-ups skip email verification; drivers get plain-text passwords and no verified flag. Password change is broken (plain-text compare and store).
3. **The bid → payment → chat flow is disconnected.** Paying for a bid doesn't create the chat or set the chosen carrier (apply-bid is orphaned), and manual loads have no price to charge a fee on. One atomic "accept bid" step is needed: bid → fee checkout → webhook-verified → chosen carrier + chat.
4. **Payment is never verified** (`isPaid = true`). Use Square webhooks or order lookup; record the order id (currently dropped by the schema).
5. **The fee model is inconsistent** (10 % markup on bids vs 10 % of total vs flat $100 vs 10 % with a $100 floor). Define one rule and show the shipper's total and the carrier's net clearly. Carrier payouts don't exist.
6. **The status machine is ad hoc.** Define an explicit enum and allowed transitions per role (including Completed and cancellation). Remove the legacy "Applied by…" states or make them real.
7. **"AI" and trust signals are fabricated:** generated reviews, a random rating floor, random past orders and years, a sponsored carrier pinned as Best Match, auto-bids from every carrier on every load every minute. A rebuild must use real or empty data, or label it clearly. Auto-bids also bypass the fee markup.
8. **Pricing** treats tier price as $/ft³ while the UI says "Price ($)" per mile band. Insurance, climate control and long-term are collected but not priced. Distance falls back silently to 50 mi.
9. **Matching ignores geography, equipment and capacity.** Take-load shows every Active load; the radius, weight and type filters are fake.
10. **Chat is not private:** the WebSocket broadcasts every message to all clients and has no auth. The chat's load context is fetched before a chat is selected.
11. **Tracking doesn't track:** the shipper sees a one-time driver snapshot; drivers handle only their first assigned load; no driver email on assignment.
12. **Data is lost silently:** form fields not in the schema (details/description, corporate, long-distance, truck-with-driver, stops) and `category/type` are never saved. Validate and persist the full load spec.
13. **PII leaks to a public Telegram channel** (emails and phones), and an unrelated client's lead bot shares the codebase.
14. **Card data:** raw card numbers and CVVs are stored. Never store PANs; use the PSP's tokenization. The cards UI is missing anyway.
15. **Notification preferences are stored but ignored.** Key events (payment, assignment, status, new chat message) send nothing.
16. **Admin metrics are thin or mocked;** Income is a stub; there's no way to set the carrier or driver role from the UI.
17. **Secrets are hard-coded in source** (ORS key in backend and frontend, two Telegram bot tokens, SMTP credentials, R2 access keys, Google Maps key). Rotate all of them and move them to env/secret storage.
18. **Lots of dead or stub UI** (search, filters, sort, "Show More: test test test", Transit Update, Remove Driver, Delete Account, header notification toggles, PayPal leftovers, duplicate metrics component). A rebuild should drop these or implement them properly.
