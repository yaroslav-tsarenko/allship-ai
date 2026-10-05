# AllShip AI — Content Inventory (old marketing site)

Source repo: `~/Projects/allshipai-la` (Next.js App Router, MUI, SCSS modules, Formik + Yup). Read-only extraction, generated 2026-10-04. Last commit in source: 2025-11-10.

Copy below is verbatim from source (including typos). Editorial flags are marked **[FLAG]**, **[TYPO]**, **[FAKE]** or **[FABRICATED]**. Image sizes are on-disk file sizes. Images referenced as `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/...` are loaded from a remote host configured via env var and are **not in the repo** (`openshipai-img-*.webp` naming suggests the site was forked from an "openship.ai" project).

## Contents

1. Global: brand, layout, header, footer, metadata defaults
2. Shared sections (used on several pages)
3. Routes (one section per route)
4. Load / move categories and form schemas (21 forms)
5. FAQ sets (full Q&A)
6. Testimonials and reviews (all fabricated)
7. Unused components that contain copy (incl. pricing tiers)
8. Blog
9. Typos, fabrication and risk flags (consolidated)
10. Asset inventory (every file in `src/assets` and `public`)
- Appendix A: Terms and Conditions (verbatim)
- Appendix B: Privacy Policy (verbatim)
- Appendix C: Cookie Policy (verbatim)

---

## 1. Global

### 1.1 Brand identity

- Brand name spellings used inconsistently: "AllShipAI", "AllShip AI", "AllshipAI", "allship.ai", "Allshipai", "ALLSHIP AI INC". **[FLAG]** pick one.
- Legal entity (footer): **ALLSHIP AI INC**, 254 CHAPMAN RD STE 209 NEWARK, DE 19702. Phone: **+18662282364**. Email: **support@allship.ai** (footer renders it as "support@allship.ai, DE 19702" **[TYPO]**).
- Domains: `https://allship.ai` (metadata), `https://www.allship.ai` (robots/sitemap), dashboard at `https://dashboard.allship.ai`, CDN `https://cdn.allship.ai`.
- Socials: TikTok `https://www.tiktok.com/@allship.ai2?lang=en`, YouTube `https://www.youtube.com/@allship-m3h`, Instagram `https://www.instagram.com/allshipai`, Facebook `https://www.facebook.com/people/allShip-AI/61575131679103/`, LinkedIn (placeholder `https://linkedin.com` **[FLAG]**). Twitter handle in /moving metadata: `@allshipai`.
- Tracking/3rd-party scripts in root layout: Google Tag Manager (GTM-5C2WTZG8), GA4 (G-MPJB4D03YP), Clixtell, Microsoft Clarity (qpmhs420il), Zoho SalesIQ chat widget, Zoho PageSense. Fillout embed form id `cbqEgGwBT6us` on /moving.

### 1.2 Logo files (`src/assets/logo`)

| File | Size | Notes |
|---|---|---|
| `src/assets/logo/logo.svg` | 14 KB | Main logo, viewBox 704x165. Wordmark fill `#141414` + Google-style multicolor mark: `#3F8BF3` (blue), `#DC493E` (red), `#FEDD44` / `#E9BF00` (yellow), `#51AA4F` (green), `#EDECEB`. Used in header, auth pages. |
| `src/assets/logo/logo-grey.svg` | 14 KB | Same mark, wordmark in `#939393`. Used in footer. |

Favicon: `src/app/favicon.ico` (1 KB). OG image: `public/og-image.png` (969 KB). `metadata.ts` points default OG to `/og/default.jpg`, which does not exist **[FLAG]**.

### 1.3 Fonts (`src/assets/font/Google-Sans`)

Google Sans (proprietary Google typeface, licensing risk for a public site **[FLAG]**). Only Regular + Bold are wired in `@font-face`, and both are put into one `src` list with `font-weight: normal`, so Bold is effectively never used as a separate weight.

| File | Size |
|---|---|
| `GoogleSans-Regular.ttf` | 117 KB |
| `GoogleSans-Medium.ttf` | 116 KB |
| `GoogleSans-Bold.ttf` | 115 KB |
| `GoogleSans-Italic.ttf` | 118 KB |
| `GoogleSans-MediumItalic.ttf` | 118 KB |
| `GoogleSans-BoldItalic.ttf` | 118 KB |

`src/app/page.module.css` is leftover create-next-app boilerplate (Geist font vars), not real brand.

### 1.4 Brand colors

CSS custom properties in `src/app/globals.css` (`:root`):

| Token | Value | Usage count in SCSS |
|---|---|---|
| `--dark-grey` | `#1e1f22` | 58 (primary text) |
| `--grey` | `#939393` | 37 (secondary text) |
| `--light-grey` | `#f1f3f4` | 17 (surfaces) |
| `--light-grey-transparent` | `#f1f3f4` | 7 (same value) |
| `--light-grey-2` | `#cacaca` | |
| `--blue` | `#0288d1` | 15 (MUI "info" blue) |
| `--blue-hovered` | `#0254b1` | |
| `--green` | `#0da462` | 13 (primary CTA green) |
| `--green-hovered` | `#07814c` | |
| `--light-green` | `#dbffdd` | |
| `--light-green-2` | `#84c16d` | |

Referenced but never defined **[FLAG]**: `--royal-green` (10 uses), `--royal-white` (7), `--white` (8), `--royal-green-dark` (1). They resolve to nothing.

Benefit-card backgrounds (`src/utils/benefitChangers.ts`): `#1a73e8`, `#ffffff`, `#e8f0fe`, `#174ea6` (Google blues). Other frequent hardcoded hexes: `#111827`, `#374151`, `#1f2937`, `#f9fafb`, `#f3f4f6` (Tailwind grays), `#00b884`, `#2563eb`, `#4285f4`, `#16c232`. Buttons are MUI defaults (`primary` #1976d2, `success` #2e7d32) with `borderRadius: 50px` pills everywhere. The overall look is "Google Material clone".

A `--0px` ... `--Npx` rem scale is defined (1px = 0.0625rem), useful only as a reference.

### 1.5 Root metadata (`src/app/layout.tsx`)

- Title: "AllshipAI - AI-driven transportation solutions"
- Description: "Optimize your logistics with AllshipAI, the ultimate AI-powered platform for seamless freight management. From load tracking to cost-saving automation, we connect shippers and carriers for smarter, faster, and more professional logistics solutions. Simplify your shipping today!"
- Per-page metadata uses `pageMetadata()` from `src/utils/metadata.ts`: title template "<Title> | AllShip AI", canonical, OG/Twitter, base keywords: moving, movers, truck rental, logistics, freight, load board, shipping, delivery, AllShip, AllShip AI.

### 1.6 Header (`src/components/header/Header.tsx`, `src/utils/headerLinks.ts`)

- Logo (alt "Alshipai Logo" **[TYPO]**) -> `/`
- Nav (react-icons): All `/all`, Ship `/ship`, AI `/ai`, Safety `/safety`, Partners `/partners`, Blog `/blog`, About `/about`. Tooltips "Go to <name>".
- Logged-out: "Sign In" (-> MAIN_FRONTEND/sign-in), "Sign Up" (green; tooltip "Join Us!").
- Logged-in: avatar menu "Dashboard", "Logout"; mobile: "Go to My Account".

### 1.7 Footer (`src/components/footer/Footer.tsx`, `src/utils/footerLinks.ts`)

- Columns:
  - **Company**: About Us `/about`, Why Choose Us `/why-choose-us`, Pricing Directs `/pricing`
  - **Resources**: Privacy Policy, Terms And Conditions, Blog, Contact Us
  - **Product**: Cookie Policy, Time Schedule, Lead Generate (**[FLAG]** legal page filed under "Product")
  - **Contact Us**: ALLSHIP AI INC (links to /cookie-policy **[FLAG]**), +18662282364, 254 CHAPMAN RD STE 209 NEWARK, DE 19702, "support@allship.ai, DE 19702" **[TYPO]**
- Newsletter: "Subscribe for Our Newsletter", email input "Enter your email", button "Subscribe" / "Subscribing...", success "Thank you for subscribing!", tooltip "Enter your email, dont miss out special offers!" **[TYPO]**, alerts "Thanks for submitting!" / "Something went wrong, try again."
- Social icons with tooltips "Follow us on TikTok/YouTube/Instagram/Facebook/LinkedIn".
- "All rights are reserved. Copyright <year>."

---

## 2. Shared sections

### 2.1 Load categories (`src/sections/load-categories/LoadCategories.tsx`, `src/utils/loadCategories.ts`)

| Label | Subtitle | Link | Image |
|---|---|---|---|
| Vehicles & Boats | Cars, Boats, Motorcycles, Rvs, Trailers, Parts (**[TYPO]** "Rvs" -> "RVs") | `/vehicle-load` | `src/assets/images/vehicle-category.png` (787 KB) |
| Moving | Furniture, Appliances | `/moving-load` | `src/assets/images/moving-category-image.svg` (230 KB) |
| Heavy Equipment | Farm, Construction | `/heavy-load` | `src/assets/images/heavy-construction-category.svg` (773 KB) |
| Freight | LTL, FTL | `/freight-load` | `src/assets/images/truck.svg` (5.5 MB) (**5.5 MB SVG** for a thumbnail **[FLAG]**) |

### 2.2 BenefitWrapper — "Why you need to prefer our AI" (`src/components/benefit-wrapper`, `src/utils/benefitChangers.ts`)

Heading: "Why you need to prefer our AI" **[TYPO/awkward]**. Four expandable cards, CTA button "Start For Free", expand toggle "Expand"/"Collapse".

1. Label **EFFICIENCY BOOST** — Title "AI Optimized Supply Chain" — "Maximize efficiency with AI insights that automatically suggest the best routes." — Expanded: "AI tracks shipments and vehicle availability in real-time, optimizing routes and reducing idle time, boosting your supply chain's performance." — bg `#1a73e8`. Images: `src/assets/images/allshipai-1.svg` (1.6 MB), sub `src/assets/images/allshipai-2.webp` (111 KB)
2. Label **SMART DECISIONS** — Title "RT Data for Smarter Decisions" — "AllShipAI delivers real-time data on market trends, vehicle availability, and load capacities." — Expanded: "AI-powered dashboards provide actionable insights into market conditions, carrier availability, and shipment status, giving you a competitive edge." — bg `#fff`. Images: `src/assets/images/allshipai-3.svg` (1.6 MB), sub `src/assets/images/allshipai-4.svg` (1.0 MB)
3. Label **AUTOMATED DISPATCH** — Title "Faster Dispatch with AI" — "AI automates load dispatch to the best carriers based on location and load needs, ensuring faster and more reliable shipping." — Expanded: "AI continually assesses carriers and drivers for the best match, ensuring quick, efficient dispatch, reducing delays, and improving shipment reliability." — bg `#e8f0fe`. Images: `src/assets/images/allshipai-7.svg` (1.0 MB), sub `src/assets/images/allshipai-8.webp` (115 KB)
4. Label **cost savings** (lowercase, inconsistent) — Title "Save AI Shipping Rates" — "Instantly compare carrier prices with AI-driven algorithms to secure the lowest rates without compromising service quality." — Expanded: "Our AI compares transport options in real-time to find the best shipping rates, cutting costs and optimizing logistics for your business." — bg `#174ea6`. Images: `src/assets/images/allshipai-6.svg` (1.1 MB), sub `src/assets/images/allshipai-5.webp` (107 KB)

### 2.3 UniversalSection — "Universal choose" (`src/components/universal`, `src/utils/roles.ts`)

- H1: "Universal choose" **[TYPO/awkward]**
- Text: "AllShipAI is a platform that connects shippers and carriers. Shippers can post their loads and carriers can bid on them. Here are the roles you can choose from"
- Animated truck: `src/assets/images/truck-animation.svg` (4 KB)
- Role cards (button "More"/"Close"):
  - **Shipper** — "Shippers can post their loads and carriers can bid on them." — `src/assets/images/shipper.svg` (668 KB)
  - **Carrier** — "Carriers can browse available loads and place bids to transport them." — `src/assets/images/carrier.svg` (856 KB)
  - **Broker** — "Brokers facilitate the connection between shippers and carriers, ensuring smooth transactions." — `src/assets/images/broker.svg` (245 KB)
  - **Dispatch** — "Dispatchers coordinate the logistics and ensure timely delivery of loads." — `src/assets/images/dispatch2.png` (2.9 MB) (**2.9 MB PNG** **[FLAG]**)

### 2.4 ClientReviewContent — "What Our Clients Say" (`src/utils/clients.ts`)

All four testimonials are generic, unattributed and should be treated as **[FAKE]**.

1. **Paul Mack**, manager — "Since integrating AllShipAI into our supply chain, we've seen a remarkable improvement in efficiency. The real-time data helps us make smarter decisions, and the automated dispatch feature ensures that our shipments are always on time. Highly recommend!" — `src/assets/images/avatar-client-1.svg` (74 KB)
2. **Jake Rogers**, Founder — "AllShipAI has been a game-changer for our business. The platform’s ability to compare rates and optimize routes has saved us thousands in shipping costs. Plus, the user-friendly interface makes it incredibly easy to use!" — `src/assets/images/avatar-client-2.svg` (92 KB)
3. **Emily Davis**, Director — "We struggled with finding cost-effective shipping solutions until we discovered AllShipAI. Their AI technology has helped us reduce our shipping expenses while improving overall productivity. The customer support has also been exceptional!" — `src/assets/images/avatar-client-3.jpg` (60 KB)
4. **John Smith**, CEO — "AllShipAI has revolutionized our shipping operations. The AI-driven insights have significantly reduced our costs while optimizing our delivery routes. The automation is seamless, saving us both time and resources. It's truly the future of logistics!" — `src/assets/images/avatar-client-4.jpg` (39 KB)

### 2.5 Other shared building blocks

- `Description` — H1 title, paragraph, then H2 sub-sections each with paragraph and optional list. Most marketing/legal pages are just this component.
- `IntroductionContainer` — image + H1 + text + "Get Started" green button (button has no link/handler **[FLAG]**).
- `FullScreenImage` — 1440x768 remote image.
- `FAQSection` — "Frequently Asked Questions" accordion.
- `ReadyToGetStarted` — H2 "Ready To Get Started?", "Start your journey and get free bonus!" (**[FLAG]** unspecified "free bonus"), buttons "Rent Truck" (outlined), "Become Shipper" (contained).
- `CreateLoadContainer` — left panel H2 + subtitle + step illustration (`src/assets/images/create-load-status-1.svg` (1 KB), `src/assets/images/create-load-status-2.svg` (1 KB), `src/assets/images/create-load-status-3.svg` (1 KB), `src/assets/images/create-load-status-4.svg` (1 KB)), right panel form.

---

## 3. Routes

Page count: **31 route files** under `src/app` (29 marketing/app pages + `not-found` + the `api/articles/add` endpoint). Content-heavy marketing pages: home, about, ai, all, ship, safety, partners, pricing, why-choose-us, time-schedule, lead-generate, moving, truck-with-driver, contact-us, 3 legal pages.

### 3.1 `/` — Home (`src/app/page.tsx`)

Purpose: main landing page for shippers and carriers. Client component; no page-level metadata, inherits root title/description.

#### 1. MainHeading (hero)

- H3 (eyebrow): "Maximize Savings, Reduce Time, Automate Control"
- H2: "Every Shipment"
- Paragraph: "AllShipAI your AI-driven shipping ally, offering intuitive solutions for tracking and managing international shipments with precision and care. Dive in and ship smarter."
- Checkmarks: "Residential & Business", "Ship Anything to Anywhere"
- CTAs: "Become Shipper" (outlined, -> DASHBOARD_URL_SIGN_UP), "Become Carrier" (green, -> DASHBOARD_URL_SIGN_UP_CARRIER)
- Social proof: 5-star rating + "Used by 20k+ companies" (FABRICATED stat) with `src/assets/images/client-trusted.svg` (491 KB) and logo strip `src/assets/images/companies.svg` (61 KB)

#### 2. LoadCategories

- Load categories grid (see Shared sections > Load categories)

#### 3. HowItWorks — "How It Works"

- Video: `https://cdn.allship.ai/projectExample5demo.mp4` (autoplay, muted; local copy `src/assets/videos/projectExample5demo.mp4`, 3.4 MB)
- Steps (auto-rotating tabs):
  1. **Book & Ship** — Book exclusively with fully licensed carriers and benefit from 24/7 tracking and automation through our stress-free AI solution.
  2. **Chose & Enjoy** — Select the best option for your budget and schedule. Our AI-driven platform ensures you have the most competitive rates and reliable carriers at your fingertips.
  3. **Get Quotes** — Easily compare competitive quotes from fully licensed carriers. Choose the best option for your budget and schedule with confidence, all within a few clicks.

#### 4. BenefitWrapper

- "Why you need to prefer our AI" benefit cards (see Shared sections > BenefitWrapper)

#### 5. UniversalSection

- "Universal choose" roles section (see Shared sections > UniversalSection)

#### 6. ClientReviewContent

- "What Our Clients Say" testimonials (see Shared sections > ClientReviewContent)

#### 7. FullPageSlider

- H1: "Full Control Over Your Shipments"
- Text: "Take complete command of your logistics with AllShipAI. From real-time tracking to seamless communication with carriers, our platform gives you full visibility and control over every stage of your shipment process. Monitor your cargo’s location, manage schedules, and handle any changes with ease, ensuring that your shipments are always on track and on time."
- Images (12 slides, 3 unique repeated): `src/assets/images/sliderImage1.svg` (557 KB), `src/assets/images/landing-page-slide-2.svg` (1.8 MB), `src/assets/images/landing-page-slide-3.svg` (1.8 MB)

#### 8. FAQSection — "Frequently Asked Questions"

- Uses `src/utils/faq1.ts` (full Q&A in "FAQ sets" section: **faq1**)

**Images on this page (from page-level sections):**

- `src/assets/images/client-trusted.svg` (491 KB)
- `src/assets/images/companies.svg` (61 KB)
- `src/assets/images/sliderImage1.svg` (557 KB)
- `src/assets/images/landing-page-slide-2.svg` (1.8 MB)
- `src/assets/images/landing-page-slide-3.svg` (1.8 MB)


### 3.2 `/about` — About

Purpose: company story / mission. Wall of text, the first "About Us" block has a title only.

- Title: "About | AllShip AI"
- Description: "Learn about AllShip AI—our mission, team, and how we simplify moving, freight, and truck rental."
- Path (canonical): `/about`
- Keywords: about AllShip, company, mission, logistics platform (+ base keywords)

#### 1. Description block — "About Us"

#### 2. FullScreenImage

- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-4.webp` (remote, not in repo)

#### 3. Description block — "About AllShipAI"

> At AllShipAI, we are redefining the logistics and transportation industry with cutting-edge artificial intelligence and unparalleled service excellence. Our platform was created with a single mission: to empower shippers and carriers with efficient, transparent, and cost-effective solutions for all their logistics needs. AllShipAI is not just a platform—it's a transformative tool designed to optimize every aspect of freight transportation, from load matching to route planning and real-time tracking. By leveraging advanced AI algorithms, we help businesses save time, reduce costs, and improve decision-making in an increasingly complex and fast-paced logistics landscape. Whether you're a small business or a large enterprise, AllShipAI provides scalable solutions tailored to your unique requirements, ensuring that your logistics operations are always one step ahead of the competition.

**Our Vision**

At AllShipAI, we envision a world where logistics operations are seamless, intelligent, and environmentally friendly. Our goal is to become the global leader in AI-powered logistics, driving innovation and sustainability in the industry. By utilizing advanced data analytics and predictive algorithms, we aim to revolutionize the way goods are transported, making logistics smarter, greener, and more efficient.

**Core Values**

Transparency: We believe in open and honest communication with our partners and customers. Efficiency: Our platform is designed to streamline processes, reduce delays, and maximize operational efficiency. Innovation: At AllShipAI, we continuously innovate to bring you the most advanced AI-driven logistics solutions. Sustainability: We are committed to reducing the environmental impact of logistics by promoting optimized routes and fuel efficiency. Partnership: We value long-term relationships with our customers and partners, working together to achieve shared success.

**Why Choose AllShipAI?**

Advanced AI Technology: Our state-of-the-art algorithms analyze vast amounts of data to optimize shipping routes, improve load matching, and reduce costs. Comprehensive Support: We offer 24/7 customer support to assist with all your logistics needs, ensuring a smooth and efficient experience. Real-Time Insights: With our real-time tracking and performance analytics, you can monitor and improve every step of your logistics process. Scalable Solutions: Whether you're a small business or a global enterprise, our platform grows with your business needs, providing tailored solutions for every stage of your growth.

**Our Commitment to Sustainability**

At AllShipAI, we recognize the importance of sustainable logistics. By optimizing routes and consolidating shipments, we help reduce fuel consumption and carbon emissions. Our platform also provides tools to measure and report on your environmental impact, enabling businesses to adopt greener practices and contribute to a sustainable future.

**Join AllShipAI**

When you partner with AllShipAI, you're not just choosing a logistics platform—you're choosing innovation, efficiency, and excellence. Join thousands of businesses that trust us to optimize their logistics operations and drive success. Experience the future of logistics today with AllShipAI.

**How AllShipAI Stands Out**

Innovative Technology: Leveraging machine learning and predictive analytics, AllShipAI ensures that every shipment is matched with the best carrier and routed for maximum efficiency. Industry Expertise: With a deep understanding of the logistics landscape, we offer tools and features tailored to meet the evolving demands of the freight industry. Real-Time Adaptability: Our platform continuously adapts to changes in traffic, weather, and market conditions, ensuring optimal performance for your shipments. Unmatched Network: Access a vast network of reliable carriers and shippers, ensuring that you always have the resources to meet your business objectives.

**Driving Sustainability in Logistics**

AllShipAI is committed to reducing the carbon footprint of logistics operations. By consolidating shipments, optimizing routes, and minimizing fuel consumption, we empower businesses to adopt eco-friendly practices. Our platform provides sustainability analytics, enabling companies to track and report on their environmental impact while achieving operational excellence.

**Comprehensive Solutions for Every Business**

Flexible Integration: AllShipAI integrates seamlessly with your existing systems, including warehouse management, CRM, and e-commerce platforms, for a streamlined workflow. Scalable Features: Whether you manage a small fleet or oversee global shipping operations, our platform is designed to scale alongside your business. Advanced Reporting: Gain actionable insights into performance metrics, cost analysis, and market trends to make informed decisions and maintain a competitive edge.

**Partnering with AllShipAI**

When you choose AllShipAI, you're choosing a future where logistics is smarter, faster, and more sustainable. Join the thousands of businesses that trust us to optimize their freight operations and drive their success. With our cutting-edge technology and unwavering commitment to excellence, AllShipAI is the ultimate solution for modern logistics.

**Take Your Logistics to the Next Level**

Ready to revolutionize your logistics operations? Explore AllShipAI's AI-driven platform and experience the difference. Contact us today to learn more about how our solutions can transform your business and help you stay ahead in the competitive world of freight and logistics.

**Images on this page (from page-level sections):**

- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-4.webp` (remote, not in repo)


### 3.3 `/ai` — AI Tools

Purpose: explain the AI angle. Generic AI copy with no concrete product features.

- Title: "AI Tools | AllShip AI"
- Description: "AI-powered pricing, matching, and scheduling for moving and freight. Optimize your operations with AllShip AI."
- Path (canonical): `/ai`
- Keywords: AI logistics, AI pricing, smart matching, automation (+ base keywords)

#### 1. FullScreenImage

- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-7.webp` (remote, not in repo)

#### 2. Description block — "AI Revolutionizing Logistics"

> Experience the future of logistics with our AI-powered platform. AllShipAI optimizes shipping routes, reduces operational costs, and enhances delivery speed using cutting-edge artificial intelligence. Book a free demo today to see how our innovative solutions can streamline your supply chain, improve efficiency, and give your business a competitive edge in the ever-evolving logistics landscape.

#### 3. Description block — "AI Transforming the World"

> Artificial Intelligence (AI) is revolutionizing industries globally, driving unprecedented efficiency, accuracy, and innovation. From healthcare to finance, AI is reshaping how we live and work, fostering growth and creating new opportunities. AllShipAI is leveraging this transformative power to redefine logistics, making it smarter, faster, and more transparent. By integrating advanced machine learning algorithms, our AI solutions optimize route planning, automate warehousing operations, and predict demand fluctuations with precision. This not only enhances productivity but also significantly reduces operational costs, contributing to a sustainable and scalable logistics ecosystem.

**AI in Logistics: Enhancing Efficiency and Reliability**

In the logistics industry, where time and accuracy are critical, AI brings a level of precision and efficiency that was previously unattainable. AI-driven analytics provide deep insights into supply chain dynamics, enabling businesses to anticipate disruptions and adapt proactively. Our AI technology continuously learns and improves, ensuring that our logistics solutions remain cutting-edge and highly effective. By utilizing predictive analytics, we can forecast demand, manage inventory more efficiently, and optimize delivery routes to reduce delays and costs. This level of optimization leads to improved service quality and customer satisfaction, making logistics operations more reliable and efficient.

**Real-Time Tracking and Automation**

AllShipAI’s AI-driven platform offers real-time tracking and automation, providing our clients with up-to-the-minute information about their shipments. This transparency allows businesses to monitor their goods' progress, manage exceptions, and make informed decisions quickly. Automation of routine tasks such as documentation, invoicing, and communication reduces the administrative burden on businesses, freeing up valuable resources to focus on core activities. Our AI technology also enhances security by monitoring shipments for potential risks and anomalies, ensuring that goods are transported safely and securely.

**Sustainability and Scalability through AI**

Our commitment to sustainability is reinforced by our use of AI to minimize environmental impact. By optimizing routes and reducing fuel consumption, we help decrease the carbon footprint associated with logistics. AI also enables more efficient use of resources, reducing waste and promoting sustainable practices across the supply chain. Scalability is another significant advantage of AI; as your business grows, our AI solutions can adapt to increasing volumes and complexity without compromising efficiency. This scalability ensures that our logistics services can support your business's growth and evolving needs.

**Driving Innovation in Logistics with AI**

At AllShipAI, we are dedicated to driving innovation in logistics through the power of AI. Our continuous investment in research and development ensures that we stay ahead of industry trends and technological advancements. We collaborate with leading experts and institutions to refine our algorithms and develop new solutions that address emerging challenges in the logistics sector. Our innovative spirit is reflected in our commitment to providing our clients with the most advanced and effective logistics solutions available.

**Shaping the Future of Logistics**

As we continue to innovate, AllShipAI is committed to driving the future of logistics with AI at its core. Our vision is to create a more efficient, transparent, and sustainable logistics industry where businesses can thrive, and customers receive unparalleled service. By harnessing the power of AI, we are setting new standards for logistics operations, ensuring that our clients can navigate the complexities of global supply chains with confidence and ease. Join us on this journey and experience the transformative power of AI in logistics.

#### 4. BenefitWrapper

- "Why you need to prefer our AI" benefit cards (see Shared sections > BenefitWrapper)

#### 5. Description block — "AI Help in Logistics"

> AI helping in logistics by providing real-time insights, automating processes, and optimizing routes. AllShipAI's AI-powered platform is designed to meet the diverse needs of modern businesses, offering scalable solutions for enterprises and small businesses alike. Our AI technology reduces fuel consumption, automates warehouse operations, and optimizes routes for faster deliveries. Experience the future of logistics with AllShipAI.

#### 6. IntroductionContainer (image + text split, reversed)

- H1: "AI-Powered Logistics"
- Text: "AI is transforming the logistics industry, optimizing routes, reducing costs, and enhancing delivery speed. Experience the future of shipping with AllShipAI."
- CTA: "Get Started" (green button)
- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-8.webp` (remote, not in repo)

#### 7. FAQSection — "Frequently Asked Questions"

- Uses `src/utils/faq4.ts` (full Q&A in "FAQ sets" section: **faq4**)

**Images on this page (from page-level sections):**

- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-7.webp` (remote, not in repo)
- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-8.webp` (remote, not in repo)


### 3.4 `/all` — All Services

Purpose: catch-all "services" page. Despite the metadata, it lists no services, only two near-duplicate "core values" essays.

- Title: "All Services | AllShip AI"
- Description: "Explore all AllShip AI services: moving, freight loads, truck rental, and more."
- Path (canonical): `/all`
- Keywords: all services, moving services, freight services, rental (+ base keywords)

#### 1. FullScreenImage

- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-10.webp` (remote, not in repo)

#### 2. Description block — "Transforming Logistics with AI: AllShipAI's Vision"

> AllShipAI is revolutionizing the logistics industry by harnessing the transformative power of artificial intelligence (AI). Our mission is to redefine how businesses manage freight, streamline operations, and optimize shipping processes. With a vision of creating a seamless, efficient, and transparent logistics ecosystem, AllShipAI empowers shippers, carriers, and businesses to achieve unparalleled operational excellence. Through advanced AI algorithms, we enable precise route optimization, real-time shipment tracking, and data-driven decision-making, reducing costs and enhancing productivity. By fostering innovation, sustainability, and trust, AllShipAI is setting the standard for the future of smart logistics.

**Core Values of AllShipAI:**

- Innovation: Pioneering New AI Technologies
  AllShipAI is at the forefront of technological advancements in the logistics industry. By integrating cutting-edge artificial intelligence solutions, we are redefining how businesses manage freight and optimize their supply chains. Our innovative AI-driven tools include real-time shipment tracking, predictive analytics for demand forecasting, and automated route planning, all designed to minimize delays and maximize efficiency. With continuous research and development, AllShipAI leads the way in creating future-ready logistics solutions that drive progress and set new industry standards.
- Transparency: Building Trust with Clear Operations
  Transparency is the cornerstone of AllShipAI’s operations. Our platform provides shippers and carriers with real-time updates, detailed analytics, and comprehensive shipment tracking to ensure complete visibility throughout the logistics process. By offering clear and accurate data, we empower businesses to make informed decisions, enhance customer trust, and foster long-term partnerships. AllShipAI’s commitment to transparent practices eliminates hidden fees, minimizes risks, and ensures accountability at every step of the supply chain.
- Efficiency: Streamlining Logistics Processes
  Efficiency is essential for staying competitive in today’s fast-paced logistics environment. AllShipAI leverages AI-powered tools to streamline logistics workflows, from automated freight matching to intelligent warehouse management. Our solutions reduce manual effort, optimize resource allocation, and cut down operational costs, enabling businesses to achieve faster deliveries and improved productivity. By simplifying complex logistics processes, AllShipAI helps companies focus on growth and customer satisfaction while staying ahead of the competition.
- Sustainability: Reducing Environmental Impact
  AllShipAI is committed to promoting green logistics by adopting sustainable practices and technologies. Our AI systems optimize routes to reduce fuel consumption and lower carbon emissions, contributing to a cleaner and greener environment. Additionally, we encourage eco-friendly packaging and collaborate with partners who share our vision of sustainability. By integrating energy-efficient operations and minimizing waste, AllShipAI helps businesses achieve their sustainability goals while supporting global efforts to combat climate change.
- Customer Focus: Prioritizing Client Needs
  At AllShipAI, our clients are at the heart of everything we do. We tailor our logistics solutions to meet the unique needs of businesses, ensuring exceptional service and support. Our 24/7 customer service team is always available to address queries and provide assistance, ensuring a seamless experience. By prioritizing customer satisfaction, AllShipAI builds strong relationships and delivers unparalleled value. From small businesses to large enterprises, our platform is designed to cater to diverse logistics requirements, ensuring every client’s success.

#### 3. IntroductionContainer (image + text split, reversed)

- H1: "Start Shipping with AllShipAI"
- Text: "Experience the future of logistics with AllShipAI, where AI-driven solutions transform shipping operations and optimize supply chain management. Join us in shaping the future of smart logistics."
- CTA: "Get Started" (green button)
- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-2.webp` (remote, not in repo)

#### 4. BenefitWrapper

- "Why you need to prefer our AI" benefit cards (see Shared sections > BenefitWrapper)

#### 5. Description block — "Redefining Logistics with AI: AllShipAI's Perspective"

> AllShipAI is reshaping the logistics landscape by utilizing the innovative capabilities of artificial intelligence (AI). Our goal is to revolutionize how companies handle freight, enhance operational efficiency, and optimize their shipping workflows. AllShipAI strives to build a connected, efficient, and transparent logistics network, empowering shippers, carriers, and businesses to achieve superior performance. Leveraging advanced AI models, we ensure accurate route planning, live shipment tracking, and informed decision-making, which lower costs and improve productivity. By embracing innovation, eco-friendly practices, and trust, AllShipAI paves the way for smarter logistics solutions.

**Key Principles of AllShipAI:**

- Innovation: Leading the Charge with AI Advancements
  AllShipAI spearheads technological progress in logistics by integrating advanced AI solutions. Our platform redefines freight management and supply chain optimization, offering innovative tools like live shipment tracking, predictive analytics for forecasting demand, and automated route optimization. Through continuous R&D, AllShipAI creates next-gen logistics solutions that set new benchmarks for the industry.
- Transparency: Cultivating Confidence with Clarity
  Clarity and openness define AllShipAI’s approach. Our system provides shippers and carriers with real-time data, in-depth analytics, and complete shipment tracking for unparalleled visibility. By delivering precise information, we help businesses make smarter decisions, build customer confidence, and foster lasting partnerships. Our transparent operations eliminate unexpected costs, reduce risks, and maintain accountability throughout the supply chain.
- Efficiency: Enhancing Workflow Optimization
  Efficiency is critical in today’s dynamic logistics world. AllShipAI employs AI-driven tools to simplify logistics processes, from automated freight coordination to smart warehouse management. Our solutions decrease manual workload, optimize resource use, and lower operational expenses, ensuring quicker deliveries and higher productivity. By addressing logistical complexities, AllShipAI empowers companies to focus on growth and client satisfaction, staying ahead in a competitive market.
- Sustainability: Championing Green Logistics
  AllShipAI prioritizes sustainability by implementing eco-friendly strategies and technologies. Our AI optimizes routes to cut fuel usage and reduce carbon emissions, contributing to a healthier environment. We promote the adoption of sustainable packaging and collaborate with like-minded partners to foster green logistics. By integrating energy-efficient practices and minimizing waste, AllShipAI supports global sustainability efforts and helps businesses meet their eco-goals.
- Customer Focus: Delivering Tailored Solutions
  At AllShipAI, our clients are central to our mission. We design logistics solutions to fit the distinct needs of every business, ensuring exceptional service and dedicated support. Our 24/7 support team is available to address concerns and provide assistance for a seamless experience. By putting customer satisfaction first, AllShipAI fosters long-term relationships and delivers outstanding value. Our platform caters to the diverse logistics needs of businesses, from startups to large enterprises, guaranteeing their success.

#### 6. IntroductionContainer (image + text split)

- H1: "Begin Your Journey with AllShipAI"
- Text: "Discover the next generation of logistics with AllShipAI. Our AI-powered solutions revolutionize shipping operations and enhance supply chain management. Be a part of the future of intelligent logistics."
- CTA: "Get Started" (green button)
- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-7.webp` (remote, not in repo)

#### 7. BenefitWrapper

- "Why you need to prefer our AI" benefit cards (see Shared sections > BenefitWrapper)

#### 8. FAQSection — "Frequently Asked Questions"

- Uses `src/utils/faq4.ts` (full Q&A in "FAQ sets" section: **faq4**)

**Images on this page (from page-level sections):**

- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-10.webp` (remote, not in repo)
- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-2.webp` (remote, not in repo)
- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-7.webp` (remote, not in repo)


### 3.5 `/ship` — Shipping

Purpose: shipper-facing benefits. Three near-identical "Why Shipping with AllShipAI..." blocks. No `PageWrapper`. "openship.ai" brand leftover in copy **[FLAG]**.

- Title: "Shipping | AllShip AI"
- Description: "Book reliable shipping for parcels, pallets, and full truckloads with live tracking."
- Path (canonical): `/ship`
- Keywords: shipping, delivery, FTL, LTL, tracking (+ base keywords)

#### 1. FullScreenImage

- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-9.webp` (remote, not in repo)

#### 2. Description block — "Why Shipping with AllShipAI is the Best Choice"

> AllShipAI takes shipping to the next level by combining state-of-the-art AI technology with a commitment to transparency, reliability, and cost-effectiveness. Our platform ensures seamless shipping operations for businesses of all sizes.
>
> Artificial Intelligence is transforming the logistics industry. Discover how AI enhances the efficiency and sustainability of shipping.

**Optimized Shipping for Every Need**

AI enables smarter decision-making, automates time-consuming processes, and ensures sustainable practices in shipping operations. Our shipping solutions are designed to meet the diverse requirements of modern businesses:

- Real-time tracking for complete shipment visibility.
- AI-driven route optimization for faster deliveries.
- Scalable solutions for small businesses and enterprises alike.
- Reduces fuel consumption through optimized routes.
- Automates warehouse operations for faster order fulfillment.

**Commitment to Sustainability**

At AllShipAI, we prioritize sustainability in our shipping processes to minimize environmental impact:

- Green logistics solutions powered by AI.
- Reduced carbon footprint with optimized routes.
- Commitment to eco-friendly packaging and practices.

#### 3. IntroductionContainer (image + text split, reversed)

- H1: "Start easy shipping"
- Text: "Discover simplicity with openship.ai, where seamless global logistics is at your fingertips. Start using modern transportation methods today."
- CTA: "Get Started" (green button)
- Image: `src/assets/images/easy-shipping-illustration.svg` (1.6 MB)

#### 4. Description block — "Why Shipping with AllShipAI is the Ultimate Choice"

> AllShipAI revolutionizes shipping by integrating cutting-edge AI technology with a strong commitment to transparency, reliability, and cost-effectiveness. Our platform ensures seamless and efficient shipping operations for businesses of all sizes.

**Optimized Shipping Solutions for Every Business Need**

Our advanced shipping solutions are meticulously designed to meet the diverse requirements of modern businesses, ensuring efficiency and reliability:

- Real-time tracking for complete shipment visibility, providing up-to-the-minute updates on your cargo's location and status.
- AI-driven route optimization for faster deliveries, reducing transit times and enhancing customer satisfaction.
- Scalable solutions for small businesses and large enterprises alike, offering flexibility and adaptability to your growing needs.

**Cost-Effective and Transparent Pricing**

AllShipAI provides competitive and transparent pricing, eliminating hidden costs to maximize your shipping budget and ensure financial efficiency:

1. Clear pricing structure tailored to your specific needs, providing detailed cost breakdowns and avoiding unexpected charges.
2. Flexible plans for varying shipment volumes, accommodating both high and low shipping demands with ease.
3. Advanced analytics to optimize cost-efficiency, leveraging data insights to reduce expenses and improve operational performance.

**Commitment to Sustainability**

At AllShipAI, we prioritize sustainability in our shipping processes to minimize environmental impact and promote eco-friendly practices:

- Green logistics solutions powered by AI, enhancing efficiency while reducing carbon emissions and resource consumption.
- Reduced carbon footprint with optimized routes, ensuring minimal environmental impact through intelligent route planning.
- Commitment to eco-friendly packaging and practices, supporting sustainable materials and reducing waste in the supply chain.

#### 5. IntroductionContainer (image + text split)

- H1: "Transparent Pricing"
- Text: "Access immediate, transparent quotes from a wide array of international carriers. openship.ai ensures cost-effective solutions with no hidden fees."
- CTA: "Get Started" (green button)
- Image: `src/assets/images/transparent-pricing.svg` (1.6 MB)

#### 6. Description block — "Why Shipping with AllShipAI is the Best Choice"

> AllShipAI takes shipping to the next level by combining state-of-the-art AI technology with a commitment to transparency, reliability, and cost-effectiveness. Our platform ensures seamless shipping operations for businesses of all sizes.

**Optimized Shipping for Every Need**

Our shipping solutions are designed to meet the diverse requirements of modern businesses:

- Real-time tracking for complete shipment visibility.
- AI-driven route optimization for faster deliveries.
- Scalable solutions for small businesses and enterprises alike.

**Cost-Effective and Transparent Pricing**

AllShipAI offers competitive and transparent pricing, eliminating hidden costs to maximize your shipping budget:

1. Clear pricing structure tailored to your needs.
2. Flexible plans for varying shipment volumes.
3. Advanced analytics to optimize cost-efficiency.

**Commitment to Sustainability**

At AllShipAI, we prioritize sustainability in our shipping processes to minimize environmental impact:

- Green logistics solutions powered by AI.
- Reduced carbon footprint with optimized routes.
- Commitment to eco-friendly packaging and practices.

#### 7. IntroductionContainer (image + text split)

- H1: "Start easy shipping"
- Text: "Discover simplicity with openship.ai, where seamless global logistics is at your fingertips. Start using modern transportation methods today."
- CTA: "Get Started" (green button)
- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-5.webp` (remote, not in repo)

#### 8. FAQSection — "Frequently Asked Questions"

- Uses `src/utils/faq2.ts` (full Q&A in "FAQ sets" section: **faq2**)

**Images on this page (from page-level sections):**

- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-9.webp` (remote, not in repo)
- `src/assets/images/easy-shipping-illustration.svg` (1.6 MB)
- `src/assets/images/transparent-pricing.svg` (1.6 MB)
- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-5.webp` (remote, not in repo)


### 3.6 `/safety` — Safety & Compliance

Purpose: trust/compliance page. Introduces a "SEYFER" security system (unexplained brand name **[FLAG]**). First description block is duplicated verbatim. Mentions "openship.ai" **[FLAG]**.

- Title: "Safety & Compliance | AllShip AI"
- Description: "Carrier vetting, insurance verification, and safety standards at AllShip AI."
- Path (canonical): `/safety`
- Keywords: safety, compliance, insurance, vetting (+ base keywords)

#### 1. Description block — "Safety and Compliance"

> At AllShipAI, safety is our top priority. Our SEYFER system ensures that all transactions and shipments are secure, giving you peace of mind throughout the logistics process. SEYFER employs advanced encryption and security protocols to protect your sensitive information and financial transactions. With real-time monitoring and automated alerts, we can quickly identify and address any potential security threats, ensuring your shipments are safe from start to finish.

#### 2. FullScreenImage

- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-3.webp` (remote, not in repo)

#### 3. BenefitWrapper

- "Why you need to prefer our AI" benefit cards (see Shared sections > BenefitWrapper)

#### 4. Description block — "Safety and Compliance"

> At AllShipAI, safety is our top priority. Our SEYFER system ensures that all transactions and shipments are secure, giving you peace of mind throughout the logistics process. SEYFER employs advanced encryption and security protocols to protect your sensitive information and financial transactions. With real-time monitoring and automated alerts, we can quickly identify and address any potential security threats, ensuring your shipments are safe from start to finish.

**Compliance with FMCSA Regulations**

We adhere to the strict guidelines set by the Federal Motor Carrier Safety Administration (FMCSA) to ensure the highest standards of safety and compliance. All our carriers are fully licensed and meet or exceed FMCSA requirements, including regular safety audits and inspections. By partnering with carriers who comply with FMCSA regulations, we ensure that your goods are transported by professionals committed to safety and reliability.

**Comprehensive Insurance Coverage**

AllShipAI takes the worry out of shipping by providing comprehensive insurance coverage for all shipments. We work with top-rated insurance providers to offer coverage that protects your cargo against loss, damage, and theft. Our insurance policies are tailored to meet the specific needs of each shipment, ensuring that you have the right level of protection. In the unlikely event of an incident, our dedicated support team will assist you in navigating the claims process quickly and efficiently.

**Licensed and Insured Carriers**

Every carrier in our network is thoroughly vetted to ensure they are fully licensed and insured. This rigorous selection process includes verifying carrier credentials, reviewing safety records, and assessing overall performance. By working only with carriers who meet our strict criteria, we guarantee that your shipments are handled by reliable and professional operators. Our commitment to using licensed and insured carriers not only enhances safety but also fosters trust and confidence in our services.

**Ongoing Safety Training and Education**

To maintain the highest standards of safety, we provide ongoing training and education for our carriers. This includes regular updates on industry best practices, safety protocols, and regulatory changes. By staying informed and prepared, our carriers can deliver superior service while minimizing risks. Our focus on continuous improvement ensures that safety remains a core value in every aspect of our operations.

**Peace of Mind with AllShipAI**

At AllShipAI, we understand the importance of trust and security in the logistics industry. Our comprehensive approach to safety—through SEYFER, compliance with FMCSA regulations, comprehensive insurance, and stringent carrier vetting—ensures that your shipments are in good hands. With 24/7 support and real-time tracking, you can monitor your cargo’s journey and rest assured that it is being handled with the utmost care and professionalism.

#### 5. IntroductionContainer (image + text split)

- H1: "Start easy shipping"
- Text: "Discover simplicity with openship.ai, where seamless global logistics is at your fingertips. Start using modern transportation methods today."
- CTA: "Get Started" (green button)
- Image: `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-2.webp` (remote, not in repo)

#### 6. FAQSection — "Frequently Asked Questions"

- Uses `src/utils/faq5.ts` (full Q&A in "FAQ sets" section: **faq5**)

**Images on this page (from page-level sections):**

- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-3.webp` (remote, not in repo)
- `$NEXT_PUBLIC_IMAGE_URL_PUBLIC/openshipai-img-2.webp` (remote, not in repo)


### 3.7 `/partners` — Partners (carrier dispatch service)

Purpose: carrier acquisition. Real business fact: **dispatch service at 5.5%**, quick pay and factoring mentioned. Second half duplicates the first with light rewording.

- Title: "Partners | AllShip AI"
- Description: "Technology and service partnerships. Integrate with AllShip AI to grow your logistics business."
- Path (canonical): `/partners`
- Keywords: partners, integrations, API, affiliates (+ base keywords)

#### 1. MainHeading (hero)

- H3 (eyebrow): "Enhance Efficiency, Maximize Profits, Ensure Compliance"
- H2: "Partner with AllShipAI"
- Paragraph: "AllShipAI offers a comprehensive dispatch service for carriers, leveraging advanced AI technology to optimize load matching, reduce deadhead miles, and increase profitability. Join us and transform your shipping operations."
- Checkmarks: "Trusted by Carriers", "Seamless Integration"
- CTAs: "Become Shipper" (outlined, -> DASHBOARD_URL_SIGN_UP), "Become Carrier" (green, -> DASHBOARD_URL_SIGN_UP_CARRIER)
- Social proof: 5-star rating + "Used by 20k+ companies" (FABRICATED stat) with `src/assets/images/client-trusted.svg` (491 KB) and logo strip `src/assets/images/companies.svg` (61 KB)

#### 2. Description block — "Partners"

> At AllShipAI, we offer a streamlined dispatch service for carriers at a competitive rate of just 5.5%. This service is designed to maximize your efficiency and profitability by leveraging our advanced AI technology and extensive network. With our dispatch service, you benefit from optimized load matching, reduced deadhead miles, and increased load acceptance rates. Our intuitive platform simplifies the process of finding and securing loads, allowing you to focus on what you do best—delivering exceptional service.

**Why AllShipAI is the Best Solution for Carriers**

Advanced AI Technology: Our AI-driven platform uses machine learning algorithms to match carriers with the most suitable loads, ensuring high efficiency and maximizing earnings. By analyzing historical data and real-time market conditions, we provide you with the best opportunities available. Comprehensive Support: We offer 24/7 support to assist you with any issues or questions. Our dedicated team is always available to help you navigate our platform, manage shipments, and optimize your operations. Real-Time Tracking and Transparency: Our platform provides real-time tracking and status updates, giving you full visibility of your shipments. This transparency helps build trust with shippers and enhances your reputation as a reliable carrier. Competitive Rates and Flexible Payments: Our competitive dispatch rate of 5.5% ensures you get the best value for your money. We also offer flexible payment options, including quick pay and factoring services, to help you maintain a steady cash flow.

**Legal and Insurance Safety Requirements**

AllShipAI is committed to maintaining the highest standards of safety and compliance. All our carriers must meet strict legal and insurance requirements to join our network: FMCSA Compliance: Every carrier must comply with the Federal Motor Carrier Safety Administration (FMCSA) regulations. This includes maintaining up-to-date operating authority, safety ratings, and compliance with Hours of Service (HOS) regulations. Comprehensive Insurance Coverage: Carriers must have active insurance policies that meet or exceed industry standards. This includes liability insurance, cargo insurance, and any additional coverage required for specific types of freight. Our platform verifies insurance details to ensure every load is protected. Vetted and Verified Carriers: We conduct thorough background checks and safety audits on all carriers in our network. This vetting process includes reviewing safety records, insurance policies, and compliance with regulatory requirements. Only carriers that meet our stringent criteria are allowed to operate under AllShipAI.

**Enhancing Your Operations with AllShipAI**

Partnering with AllShipAI means you benefit from our industry-leading technology, comprehensive support, and commitment to safety and compliance. Our platform is designed to enhance your operations, reduce administrative burdens, and increase profitability. Here’s how we do it: Optimized Load Matching: Our AI algorithms analyze multiple data points to match you with the best loads, reducing empty miles and increasing your load acceptance rate. Efficient Route Planning: With our route optimization tools, you can plan the most efficient paths, saving time and fuel costs. This not only improves your bottom line but also contributes to a more sustainable operation. Seamless Communication: Our platform facilitates seamless communication between carriers and shippers, ensuring that all parties are informed and updated throughout the shipping process. Access to a Large Network: As part of the AllShipAI network, you gain access to a vast pool of shippers and freight opportunities. This extensive network ensures that you always have access to the best loads available.

**Join AllShipAI Today**

If you’re a carrier looking for a reliable, efficient, and profitable solution, look no further than AllShipAI. Our 5.5% dispatch service, advanced technology, and unwavering commitment to safety and compliance make us the best choice for your logistics needs. Join us today and experience the benefits of partnering with an industry leader.

#### 3. BenefitWrapper

- "Why you need to prefer our AI" benefit cards (see Shared sections > BenefitWrapper)

#### 4. UniversalSection

- "Universal choose" roles section (see Shared sections > UniversalSection)

#### 5. FAQSection — "Frequently Asked Questions"

- Uses `src/utils/faq4.ts` (full Q&A in "FAQ sets" section: **faq4**)

#### 6. Description block — "Partnership"

> At AllShipAI, we provide an efficient dispatch service for carriers at a competitive rate of just 5.5%. This service is designed to enhance your efficiency and profitability by utilizing our advanced AI technology and extensive network. With our dispatch service, you benefit from optimized load matching, reduced empty miles, and increased load acceptance rates. Our user-friendly platform simplifies the process of finding and securing loads, allowing you to focus on delivering exceptional service.

**Why AllShipAI is the Ideal Solution for Carriers**

Cutting-Edge AI Technology: Our AI-powered platform uses machine learning algorithms to match carriers with the most suitable loads, ensuring high efficiency and maximizing earnings. By analyzing historical data and real-time market conditions, we provide you with the best opportunities available. Comprehensive Support: We offer 24/7 support to assist you with any issues or questions. Our dedicated team is always available to help you navigate our platform, manage shipments, and optimize your operations. Real-Time Tracking and Transparency: Our platform provides real-time tracking and status updates, giving you full visibility of your shipments. This transparency helps build trust with shippers and enhances your reputation as a reliable carrier. Competitive Rates and Flexible Payments: Our competitive dispatch rate of 5.5% ensures you get the best value for your money. We also offer flexible payment options, including quick pay and factoring services, to help you maintain a steady cash flow.

**Legal and Insurance Compliance**

AllShipAI is committed to maintaining the highest standards of safety and compliance. All our carriers must meet strict legal and insurance requirements to join our network: FMCSA Compliance: Every carrier must comply with the Federal Motor Carrier Safety Administration (FMCSA) regulations. This includes maintaining up-to-date operating authority, safety ratings, and compliance with Hours of Service (HOS) regulations. Comprehensive Insurance Coverage: Carriers must have active insurance policies that meet or exceed industry standards. This includes liability insurance, cargo insurance, and any additional coverage required for specific types of freight. Our platform verifies insurance details to ensure every load is protected. Vetted and Verified Carriers: We conduct thorough background checks and safety audits on all carriers in our network. This vetting process includes reviewing safety records, insurance policies, and compliance with regulatory requirements. Only carriers that meet our stringent criteria are allowed to operate under AllShipAI.

**Improving Your Operations with AllShipAI**

Partnering with AllShipAI means you benefit from our industry-leading technology, comprehensive support, and commitment to safety and compliance. Our platform is designed to enhance your operations, reduce administrative burdens, and increase profitability. Here’s how we do it: Optimized Load Matching: Our AI algorithms analyze multiple data points to match you with the best loads, reducing empty miles and increasing your load acceptance rate. Efficient Route Planning: With our route optimization tools, you can plan the most efficient paths, saving time and fuel costs. This not only improves your bottom line but also contributes to a more sustainable operation. Seamless Communication: Our platform facilitates seamless communication between carriers and shippers, ensuring that all parties are informed and updated throughout the shipping process. Access to a Large Network: As part of the AllShipAI network, you gain access to a vast pool of shippers and freight opportunities. This extensive network ensures that you always have access to the best loads available.

**Join AllShipAI Today**

If you’re a carrier looking for a reliable, efficient, and profitable solution, look no further than AllShipAI. Our 5.5% dispatch service, advanced technology, and unwavering commitment to safety and compliance make us the best choice for your logistics needs. Join us today and experience the benefits of partnering with an industry leader.

**Partner Advantages**

As an AllShipAI partner, you gain access to exclusive benefits that enhance your operations and profitability. Our platform offers advanced analytics, real-time market insights, and dedicated support to help you stay ahead of the competition. Partner with us and leverage our technology to drive your business forward.

**Images on this page (from page-level sections):**

- `src/assets/images/client-trusted.svg` (491 KB)
- `src/assets/images/companies.svg` (61 KB)


### 3.8 `/pricing` — "Pricing Directs"

Purpose: supposed pricing page, but contains **no prices**, just a generic essay on AI dynamic pricing. Footer link label "Pricing Directs" **[TYPO/awkward]**. Real price points live in the unused TariffSection (section 7) and on /truck-with-driver.

- Title: "Pricing | AllShip AI"
- Description: "Transparent pricing for moving, freight, and truck rental. No hidden fees."
- Path (canonical): `/pricing`
- Keywords: moving prices, freight rates, truck rental cost, pricing (+ base keywords)

#### 1. Description block — "Pricing Directs"

> AI is revolutionizing pricing strategies in transportation by offering real-time insights, dynamic pricing adjustments, and data-driven optimizations. This ensures cost-effectiveness, market competitiveness, and improved profitability for all stakeholders.

**1. Dynamic Pricing Models**

Dynamic pricing is a cornerstone of modern logistics. AI-powered systems enable rates to adjust in real-time based on a variety of factors, including:

- Market Demand: AI monitors fluctuations in demand to increase or decrease prices accordingly, ensuring balance between availability and profitability.
- Supply Levels: By analyzing the supply of carriers and available trucks, AI recommends competitive yet sustainable rates.
- Historical Trends: Leveraging data on seasonal patterns and historical shipments, AI predicts optimal pricing structures.
- Route-Specific Variables: Pricing adjustments based on specific routes, including tolls, fuel costs, and weather conditions.

**2. Cost Optimization**

AI plays a pivotal role in reducing costs across logistics operations. Key benefits include:

- Fuel Efficiency: AI suggests the most fuel-efficient routes, significantly cutting transportation costs.
- Load Maximization: Algorithms optimize load distribution to ensure maximum vehicle utilization, reducing the number of trips.
- Overhead Reduction: Automated processes minimize the need for manual intervention, lowering administrative expenses.
- Idle Time Analysis: AI tracks and reduces idle time during loading, unloading, and transit, improving overall efficiency.

**3. Competitive Analysis**

Staying competitive requires deep insights into market trends. AI provides tools to analyze competitor strategies effectively. These include:

- Competitor Pricing: Continuous monitoring of competitor rates allows for strategic pricing decisions.
- Market Positioning: AI helps identify gaps in the market where competitive advantages can be leveraged.
- Service Differentiation: By analyzing competitor offerings, AI highlights areas for value addition to attract more clients.
- Customer Preferences: Insights into customer behaviors and preferences enable businesses to offer tailored pricing options.

**4. Real-Time Adjustments**

AI-driven pricing systems adapt instantly to changing conditions, providing:

- Immediate Reactions to External Factors: Sudden changes like fuel price hikes or road closures are accounted for instantly.
- Customer-Specific Pricing: Personalized rates based on the client's history, loyalty, and requirements.
- Dynamic Promotions: AI identifies opportunities for discounts or incentives during low-demand periods.

**5. Transparency in Pricing**

Transparent pricing builds trust with clients. AI enables this by providing:

- Breakdown of Costs: Detailed insights into how pricing is calculated, including fuel, tolls, and service fees.
- Predictable Rates: Clients can anticipate costs through AI-driven forecasts.
- Accessible Dashboards: Real-time pricing information available through user-friendly interfaces.

**6. Revenue Management**

AI enhances revenue generation through intelligent pricing strategies, which include:

- Yield Management: Maximizing revenue by adjusting rates based on shipment timing and urgency.
- Profitability Forecasts: Predicting revenue outcomes for different pricing scenarios.
- Upselling Opportunities: Identifying clients who may benefit from premium services or add-ons.

**7. Sustainability Benefits**

AI-powered pricing contributes to sustainable practices by:

- Reducing Empty Miles: Optimizing shipment consolidation reduces unnecessary trips.
- Encouraging Green Options: Incentivizing clients to choose eco-friendly delivery methods.
- Minimizing Resource Wastage: Ensuring optimal vehicle utilization and reduced emissions.

**8. Client Retention Strategies**

AI pricing enhances customer loyalty through:

- Consistent Value: Ensuring fair and competitive pricing at all times.
- Customized Offers: Personalized deals based on client preferences and past interactions.
- Proactive Communication: Keeping clients informed about pricing changes and the reasons behind them.

**9. Scalability**

AI pricing systems are designed to scale with your business, providing:

- Handling Increased Volume: Efficiently managing more shipments as demand grows.
- Global Adaptability: Supporting pricing strategies across multiple regions and currencies.
- Future-Proof Solutions: Adapting to evolving market conditions and client expectations.


### 3.9 `/why-choose-us` — Why Choose Us

Purpose: should be differentiators. **[FLAG]** The page is titled "Project Management" and its body is a word-for-word copy of /pricing (same 9 sections).

- Title: "Why Choose Us | AllShip AI"
- Description: "Faster bookings, vetted carriers, AI pricing, and transparent support—why customers choose AllShip AI."
- Path (canonical): `/why-choose-us`
- Keywords: why choose us, benefits, features, value (+ base keywords)

#### 1. Description block — "Project Management"

> AI is revolutionizing pricing strategies in transportation by offering real-time insights, dynamic pricing adjustments, and data-driven optimizations. This ensures cost-effectiveness, market competitiveness, and improved profitability for all stakeholders.

**1. Dynamic Pricing Models**

Dynamic pricing is a cornerstone of modern logistics. AI-powered systems enable rates to adjust in real-time based on a variety of factors, including:

- Market Demand: AI monitors fluctuations in demand to increase or decrease prices accordingly, ensuring balance between availability and profitability.
- Supply Levels: By analyzing the supply of carriers and available trucks, AI recommends competitive yet sustainable rates.
- Historical Trends: Leveraging data on seasonal patterns and historical shipments, AI predicts optimal pricing structures.
- Route-Specific Variables: Pricing adjustments based on specific routes, including tolls, fuel costs, and weather conditions.

**2. Cost Optimization**

AI plays a pivotal role in reducing costs across logistics operations. Key benefits include:

- Fuel Efficiency: AI suggests the most fuel-efficient routes, significantly cutting transportation costs.
- Load Maximization: Algorithms optimize load distribution to ensure maximum vehicle utilization, reducing the number of trips.
- Overhead Reduction: Automated processes minimize the need for manual intervention, lowering administrative expenses.
- Idle Time Analysis: AI tracks and reduces idle time during loading, unloading, and transit, improving overall efficiency.

**3. Competitive Analysis**

Staying competitive requires deep insights into market trends. AI provides tools to analyze competitor strategies effectively. These include:

- Competitor Pricing: Continuous monitoring of competitor rates allows for strategic pricing decisions.
- Market Positioning: AI helps identify gaps in the market where competitive advantages can be leveraged.
- Service Differentiation: By analyzing competitor offerings, AI highlights areas for value addition to attract more clients.
- Customer Preferences: Insights into customer behaviors and preferences enable businesses to offer tailored pricing options.

**4. Real-Time Adjustments**

AI-driven pricing systems adapt instantly to changing conditions, providing:

- Immediate Reactions to External Factors: Sudden changes like fuel price hikes or road closures are accounted for instantly.
- Customer-Specific Pricing: Personalized rates based on the client's history, loyalty, and requirements.
- Dynamic Promotions: AI identifies opportunities for discounts or incentives during low-demand periods.

**5. Transparency in Pricing**

Transparent pricing builds trust with clients. AI enables this by providing:

- Breakdown of Costs: Detailed insights into how pricing is calculated, including fuel, tolls, and service fees.
- Predictable Rates: Clients can anticipate costs through AI-driven forecasts.
- Accessible Dashboards: Real-time pricing information available through user-friendly interfaces.

**6. Revenue Management**

AI enhances revenue generation through intelligent pricing strategies, which include:

- Yield Management: Maximizing revenue by adjusting rates based on shipment timing and urgency.
- Profitability Forecasts: Predicting revenue outcomes for different pricing scenarios.
- Upselling Opportunities: Identifying clients who may benefit from premium services or add-ons.

**7. Sustainability Benefits**

AI-powered pricing contributes to sustainable practices by:

- Reducing Empty Miles: Optimizing shipment consolidation reduces unnecessary trips.
- Encouraging Green Options: Incentivizing clients to choose eco-friendly delivery methods.
- Minimizing Resource Wastage: Ensuring optimal vehicle utilization and reduced emissions.

**8. Client Retention Strategies**

AI pricing enhances customer loyalty through:

- Consistent Value: Ensuring fair and competitive pricing at all times.
- Customized Offers: Personalized deals based on client preferences and past interactions.
- Proactive Communication: Keeping clients informed about pricing changes and the reasons behind them.

**9. Scalability**

AI pricing systems are designed to scale with your business, providing:

- Handling Increased Volume: Efficiently managing more shipments as demand grows.
- Global Adaptability: Supporting pricing strategies across multiple regions and currencies.
- Future-Proof Solutions: Adapting to evolving market conditions and client expectations.


### 3.10 `/time-schedule` — Time Schedule

Purpose: SEO filler essay on AI scheduling.

- Title: "Time Schedule | AllShip AI"
- Description: "Plan pickups and deliveries. Real-time scheduling for moving, freight, and rentals."
- Path (canonical): `/time-schedule`
- Keywords: schedule, pickup time, delivery window, availability (+ base keywords)

#### 1. Description block — "Time Schedule"

> AI is revolutionizing time scheduling in transportation by leveraging advanced technologies like real-time updates, predictive analytics, and automated processes. These innovations ensure smoother operations, reduced costs, and greater customer satisfaction.

**1. Real-Time Updates**

AI-driven systems provide instant updates on shipment statuses and transit conditions. These real-time updates empower businesses to:

- Adapt to unexpected delays by dynamically adjusting schedules.
- Improve communication with customers through accurate delivery estimates.
- Enhance coordination among logistics teams for optimal efficiency.

**2. Predictive Analytics**

Predictive analytics utilize historical data and machine learning algorithms to forecast potential disruptions. Key benefits include:

- Identifying high-risk routes or times for shipments.
- Providing alternative plans to minimize downtime.
- Optimizing resource allocation to meet delivery demands.

**3. Automated Scheduling**

Automation streamlines the scheduling process, reducing human intervention and increasing precision. Key advantages are:

- Minimizing manual errors that lead to costly delays.
- Freeing up staff for higher-value tasks.
- Ensuring schedules are aligned with real-world conditions.

**4. Enhanced Customer Satisfaction**

AI-powered scheduling creates better customer experiences by:

- Delivering goods on time with greater accuracy.
- Providing transparency through tracking and notifications.
- Improving service reliability and reducing complaints.

**5. Cost Optimization**

AI helps reduce operational costs by:

- Lowering fuel consumption through route optimization.
- Reducing unnecessary stops and idle time.
- Avoiding penalties for missed deadlines or delays.

**6. Fleet Management Integration**

Seamless integration with fleet management systems allows for:

- Tracking vehicle performance and maintenance needs.
- Assigning tasks to the most suitable vehicles.
- Balancing workloads to prevent overuse of assets.

**7. Adaptive Scheduling**

AI adapts to changing conditions in real-time by:

- Incorporating weather forecasts to avoid delays.
- Adjusting for traffic congestion and road closures.
- Reprioritizing tasks to ensure critical deliveries are on time.

**8. Data-Driven Decision Making**

AI scheduling leverages data to support strategic decisions, such as:

- Determining peak operation times for maximum efficiency.
- Forecasting demand to prepare resources in advance.
- Analyzing historical trends for continual improvement.

**9. Sustainability Benefits**

AI-powered scheduling contributes to eco-friendly logistics by:

- Reducing emissions through optimal routing.
- Minimizing fuel usage and wasteful practices.
- Encouraging greener transportation solutions.

**10. Scalability for Growing Businesses**

As businesses expand, AI scheduling supports scalability by:

- Managing increased shipment volumes without added complexity.
- Providing tools to handle diverse and global logistics needs.
- Adapting to growing customer bases with seamless efficiency.


### 3.11 `/lead-generate` — Lead Generation

Purpose: SEO filler essay on AI lead generation. Title "Lead Generate" **[TYPO]**.

- Title: "Lead Generation | AllShip AI"
- Description: "Generate high-intent moving and freight leads for carriers and partners with AllShip AI."
- Path (canonical): `/lead-generate`
- Keywords: lead generation, carriers, movers, logistics leads (+ base keywords)

#### 1. Description block — "Lead Generate"

> AI is enhancing lead generation in transportation by leveraging advanced tools and analytics to identify potential clients, optimize marketing strategies, and drive measurable results.

**1. Identifying Potential Clients**

AI analyzes massive datasets to pinpoint high-potential leads who are most likely to benefit from transportation services. By using predictive modeling, AI helps prioritize outreach efforts to maximize conversion rates.

**2. Market Trends Analysis**

Through advanced market analysis, AI provides actionable insights into emerging customer needs and preferences. These trends help businesses tailor their services and messaging for greater impact.

**3. Optimizing Marketing Strategies**

AI-driven marketing optimizations focus on analyzing past campaign performance, identifying strengths and weaknesses, and suggesting actionable improvements to ensure maximum ROI.

**4. Predictive Lead Scoring**

AI assigns predictive scores to leads based on their likelihood of conversion. This allows sales teams to focus on high-value opportunities and improve overall efficiency.

**5. Personalized Outreach**

Using AI, businesses can create personalized marketing messages and campaigns tailored to individual preferences and behaviors, leading to higher engagement and better customer experiences.

**6. Automation of Lead Nurturing**

AI automates repetitive tasks like follow-up emails and reminders, enabling faster response times and consistent communication with potential clients throughout their buyer journey.

**7. Dynamic Content Generation**

AI generates dynamic content for marketing campaigns, ensuring that materials resonate with target audiences by addressing their unique challenges and goals.

**8. Integration with CRM Systems**

Seamless integration with CRM platforms allows AI to track, manage, and update lead information in real-time, improving workflow efficiency and accuracy.

**9. Data-Driven Decision Making**

AI enables data-driven decision-making by offering clear insights into lead behavior, campaign performance, and market opportunities, helping businesses refine their strategies.

**10. Enhanced Lead Quality**

AI filters and refines lead lists to ensure high-quality prospects are targeted, reducing wasted effort and increasing the likelihood of successful conversions.

**11. Social Media Engagement**

AI analyzes social media trends and interactions to identify potential leads and track sentiment, enabling targeted engagement strategies.

**12. Real-Time Performance Monitoring**

AI tools provide real-time monitoring of lead generation campaigns, allowing businesses to make immediate adjustments and optimize performance on the fly.

**13. Cost Optimization**

By targeting the most promising leads and automating processes, AI reduces marketing costs while improving overall campaign effectiveness.

**14. Geographic Targeting**

AI identifies geographic hotspots for demand, enabling businesses to focus their efforts on regions with the highest growth potential and customer interest.

**15. Continuous Improvement**

With machine learning, AI constantly evolves by learning from new data, ensuring that lead generation strategies remain effective and relevant over time.


### 3.12 `/moving` — Moving landing page (`src/components/moving-page/MovingPage.tsx`)

Purpose: paid-traffic landing page for residential movers with instant quote search. Has its own hand-written metadata (not `pageMetadata`):

- Title: "AllShipAI – Ship Anything Anywhere with AI"
- Description: "AllShipAI simplifies logistics with AI-powered solutions. Reduce costs, track shipments, and optimize freight management worldwide."
- OG title "AllShipAI – AI-Powered Logistics Platform"; OG description "Ship anything to anywhere. AI-driven logistics solutions for shippers and carriers."; OG image `/og-image.png` (alt "AllShipAI – Smart Logistics Platform")
- Twitter: site "@allshipai", title "AllShipAI – AI-Powered Logistics", description "Smart freight management platform powered by AI. Ship faster, cheaper, smarter."

Section order:

0. Floating sticky CTA: "Get Free Qoute" **[TYPO]** -> "Get Free Quote".
1. **MovingMain (hero)** (`src/components/moving-main/MovingMain.tsx`)
   - Background video: `public/video/video-move-ezgif.com-gif-maker.mp4` (3.0 MB); fallback text "Your browser does not support the video tag."
   - H1: "Move with Ease, with best Moving Company" **[TYPO/grammar]**
   - Quote search form (see Forms below)
   - Rotating Google-style review card (`src/components/review/Review.tsx`, **[FAKE]**, see section 6.2)
   - H2: "Moving, automated"; H3: "Experience seamless, AI-powered moves for modern living."
   - Text: "Enjoy effortless relocation with intelligent planning, real-time updates, and optimized logistics. Our platform ensures your move is fast, reliable, and stress-free—every time."
   - Social icons: TikTok, YouTube, Instagram, Facebook.
2. **TrustCompanies** — H1 "Top carriers. Thousands of 5★ reviews." Rating badges, all numbers **[FABRICATED]** (and using third-party trademarks):
   - Thumbtack 4.9 (420 reviews) — `src/assets/images/thumbtack.png` (7 KB)
   - Angi 4.8 (389) — `src/assets/images/angi.png` (18 KB)
   - HomeAdvisor 4.8 (512) — `src/assets/images/home-advisor.svg` (248 KB)
   - Yelp 4.8 (278), 4 stars shown — `src/assets/images/yelp.svg` (17 KB)
   - Google 5.0 (654) — `src/assets/images/google-icon.svg` (79 KB)
   - Trust Pilot 4.8 (1261), 4 stars shown — `src/assets/images/trustpilot-icon.svg` (43 KB)
   - Yellow Pages 4.9 (1120) — `src/assets/images/yp-icon.svg` (196 KB)
   - BBB 4.8 (351), 4 stars shown — `src/assets/images/bbb-logo.svg` (2 KB)
3. **CompanyImages** — H1 "Our Highest Standard in Residential Moving". Two infinite-scroll photo rows (160s), click opens lightbox. Photos (titles "Allshipai 1..10", real crew/truck photos judging by the jpg naming): `src/assets/images/allshipai-1.jpg` (141 KB), `src/assets/images/allshipai-2.jpg` (220 KB), `src/assets/images/allshipai-15.jpg` (141 KB), `src/assets/images/allshipai-4.jpg` (225 KB), `src/assets/images/allshipai-14.jpg` (108 KB), `src/assets/images/allshipai-12.jpg` (113 KB), `src/assets/images/allshipai-7.jpg` (124 KB), `src/assets/images/allshipai-13.jpg` (109 KB), `src/assets/images/allshipai-16.jpg` (178 KB)
4. **GoogleReviews** — H1 "Meet featured reviews from our customers!" 13 cards from `src/utils/reviews.ts`, all with randomuser.me avatars **[FAKE]**, see section 6.1.
5. **FilloutForm** — embedded Fillout form `data-fillout-id="cbqEgGwBT6us"` (500px tall). Fields live in Fillout, not in the repo.
6. **BenefitsLanding** — H1 "Choose the best US Moving Company". 9 MUI cards with "Learn More"/"Show Less" expansion:
   1. **AI-Powered Efficiency** — "AllShipAI uses advanced AI to optimize your move, saving you time and money with smart route planning and carrier selection." / More: "Our AI algorithms analyze thousands of data points to ensure your move is as efficient and cost-effective as possible." — `src/assets/images/ai-1.jpg` (54 KB)
   2. **Trusted & Licensed Carriers** — "Move with confidence. AllShipAI connects you only with fully licensed, vetted, and trusted moving companies across the US." / More: "We verify all carriers for licensing and insurance, so you never have to worry about reliability or safety." — `src/assets/images/carrier01.jpg` (57 KB)
   3. **24/7 Support & Tracking** — "Enjoy peace of mind with real-time shipment tracking and round-the-clock customer support for all your moving needs." / More: "Track your move in real time and get help from our support team any time, day or night." — `src/assets/images/call-center.jpg` (49 KB)
   4. **Transparent Pricing** — "No hidden fees. AllShipAI provides clear, upfront pricing so you always know what to expect." / More: "All quotes are fully itemized and transparent, so you can budget with confidence." — `src/assets/images/transparent-pricing.jpg` (46 KB)
   5. **Nationwide Coverage** — "Whether you’re moving across town or across the country, AllShipAI has you covered with a vast network of carriers." / More: "Our network spans all 50 states, ensuring you get the best service wherever you are." — `src/assets/images/nationwide.jpg` (85 KB)
   6. **Easy Online Booking** — "Book your move in minutes with our user-friendly online platform, available anytime, anywhere." / More: "Our platform is designed for speed and simplicity, letting you book your move in just a few clicks." — `src/assets/images/online-booking.jpg` (53 KB)
   7. **Customizable Moving Solutions** — "Tailor your move to your needs with flexible options for packing, storage, and delivery." / More: "Choose only the services you need, from full-service packing to self-storage and more." — `src/assets/images/moving-solutions.jpg` (92 KB)
   8. **Insurance & Protection** — "Your belongings are protected with comprehensive insurance options for added peace of mind." / More: "We offer a range of insurance plans to fit your needs and budget." — `src/assets/images/moving.jpg` (72 KB)
   9. **Eco-Friendly Initiatives** — "AllShipAI supports green moving practices, helping reduce your move’s environmental impact." / More: "We use eco-friendly materials and partner with green carriers to minimize your carbon footprint." — `src/assets/images/eco-friendly.jpg` (116 KB)
7. **IntroductionContainer** — "Start easy shipping" — "Getting started with allship.ai is effortless—set up your account in minutes and enjoy a seamless, user-friendly experience. Manage your shipments, track progress, and access support with just a few clicks. Simplify your logistics journey today." — `src/assets/images/screen-3.jpg` (92 KB) (product screenshot)
8. **IntroductionContainer (reversed)** — "Effortless Shipping Platform" — "Experience the convenience of allship.ai—an intuitive platform designed for everyone. Set up, manage, and track your shipments with ease, all in one place. Shipping has never been this simple." — `src/assets/images/screen-2.jpg` (314 KB)
9. **AdvantagesLine** — H2 "Experience the allship.ai Advantage: Stress-Free Moving Services". Points (Feather icons): Personalized moving plans; Real-time move tracking; Professional, vetted movers; Flexible scheduling options; Transparent, upfront pricing; Secure handling of valuables; Eco-friendly packing solutions; Dedicated customer support.
10. **IntroductionContainer** — "AI-Powered, Easy-to-Use Platform" — "allship.ai makes moving simple with an intuitive platform enhanced by AI. Effortlessly manage your move while our AI checks the weather, monitors your load, and keeps you informed every step of the way." — `src/assets/images/screen-1.jpg` (250 KB)
11. **FAQSection** — `faq6` (section 5).

**Form: moving quote search** (`src/components/landing-form/Form.tsx`)

| Field | Label | Type | Options / notes |
|---|---|---|---|
| `bedrooms` | Bedrooms | select | 1 Bedroom (300 ft³), 2 Bedrooms (600 ft³), 3 Bedrooms (950 ft³), 4 Bedrooms (1300 ft³), 5 Bedrooms (1650 ft³), 6 Bedrooms (2000 ft³), 7 Bedrooms (2300 ft³), 8 Bedrooms (2600 ft³) |
| `from` | From | location autocomplete | |
| `to` | To | location autocomplete | |
| `pickupDate` | Pickup Date | date picker | placeholder "Select pickup date" |
| `fullPacking` | Full Packing (100%) | checkbox | |
| `halfPacking` | Half Packing (50%) | checkbox | |
| `quarterPacking` | 1/4 Packing (25%) | checkbox | |
| `storage` | Storage/mo | checkbox | reveals `storageAmount` |
| `storageAmount` | Storage Duration (months) | number, min 0 | prompt "How many months do you need storage for?" |
| `unpacking` | Unpacking | checkbox | |

Submit "Search" -> POST `/user/find-matched-carriers`. No Yup validation. Results: H2 "We found N best matched carriers", gated behind sign-up with blur: H4 "To see the founded results you need to sign up" **[TYPO]**, button "Sign Up". Error: "The server didn’t respond. Please try again later."

Matched carrier card (`MatchedCarrierItem`): "Best Match" badge, company avatar/name, "Average Rating:", 🚚 "Distance Charge: $", 📈 "Total Orders:", 🧳 "Packing: $", 📦 "Unpacking: $", 🏡 "Storage: $", 💰 "Total: $", button "Choose". Confirm dialog: "Are you sure you want to choose <name>?" / "By choosing <name>, you will proceed to the next step and start your booking process with this carrier." Buttons "Cancel", "Yes, Choose". (Emoji used as UI icons.)

### 3.13 `/truck-with-driver` — Truck with Driver (`src/components/rent-truck/RentTruck.tsx`)

Purpose: hourly truck + driver rental landing page.

- Title: "Truck with Driver | AllShip AI"
- Description: "Hire a truck with a professional driver by the hour. Fast, safe, and insured."
- Path (canonical): `/truck-with-driver`
- Keywords: truck with driver, hourly truck, driver hire (+ base keywords)

Section order:

1. Hero — H1 "Rent **Truck with Driver**". Text: "Experience hassle-free truck rentals with professional drivers, affordable pricing, and 24/7 support. Perfect for all your transportation needs!"
2. **ComparisonTable** — columns AllShipAI vs **uShip** vs **Fluid Trucks** (named competitors, legal risk **[FLAG]**, claims unverified):

| AllShipAI | uShip | Fluid Trucks |
|---|---|---|
| Affordable Pricing | High Costs | Expensive |
| Time-Saving | Time-Consuming | Moderate |
| Optimized Fuel Usage | Fuel Wastage | High Fuel Costs |
| Driver Responsible | No Accountability | Limited Responsibility |
| 24/7 Smart Support | Slow Response | Limited Support |
| Live GPS Tracking | No Real-Time Tracking | Basic Tracking |
| Clear Pricing | Hidden Fees | Unclear Costs |
| Customizable Solutions | Rigid Options | Limited Flexibility |
| Eco-Friendly Operations | High Emissions | Moderate Emissions |
| Seamless Integration | Complex Setup | Limited Compatibility |
| AI-Powered Optimization | Manual Processes | Basic Automation |
| Comprehensive Insurance | Limited Coverage | Basic Insurance |
| Scalable Solutions | Fixed Plans | Limited Scalability |

3. **Stats row** (all **[FABRICATED]**): "$500k" Saved for clients using our services; "121" Successful Deliveries; "100%" Job Success; "4.8/5" Avg. Google Reviews.
4. **Truck cards** (`TruckEntity`, button "Rent Truck"); pricing chips "AllShipAI - 0.5$ - 1$ / mile" vs "Other Companies - 1$ - 1.5$ / mile" (identical for all three trucks, unverified **[FLAG]**):
   - **Sprinter** — "Ideal for small load, quick deliveries, and urban logistics" — 2.1L engine, 6 gallons — `src/assets/images/sprinter-truck.svg` (215 KB)
   - **6-feet Boxtruck** — "Perfect for medium-sized loads and regional transportation" — 3.0L, 8 gallons — `src/assets/images/6-feet-boxtruck.svg` (201 KB)
   - **16-feet Boxtruck** — "Best for large load, long-distance moves, and commercial use" — 4.5L, 12 gallons — `src/assets/images/16-feet-boxtruck.svg` (189 KB)
5. **HowItWorks** (video `https://cdn.allship.ai/projectExample5demo.mp4`): 1. **Find Your Truck** — "Easily book with licensed carriers and enjoy 24/7 tracking and automation through our AI-powered platform." 2. **Choose & Enjoy** — "Pick the best services for your needs with competitive rates and reliable carriers, all powered by advanced AI." 3. **Get Bids** — "Compare quotes from licensed carriers and confidently select the best option for your budget and schedule."
6. **Route price examples** (`DirectionsPriceEntity` with embedded Google Map; all identical placeholder numbers **[FLAG]**): New York – Boston, California – Arizona, LA – Portland, Boston – Washington; each "3$ / mile", "1500$ Total", button "Rent Truck".
7. UniversalSection (shared)
8. ReadyToGetStarted (shared)
9. FAQSection — `faq3`

### 3.14 `/rent-truck` — Rent a Truck (`src/components/rent-truck-form/RentTruckForm.tsx`)

Purpose: rental booking flow. Step 1 `LocationTimeDataForm` (section 4.2), step 2 `LoadForm` with subType "Rent Truck" (form 21, section 4.4). Requires registration (auth dialog) before submit. Submit button reads "Rent Truck".

- Title: "Rent a Truck | AllShip AI"
- Description: "Rent a truck by the hour or day with flexible scheduling, driver options, and insurance."
- Path (canonical): `/rent-truck`
- Keywords: rent truck, truck rental, box truck, moving truck (+ base keywords)

### 3.15 `/vehicle-load` — Vehicle Transport (`src/components/vehicle-load/VehicleLoad.tsx`)

Purpose: post a vehicle/boat load. Step 1: H2 "Vehicle Load", "Create a new vehicle load", grid of 10 subtypes (section 4.1). Step 2: location/time. Step 3: subtype form; registration required.

- Title: "Vehicle Transport | AllShip AI"
- Description: "Open and enclosed auto transport with insured carriers. Door-to-door delivery."
- Path (canonical): `/vehicle-load`
- Keywords: vehicle transport, car shipping, auto transport (+ base keywords)

### 3.16 `/moving-load` — Post a Moving Load (`src/components/moving-load/MovingLoad.tsx`)

Purpose: post a moving job. Step 1 grid of 9 moving subtypes. **[FLAG]** Step-1 header is copy-pasted: "Vehicle Load" / "Create a new vehicle load". Registration is *not* required here (unlike the other flows).

- Title: "Post a Moving Load | AllShip AI"
- Description: "Post your moving job and receive offers from vetted movers. Easy scheduling and secure payments."
- Path (canonical): `/moving-load`
- Keywords: moving load, post moving job, book movers (+ base keywords)

### 3.17 `/heavy-load` — Heavy & Oversized Loads (`src/components/heavy-equipment-load`)

Purpose: post heavy equipment load. Goes straight to location/time, then "Heavy Equipment" form. Registration required. Metadata promises "permits, escorts, and route planning", none of which exist in the form **[FLAG]**.

- Title: "Heavy & Oversized Loads | AllShip AI"
- Description: "Specialized transport for heavy and oversized cargo with permits, escorts, and route planning."
- Path (canonical): `/heavy-load`
- Keywords: heavy haul, oversized, permits, escort, specialized transport (+ base keywords)

### 3.18 `/freight-load` — Freight Loads (`src/components/freight-load`)

Purpose: post LTL/FTL freight. Location/time, then "Freight" form. Registration required.

- Title: "Freight Loads | AllShip AI"
- Description: "Post and book freight loads with trusted carriers. Real-time pricing and fast dispatching."
- Path (canonical): `/freight-load`
- Keywords: freight, load board, carriers, dispatch, shipping (+ base keywords)

### 3.19 `/load/[loadId]` — Load detail (`src/components/load-page/LoadPage.tsx`)

Purpose: public load page where carriers bid. Shows Load ID, title, pickup/delivery stepper, photo slider (`https://cdn.allship.ai/load-<id>-photo-<n>`), Google Map route. Button "Bid Load" or "You can't bid on this load" (for customers/drivers). Unauthenticated users get `CarrierSignUpForm` in a dialog.

- Title: "Loads | AllShip AI"
- Description: "Create, manage, and track your loads. Instant confirmation and transparent pricing."
- Path (canonical): `/load`
- Keywords: loads, create load, manage load, tracking, dispatch (+ base keywords)

**Bid dialog form:** title "Bid load"; intro "Carefully review all the data on the load to give the most accurate price for the load, and be on the lookout for fraudsters".

| Field | Label | Type | Validation |
|---|---|---|---|
| `letter` | Cover Letter | textarea (4 rows) | required, min 150 chars ("Cover Letter must be at least 150 characters") |
| `estimatedDeliveryTime` | Estimated Delivery Time | datetime-local | required ("Date and Time is required") |
| `bidPrice` | Bid $ | number | required ("Bid is required") |

Fee notice: "When you make bid, you agree to the terms of the service and the terms of the load, and fee of service is 10%, so shipper will receive bid - $<bid*1.1>" (**real business fact: 10% service fee on bids**; wording garbled **[TYPO]**). Submit "Make Bid <n>$" or "Fill all fields". Success "Bid submitted!", error "Cannot make bid, try again later".

### 3.20 `/contact-us` — Contact Us (`src/components/contact-us/ContactUs.tsx`)

- Title: "Contact Us | AllShip AI"
- Description: "Get in touch with AllShip AI support and sales. We’re here to help with bookings and partnerships."
- Path (canonical): `/contact-us`
- Keywords: contact, support, sales, help (+ base keywords)

- H1: "Contact us"
- Text: "Often we respond within 48 hours, but it depends on the demand for requests. We strive to address all inquiries as quickly as possible to ensure customer satisfaction. Please note that by submitting your information, you consent to the collection and use of your personal data in accordance with our privacy policy. We use this data to improve our services and provide a better user experience. Your privacy is important to us, and we are committed to protecting your personal information."
- Form: `name` (Name, text, required "Name is required"), `email` (Email, email, required "Email is required"), `message` (Message, textarea 4 rows, required "Message is required"). Button "Submit". Alerts "Thanks for submitting!" / "Something went wrong, try again later".
- No address/phone/map on the page itself **[FLAG]**.

### 3.21 `/blog` and `/blog/[slug]`

Purpose: Markdown blog read from `public/articles/*.md` via gray-matter (frontmatter: slug, title, author, date, description/excerpt/metaDescription, tags, featureImage, altText). No metadata on either route. Index: H2 "Blog", cards with image/title/description/tags, "Read more →", empty state "No articles found." Article: H1 title, "By <author> on <date>", tags "#tag", feature image 800x400, rendered Markdown. Missing article returns plain "Article not found". See section 8.

### 3.22 `/add-article` — internal SEO article editor (`src/components/add-article/AddArticle.tsx`)

Purpose: internal tool, publicly routable, gated by a **password hardcoded in client JS** **[FLAG: security]**. Screens: "🔐 Enter SEO Admin Password" (field Password, button "Login", error "❌ Incorrect password. Try again!"), then "📝 Add SEO Optimized Article" with "Fill in all required fields carefully. Fields marked * are mandatory for proper SEO and display."

Fields (all via POST `/api/articles/add`, which writes a file into `public/articles`):

| Field | Placeholder | Validation |
|---|---|---|
| `title` | * H1 Title (Main headline) | required, min 5 |
| `metaTitle` | * Meta Title (SEO title for Google) | required, min 10 |
| `metaDescription` | * Meta Description (max 160 chars) | required, 20–160 |
| `slug` | * URL Slug (e.g. moving-tips) | required, lowercase/numbers/dashes |
| `keywords` | Keywords (comma separated) | optional |
| `tags` | Tags (comma separated) | optional |
| `category` | * Category (e.g. Moving Tips) | required |
| `excerpt` | * Short Excerpt (summary text) | required, min 30 |
| `content` | * Article Content (Markdown supported) | required, min 100 |
| `featureImage` | * Feature Image URL (https://...) | required, URL |
| `altText` | * Alt Text (describe the image) | required |
| `author` | * Author Name | required, min 3 |
| `publishDate` | * Publish Date (date) | required |

Button "💾 Save Article"; alerts "✅ Article saved successfully!", "❌ Failed to save article. Please try again later."

### 3.23 `/sign-in` (`src/components/login/Login.tsx`)

No metadata. Logo, H1 "Sign In". Fields: `email` (Email; "Invalid email format", "Enter email"), `password` (Password; must include uppercase, lowercase, number, symbol; "Enter password"). Checkbox "Remember me" (not wired). Button "Sign In" / "Processing..." / "Redirecting...". Links: "Don’t have an account? Sign Up", "Forgot Dassword? Click Here" **[TYPO]**. Footer "Copyright allship.ai". Alerts "Login successful", "Something went wrong, please try again later."

### 3.24 `/sign-up` (`src/components/register/Register.tsx`)

No metadata. H1 "Sign Up", sub "Almost done! Just complete a simple registration, and you’ll be able to continue creating your load!" Tabs **Individual** / **Business**.

| Field | Label | Type | Tab | Validation |
|---|---|---|---|---|
| `name` | Name | text | both | "Enter name" |
| `secondName` | Second Name | text | both | "Enter second name" |
| `email` | Email | email | both | "Invalid email format", "Enter email" |
| `phone` | (phone input) | phone | both | "Enter your phone", "Enter only digits" |
| `password` | Password | password | both | "Enter your password" |
| `confirmPassword` | Confirm Password | password | both | "Passwords must match" |
| `companyName` | Company Name | text | Business | "Enter company name" |
| `companyUrl` | Company URL (optional) | text | Business | optional |
| `estShipmentsPerMonth` | Estimated Shipments per Month | number | Business | "Enter estimated shipments per month" |
| `smsOptIn` | "I agree to receive AllShipAI SMS about my account and deliveries and consent to data processing according to Privacy Policy and Terms. Message & data rates may apply." | checkbox | both | |

Plus "Remember me" checkbox. Button "Sign Up". "Already have an account? Sign In". Then **Email Verification** step: "Enter the 6-digit code we sent to your email address.", field "Enter verification code", button "Verify"/"Verifying...". Alerts: "Registration successful! Enter the verification code from your email.", "User already exists, or server side issue", "Verification successful!", "Invalid or expired code".

**Carrier sign-up** (`src/components/carrier-sign-up/CarrierSignUpForm.tsx`, shown on /load/[loadId]) — 4-step stepper with per-step intro copy:
1. **Get Started** — "Welcome to the Carrier Sign Up page. Please fill in the form to create an account. All your data is secure and encrypted using the latest technologies." Fields: name, secondName, phone, email.
2. **Authority** — "Please provide your authority details. We ensure that your information is protected and handled with the utmost care." Fields: `dotNumber` (DOT Number, required), `mcNumber` (MC Number, required).
3. **Company Details** — "Enter your company details. Your data is encrypted and stored securely, ensuring the best safety solutions." Fields: companyName (required), companyUrl (optional, URL).
4. **Account** — "Create your account by setting a password. We use bcrypt to hash your password, providing the highest level of security." Fields: password, confirmPassword.
Buttons "Back", "Next", "Sign Up"; login mode "Sign in"; toggles "Already have an account? Sign In", "Doesn't have an account? Sign Up" **[TYPO]**.

### 3.25 `/forgot-password`

No metadata. H1 "Forgot Password", field `email` ("Enter your email"), button "Send Reset Link" / "Processing...", "Remember your password? Sign In". Alerts "If this email exists, a reset link was sent.", "No account found with this email.", "Something went wrong, please try again later."

### 3.26 `/reset-password/[token]`

No metadata. H1 "Reset Password". Fields `password` ("New password"; min 8, "Must contain uppercase, lowercase, number, and symbol", "Enter a password"), `confirmPassword` ("Confirm password"; "Passwords must match", "Confirm your password"). Button "Change Password". "Go back to Sign In". Alerts "Password successfully changed! You can now sign in.", "Token invalid or expired. Please request again."

### 3.27 `/terms-and-conditions`, `/privacy-policy`, `/cookie-policy`

- Title: "Terms & Conditions | AllShip AI"
- Description: "Service terms, user responsibilities, and legal information for using AllShip AI."
- Path (canonical): `/terms-and-conditions`
- Keywords: terms, conditions, legal (+ base keywords)
- robots: noindex, nofollow

- Title: "Privacy Policy | AllShip AI"
- Description: "How AllShipAI collects, uses, and protects your personal information in compliance with data protection laws."
- Path (canonical): `/privacy-policy`
- Keywords: privacy policy, data protection, user data (+ base keywords)
- robots: noindex, nofollow

- Title: "Cookie Policy | AllShip AI"
- Description: "How AllShip AI uses cookies and similar technologies to improve your experience."
- Path (canonical): `/cookie-policy`
- Keywords: cookie policy, privacy, tracking (+ base keywords)
- robots: noindex, nofollow

All three are a single `Description` block; full text in Appendices A–C. Cookie Policy numbering starts at "3." (sections 1–2 missing in source **[FLAG]**); it claims no advertising tracking while the layout loads Clixtell (ad click tracking) and Zoho PageSense **[FLAG]**. Privacy Policy includes an "SMS Consent (Opt-In)" section that matches the sign-up checkbox (worth keeping for A2P 10DLC compliance). **[FLAG]** These are generic AI-ethics essays, not real legal documents (no governing law, liability, refund/cancellation, dispute terms, data controller details, cookie list). They should be rewritten by counsel.

### 3.28 Not found (`src/app/not-found.tsx`)

H1 "404 – Page Not Found", text "Sorry this page not found" **[TYPO]**, link "Go to the main" **[TYPO]** (inline blue underline style).

---

## 4. Load / move categories and forms

### 4.1 Category taxonomy

Top-level load types (from `CreateLoad.tsx` and the landing category grid): **Vehicle Load** (Vehicles & Boats), **Moving**, **Freight**, **Heavy Equipment**, plus **Rent Truck** as a separate flow. The unused `load-create/CreateLoad.tsx` imports top-level icons `vehicle-load-type.png`, `moving-load-type.png`, `freight-load-type.png`, `heavy-load-type.png`, which do not exist in `src/assets/images` (component would not build if mounted). `freight-category-image.svg` (123 KB) exists but is unused.

The 21 form components in `src/components/forms/*` and the `subType` string that selects each one in `LoadForm.tsx`:

| # | Group | subType string (exact) | Component dir | Picker image | Yup schema in validate.ts |
|---|---|---|---|---|---|
| 1 | Vehicle | `Car or Light Truck` | car-or-light-truck | `src/assets/images/car-load-type-2.webp` (4 KB) | carOrLightTruckSchema |
| 2 | Vehicle | `Moto Equipment` | moto-equipment | `src/assets/images/moto-load-type-2.webp` (5 KB) | motoEquipmentSchema |
| 3 | Vehicle | `Powerboats` | powerboats | `src/assets/images/powerboats-load-type-2.webp` (3 KB) | powerboatsSchema (requires `quantity`, which the form lacks **[BUG]**) |
| 4 | Vehicle | `Sailboats` | sailboats | `src/assets/images/sailboat-load-type-2.webp` (3 KB) | none (no case) **[BUG]** |
| 5 | Vehicle | `Personal watercrafts` | personal-watercraft | `src/assets/images/personal-watercrafts-load-type-2.webp` (2 KB) | personalWatercrafts |
| 6 | Vehicle | `ATVs & Power Sports` | atv-power-sports | `src/assets/images/atv-load-type-2.webp` (5 KB) | atv |
| 7 | Vehicle | `Commercial Truck` | commercial-truck | `src/assets/images/commercial-truck-load-type-2.webp` (4 KB) | commercialTruck |
| 8 | Vehicle | `Parts` | parts | `src/assets/images/parts-load-type-2.webp` (6 KB) | parts |
| 9 | Vehicle | `Trailer & Other Vehicles` | trailer-and-other-vehicles | `src/assets/images/trailer-load-type-2.webp` (3 KB) | trailerAndOtherVehicles |
| 10 | Vehicle | `RV (Recreational Vehicles)` | recreational-vehicles | `src/assets/images/rv-load-type-2.webp` (4 KB) | rv (requires `selectName`, form uses `rvType` **[BUG]**) |
| 11 | Moving | `Local Moving (less than 50 miles)` | local-moving | `src/assets/images/local-moving-load-type.svg` (846 KB) | localMoving |
| 12 | Moving | `Commercial / Business Moving` | commercial-business-moving | `src/assets/images/business-moving-load-type.svg` (962 KB) | commercialBusinessMoving |
| 13 | Moving | `Heavy Lifting and Moving Only` | heavy-lifting-moving | `src/assets/images/heavy-moving-load-type.svg` (1.1 MB) | heavyLiftingAndMovingOnly |
| 14 | Moving | `Household item` | household-item | `src/assets/images/household-load-type.svg` (1.0 MB) | householdItemMoving (field names have trailing spaces **[BUG]**) |
| 15 | Moving | `Office Moving` | office-moving | `src/assets/images/office-moving-load-type.svg` (1.0 MB) | officeMovingSchema |
| 16 | Moving | `Corporate Moving` | corporate-moving | `src/assets/images/corporate-moving-load-type.svg` (1.0 MB) | corporateMovingSchema |
| 17 | Moving | `Student Moving` | student-moving | `src/assets/images/student-moving-load-type.svg` (1.1 MB) | studentMovingSchema |
| 18 | Moving | `Military Moving` | military-moving | `src/assets/images/military-moving-load-type.svg` (1.2 MB) | militaryMovingSchema |
| 19 | Freight | `Freight` | freight | (category) `src/assets/images/truck.svg` (5.5 MB) | freight |
| 20 | Heavy | `Heavy Equipment` | heavy-equipment | (category) `src/assets/images/heavy-construction-category.svg` (773 KB) | heavyEquipment |
| 21 | Rental | `Rent Truck` | rent-truck | n/a | none |

Extra moving subtype shown in the `/moving-load` picker with **no form**: `Long Distance Moving` (`src/assets/images/long-distance-moving-load-type.svg` (1022 KB)) → renders "No form for Long Distance Moving" **[BUG]**.

Naming inconsistencies: "Personal watercrafts" vs "Personal Watercrafts" (rent-truck list); "Household item" vs "Household Item".

### 4.2 Shared step: Location & Time (`LocationTimeDataForm.tsx`)

Header "Location & Time Data" / "Please provide the location and time data for the load". Groups "Pickup Data", "Stop" (repeatable, button "Delete Stop"), "Delivery Data". Calculates driving distance via OpenRouteService ("<n> mil"). Buttons "Go Back", "Next"/"Processing...".

| Field | Label | Type | Required message |
|---|---|---|---|
| `pickupLocation` | Pickup Location | location autocomplete | Enter pickup location |
| `pickupTime` | Pickup Time | datetime-local (default 2025-01-01T00:00) | Enter pickup time |
| `stops[]` | — | array of `{stopLocation, stopTime}` | |
| `stops[i].stopLocation` | Stop Location | location autocomplete | Enter stop location |
| `stops[i].stopTime` | Stop Time | datetime-local | Enter stop time |
| `deliveryLocation` | Delivery Location | location autocomplete | Enter delivery location |
| `deliveryTime` | Delivery Time | datetime-local | Enter delivery time |

### 4.3 Shared fields on every load form (`LoadForm.tsx`)

Header: H2 = subType, "Please fill out the form below to create a new load." (step 4 illustration).

- "Add Files" (max 5; tooltip "You can add maximum 5 files") → `files[]`
- "Add Photos" (image/*, max 5) → `photos[]`
- `details` — "Additional Details", textarea 4 rows, optional
- Hidden/system: `user` (userId from localStorage), `subType`, plus location fields from 4.2
- Buttons "Go Back" (tooltip "Turn back"), "Create Load" / "Rent Truck" (tooltip "Submit and create my load"). Submit disabled until schema valid.
- Messages: "Load created successfully!" then redirect to `https://dashboard.allship.ai/my-loads`; carriers/drivers get "Oops! You don't have the ability to create a load because you are a <role>."

Reusable widgets:
- **TrailerPreferences**: `hasTrailerPreference` (checkbox "Yes") reveals `trailerPreferences[]` multi-check: Flatbed, Stretched Flatbed, Step Deck, Lowboy, Flatbed Double, Removable Gooseneck, Other, Auto Carrier, Reefer, Dry Van, Air Ride Van, Van Double, Tanker, Dump.
- **UnitTypes**: `typeUnits[]` multi-check: Crate, Pallet, Box, Other; "Other" reveals: Bag, Bale, Bundle, Can, Carton, Case, Coil, Cylinder, Drum, Loose, Pail, Reel, Roll, Pipe.
- **CustomSwitch**: boolean toggle (label + optional helper title).

Field type legend: `text`, `number`, `select` (single, options listed), `switch` (boolean). "Req" = required by Yup schema for that subType. Section labels are the `Divider` title / subtitle shown above fields.

### 4.4 Per-form field lists

#### Form 1 — Car or Light Truck (`car-or-light-truck/CarOrLightTruck.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Title | text | | yes ("Enter title") |
| vehicleYear | Vehicle Year | text | must match 4 digits | yes ("Enter a valid 4-digit year") |
| vehicleMake | Vehicle Make | text | | yes |
| vehicleModel | Vehicle Model | text | | yes |
| — section "Vehicle Load Specifications" / "Fill all necessary fields" | | | | |
| isConvertible | Is Convertible | switch | | |
| isModified | Is Modified | switch | | |
| isInoperable | Is Inoperable | switch | | |
| — section "Load Trailer Type" / "Select trailer type" | | | | |
| openTrailer | Open Trailer | switch | | |
| enclosedTrailer | Enclosed Trailer | switch | | |
| bothOpenAndEnclosed | Both | switch | | |

#### Form 2 — Moto Equipment (`moto-equipment/MotoEquipment.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Title | text | | yes |
| vehicleYear | Vehicle Year | text | 4 digits | yes |
| vehicleMake | Vehicle Make | text | | yes |
| vehicleModel | Vehicle Model | text | | yes |
| — "Vehicle Specifications" | | | | |
| isOperable | Operable | switch | "Runs & drives" | yes (boolean) |
| isSidecar | Sidecar | switch | "One-wheeled devices attached" | yes (boolean) |
| isTrike | Trike | switch | "Three-wheeled vehicle" | yes (boolean) |
| isModified | Modified | switch | "Custom parts or any measures from stock" | yes (boolean) |

Note: `isOperable` is missing from `initialValues`, so the required check fails until toggled **[BUG]**.

#### Form 3 — Powerboats (`powerboats/Powerboats.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Dimensions" / "Fill all necessary fields" | | | | |
| weight | Weight (lbs) | number | | yes |
| length | Length (lbs) **[TYPO unit]** | number | | yes |
| width | Width (lbs) **[TYPO unit]** | number | | yes |
| height | Height (lbs) **[TYPO unit]** | number | | yes |
| — "Is Boat on Trailer?" | | | | |
| isOnTrailer | Yes | switch | "Yes, on trailer" | |
| (quantity) | — not rendered — | | | yes in schema **[BUG]** |

#### Form 4 — Sailboats (`sailboats/Sailboats.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | no schema |
| quantity | Number of boats | number | | |
| — "Boat Make" / "What is the make of your boat" | | | | |
| vehicleMake | Boat Make | text | | |
| — "Dimensions" | | | | |
| weight | Weight (lbs) | number | | |
| length | Length (lbs) **[TYPO unit]** | number | | |
| width | Width (lbs) **[TYPO unit]** | number | | |
| height | Height (lbs) **[TYPO unit]** | number | | |
| — "Is Boat on Trailer?" | | | | |
| isOnTrailer | Yes | switch | "Yes, on trailer" | |

#### Form 5 — Personal watercrafts (`personal-watercraft/PersonalWatercrafts.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| quantity | Number of items | number | | yes |
| — "Watercraft Make" / "What is the make of your boat" | | | | |
| vehicleMake | Watercraft Make | text | | |
| — "Dimensions" | | | | |
| weight | Weight (lbs) | number | | yes |
| length | Length (lbs) **[TYPO unit]** | number | | yes |
| width | Width (lbs) **[TYPO unit]** | number | | yes |
| height | Height (lbs) **[TYPO unit]** | number | | yes |
| — "Is Watercraft on Trailer?" | | | | |
| isOnTrailer | Yes | switch | "Yes, on trailer" | |

#### Form 6 — ATVs & Power Sports (`atv-power-sports/ATVandPowerSports.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Title | text | | yes |
| quantity | ATVs quantity | number | | yes ("ATV Quantity is required") |
| — "ATV Specifications" | | | | |
| weight | Weight (lbs) | number | | yes |
| length | Length (lbs) **[TYPO unit]** | number | | yes |
| width | Width (lbs) **[TYPO unit]** | number | | yes |
| height | Height (lbs) **[TYPO unit]** | number | | yes |
| — "Is ATV on Trailer?" | | | | |
| isOnTrailer | Yes | switch | "Yes, on trailer" | |

#### Form 7 — Commercial Truck (`commercial-truck/CommercialTruck.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Title | text | | yes |
| — "Any vehicle specifications?" / "Fill all fields" | | | | |
| quantity | Quantity of items | number | | yes ("Trucks quantity") |
| vehicleYear | Vehicle Year | text | 4 digits | yes |
| vehicleMake | Vehicle Make | text | | yes ("Enter Truck make") |
| vehicleModel | Vehicle Model | text | | yes ("Enter Truck model") |
| — "Do you have any trailer preferences?" / "Select trailer type" | | | | |
| hasTrailerPreference + trailerPreferences[] | TrailerPreferences widget | checkbox + multi | see 4.3 | |

#### Form 8 — Parts (`parts/Parts.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Title | text | | yes |
| — "Dimensions" / "Fill all fields" | | | | |
| width | Widht (lbs) **[TYPO]** | number | | yes |
| height | Height (lbs) **[TYPO unit]** | number | | yes |
| weight | Weight (lbs) | number | | yes |
| length | Length (lbs) **[TYPO unit]** | number | | yes |
| quantity | Quantity of items | number | | yes ("Items quantity") |
| — "Any freight specifications?" | | | | |
| isStackable | Stackable | switch | "Items that can be stacked to reduce linear space." | |
| isHazardous | Hazardous | switch | "Hazmat such as chemicals, acid, waste with a UN number" | |
| — "Do you have any trailer preferences?" (but renders UnitTypes **[FLAG]**) | | | | |
| typeUnits[] | UnitTypes widget | multi | see 4.3 | |

#### Form 9 — Trailer & Other Vehicles (`trailer-and-other-vehicles/TrailerAndOtherVehicles.tsx`)
| Field | Label | Type | Req |
|---|---|---|---|
| title | Title | text | yes |
| — "Dimensions" | | | |
| width | Widht (lbs) **[TYPO]** | number | yes |
| height | Height (lbs) | number | yes |
| weight | Weight (lbs) | number | yes |
| length | Length (lbs) | number | yes |

#### Form 10 — RV (Recreational Vehicles) (`recreational-vehicles/RecreationalVehicles.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| — "RV Type and Name" / "Fill all fields" | | | | |
| title | Shipment Title | text | | yes |
| rvType | RV Type | select | Class A Motorhome, Class B Motorhome, Class C Motorhome, Travel Trailer, Folding Tent Trailer, Fifth-Wheel, Truck Camper, Other | (schema checks `selectName` instead **[BUG]**) |
| — "RV Specifications" | | | | |
| width | Widht (lbs) **[TYPO]** | number | | yes |
| height | Height (lbs) | number | | yes |
| weight | Weight (lbs) | number | | yes |
| length | Length (lbs) | number | | yes |

#### Form 11 — Local Moving (less than 50 miles) (`local-moving/LocalMoving.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes ("Enter Shipment title") |
| — "Enter shipment information" / "Fill all fields" | | | | |
| typeOfResidence | Type of residence | select | House, Apartment, Condo, Other | yes |
| numberOfBedrooms | Number of bedrooms | select | Studio, 1, 2, 3, 4+ | yes |
| pickupStories | Pickup stories | select | 1, 2, 3+ | yes |
| deliveryStories | Delivery stories | select | 1, 2, 3+ | no |

#### Form 12 — Commercial / Business Moving (`commercial-business-moving/CommercialBusinessMoving.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Enter shipment information" | | | | |
| typeOfBusinessLocation | Type of Business Location | select | Office, Retail Store, Warehouse, Restaurant, Other | yes |
| totalSquareFootage | Total Square Footage | select | <500 sq. ft, 500-1000 sq. ft, 1000-5000 sq. ft, 5000+ sq. ft | yes |
| numberOfWorkstations | Number of Workstations/Desks | select | 1-5, 6-10, 11-20, 21-50, 50+ | yes |
| numberOfLargeOfficeEquipment | Number of Large Office Equipment | select | 0-2, 3-5, 6-10, 11+ | yes |
| pickupFloorLevel | Pickup Floor Level | select | Ground Floor, 1, 2, 3+ with Elevator, 3+ No Elevator | yes |
| deliveryFloorLevel | Delivery Floor Level | select | Ground Floor, 1, 2, 3+ with Elevator, 3+ No Elevator | yes |
| — "Special Moving Needs" / "Select all that apply" (but single select **[FLAG]**) | | | | |
| specialMovingNeeds | Special Moving Needs | select | IT Equipment, Server Racks, Filing Cabinets, Fragile Items, Heavy Machinery, Other | yes |

#### Form 13 — Heavy Lifting and Moving Only (`heavy-lifting-moving/HeavyLiftingMoving.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Choose Shipment Information" / "Heavy Lifting & Moving Only" | | | | |
| typeOfItemsToMove | Type of Items to Move | select | Furniture, Appliances, Safes, Pianos, Gym Equipment, Industrial Machinery, Other | yes |
| estimatedWeightPerItem | Estimated Weight Per Item | select | <100 lbs, 100-250 lbs, 250-500 lbs, 500+ lbs | yes |
| totalNumberOfHeavyItems | Total Number of Heavy Items | select | 1-2, 3-5, 6-10, 10+ | yes |
| pickupFloorLevel | Pickup Floor Level | select | Ground Floor, 1, 2, 3+ with Elevator, 3+ No Elevator | yes |
| deliveryFloorLevel | Delivery Floor Level | select | same | yes |
| isElevatorAvailable | Is There an Elevator Available? | select | Yes, No, Not Sure | yes |
| distanceToMove | Distance to Move | select | Within the Same Room, Within the Same Floor, Between Floors, Between Buildings within 100 feet, Between Buildings 100+ feet | yes |
| — "Would You Like Any Additional Features?" | | | | |
| disassemblyReassembly | Disassembly & Reassembly of Items | switch | | yes (boolean) |
| useOfMovingEquipment | Use of Moving Equipment (Dollies, Straps, Hoists, etc.) | switch | | yes (boolean) |
| needAdditionalCrew | Need Additional Crew Members? | switch | | yes (boolean) |
| emergencyMoving | Emergency or Same-Day Moving? | switch | | yes (boolean) |

#### Form 14 — Household item (`household-item/HouseholdItem.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Choose Shipment Information" / "Household Item Moving" | | | | |
| typeOfResidence | Type of Residence | select | House, Apartment, Condo, Mobile Home, Other | yes |
| `numberOfBedrooms   ` (trailing spaces **[BUG]**) | Number of Bedrooms | select | Studio, 1, 2, 3, 4+ | yes |
| `totalNumberOfBoxes ` (trailing space **[BUG]**) | Total Number of Boxes | select | 1-5, 6-10, 11-20, 21-50, 50+ | yes |
| largeFurnitureItems | Large Furniture Items | select (initial value is an array) | Bed, Sofa, Dresser, Wardrobe, Dining Table, TV Stand, Desk, Other | yes |
| appliancesBeingMoved | Appliances Being Moved | select (array initial) | Refrigerator, Washer/Dryer, Microwave, Dishwasher, Oven, Other | yes |
| `doYouHaveFragileItems  ` (trailing spaces **[BUG]**) | Do You Have Fragile Items? | select | Yes, No | yes |
| specialHandlingRequired | Special Handling Required? | select (array initial) | Antiques, Glass Items, Electronics, Musical Instruments, Other | yes |
| — "Would You Like Any Additional Features?" | | | | |
| packingUnpackingServices | Packing & Unpacking Services | switch | | |
| furnitureDisassemblyReassembly | Furniture Disassembly & Reassembly | switch | | |
| storageNeeds | Storage Needs? | switch | | |
| needExtraMovingSupplies | Need Extra Moving Supplies? | switch | | |

Every required message in this schema is "Enter Shipment title" (copy-paste **[BUG]**).

#### Form 15 — Office Moving (`office-moving/OfficeMoving.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Choose Shipment Information" / "Office Moving" | | | | |
| typeOfOfficeSpace | Type of Office Space | select | Small Office, Corporate Office, Co-Working Space, Retail Store, Warehouse, Other | yes |
| totalSquareFootage | Total Square Footage | select | <500 sq. ft, 500-1000 sq. ft, 1000-5000 sq. ft, 5000+ sq. ft | yes |
| numberOfWorkstations | Number of Workstations/Desks | select | 1-5, 6-10, 11-20, 21-50, 50+ | yes |
| numberOfLargeOfficeFurnitureItems | Number of Large Office Furniture Items | select | 1-5, 6-10, 11-20, 20+ | yes |
| doesYourOfficeHaveFragileItems | Does Your Office Have Fragile Items? | select | Yes, No | yes |
| — "Office Equipment to Move" | | | | |
| computers / printers / copiers / phones / servers / otherOfficeEquipment | Computers / Printers / Copiers / Phones / Servers / Other | switch | | |
| — "Special Handling Required?" | | | | |
| itEquipment / serverRacks / glassPartitions / electronics / heavyMachinery / otherSpecialHandling | IT Equipment / Server Racks / Glass Partitions / Electronics / Heavy Machinery / Other | switch | | |
| — "Would You Like Any Additional Features?" | | | | |
| packingUnpackingServices | Packing & Unpacking Services | switch | | |
| furnitureDisassemblyReassembly | Furniture Disassembly & Reassembly | switch | | |
| storageNeeds | Storage Needs? | switch | | |
| afterHoursOrWeekendMoving | After-Hours or Weekend Moving? | switch | | |
| needExtraMovingSupplies | Need Extra Moving Supplies? | switch | | |

#### Form 16 — Corporate Moving (`corporate-moving/CorporateMoving.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Choose Shipment Information" / "Corporate Moving" | | | | |
| typeOfCorporateSpace | Type of Corporate Space | select | Office Building, Tech Hub, Call Center, Retail Chain, Manufacturing Facility, Other | yes |
| totalSquareFootage | Total Square Footage | select | <1,000 sq. ft, 1,000-5,000 sq. ft, 5,000-10,000 sq. ft, 10,000+ sq. ft | yes |
| numberOfWorkstations | Number of Workstations/Desks | select | 1-10, 11-50, 51-100, 100+ | yes |
| numberOfMeetingRooms | Number of Meeting Rooms & Conference Tables | select | 1-2, 3-5, 6-10, 10+ | yes |
| numberOfLargeOfficeEquipment | Number of Large Office Equipment | select | 1-5, 6-10, 11-20, 20+ | yes |
| numberOfOfficePartitions | Number of Office Partitions/Cubicles to Move | select | 1-5, 6-10, 11-20, 20+ | yes |
| doesYourMoveInvolveFragileItems | Does Your Move Involve Fragile or High-Value Items? | select | Yes, No | yes |
| securityClearanceNeeded | Security Clearance Needed? | select | Yes, No, Not Sure | yes |
| — "Specialized Office Equipment" | | | | |
| itRacks / largeServers / heavyMachinery / highSecurityEquipment / otherSpecializedEquipment | IT Racks / Large Servers / Heavy Machinery / High-Security Equipment / Other | switch | | |
| — "Would You Like Any Additional Features?" | | | | |
| itNetworkSetupAssistance | IT & Network Setup Assistance | switch | | |
| packingUnpackingServices | Packing & Unpacking Services | switch | | |
| disassemblyReassembly | Disassembly & Reassembly of Furniture & Equipment | switch | | |
| storageNeeds | Short-Term or Long-Term Storage Needed? | switch | | |
| afterHoursOrWeekendMoving | After-Hours or Weekend Moving? | switch | | |
| additionalSecurityInsurance | Additional Security & Insurance Coverage? | switch | | |
| specializedPacking | Specialized Packing for High-Value Items? | switch | | |

Note: several of these keys (typeOfCorporateSpace, numberOfMeetingRooms, numberOfOfficePartitions, doesYourMoveInvolveFragileItems, securityClearanceNeeded, itRacks, ...) are not in `LoadForm` `initialValues`; Formik still collects them once touched.

#### Form 17 — Student Moving (`student-moving/StudentMoving.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Choose Shipment Information" / "Student Moving" | | | | |
| typeOfResidence | Type of Residence | select | Dormitory, Shared Apartment, Studio, Other | yes |
| numberOfBedrooms | Number of Bedrooms | select | Shared Room, Studio, 1 Bedroom, 2 Bedroom, Other | yes |
| totalNumberOfBoxes | Total Number of Boxes | select | 1-5, 6-10, 11-20, 20+ | yes |
| doYouHaveFragileItems | Do You Have Fragile Items? | select | Yes, No | yes |
| doYouNeedHelpAssemblingDisassemblingFurniture | Do You Need Help Assembling/Disassembling Furniture? | select | Yes, No | yes |
| — "Large Items to Move" | | | | |
| bed / desk / chair / dresser / bookshelf / miniFridge / tv / otherLargeItems | Bed / Desk / Chair / Dresser / Bookshelf / Mini-Fridge / TV / Other | switch | | |
| — "Electronics Being Moved" | | | | |
| laptop / desktopPC / monitor / tvElectronics / gamingConsole / speakers / otherElectronics | Laptop / Desktop PC / Monitor / TV / Gaming Console / Speakers / Other | switch | | |
| — "Would You Like Any Additional Features?" | | | | |
| packingUnpackingServices | Packing & Unpacking Services | switch | | |
| temporaryStorageNeeded | Temporary Storage Needed? | switch | | |
| needMovingSupplies | Need Moving Supplies? | switch | | |
| helpWithHeavyLifting | Help with Heavy Lifting? | switch | | |
| lastMinuteOrEmergencyMove | Last-Minute or Emergency Move? | switch | | |

#### Form 18 — Military Moving (`military-moving/MilitaryMoving.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Shipment Title | text | | yes |
| — "Choose Shipment Information" / "Military Moving" | | | | |
| typeOfMilitaryMove | Type of Military Move | select | PCS (Permanent Change of Station), Temporary Duty (TDY), Deployment, Retirement, Other | yes |
| totalHouseholdSize | Total Household Size | select | Single, Couple, Family with 1-2 children, Family with 3+ children | yes |
| numberOfBedrooms | Number of Bedrooms | select | Studio, 1, 2, 3, 4+ | yes |
| totalNumberOfBoxes | Total Number of Boxes | select | 1-5, 6-10, 11-20, 20+ | yes |
| doYouHaveFragileItems | Do You Have Fragile or High-Value Items? | select | Yes, No | yes |
| — "Large Household Items" | | | | |
| bed / sofa / diningTable / wardrobe / desk / dresser / bookshelves / otherLargeItems | Bed / Sofa / Dining Table / Wardrobe / Desk / Dresser / Bookshelves / Other | switch | | |
| — "Appliances Being Moved" | | | | |
| refrigerator / washerDryer / microwave / dishwasher / oven / otherAppliances | Refrigerator / Washer/Dryer / Microwave / Dishwasher / Oven / Other | switch | | |
| — "Military-Specific Items to Move" | | | | |
| uniformsGear | Uniforms/Gear | switch | | |
| weaponsFirearms | Weapons/Firearms (with proper documentation) | switch | | |
| storageContainers | Storage Containers | switch | | |
| safe | Safe | switch | | |
| otherMilitaryItems | Other | switch | | |
| — "Would You Like Any Additional Features?" | | | | |
| packingUnpackingServices | Packing & Unpacking Services | switch | | |
| disassemblyReassembly | Disassembly & Reassembly of Furniture | switch | | |
| temporaryStorage | Temporary or Long-Term Storage? | switch | | |
| specialPacking | Special Packing for Military Gear or Sensitive Documents? | switch | | |
| expeditedMoving | Expedited or Last-Minute Moving? | switch | | |
| assistanceWithPaperwork | Do You Require Assistance with Military Move Paperwork? | switch | | |

#### Form 19 — Freight (`freight/Freight.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Title | text | | yes |
| — "Unit Measurements" / "Fill all needed information" | | | | |
| length | Length (in.) | number | | yes |
| width | Width (in.) | number | | yes |
| height | Height (in.) | number | | yes |
| weight | Length (lbs.) **[TYPO: should be Weight]** | number | | yes |
| — "Do you have any trailer preferences?" | | | | |
| hasTrailerPreference + trailerPreferences[] | TrailerPreferences widget | | see 4.3 | |
| — "Another Load details?" / "Select trailer type" **[TYPO]** | | | | |
| typeUnits[] | UnitTypes widget | | see 4.3 | |

No LTL/FTL selector, pallet count, freight class or hazmat flag despite "LTL, FTL" category copy **[FLAG]**.

#### Form 20 — Heavy Equipment (`heavy-equipment/HeavyEquipment.tsx`)
| Field | Label | Type | Options / helper | Req |
|---|---|---|---|---|
| title | Title | text | | yes |
| — "Heavy Load Specifications" | | | | |
| vehicleYear | Vehicle Year | text | | |
| vehicleMake | Vehicle Make | text | | |
| vehicleModel | Vehicle Model | text | | |
| quantity | Items quantity | number | | yes |
| — "Additional " / "Select trailer type" | | | | |
| typeOfHeavyEquipment | Type of Heavy Equipment | select (array initial) | Bulldozer, Excavator, Forklift, Crane, Tractor, Backhoe, Loader, Generator, Other | |
| heavyEquipmentCategory | Heavy Equipment Category | select (array initial) | Construction Machinery, Agricultural Equipment, Industrial Machinery, Mining Equipment, Other | |
| — "Load Trailer Type" | | | | |
| openTrailer | Open Trailer (Cost Loss) **[TYPO: Cost Less]** | switch | "Vehicle is open to the trailer" | |
| enclosedTrailer | Enclosed Trailer (Cost More) | switch | "Vehicle protected" | |
| bothOpenAndEnclosed | Both | switch | "You can opt for open or enclosed trailer" | |

No dimensions, weight, permits or escort fields despite /heavy-load metadata **[FLAG]**.

#### Form 21 — Rent Truck (`rent-truck/RentTruckForm.tsx`)
| Field | Label | Type | Options | Req |
|---|---|---|---|---|
| title | Load Type | select | Car or Light Truck, Moto Equipment, Powerboats, Sailboats, Personal Watercrafts, ATVs & Power Sports, Commercial Truck, Parts, Trailer & Other Vehicles, RV (Recreational Vehicles), Local Moving (less than 50 miles), Long Distance Moving, Commercial / Business Moving, Heavy Lifting and Moving Only, Household Item, Office Moving, Corporate Moving, Student Moving, Military Moving, Farm, Construction, LTL, FTL, Heavy Equipment, Forklift, Crane, Tractor, Backhoe, Loader, Generator, Other | no schema |
| truckType | Truck Type | select | Sprinter Van, Cargo Van, Pickup Truck, Flatbed Truck, Box Truck - 6 Feet, Box Truck - 10 Feet, Box Truck - 12 Feet, Box Truck - 14 Feet, Box Truck - 16 Feet, Box Truck - 20 Feet, Box Truck - 24 Feet, Box Truck - 26 Feet, Refrigerated Truck (Reefer), Stake Bed Truck, Dump Truck, Tow Truck, Rollback Tow Truck, Wrecker Tow Truck, Car Hauler, Day Cab Tractor, Sleeper Cab Tractor, Lowboy Trailer Truck, Dry Van Trailer, Tanker Truck, Logging Truck, Concrete Mixer Truck, Garbage Truck, Utility Truck, Service Truck, Delivery Truck, Moving Truck, Heavy Duty Truck, Medium Duty Truck, Light Duty Truck, Other | |
| liftGate | Liftgate | switch | | |
| palletJack | Pallet Jack | switch | | |
| movingRamp | Moving Ramp | switch | | |
| deliveryPoint | Delivery Point | switch | | |
| callBeforeDelivery | Call before delivery | switch | | |
| — "Is needed driver assistance" / "Turn checkbox if needs and give short description" **[TYPO]** | | | | |
| neededDriverAssistance | I need | switch | "Need driver assistance" | |
| driverAssistanceDetails | Driver Assistance Details | textarea (4 rows), shown when previous is on | | |
| — "Other Details" / "Enter other details if needed" (then shared `details`) | | | | |

Note: "Load Type" is stored in the `title` field, and its list contains "Farm, Construction" and "LTL, FTL" as single options (the comma-joined category subtitles).

### 4.5 validate.ts summary

`getValidationSchema(subType)` switch keys (exact strings): Car or Light Truck, Moto Equipment, Powerboats, Personal watercrafts, ATVs & Power Sports, Commercial Truck, Parts, Trailer & Other Vehicles, RV (Recreational Vehicles), Local Moving (less than 50 miles), Commercial / Business Moving, Heavy Lifting and Moving Only, Household item, Office Moving, Corporate Moving, Student Moving, Military Moving, Freight, Heavy Equipment. Default: empty schema (Sailboats, Long Distance Moving, Rent Truck). All numeric dimensions are validated as strings (`Yup.string().required`), no min/max or number coercion. Only year has a format rule (`/^\d{4}$/`). Required messages per field are given in the tables above.

Suggested typed-schema takeaways: one discriminated union on `subType`; shared base `{title, subType, pickup/delivery/stops, details, files, photos}`; dimension block `{weight_lbs, length_in, width_in, height_in}` (fix the lbs labels); vehicle block `{year, make, model}`; trailer block; moving inventory as boolean maps.

---

## 5. FAQ sets (full text)

Usage: **faq1** → `/`; **faq2** → `/ship`; **faq3** → `/truck-with-driver`; **faq4** → `/ai`, `/all`, `/partners`; **faq5** → `/safety`; **faq6** → `/moving`.

### faq1 (`src/utils/faq1.ts`)

1. **Q: What is AllShipAI?**
   A: AllShipAI is an advanced, AI-powered platform that revolutionizes the shipping and logistics industry. It streamlines the process of finding carriers, managing shipments, and optimizing routes, making shipping more efficient and cost-effective for businesses of all sizes.
2. **Q: How does AllShipAI benefit my business?**
   A: AllShipAI leverages artificial intelligence to automate and enhance your shipping operations. Benefits include reduced shipping costs, faster delivery times, improved route optimization, real-time tracking, and seamless communication between shippers and carriers.
3. **Q: Is AllShipAI suitable for small businesses?**
   A: Absolutely! AllShipAI is designed to cater to businesses of all sizes. Small businesses can particularly benefit from our platform by accessing competitive shipping rates, optimizing their logistics processes, and expanding their reach without significant overhead costs.
4. **Q: What kind of customer support does AllShipAI provide?**
   A: We offer 24/7 customer support through multiple channels, including live chat, email, and phone. Our dedicated support team is always ready to assist you with any questions or issues you may encounter.
5. **Q: Is my data secure with AllShipAI?**
   A: Data security is a top priority for us. AllShipAI employs advanced encryption and security protocols to protect your sensitive information. We comply with industry standards and regulations to ensure your data is safe.
6. **Q: How does AllShipAI's AI optimize shipping routes?**
   A: Our AI algorithms analyze various factors such as distance, traffic patterns, weather conditions, and carrier availability to determine the most efficient shipping routes. This optimization reduces transit times and costs.
7. **Q: Can I schedule pickups and deliveries through AllShipAI?**
   A: Yes, you can schedule pickups and deliveries through AllShipAI. Our platform offers comprehensive logistics management tools that enable you to arrange, track, and manage your shipments seamlessly.

### faq2 (`src/utils/faq2.ts`)

1. **Q: How does AllShipAI reduce shipping costs for businesses?**
   A: AllShipAI uses advanced AI algorithms to optimize carrier selection, route planning, and load management. This results in reduced shipping costs by minimizing fuel usage, improving delivery efficiency, and ensuring competitive carrier rates.
2. **Q: Can AllShipAI handle high-volume logistics for large enterprises?**
   A: Yes, AllShipAI is built to scale. Our platform supports high-volume shipments and offers enterprise-grade solutions such as bulk order management, API integrations, and advanced analytics to optimize large-scale logistics operations.
3. **Q: What is the environmental impact of AllShipAI?**
   A: AllShipAI is committed to sustainability. By optimizing shipping routes and consolidating shipments, we help reduce carbon emissions. Additionally, our platform provides tools to measure and track the environmental impact of your logistics operations.
4. **Q: What makes AllShipAI different from traditional shipping platforms?**
   A: Unlike traditional shipping platforms, AllShipAI leverages AI-driven technology to provide real-time insights, automate manual processes, and deliver predictive analytics for smarter decision-making. This unique approach saves businesses time and money.
5. **Q: Can AllShipAI support multi-modal logistics operations?**
   A: Yes, AllShipAI supports multi-modal logistics, including road, air, sea, and rail. Our platform is designed to handle complex shipping needs, ensuring seamless coordination across different transportation modes.

### faq3 (`src/utils/faq3.ts`)

1. **Q: Does AllShipAI offer predictive analytics for logistics?**
   A: AllShipAI provides advanced predictive analytics that help forecast demand, identify potential delays, and optimize shipping schedules. This allows businesses to make proactive decisions and improve operational efficiency.
2. **Q: How does AllShipAI improve customer satisfaction?**
   A: AllShipAI enhances customer satisfaction by providing real-time tracking, accurate delivery estimates, and streamlined communication between shippers and carriers. This transparency builds trust and improves customer retention.
3. **Q: What are the key features of AllShipAI's dashboard?**
   A: The AllShipAI dashboard offers features such as shipment tracking, route optimization, performance analytics, and carrier management. It’s an intuitive interface that simplifies logistics operations for businesses of all sizes.
4. **Q: Does AllShipAI provide support for e-commerce businesses?**
   A: Absolutely! AllShipAI is designed with e-commerce businesses in mind. We offer tools for order tracking, real-time delivery updates, and integration with popular e-commerce platforms like Shopify and WooCommerce.
5. **Q: Can AllShipAI help with cross-border shipping regulations?**
   A: Yes, AllShipAI provides tools to manage customs documentation and ensures compliance with international shipping regulations. Our platform simplifies cross-border logistics and reduces the risk of delays.

### faq4 (`src/utils/faq4.ts`)

1. **Q: How secure is AllShipAI's logistics management platform?**
   A: AllShipAI ensures top-tier security with data encryption, secure APIs, and compliance with global data protection regulations. Your sensitive business and customer data are fully protected at all times.
2. **Q: What kind of analytics does AllShipAI provide for businesses?**
   A: AllShipAI delivers detailed analytics, including shipment performance, carrier efficiency, and cost analysis. These insights empower businesses to identify inefficiencies and enhance their logistics strategies.
3. **Q: Does AllShipAI integrate with warehouse management systems (WMS)?**
   A: Yes, AllShipAI seamlessly integrates with WMS platforms, enabling businesses to manage inventory, streamline order fulfillment, and synchronize shipping operations with warehouse workflows.
4. **Q: How can I switch my logistics operations to AllShipAI?**
   A: Switching to AllShipAI is easy. Our onboarding specialists guide you through account setup, integration, and customization to ensure a smooth transition and minimal disruption to your operations.
5. **Q: What kind of businesses use AllShipAI for logistics?**
   A: AllShipAI is used by businesses across various industries, including e-commerce, retail, manufacturing, healthcare, and logistics providers. Our flexible platform adapts to the unique needs of each industry.

### faq5 (`src/utils/faq5.ts`)

1. **Q: Does AllShipAI support real-time shipment notifications?**
   A: Yes, AllShipAI offers real-time notifications for shipment status updates. Businesses and customers are informed at every step, improving communication and reducing uncertainty in logistics.
2. **Q: What kind of AI technology powers AllShipAI?**
   A: AllShipAI uses machine learning and artificial intelligence to analyze data, predict trends, and optimize shipping operations. This technology drives smarter decisions and reduces logistics costs.
3. **Q: Can AllShipAI handle perishable goods and temperature-sensitive shipments?**
   A: Absolutely! AllShipAI provides specialized tools to manage perishable goods, including real-time temperature monitoring and optimized routes to ensure the integrity of sensitive shipments.
4. **Q: How can AllShipAI help reduce logistics errors?**
   A: AllShipAI automates key logistics processes, reducing manual errors such as incorrect data entry, missed deliveries, or inefficient routes. This automation improves overall accuracy and reliability.
5. **Q: What is the cost structure for using AllShipAI?**
   A: AllShipAI offers flexible pricing plans based on your business needs. Choose from tiered subscription plans, pay-as-you-go models, or enterprise-level solutions for large-scale logistics operations.

### faq6 (`src/utils/faq6.ts`)

1. **Q: What is AllShipAI?**
   A: AllShipAI is an advanced, AI-powered platform that revolutionizes the shipping and logistics industry. It streamlines the process of finding carriers, managing shipments, and optimizing routes, making shipping more efficient and cost-effective for businesses of all sizes.
2. **Q: How does AllShipAI benefit my business?**
   A: AllShipAI leverages artificial intelligence to automate and enhance your shipping operations. Benefits include reduced shipping costs, faster delivery times, improved route optimization, real-time tracking, and seamless communication between shippers and carriers.
3. **Q: Is AllShipAI suitable for small businesses?**
   A: Absolutely! AllShipAI is designed to cater to businesses of all sizes. Small businesses can particularly benefit from our platform by accessing competitive shipping rates, optimizing their logistics processes, and expanding their reach without significant overhead costs.
4. **Q: What kind of customer support does AllShipAI provide?**
   A: We offer 24/7 customer support through multiple channels, including live chat, email, and phone. Our dedicated support team is always ready to assist you with any questions or issues you may encounter.
5. **Q: Is my data secure with AllShipAI?**
   A: Data security is a top priority for us. AllShipAI employs advanced encryption and security protocols to protect your sensitive information. We comply with industry standards and regulations to ensure your data is safe.
6. **Q: How does AllShipAI's AI optimize shipping routes?**
   A: Our AI algorithms analyze various factors such as distance, traffic patterns, weather conditions, and carrier availability to determine the most efficient shipping routes. This optimization reduces transit times and costs.
7. **Q: Can I schedule pickups and deliveries through AllShipAI?**
   A: Yes, you can schedule pickups and deliveries through AllShipAI. Our platform offers comprehensive logistics management tools that enable you to arrange, track, and manage your shipments seamlessly.
8. **Q: Does AllShipAI integrate with other business software?**
   A: Yes, AllShipAI offers integrations with popular ERP, CRM, and e-commerce platforms, allowing seamless data exchange and workflow automation.
9. **Q: How do I get started with AllShipAI?**
   A: Simply sign up on our website, set up your business profile, and start managing your shipments. Our onboarding team is available to guide you through the process.

---

## 6. Testimonials and reviews

**All testimonials on the site should be treated as fabricated.** None can be traced to real customers.

### 6.1 GoogleReviews cards on /moving (`src/utils/reviews.ts`) — **[FAKE]**, randomuser.me stock avatars, styled as Google reviews

1. **Jane Doe** — Local Guide, 4.8★, "123 reviews", 2 days ago — avatar `https://randomuser.me/api/portraits/women/44.jpg` **[FAKE: randomuser.me stock avatar]**
   > From the moment I called for a quote, the staff was incredibly friendly and patient with all my questions. On moving day, the team arrived early, handled my fragile items with care, and even helped me rearrange furniture in my new place. I felt truly supported throughout the process. Highly recommended for anyone looking for a stress-free move!
2. **John Smith** — Customer, 5★, "98 reviews", 1 week ago — avatar `https://randomuser.me/api/portraits/men/32.jpg` **[FAKE: randomuser.me stock avatar]**
   > I’ve moved several times in the past decade, but this was by far the smoothest experience. The movers were punctual, polite, and worked efficiently. They even took the time to wrap my antique desk and made sure nothing was scratched. I appreciated the constant communication and updates. Would absolutely use them again.
3. **Emily Chen** — Customer, 4.9★, "87 reviews", 3 days ago — avatar `https://randomuser.me/api/portraits/women/65.jpg` **[FAKE: randomuser.me stock avatar]**
   > I was nervous about moving my piano, but the team handled it like true professionals. They brought all the right equipment and reassured me every step of the way. The whole move was finished ahead of schedule, and nothing was damaged. Thank you for making a stressful day so much easier!
4. **David Kim** — Local Guide, 5★, "110 reviews", 5 days ago — avatar `https://randomuser.me/api/portraits/men/41.jpg` **[FAKE: randomuser.me stock avatar]**
   > What stood out to me was the attention to detail. The movers labeled every box, double-checked the inventory, and even gave me tips on unpacking efficiently. They treated my belongings as if they were their own. I felt valued as a customer and will be recommending them to all my friends.
5. **Maria Lopez** — Customer, 4.7★, "76 reviews", 2 weeks ago — avatar `https://randomuser.me/api/portraits/women/68.jpg` **[FAKE: randomuser.me stock avatar]**
   > The team was so cheerful and positive, even when carrying heavy boxes up three flights of stairs! They made what could have been a tiring day actually enjoyable. I especially appreciated how they checked in with me about where to place each item. Great service from start to finish.
6. **Jake Austino** — Customer, 4.7★, "54 reviews", 1 month ago — avatar `https://randomuser.me/api/portraits/men/23.jpg` **[FAKE: randomuser.me stock avatar]**
   > This is my fourth time using this company, and they never disappoint. Every move has been handled with professionalism and care. The movers are always respectful of my home and belongings, and they work quickly without sacrificing quality. I wouldn’t trust anyone else with my moves.
7. **Olivia Brown** — Customer, 4.6★, "65 reviews", 3 weeks ago — avatar `https://randomuser.me/api/portraits/women/12.jpg` **[FAKE: randomuser.me stock avatar]**
   > I had a last-minute change in my moving date, and the office staff was so accommodating. They rescheduled me without any hassle. On moving day, the crew was friendly and efficient, and everything arrived in perfect condition. I’m grateful for their flexibility and professionalism.
8. **Liam Wilson** — Customer, 4.8★, "89 reviews", 4 days ago — avatar `https://randomuser.me/api/portraits/men/56.jpg` **[FAKE: randomuser.me stock avatar]**
   > The movers were right on time and worked tirelessly until the job was done. They even helped me disassemble and reassemble my bed frame, which was a huge help. I was impressed by their teamwork and positive attitude throughout the day.
9. **Sophia Turner** — Local Guide, 5★, "102 reviews", 2 days ago — avatar `https://randomuser.me/api/portraits/women/33.jpg` **[FAKE: randomuser.me stock avatar]**
   > Absolutely perfect! The team took extra care with my artwork and glassware, wrapping everything securely. They were polite, efficient, and made sure I was comfortable with every step. Moving can be overwhelming, but they made it feel easy and even fun.
10. **Noah Martinez** — Customer, 4.9★, "95 reviews", 1 week ago — avatar `https://randomuser.me/api/portraits/men/77.jpg` **[FAKE: randomuser.me stock avatar]**
   > Communication was excellent from the first phone call to the final box being unloaded. The movers kept me updated on their arrival time and checked in throughout the day. I felt like my needs were truly listened to. Highly recommend for anyone who values great service.
11. **Ava Lee** — Customer, 4.7★, "73 reviews", 5 days ago — avatar `https://randomuser.me/api/portraits/women/21.jpg` **[FAKE: randomuser.me stock avatar]**
   > I was worried about moving with two small kids, but the team was so understanding and patient. They worked around nap times and even brought a little treat for my daughter. Everything was packed with care, and nothing was broken. Thank you for going above and beyond!
12. **Mason Clark** — Customer, 4.8★, "80 reviews", 2 weeks ago — avatar `https://randomuser.me/api/portraits/men/12.jpg` **[FAKE: randomuser.me stock avatar]**
   > Very friendly and efficient team. They made sure to protect my floors and walls, and even helped me set up my new living room. I appreciated their attention to detail and willingness to help with the little things.

### 6.2 Rotating hero review on /moving (`src/components/review/Review.tsx`) — **[FAKE]**

Styled with a Google "G" logo and star rating:

1. **Jake Austino**, "Orlando - May 16, 2025" — "It was perfect!" — “It was perfect! This is the 4th time I have used Flat Rate and I’ll use them again if there is a 5th!” (**[FLAG]** names "Flat Rate", a real competing moving company; review was copied from them)
2. **Maria Lopez**, "Miami - Apr 2, 2024" — "Outstanding Service" — “The movers were professional and efficient. Highly recommend!”
3. **John Smith**, "Tampa - Jan 10, 2024" — "Smooth Move" — “Everything went smoothly and on time. Great experience overall.”
4. **Emily Chen**, "Jacksonville - Feb 22, 2024" — "Very Satisfied" — “Very satisfied with the service. Will use again!”
5. **David Kim**, "St. Petersburg - Mar 15, 2024" — "Highly Recommend" — “Friendly staff and careful with my belongings. Highly recommend.”

### 6.3 ClientReviewContent on / — **[FAKE]** (see 2.4)

---

## 7. Unused components that contain copy

### 7.1 TariffSection — moving packages with real price points (`src/components/tariff-section/TariffSection.tsx`, not mounted anywhere)

H1 "Move with Ease: All-Inclusive Moving Packages". Intro: "Discover our transparent, all-in-one moving packages designed to fit every need and budget. Whether you’re moving a studio or a mansion, our expert team ensures a smooth, stress-free experience from start to finish." Each tier has accordions "Who is it for?" and "What you get".

| Tier | Price | Description | Who is it for? | What you get |
|---|---|---|---|---|
| **Basic** | $299 – $699 | Perfect for small apartments or single-room moves. Get the essentials covered with professional care. | Ideal for students, singles, or anyone with minimal belongings needing a quick, efficient move. | 2 professional movers; Standard moving truck; Basic packing materials; Loading & unloading; Up to 3 hours of service |
| **Premium** | $700 – $1899 | A step up for families or larger apartments. Enjoy extra support and more included services. | Great for couples, small families, or those with moderate furniture and boxes. | 3 professional movers; Larger moving truck; Premium packing materials; Furniture disassembly/reassembly; Up to 5 hours of service |
| **Gold** | $2499 – $6,499 | Comprehensive moving for bigger homes. More hands, more time, and more peace of mind. | Best for families, townhouses, or those with specialty items and a full household. | 4 professional movers; Large moving truck; Full packing & unpacking; Specialty item handling (pianos, antiques); Up to 8 hours of service |
| **Elite** | $7499 – $26,499 | The ultimate, all-inclusive package for luxury or long-distance moves. White-glove service from start to finish. | Designed for large homes, luxury moves, or anyone wanting a completely hands-off experience. | 6+ professional movers; Multiple trucks if needed; Complete packing/unpacking; Custom crating & storage; Dedicated move coordinator; No time limits |

Note inconsistent number formatting ($1899 vs $6,499) and gaps between tiers ($1899 → $2499).

### 7.2 SubArticle data (`src/utils/subArticles.ts`, component unused, links point to non-existent routes)

- "Logistics Optimization" — "Learn how AI-driven logistics optimization can help your business streamline operations and reduce overhead costs." → `/logistics-optimization` — remote image `the-role-of-ai.webp`
- "Sustainability in Transportation" — "Discover how AllShipAI is paving the way for greener, more sustainable freight transportation solutions." → `/sustainability-in-transportation` — remote `real-time-tracking.webp`
- "AI Integration" — "Explore how integrating AI into logistics can enhance efficiency, accuracy, and decision-making in your operations." → `/ai-integration` — remote `log-driver.webp`

Other unused components: animation-label, fillout-popup, info-with-icons, landing (duplicate of MovingMain wrapper), load-create (4-step generic create flow, copy captured in section 4.1), location-autocomplete, vertical-stepper.

---

## 8. Blog

- `public/articles/post-1.md` exists but is **empty (0 bytes)**, so the blog has no real content. No article copy to carry over.
- Git history shows the file was touched in several commits ("new changes"); content was never committed or was wiped by the `/add-article` writer.
- Articles are meant to be added through `/add-article` (section 3.22), which writes Markdown with frontmatter: title, metaTitle, metaDescription, slug, keywords, tags, category, excerpt, featureImage, altText, author, publishDate.

---

## 9. Consolidated flags

### 9.1 Typos and copy errors

| Where | Text | Fix |
|---|---|---|
| Home HowItWorks | "Chose & Enjoy" | Choose & Enjoy |
| Home hero paragraph | "AllShipAI your AI-driven shipping ally" | missing "is" |
| /moving sticky CTA | "Get Free Qoute" | Get Free Quote |
| /moving hero H1 | "Move with Ease, with best Moving Company" | grammar |
| /moving results | "To see the founded results you need to sign up" | found |
| Login | "Forgot Dassword?" | Forgot Password? |
| Carrier sign-up | "Doesn't have an account?" | Don't have an account? |
| Header logo alt | "Alshipai Logo" | AllShipAI logo |
| Footer | "support@allship.ai, DE 19702" | email only |
| Footer tooltip | "dont miss out special offers" | don't miss out on special offers |
| Footer column | "Pricing Directs", "Lead Generate" | Pricing, Lead Generation |
| BenefitWrapper | "Why you need to prefer our AI" | rewrite |
| UniversalSection | "Universal choose" | rewrite |
| Load category | "Rvs" | RVs |
| Forms 3–6, 8–10 | "Length/Width/Height (lbs)" | inches/feet |
| Forms 8–10 | "Widht (lbs)" | Width |
| Form 19 Freight | weight field labelled "Length (lbs.)" | Weight (lbs) |
| Form 19 Freight | "Another Load details?" / "Select trailer type" | unit types |
| Form 20 Heavy | "Open Trailer (Cost Loss)" | Cost Less |
| Form 20 Heavy | Divider "Additional " | trailing space, vague |
| Form 21 Rent | "Is needed driver assistance", "Turn checkbox if needs" | rewrite |
| /moving-load step 1 | "Vehicle Load" / "Create a new vehicle load" | Moving Load |
| /why-choose-us | H1 "Project Management" + copy of /pricing | write real page |
| Bid dialog | "fee of service is 10%, so shipper will receive bid -" | rewrite |
| /safety, /ship | "openship.ai" | AllShip AI |
| 404 | "Sorry this page not found", "Go to the main" | rewrite |
| ReadyToGetStarted | "get free bonus!" | undefined promise |
| BenefitWrapper card 4 | label "cost savings" lowercase | COST SAVINGS |

### 9.2 Fabricated or unverifiable claims

- "Used by 20k+ companies" + 5 stars (home and partners hero) — **[FABRICATED]**
- /truck-with-driver stats: "$500k saved", "121 Successful Deliveries", "100% Job Success", "4.8/5 Avg. Google Reviews" — **[FABRICATED]** (and internally inconsistent: 121 deliveries vs "20k+ companies")
- TrustCompanies ratings (Thumbtack/Angi/HomeAdvisor/Yelp/Google/Trustpilot/Yellow Pages/BBB, review counts) — **[FABRICATED]**, also uses third-party logos without permission
- "Join thousands of businesses that trust us" (about) — unverified
- "Our network spans all 50 states" (moving) — unverified
- Comparison vs uShip and Fluid Trucks — unverified, legal risk
- Price chips "AllShipAI 0.5$–1$ / mile vs Other Companies 1$–1.5$ / mile" and route cards "3$ / mile, 1500$ Total" — placeholder numbers, mutually inconsistent
- All testimonials (section 6) — **[FAKE]**; 13 use randomuser.me avatars; one names competitor "Flat Rate"
- "SEYFER" security system, "We use bcrypt", "advanced encryption" — marketing claims with no product backing on the site
- "Comprehensive insurance coverage for all shipments" (safety) — legal claim, verify
- faq3: integration with "Shopify and WooCommerce", customs/cross-border tooling — no such features exist on the site

### 9.3 Real business facts worth keeping

- Carrier dispatch service fee **5.5%** (partners), quick pay and factoring
- Platform fee **10%** on carrier bids (load page)
- Moving package tiers with price ranges (unused TariffSection)
- Moving quote inputs: bedrooms → cubic feet mapping (300/600/950/1300/1650/2000/2300/2600 ft³), packing levels 100/50/25%, storage per month, unpacking
- Carrier requirements: FMCSA compliance, DOT + MC numbers, liability and cargo insurance
- Company: ALLSHIP AI INC, Newark DE address, +1 866 228 2364, support@allship.ai

### 9.4 Security / hygiene (no values reproduced here)

- Hardcoded Google Maps API key in `DirectionsPriceEntity.tsx` and `LoadPage.tsx`
- Hardcoded OpenRouteService API key in `LocationTimeDataForm.tsx`
- Hardcoded admin password for `/add-article` in client bundle (`AddArticle.tsx`); `/api/articles/add` writes files to `public/` unauthenticated server-side
- Login has a hardcoded `http://localhost:3001` fallback

### 9.5 Performance

- Many decorative SVGs are 1–5.5 MB (embedded rasters): `truck.svg` 5.5 MB, `shocked-man.svg`/`rent-truck-bg.svg` 3.1 MB, slider SVGs 1.8 MB each.
- Videos in `src/assets/videos` (up to 11.1 MB) are unused by pages; HowItWorks streams from CDN.

---

## 10. Asset inventory

Every file under `src/assets` and `public` with on-disk size. Filename-based description where meaningful. Files not referenced by any page are still listed (many are unused).

Notable groups:
- `screen-1..5.jpg` — product dashboard screenshots (used on /moving).
- `allshipai-*.jpg` — real-looking crew/truck photos (moving gallery); `allshipai-*.svg/.webp` — benefit-card illustrations.
- `*-load-type-2.webp` — vehicle subtype picker photos; `*-moving-load-type.svg` — moving subtype illustrations.
- `create-load-status-1..4.svg` — stepper illustrations.
- Third-party logos: google-icon, trustpilot-icon, bbb-logo, yp-icon, yelp, home-advisor, angi, thumbtack.
- Videos: `src/assets/videos/*` (marketing/demo clips), `public/video/video-move-ezgif.com-gif-maker.mp4` (moving hero background).

| Path | Size |
|---|---|
| `public/file.svg` | 1 KB |
| `public/globe.svg` | 1 KB |
| `public/next.svg` | 1 KB |
| `public/og-image.png` | 969 KB |
| `public/robots.txt` | 1 KB |
| `public/sitemap.xml` | 2 KB |
| `public/vercel.svg` | 1 KB |
| `public/video/video-move-ezgif.com-gif-maker.mp4` | 3.0 MB |
| `public/window.svg` | 1 KB |
| `src/assets/font/Google-Sans/GoogleSans-Bold.ttf` | 115 KB |
| `src/assets/font/Google-Sans/GoogleSans-BoldItalic.ttf` | 118 KB |
| `src/assets/font/Google-Sans/GoogleSans-Italic.ttf` | 118 KB |
| `src/assets/font/Google-Sans/GoogleSans-Medium.ttf` | 116 KB |
| `src/assets/font/Google-Sans/GoogleSans-MediumItalic.ttf` | 118 KB |
| `src/assets/font/Google-Sans/GoogleSans-Regular.ttf` | 117 KB |
| `src/assets/images/16-feet-boxtruck.svg` | 189 KB |
| `src/assets/images/16-feet-truck.svg` | 189 KB |
| `src/assets/images/6-feet-boxtruck.svg` | 201 KB |
| `src/assets/images/6-feet-truck.svg` | 201 KB |
| `src/assets/images/ai-1.jpg` | 54 KB |
| `src/assets/images/allshipai-1-8.jpg` | 113 KB |
| `src/assets/images/allshipai-1.jpg` | 141 KB |
| `src/assets/images/allshipai-1.svg` | 1.6 MB |
| `src/assets/images/allshipai-10.jpg` | 194 KB |
| `src/assets/images/allshipai-10.svg` | 1.1 MB |
| `src/assets/images/allshipai-11.jpg` | 186 KB |
| `src/assets/images/allshipai-11.svg` | 1.6 MB |
| `src/assets/images/allshipai-12.jpg` | 113 KB |
| `src/assets/images/allshipai-12.webp` | 198 KB |
| `src/assets/images/allshipai-13.jpg` | 109 KB |
| `src/assets/images/allshipai-13.svg` | 1.6 MB |
| `src/assets/images/allshipai-14.jpg` | 108 KB |
| `src/assets/images/allshipai-14.svg` | 952 KB |
| `src/assets/images/allshipai-15.jpg` | 141 KB |
| `src/assets/images/allshipai-15.svg` | 847 KB |
| `src/assets/images/allshipai-16.jpg` | 178 KB |
| `src/assets/images/allshipai-17.jpg` | 128 KB |
| `src/assets/images/allshipai-2.jpg` | 220 KB |
| `src/assets/images/allshipai-2.webp` | 111 KB |
| `src/assets/images/allshipai-3.jpg` | 214 KB |
| `src/assets/images/allshipai-3.svg` | 1.6 MB |
| `src/assets/images/allshipai-4.jpg` | 225 KB |
| `src/assets/images/allshipai-4.svg` | 1.0 MB |
| `src/assets/images/allshipai-5.jpg` | 168 KB |
| `src/assets/images/allshipai-5.webp` | 107 KB |
| `src/assets/images/allshipai-6.jpg` | 183 KB |
| `src/assets/images/allshipai-6.svg` | 1.1 MB |
| `src/assets/images/allshipai-7.jpg` | 124 KB |
| `src/assets/images/allshipai-7.svg` | 1.0 MB |
| `src/assets/images/allshipai-8.webp` | 115 KB |
| `src/assets/images/allshipai-9.jpg` | 132 KB |
| `src/assets/images/allshipai-9.svg` | 322 KB |
| `src/assets/images/angi.png` | 18 KB |
| `src/assets/images/atv-load-type-2.webp` | 5 KB |
| `src/assets/images/avatar-client-1.svg` | 74 KB |
| `src/assets/images/avatar-client-2.svg` | 92 KB |
| `src/assets/images/avatar-client-3.jpg` | 60 KB |
| `src/assets/images/avatar-client-4.jpg` | 39 KB |
| `src/assets/images/bbb-logo.svg` | 2 KB |
| `src/assets/images/bg-rent-truck.svg` | 1 KB |
| `src/assets/images/broker.svg` | 245 KB |
| `src/assets/images/business-moving-load-type.svg` | 962 KB |
| `src/assets/images/call-center.jpg` | 49 KB |
| `src/assets/images/car-load-type-2.webp` | 4 KB |
| `src/assets/images/carrier.svg` | 856 KB |
| `src/assets/images/carrier01.jpg` | 57 KB |
| `src/assets/images/client-trusted.svg` | 491 KB |
| `src/assets/images/commercial-truck-load-type-2.webp` | 4 KB |
| `src/assets/images/companies.svg` | 61 KB |
| `src/assets/images/corporate-moving-load-type.svg` | 1.0 MB |
| `src/assets/images/create-load-status-1.svg` | 1 KB |
| `src/assets/images/create-load-status-2.svg` | 1 KB |
| `src/assets/images/create-load-status-3.svg` | 1 KB |
| `src/assets/images/create-load-status-4.svg` | 1 KB |
| `src/assets/images/dispatch2.png` | 2.9 MB |
| `src/assets/images/easy-shipping-illustration.svg` | 1.6 MB |
| `src/assets/images/eco-friendly.jpg` | 116 KB |
| `src/assets/images/freight-category-image.svg` | 123 KB |
| `src/assets/images/google-icon.svg` | 79 KB |
| `src/assets/images/heavy-construction-category.svg` | 773 KB |
| `src/assets/images/heavy-moving-load-type.svg` | 1.1 MB |
| `src/assets/images/home-advisor.jpg` | 186 KB |
| `src/assets/images/home-advisor.svg` | 248 KB |
| `src/assets/images/household-load-type.svg` | 1.0 MB |
| `src/assets/images/landing-page-slide-2.svg` | 1.8 MB |
| `src/assets/images/landing-page-slide-3.svg` | 1.8 MB |
| `src/assets/images/local-moving-load-type.svg` | 846 KB |
| `src/assets/images/long-distance-moving-load-type.svg` | 1022 KB |
| `src/assets/images/military-moving-load-type.svg` | 1.2 MB |
| `src/assets/images/moto-load-type-2.webp` | 5 KB |
| `src/assets/images/moving-category-image.svg` | 230 KB |
| `src/assets/images/moving-solutions.jpg` | 92 KB |
| `src/assets/images/moving.jpg` | 72 KB |
| `src/assets/images/nationwide.jpg` | 85 KB |
| `src/assets/images/office-moving-load-type.svg` | 1.0 MB |
| `src/assets/images/online-booking.jpg` | 53 KB |
| `src/assets/images/parts-load-type-2.webp` | 6 KB |
| `src/assets/images/personal-watercrafts-load-type-2.webp` | 2 KB |
| `src/assets/images/powerboats-load-type-2.webp` | 3 KB |
| `src/assets/images/rate-icon.svg` | 65 KB |
| `src/assets/images/rating-icon.svg` | 26 KB |
| `src/assets/images/rent-truck-bg.svg` | 3.0 MB |
| `src/assets/images/rv-load-type-2.webp` | 4 KB |
| `src/assets/images/sailboat-load-type-2.webp` | 3 KB |
| `src/assets/images/screen-1.jpg` | 250 KB |
| `src/assets/images/screen-2.jpg` | 314 KB |
| `src/assets/images/screen-3.jpg` | 92 KB |
| `src/assets/images/screen-4.jpg` | 290 KB |
| `src/assets/images/screen-5.jpg` | 156 KB |
| `src/assets/images/shipper.svg` | 668 KB |
| `src/assets/images/shocked-man.svg` | 3.0 MB |
| `src/assets/images/sliderImage1.svg` | 557 KB |
| `src/assets/images/sprinter-truck.svg` | 215 KB |
| `src/assets/images/student-moving-load-type.svg` | 1.1 MB |
| `src/assets/images/thumbtack.png` | 7 KB |
| `src/assets/images/trailer-load-type-2.webp` | 3 KB |
| `src/assets/images/transparent-pricing.jpg` | 46 KB |
| `src/assets/images/transparent-pricing.svg` | 1.6 MB |
| `src/assets/images/truck-animation.svg` | 4 KB |
| `src/assets/images/truck.svg` | 5.5 MB |
| `src/assets/images/trustpilot-icon.svg` | 43 KB |
| `src/assets/images/vehicle-category.png` | 787 KB |
| `src/assets/images/vehicles-category-image.svg` | 1.4 MB |
| `src/assets/images/yelp.png` | 65 KB |
| `src/assets/images/yelp.svg` | 17 KB |
| `src/assets/images/yp-icon.svg` | 196 KB |
| `src/assets/logo/logo-grey.svg` | 14 KB |
| `src/assets/logo/logo.svg` | 14 KB |
| `src/assets/videos/allship-video-2.MP4` | 3.6 MB |
| `src/assets/videos/allship-video-3.MP4` | 430 KB |
| `src/assets/videos/allshipai-video-16.MP4` | 11.1 MB |
| `src/assets/videos/allshipai-video-4.MP4` | 1.3 MB |
| `src/assets/videos/project-example2.mp4` | 1.3 MB |
| `src/assets/videos/projectExample5demo.mp4` | 3.4 MB |

Remote images (not in repo; served from `$NEXT_PUBLIC_IMAGE_URL_PUBLIC`, indexes used by `AllShipAIImages[n]`): 0 openshipai-img-1.webp, 1 -2, 2 -3, 3 -4, 4 -5, 5 -6, 6 -7, 7 -8, 8 -9, 9 -10, 10 lighting-fast-logistics.svg, 11 analyse-road-data.svg, 12 auto-transport-delivery.svg, 13 adaptive-weather-planning.svg, 14 american-truck.jpg, 15 real-time-tracking.jpg, 16 american-truck.jpg, 17 log-driver.webp, 18 real-time-tracking.webp, 19 the-role-of-ai.webp. These need to be downloaded from the live site/CDN if the rewrite wants them.

---

## Appendix A — Terms and Conditions (verbatim, `src/app/terms-and-conditions/page.tsx`)

#### 1. Description block — "Terms and Conditions"

> Our terms and conditions outline the use of AI in transportation, ensuring transparency, compliance, and ethical practices. By using AllShipAI’s services, you agree to adhere to these principles and ensure responsible usage.

**1. Transparency**

Transparency is a cornerstone of AllShipAI’s operations. We ensure that all AI-driven processes are documented and accessible, providing clear information on how data is processed, analyzed, and utilized. Specifically:

- Providing detailed documentation for all automated decision-making processes.
- Ensuring that users have access to insights generated by AI tools.
- Regularly publishing updates and changes to algorithms and their intended uses.

**2. Compliance**

AllShipAI’s AI systems comply with industry standards and regional regulations, including but not limited to:

- Adherence to GDPR, CCPA, and similar global data privacy laws.
- Regular audits to ensure alignment with evolving compliance requirements.
- Ensuring that transportation practices meet local and international legal standards.

**3. Ethical Practices**

Our commitment to ethical AI ensures that our technology benefits users without causing harm. This includes:

- Avoiding biases in AI decision-making by conducting regular evaluations.
- Promoting fair treatment of all users, including shippers and carriers.
- Implementing safeguards to prevent misuse of AI technology.

**4. User Responsibilities**

All users of AllShipAI’s platform are expected to uphold the integrity and security of the system. Users must:

- Provide accurate information for shipments and other operations.
- Avoid attempting to manipulate or exploit AI-driven processes.
- Report any suspicious activities or potential security breaches immediately.

**5. Data Ownership and Security**

AllShipAI respects your ownership of data while ensuring its security through advanced measures. Key points include:

- Users retain ownership of data provided to AllShipAI, with explicit consent for its usage.
- Data is secured using encryption, regular security audits, and access controls.
- User data will not be sold or misused under any circumstances.

**6. Limitations of Liability**

While AllShipAI strives to provide accurate and reliable services, certain limitations apply:

- AllShipAI is not liable for damages arising from user error or misuse of the platform.
- Service interruptions due to unforeseen circumstances, such as technical issues, are addressed promptly but may cause temporary delays.
- Users are responsible for compliance with laws and regulations relevant to their operations.

**7. Dispute Resolution**

In the event of disputes, AllShipAI encourages resolution through communication. If necessary, formal measures include:

- Mediation services to facilitate agreement between parties.
- Binding arbitration as a final step in unresolved disputes.
- Ensuring that all dispute resolutions are conducted fairly and transparently.

**8. Updates to Terms and Conditions**

AllShipAI reserves the right to update these terms as needed. Notifications for updates will include:

- Email alerts to registered users regarding significant changes.
- Prominent notices on our website for transparency.
- Regular reminders to review terms for continued compliance.

**9. Contact Us**

For inquiries, support, or clarification regarding these terms, users can contact AllShipAI through:

- Email: support@AllShipAI.com
- Phone: +1-800-555-TRANSPORT
- Address: 123 Logistics Lane, Innovation City, USA.

**10. SMS Consent (Opt-In) & Data Processing**

By providing your phone number and explicitly opting in (e.g., checking a box on a form or confirming via SMS code), you consent to receive non-marketing service-related messages from AllShipAI, such as delivery updates, account notices, and customer support responses.

- Message purpose: transactional SMS only (delivery updates, account notices, reminders, and support).
- We do not send promotional or marketing SMS messages without your explicit, separate consent.
- Message frequency depends on user activity (e.g., several updates per order).
- Standard carrier message and data rates may apply.
- Opt-out: reply with STOP, END, CANCEL, UNSUBSCRIBE, or QUIT to stop receiving messages. Reply HELP for assistance.
- Consent is not a condition of purchase or service use.
- Processed data: phone number, SMS content, timestamps, delivery info, and technical metadata (IP, device, etc.).
- We use Twilio only as a service provider (data processor) to deliver messages. Twilio has no right to reuse or share data.
- We never sell, transfer, or share opt-in data for marketing or unrelated purposes.
- Retention & security: SMS data is securely stored and deleted or anonymized when no longer needed for legal or operational purposes.
- Consent records include method, timestamp, policy version, and IP/device for compliance purposes.
- To withdraw consent or request deletion, reply STOP or contact privacy@allship.ai.


## Appendix B — Privacy Policy (verbatim, `src/app/privacy-policy/page.tsx`)

#### 1. Description block — "Privacy Policy"

> At AllShipAI, protecting your privacy is our top priority. This Privacy Policy explains how we collect, use, and safeguard your information when you use our services. We do not sell, transfer, or share user consent or personal data with any third parties for marketing or promotional purposes. AllShipAI complies with applicable privacy regulations, including GDPR and CCPA.

**1. Data Collection and Usage**

We collect only the data necessary to provide our logistics and communication services. This includes:

- Contact information such as name, email address, and phone number for account setup and communication.
- Shipping details for coordinating and optimizing logistics operations.
- Payment details for secure transaction processing.
- Technical and usage data to maintain and improve platform functionality.

**2. Data Protection Measures**

We implement strict security measures to protect your data from unauthorized access, alteration, or disclosure. These include:

- Data encryption in transit and at rest.
- Strict internal access controls.
- Regular security audits and compliance reviews.
- Storage on secure, monitored servers.

**3. Use of Service Providers**

We work with a limited number of trusted service providers that process information on our behalf to deliver our services. These providers act solely under our instructions and do not have independent rights to use your information. Examples include:

- Payment processors for handling transactions securely.
- Logistics partners for shipment tracking and delivery coordination.
- Communication providers (e.g., Twilio) for sending authorized service messages.
- Legal or regulatory authorities when required by law.

**4. No Sale or Transfer of Consent**

AllShipAI does not sell, share, transfer, or exchange customer consent data with any third parties. User opt-in consent for communications is collected directly by AllShipAI and used exclusively to provide the services you have requested.

**5. Cookies and Tracking Technologies**

We use cookies to enhance site functionality and improve your user experience. Cookies are used only for session management, analytics, and preferences—not for selling or sharing data with advertisers.

**6. Your Rights**

You may request access, correction, or deletion of your data at any time. You can also withdraw consent for communications without affecting your access to our services. Contact us at privacy@allship.ai for assistance.

**7. SMS Consent (Opt-In) & Data Processing**

By providing your phone number and explicitly opting in (e.g., checking a box or confirming via SMS code), you consent to receive non-marketing, service-related messages from AllShipAI (such as order confirmations, delivery updates, and support notices).

- We do not send promotional or marketing SMS messages without your explicit, separate consent.
- Message frequency depends on your activity (e.g., shipment updates or confirmations).
- Standard carrier message and data rates may apply.
- Opt-out: reply STOP, END, CANCEL, UNSUBSCRIBE, or QUIT to stop receiving messages. For help, reply HELP.
- Consent is not a condition of purchase.
- We use Twilio as a technical service provider (processor) to deliver messages. Twilio does not have permission to use your data for any other purpose.
- We do not sell, exchange, or share opt-in data with any third parties.
- We store SMS-related data (phone number, timestamps, message content, delivery status) only as long as necessary for compliance and operations, then delete or anonymize it.
- All opt-in records include time, date, method, and version of consent text for audit and compliance.
- To withdraw consent or request deletion, contact us at privacy@allship.ai.

**8. Policy Updates**

We may update this Privacy Policy as needed to reflect changes in our services or legal requirements. Significant updates will be communicated clearly on our website and by email when appropriate.

**9. Contact Us**

If you have questions about this policy or your data, contact us at privacy@allship.ai.


## Appendix C — Cookie Policy (verbatim, `src/app/cookie-policy/page.tsx`)

#### 1. Description block — "Cookie Policy for AllShipAI"

> At AllShipAI, we prioritize your privacy and ensure transparency in how we use cookies. This Cookie Policy outlines how we use cookies and similar technologies to enhance your experience on our platform. By continuing to use our site, you consent to the use of cookies as described in this policy.

**3. Third-Party Cookies**

We use a limited number of trusted third-party service providers who may place cookies on your device strictly to support our platform functionality and analytics. These cookies do not collect personally identifiable information unless explicitly provided by you. Specifically:

- Analytics tools (e.g., Google Analytics) to understand how users interact with our platform and improve performance.
- Embedded content (e.g., videos, support widgets) that may require functional cookies.
- No advertising cookies or tracking for third-party marketing is used without your separate, explicit consent.

**4. Managing Cookies**

You have control over how cookies are used on your device. Here’s how you can manage them:

- Most browsers allow you to accept, reject, or delete cookies through their settings.
- You can set preferences to block certain types of cookies or receive alerts before a cookie is placed.
- Keep in mind that disabling cookies may affect the functionality of our platform and limit certain features.

**5. Data Collected Through Cookies**

Cookies may collect technical and usage data to improve your experience. This includes:

- IP addresses and general geolocation to optimize regional services.
- Device and browser type to ensure compatibility and troubleshooting.
- Usage patterns such as pages visited and session duration, used only for internal analytics.

**6. Cookie Consent**

By using the AllShipAI platform, you agree to the use of cookies as described in this policy. You can manage or withdraw your consent at any time via your browser settings or by contacting us directly. We do not use cookies to sell, share, or transfer your data to third parties for advertising or promotional purposes.

**7. Updates to This Cookie Policy**

AllShipAI may update this Cookie Policy periodically to reflect changes in practices or legal requirements. Key updates will be communicated through:

- Notifications on our website.
- Email alerts to registered users.
- Revisions to the effective date at the top of this policy.

**8. Contact Us**

For questions or concerns regarding our Cookie Policy, please reach out to us via:

- Email: allship.inc@gmail.com
- Address: 123 Logistics Lane, Innovation City, USA
- Support Portal: Visit our Help Center for additional assistance.

