# FORTHEPEOPLE.IN — UNIFIED MASTER BLUEPRINT
# ═══════════════════════════════════════════════════════════
# SINGLE SOURCE OF TRUTH — Combines original + all addendums
# Claude Code: Read this file at the start of EVERY session.
# Generic for ANY Indian district. Pilot: Mandya, Karnataka.
# Last updated: March 28, 2026
# ═══════════════════════════════════════════════════════════

## PROJECT IDENTITY

```
Name:           ForThePeople.in
Tagline:        "Your District. Your Data. Your Right."
Domain:         forthepeople.in
Pilot Focus:    Mandya District, Karnataka
Scalable To:    All 780+ districts across 28 states & 8 UTs
Languages:      English + Regional (Kannada for pilot, expandable via next-intl)
Theme:          LIGHT — minimal, clean, modern, airy (dark mode toggle also available)
License:        Open source (MIT)
Legal Status:   Uses ONLY publicly available government data
                NOT an official government website
GitHub:         https://github.com/jayanthmb14/forthepeople (private)
```

## LEGAL PROTECTION (CRITICAL)

```
LEGALLY SAFE BECAUSE:
1. RIGHT TO INFORMATION: Article 19(1)(a) of the Indian Constitution
2. OPEN DATA POLICY: data.gov.in operates under NDSAP — designed for public reuse
3. NO COPYRIGHTED CONTENT: Government data is public domain (Copyright Act §52(1)(q))
4. NO IMPERSONATION: Site clearly states it is NOT a government website

MANDATORY DISCLAIMERS (every page):
  EN: "ForThePeople.in is an independent citizen transparency initiative.
       This is NOT an official government website. All data is sourced from
       publicly available government portals under India's Open Data Policy (NDSAP)."
  Footer: "Data sourced under NDSAP | Built with ❤️ for the citizens of India"

NEVER DO:
  ✗ Use government logos/emblems (Ashoka emblem, state seals)
  ✗ Claim to be an official government service
  ✗ Store personal citizen data (Aadhaar, PAN, etc.)
  ✗ Display full copyrighted news articles (headlines + links only)
  ✗ Charge money for accessing government data
  ✗ Scrape faster than 1 request per 2-3 seconds
```

---

## UI/UX DESIGN SYSTEM

```
AESTHETIC:    Clean editorial — Linear.app, Vercel, Stripe inspired
THEME:        Light + Dark mode. Default: light.

FONTS (Google Fonts — all free):
  English:    "Plus Jakarta Sans"
  Regional:   "Noto Sans Kannada" (pilot) — swap per state using Noto Sans family
  Monospace:  "JetBrains Mono" (data/numbers)

COLOR PALETTE:
  Background:     #FAFAF8  (warm off-white)
  Surface:        #FFFFFF  (cards)
  Border:         #E8E8E4  (soft warm gray)
  Text Primary:   #1A1A1A  (near-black)
  Text Secondary: #6B6B6B  (medium gray)
  Text Muted:     #9B9B9B  (light gray)
  Accent Blue:    #2563EB  (primary actions)
  Accent Green:   #16A34A  (success/positive)
  Accent Amber:   #D97706  (warning/in-progress)
  Accent Red:     #DC2626  (error/negative/wasted funds)
  Accent Purple:  #7C3AED  (planned/upcoming)
  Hover BG:       #F5F5F0
  Selected BG:    #EFF6FF

SPACING & COMPONENTS:
  Card padding: 24px | Section gap: 32px | Card radius: 16px | Small radius: 8px
  Card shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)
  Progress bars: 8px height, pill-shaped (border-radius: 99px)
  Tables: zebra-striped, no heavy borders
  Charts: accent colors only, no gradients
  Icons: Lucide React (20px default)
  Animations: subtle fade-in only (200ms ease)
  Mobile-first: works on ₹8000 phones, min tap target 44×44px
  Numbers: ALWAYS in JetBrains Mono (.font-data class)
  Font weights: max 2 per section (400 regular + 600 semibold)
```

Tailwind v4 — all tokens in `src/app/globals.css` `@theme {}` block (NO tailwind.config.ts).

---

## TECH STACK

```
Framework:    Next.js 16.1.7 (App Router, TypeScript, src/ directory)
React:        19.2.3
CSS:          Tailwind CSS v4 (CSS-based config, tokens in globals.css @theme)
ORM:          Prisma 7.5.0 with prisma-client-js generator
DB adapter:   @prisma/adapter-pg (PrismaPg class)
Database:     Neon PostgreSQL (production) / local Postgres via Prisma dev proxy (dev)
Cache:        @upstash/redis (production) + ioredis (scraper/scheduler)
State:        @tanstack/react-query v5 + zustand v5
Charts:       recharts v3
Maps:         react-simple-maps + topojson-client (India map, SVG)
              Leaflet.js via TalukMap (district taluk drill-down)
Icons:        lucide-react
i18n:         next-intl v4
Payments:     razorpay SDK + Razorpay Live checkout
Email:        resend v6 (2FA recovery emails)
2FA:          otpauth + qrcode (Google Authenticator TOTP)
Scraping:     cheerio + puppeteer + node-cron + bullmq
AI providers: @anthropic-ai/sdk + @google/generative-ai
Encryption:   AES-256-CBC (Node.js crypto) via src/lib/encryption.ts
Date:         date-fns v4
```

### Key Library Notes
- `@upstash/redis` (NOT ioredis) for Vercel cache
- `ioredis` is used only in the scraper scheduler (Railway container)
- `recharts` Tooltip `formatter` must not type-param `(v: number)` — use `(v)` + `Number(v)` cast
- `react-simple-maps`: portrait viewBox 800×900, scale=900, center=[82.5,23] for India
- GeoJSON exterior rings MUST be CW (clockwise winding) for d3-geo, despite RFC7946 claiming CCW

---

## DISTRICT HIERARCHY & ROUTING

```
LEVEL 0: Country     → forthepeople.in/
LEVEL 1: State       → forthepeople.in/karnataka/
LEVEL 2: District    → forthepeople.in/karnataka/mandya/
LEVEL 3: Taluk/Block → forthepeople.in/karnataka/mandya/srirangapatna/
LEVEL 4: Village     → forthepeople.in/karnataka/mandya/srirangapatna/ganjam/

GENERIC STRUCTURE:
  India → ~28 states + 8 UTs → ~780 districts → ~6,000+ taluks → ~640,000 villages
  Each district shows THE SAME 29 dashboard modules, scoped to that district's data.
  Taluk pages: same modules filtered to taluk. Village pages: simplified view.

LOCK BEHAVIOR:
  Active district:  Full data, clickable
  Locked district:  Grayed out, "🔒 Coming Soon"

PILOT: Mandya, Karnataka — 7 Taluks:
  1. Mandya (ಮಂಡ್ಯ) — "Sugar Capital of Karnataka"
  2. Maddur (ಮದ್ದೂರು) — "Gateway to Old Mysore"
  3. Malavalli (ಮಳವಳ್ಳಿ) — "Land of Temples & Tanks"
  4. Srirangapatna (ಶ್ರೀರಂಗಪಟ್ಟಣ) — "Tipu Sultan's Island Fortress"
  5. Nagamangala (ನಾಗಮಂಗಲ) — "Heart of the Deccan Plateau"
  6. K R Pete (ಕೆ.ಆರ್.ಪೇಟೆ) — "Jewel of the Kaveri Basin"
  7. Pandavapura (ಪಾಂಡವಪುರ) — "Where the Pandavas Rested"
```

---

## COMPLETE SIDEBAR NAVIGATION (29 MODULES)

```
📊 Overview                    — District summary, stats grid, weather widget, alerts, leaders, infra, finance, police, news, taluk map, module grid
🗺️ Interactive Map             — react-simple-maps India SVG + Leaflet.js Mandya taluk drill-down
👥 Leadership & Hierarchy      — 10-tier org chart: MP, MLAs, DC, SP, District Judge, etc.
🚰 Water & Dams                — Live KRS dam levels, inflow/outflow, canal releases
🏭 Local Industries            — Sugar factories (Mandya-specific), with crushing data
💰 Finance & Budget            — Budget breakdown (Crores), lapsed funds, revenue collection
🌾 Crop Prices (Live)          — Real-time mandi prices from AGMARKNET (DATA_GOV_API_KEY)
📈 Population & Demographics   — Census 2011 data, literacy, sex ratio, urban/rural trends
🌦️ Weather & Rainfall          — Live weather (OpenWeatherMap), historical rainfall
👮 Police & Traffic             — Station directory, traffic revenue, crime stats
📋 Government Schemes          — Active central/state schemes, eligibility, apply links
📋 Services Guide              — "How do I get ___?" step-by-step for certificates
📊 Elections                   — Results by constituency, representative, turnout, booth finder
🚌 Transport                   — Bus routes, train schedule, auto fare chart
💧 Water Supply (JJM)          — Jal Jeevan Mission tap connection coverage
🏠 Housing Schemes             — PMAY tracker, completion rates
⚡ Power & Outages             — Scheduled power cuts, BESCOM outage tracker
🎓 Schools                     — Performance dashboard, SSLC board results
🌾 Farm Advisory               — Soil health cards, KVK crop advisory, agri tips
🏛️ RTI Tracker                 — Filing trends, department-wise response time
📜 File RTI                    — Guided wizard with pre-drafted RTI templates
🏘️ Gram Panchayat             — Village-level MGNREGA, fund utilization, GP data
⚖️ Courts & Judiciary          — Case pendency, disposal rates, court directory
🏥 Health                      — Hospital directory, bed count, doctor ratio
⚠️ Local Alerts                — Real-time advisories (auto-expires after 14 days)
🏢 Offices & Services          — Govt office directory with hours, "Open Now" indicator
🤝 Citizen Corner              — Responsibility tips, helplines, RTI templates
📰 News & Updates              — Aggregated local news (AI dedup, AI insights badge)
🔗 Data Sources                — All official sources with scraping status
```

All module pages are at: `src/app/[locale]/[state]/[district]/[module]/page.tsx`

---

## DATABASE SCHEMA (48+ PRISMA MODELS)

Generator: `provider = "prisma-client-js"`, output: `"../src/generated/prisma"`
Imports: `from '@/generated/prisma'`
Config: `prisma.config.ts` at project root (Prisma 7 — NO `url` in datasource block)
Adapter: `new PrismaPg({ connectionString })` from `@prisma/adapter-pg`

### Core Hierarchy
- `State` — id, name, nameLocal, slug, active, capital
- `District` — id, stateId, name, nameLocal, slug, tagline, active, population, area, talukCount, villageCount, literacy, sexRatio, density, avgRainfall + 40 relation arrays
- `Taluk` — id, districtId, name, nameLocal, slug, population, area, villageCount
- `Village` — id, talukId, name, nameLocal, slug, population, households, pincode, lat, lng

### Data Models (per district)
- `Leader` — tier (1-10), name, role, party, constituency, phone, email, since, photoUrl
- `InfraProject` — name, category, budget, fundsReleased, progressPct, status, contractor, startDate, expectedEnd
- `BudgetEntry` — fiscalYear, sector, allocated, released, spent
- `BudgetAllocation` — fiscalYear, department, scheme, category, allocated, released, spent, lapsed
- `RevenueEntry` / `RevenueCollection` — monthly revenue by category
- `CropPrice` — commodity, variety, market, minPrice, maxPrice, modalPrice, arrivalQty, date (AGMARKNET)
- `WeatherReading` — temp, feelsLike, humidity, windSpeed, conditions, rainfall, pressure
- `RainfallHistory` — year, month, rainfall, normal, departure
- `PopulationHistory` — year, total, rural, urban, literacy, sexRatio, density
- `PoliceStation` — name, type, sho, phone, address, lat, lng, jurisdiction
- `TrafficCollection` — month, revenue, vehicles, fines
- `CrimeStat` — year, category, cases, solved
- `Scheme` — name, category, department, beneficiaries, budget, status
- `ServiceGuide` — service, steps, duration, fee, documents, department
- `GramPanchayat` — name, taluk, population, mgnregaDemand, mgnregaWorkDays, fundsReceived
- `RtiStat` — year, totalFiled, totalPending, avgResponseDays, departmentWise
- `CourtStat` — year, totalPending, totalDisposed, civilPending, criminalPending
- `NewsItem` — title, summary, url, source, category, publishedAt, imageUrl, aiAnalyzed
- `DamReading` — dam name, storageLevel, fullCapacity, inflow, outflow, rainfall
- `CanalRelease` — canal name, releaseDate, flowRate, reason, duration
- `SugarFactory` — name, capacity, crushingSeasonStart/End, cane crushed, recovery%
- `LocalAlert` — title, type, severity, message, active, createdAt (auto-expires >14 days)
- `GovOffice` — name, type, address, phone, hours, openNow, lat, lng
- `ElectionResult` — constituency, year, type, winnerName, winnerParty, winnerVotes, margin
- `PollingBooth` — boothId, name, address, totalVoters, maleFemaleRatio
- `BusRoute` / `TrainSchedule` — transport schedules
- `JJMStatus` — taluk, habitationsTotal, covered, coveragePct
- `HousingScheme` — scheme, category, sanctioned, completed, underConstruction
- `PowerOutage` — area, reason, startTime, endTime, duration, active
- `School` / `SchoolResult` — UDISE data, student/teacher counts, board results
- `SoilHealth` / `AgriAdvisory` — soil pH/NPK, weekly crop advisories
- `RtiTemplate` — topic, department, PIO address, fee, template text
- `FamousPersonality` — name, category, bio, photoUrl, birthYear, bornInDistrict
- `Feedback` — type, module, subject, message, email, status, adminNote
- `MarketData` — SENSEX, NIFTY, GOLD, SILVER, USD_INR, CRUDE prices

### AI & Intelligence Models
- `AIInsight` — districtId, module, headline, summary, sentiment, confidence, sourceUrls, approved
- `ReviewQueue` — insightId, status (pending/approved/rejected), reviewerNote
- `NewsIntelligenceLog` — phase, status, tokensUsed, durationMs, aiProvider, aiModel
- `SharedAIInsight` — scope, module, insight, variables, expiresAt
- `FactCheck` — districtId, module, status, totalItems, issuesFound, staleItems, duplicates, results (Json), aiProvider, durationMs

### Payments
- `Contribution` — razorpayOrderId, razorpayPaymentId, name, email, amount (paise), tier, status
- `Supporter` — name, email, phone, amount (₹), tier, paymentId, method, razorpayData

### System & Admin
- `ScraperLog` — jobName, status, recordsNew, recordsUpdated, duration, error
- `DataRefresh` — endpoint, lastRefreshed, nextRefresh, status
- `DistrictRequest` — stateName, districtName, requestCount
- `AdminAPIKey` — provider (gemini/anthropic/anthropic_official/razorpay_*), encryptedKey (AES-256), isActive
- `AIProviderSettings` — singleton: activeProvider, geminiModel, anthropicModel, anthropicBaseUrl, anthropicSource, fallbackEnabled, totalCalls
- `AdminAuth` — singleton: totpSecret (encrypted), totpEnabled, totpVerifiedAt, recoveryEmail, recoveryPhone, backupCodes (encrypted JSON), lastLoginAt, failedAttempts, lockedUntil

---

## AI PROVIDER SYSTEM

### Architecture
All AI calls go through `src/lib/ai-provider.ts` → `callAI()` and `callAIJSON()` unified gateway.

### Three Provider Sources
```
1. OpusCode.pro (Anthropic proxy)
   activeProvider = "anthropic", anthropicSource = "opuscode"
   Key stored as: provider = "anthropic" in AdminAPIKey
   Base URL: process.env.ANTHROPIC_BASE_URL (must be set in env) || settings.anthropicBaseUrl

2. Official Anthropic
   activeProvider = "anthropic", anthropicSource = "official"
   Key stored as: provider = "anthropic_official" in AdminAPIKey
   Base URL: "https://api.anthropic.com"

3. Google Gemini
   activeProvider = "gemini"
   Key stored as: provider = "gemini" in AdminAPIKey
   Default model: gemini-2.5-flash
```

### Key Resolution Priority
1. DB-stored encrypted key (AdminAPIKey where provider = keyName, isActive = true)
2. Env var fallback: ANTHROPIC_API_KEY or GEMINI_API_KEY
3. Returns null → AI call fails gracefully

### Base URL Priority (CRITICAL — env var MUST take priority over DB default)
```typescript
process.env.ANTHROPIC_BASE_URL || settings.anthropicBaseUrl || "https://api.anthropic.com"
```

### Fallback
If primary provider fails, auto-falls back to `fallbackProvider` (DB setting).
`callAIJSON<T>()` returns `{ data: T, provider: string, model: string }`.

### Models
- Gemini: `gemini-2.5-flash` (default), `gemini-2.0-flash`, `gemini-1.5-pro`
- Anthropic: `claude-opus-4-6` (default), `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`

### AI Uses in the App
- News Intelligence Pipeline: analyze news → extract module-relevance → generate AIInsight
- Fact Checker: verify leadership, budget, infrastructure, demographics, courts, alerts vs AI knowledge
- Data Verifier: QA check for data completeness & plausibility
- AI Insight Cards: per-module AI summary badges on district pages
- Citizen Tips: AI-generated district-specific civic tips
- Public AI Narrative: /api/public/district/[district] returns AI-readable paragraphs

---

## SECURITY & ADMIN AUTH

### Admin Login
- Cookie: `ftp_admin_v1 = "ok"` (set by `/admin` login page)
- Password: `ADMIN_PASSWORD` env var (verify using `timingSafeEqual`)
- All admin API routes check `isAuthed()` (reads cookie)

### 2FA (Google Authenticator)
- TOTP via `otpauth` library, QR code via `qrcode`
- Secret stored encrypted (AES-256-CBC) in `AdminAuth.totpSecret`
- Setup flow: `/api/admin/2fa/setup` → `/api/admin/2fa/verify`
- Disable: `/api/admin/2fa/disable`
- Recovery: `/api/admin/2fa/recover` → sends email via Resend → `/api/admin/2fa/recover/verify`
- 8 backup codes generated at setup, stored encrypted as JSON in `AdminAuth.backupCodes`
- Rate limiting on login (failedAttempts, lockedUntil)

### Encryption
- `src/lib/encryption.ts` — AES-256-CBC
- Key: `ENCRYPTION_SECRET` env var (32+ char random string)
- Used for: API keys, TOTP secret, backup codes
- `encrypt(plaintext) → "iv:ciphertext"` (base64 encoded)

### Security API Routes
```
POST /api/admin/2fa/setup         — Generate TOTP secret + QR code
POST /api/admin/2fa/verify        — Verify code and enable 2FA
POST /api/admin/2fa/disable       — Disable 2FA
POST /api/admin/2fa/recover       — Send recovery email (Resend)
POST /api/admin/2fa/recover/verify — Verify recovery token
GET  /api/admin/security          — Auth info (no secrets)
PATCH /api/admin/security         — Update recovery email/phone
POST /api/admin/security/logout-all — Invalidate all sessions
```

### Recovery Email
- Sent via `resend` SDK using `RESEND_API_KEY` env var
- Recovery email/phone stored in `AdminAuth` table (env var defaults: `ADMIN_RECOVERY_EMAIL`, `ADMIN_RECOVERY_PHONE`)

---

## SCRAPER SYSTEM

### Architecture
- Container: Railway (Dockerfile.scraper) — runs 24/7
- Scheduler: `src/scraper/scheduler.ts` — node-cron
- Jobs: `src/scraper/jobs/*.ts` (20 scrapers)
- Logger: `src/scraper/logger.ts` → ScraperLog DB table
- Redis: ioredis (NOT @upstash/redis) for scraper container
- Districts: `ACTIVE_DISTRICTS` constant in scheduler

### Dockerfile.scraper
```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --legacy-peer-deps   # npm ci fails due to peer dep conflicts
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
CMD ["npx", "tsx", "src/scraper/scheduler.ts"]
```

### Scraper Schedule
```
Every 5 min:   weather.ts      — OpenWeatherMap API
Every 15 min:  crops.ts        — DATA_GOV_API_KEY (AGMARKNET)
               power.ts        — BESCOM power outages
Every 30 min:  dams.ts         — KRS dam levels
Every 1 h:     news.ts         — RSS feeds (3 queries per district, 50 item limit, URL dedup)
Every 2 h:     alerts.ts       — Local alerts aggregation
Every 6 h:     police.ts       — Police data
Every 12 h:    infrastructure.ts — Project status
Daily:         rti.ts          — RTI statistics
               courts.ts       — Court pendency
               mgnrega.ts      — MGNREGA NREGS portal
Weekly:        jjm.ts          — Jal Jeevan Mission
               housing.ts      — PMAY housing
               schools.ts      — UDISE school data
Monthly:       finance.ts      — Budget/revenue
               transport.ts    — KSRTC/railway schedules
               schemes.ts      — Central/state schemes
               soil.ts         — Soil health cards (KVK)
               elections.ts    — Election commission data
               ai-analyzer.ts  — AI news intelligence pipeline
```

### AI News Intelligence Pipeline (ai-analyzer.ts)
1. Fetch recent NewsItems (last 24h) from DB
2. For each district × module combo, build context from news
3. Call Gemini 2.5 Flash (or Anthropic fallback) to generate AIInsight
4. Insert into `ReviewQueue` as "pending"
5. Admin approves/rejects in `/admin/review` tab
6. Approved insights shown as badge on module pages

### News Cron (Vercel — /api/cron/scrape-news)
- Runs daily 6AM UTC (Hobby plan cron limit)
- After scraping: inline dedup (normalized title prefix, keep newest, delete older dupes)
- Auto-expire `LocalAlert` records > 14 days old (`active: false`)
- Secured with `CRON_SECRET` header

---

## ADMIN PANEL

URL: `forthepeople.in/admin` (all routes under `/[locale]/admin/`)

### 6 Tabs
1. **Dashboard** — Overview stats, sync tools
2. **AI Settings** — 3-provider cards (OpusCode.pro, Official Anthropic, Gemini), model selection, fallback toggle, advanced settings, test connection
3. **Security** — 2FA setup/status, backup codes count, recovery email/phone, last login
4. **Review** — AI Insight review queue (approve/reject generated insights)
5. **Feedback** — All user feedback submissions with status management
6. **Supporters** — Contributions table with Razorpay sync button

### AI Settings Page (`/admin/ai-settings`)
- 3 provider cards with single-select "Activate" button
- Active card: colored border + "✓ ACTIVE" badge
- Expandable API key input per card (hidden by default)
- Provider mapping:
  - OpusCode.pro → `activeProvider="anthropic"`, `anthropicSource="opuscode"`, key name `"anthropic"`
  - Official Anthropic → `activeProvider="anthropic"`, `anthropicSource="official"`, key name `"anthropic_official"`
  - Google Gemini → `activeProvider="gemini"`, key name `"gemini"`
- Below cards: model selection, fallback toggle, advanced (maxTokens, temperature), test connection
- Key API routes: GET/PUT `/api/admin/ai-settings`, POST/DELETE `/api/admin/api-keys`

### Fact Checker (`FactChecker.tsx` on Dashboard tab)
- POST `/api/admin/fact-check` — runs AI verification across 7 modules
- Modules: leadership, budget, infrastructure, demographics, courts, news/alerts, all
- Returns: totalItems checked, issuesFound, staleItems, duplicates, per-module results
- Stored in `FactCheck` DB table with durationMs, aiProvider, aiModel
- GET returns last 20 checks with status history

### Data Verifier
- POST `/api/admin/verify-data` — AI QA of a specific module
- Returns: issues[], suggestions[], confidence (0-100), status (ok/warning/error)
- Graceful error: returns status:"error" instead of 500 when AI fails

### Stale Data Management
- GET `/api/admin/expire-stale` — preview stale alerts
- POST `/api/admin/expire-stale` — expire alerts older than N days
- POST `/api/admin/deduplicate-news` — deduplicate news by title prefix

---

## PAYMENT SYSTEM (RAZORPAY)

```
Live keys in env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET

4 Tiers on /support page:
  ☕ Chai (₹99)          — one-time
  🤝 Supporter (₹499)   — one-time
  🏙️ District Champion (₹1999) — one-time
  🌟 State Patron (₹4999)     — one-time

Flow:
  1. POST /api/payment/create-order  — creates Razorpay order
  2. Razorpay checkout on frontend
  3. POST /api/payment/verify        — verify signature, save Contribution
  4. POST /api/webhooks/razorpay     — webhook backup (timingSafeEqual signature verify)
  5. GET  /api/payment/contributors  — public contributors wall (isPublic=true)

Admin Sync:
  POST /api/admin/sync-razorpay      — fetch last 100 captured payments from Razorpay API
                                       Skip captured=false, dedup by paymentId, upsert Supporter

Supporter Wall: on /support + compact version on homepage
```

---

## API ROUTES

### Data API
```
GET  /api/data/[module]         — 30-module district data with Redis cache (5min TTL)
GET  /api/data/village          — village data
GET  /api/data/homepage-stats   — district counts, contributor count
GET  /api/data/homepage-preview — preview data for homepage cards
GET  /api/data/market-ticker    — SENSEX/NIFTY/Gold market data
GET  /api/data/ai-insight       — AI insight for a module
GET  /api/insights              — AI insights list
```

### AI API
```
POST /api/ai/insight            — Generate/fetch AI insight for module
POST /api/ai/citizen-tips       — Generate district-specific citizen tips
```

### Public API
```
GET  /api/public/district/[district]  — AI-readable district summary (structured paragraphs)
```

### Admin API
```
GET/PUT  /api/admin/ai-settings       — AI provider settings
POST/DEL /api/admin/api-keys          — Manage encrypted API keys
GET      /api/admin/scraper-logs      — Scraper job history
GET      /api/admin/payments          — All contributions (admin-gated)
GET/PATC /api/admin/supporters        — Supporters management
POST     /api/admin/sync-razorpay     — Sync last 100 payments from Razorpay
POST     /api/admin/fact-check        — Run AI fact check
GET      /api/admin/fact-check        — Fact check history (last 20)
POST     /api/admin/verify-data       — AI data quality verification
GET      /api/admin/expire-stale      — Preview stale alerts
POST     /api/admin/expire-stale      — Expire stale alerts
POST     /api/admin/deduplicate-news  — Deduplicate news items
GET/PATC /api/admin/security          — Auth info / recovery contact update
POST     /api/admin/security/logout-all — Invalidate all sessions
POST     /api/admin/2fa/setup         — Generate TOTP secret + QR code
POST     /api/admin/2fa/verify        — Enable 2FA
POST     /api/admin/2fa/disable       — Disable 2FA
POST     /api/admin/2fa/recover       — Send recovery email
POST     /api/admin/2fa/recover/verify — Verify recovery token
GET/PATC /api/admin/review            — AI insight review queue
GET/PATC /api/admin/feedback          — Feedback management
POST     /api/admin/ai-test           — Test AI provider connection
```

### Payment & Webhook
```
POST /api/payment/create-order  — Create Razorpay order
POST /api/payment/verify        — Verify payment signature
GET  /api/payment/contributors  — Public contributors list
POST /api/webhooks/razorpay     — Razorpay webhook handler
```

### Utility
```
GET  /api/health                — Health check (DB, Redis, AI provider, alert counts)
POST /api/feedback              — Submit user feedback
POST /api/district-request      — Request new district
POST /api/cron/scrape-news      — Cron: daily news scrape + dedup + expire stale alerts
POST /api/cron/news-intelligence — Cron: run AI news intelligence pipeline
```

---

## ENVIRONMENT VARIABLES

### Required — Production (Vercel)
```
DATABASE_URL              — Neon PostgreSQL connection string
REDIS_URL                 — Upstash Redis REST URL
REDIS_TOKEN               — Upstash Redis REST token
GEMINI_API_KEY            — Google Gemini API key
ANTHROPIC_API_KEY         — Anthropic API key (fallback)
ANTHROPIC_BASE_URL        — https://generativelanguage.googleapis.com/ for OpusCode proxy
ENCRYPTION_SECRET         — 32+ char random string for AES-256 encryption
ADMIN_PASSWORD            — Admin panel password (use strong password in prod)
CRON_SECRET               — Secret for cron endpoint authentication
RAZORPAY_KEY_ID           — Razorpay live key ID
RAZORPAY_KEY_SECRET       — Razorpay live key secret
RAZORPAY_WEBHOOK_SECRET   — Razorpay webhook signature secret
RESEND_API_KEY            — Resend email API key (for 2FA recovery emails)
NEXT_PUBLIC_SITE_URL      — https://forthepeople.in
DATA_GOV_API_KEY          — data.gov.in API key (crop prices)
OPENWEATHER_API_KEY       — OpenWeatherMap API key (weather)
ADMIN_RECOVERY_EMAIL      — Recovery email address (jayanthmbj@gmail.com)
ADMIN_RECOVERY_PHONE      — Recovery phone (+919449572249)
```

### Required — Railway (Scraper Container)
Same DATABASE_URL, GEMINI_API_KEY, ANTHROPIC_API_KEY, ENCRYPTION_SECRET, REDIS_URL (ioredis format), DATA_GOV_API_KEY, OPENWEATHER_API_KEY

### Local Dev (.env.local)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:51214/template1?sslmode=disable
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=https://api.anthropic.com
ENCRYPTION_SECRET=...
ADMIN_PASSWORD=...
```

⚠️ NEVER commit .env.local to git. .env.prod and .env.example are in .gitignore.

---

## DEPLOYMENT

### Frontend — Vercel
```bash
cd forthepeople
npx vercel --prod --yes
```
- Auto-detects Next.js, builds and deploys
- Domain: forthepeople.in (aliased from Vercel deployment)
- ISR: `revalidate = 300` on district pages
- GeoJSON Cache-Control: 24h; API responses: 5min
- CRITICAL: git `user.email` MUST be `jayanthmbj@gmail.com` (Vercel rejects other authors)
  Set with: `git config user.email "jayanthmbj@gmail.com"`

### Scraper — Railway
- Service: Docker container from `Dockerfile.scraper`
- Runs 24/7, connects directly to Neon PostgreSQL
- Auto-restarts on crash
- Set all env vars in Railway dashboard

### Local Dev
```bash
# Terminal 1 — Start Prisma dev proxy (KEEP RUNNING)
cd forthepeople && npx prisma dev

# Terminal 2 — Start Next.js
npm run dev
```
- Prisma proxy on port 51213 (prisma+postgres://)
- Actual Postgres on port 51214 (direct postgresql://)

### Database Commands
```bash
npx prisma db push            # Apply schema changes
npx prisma generate           # Regenerate client
npx tsx prisma/seed.ts        # Re-seed Mandya data
# Force reset:
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma db push --force-reset
```

### GitHub
```
Repo: github.com/jayanthmb14/forthepeople (private)
Push: git push origin main
Remote added via: gh auth setup-git (credential helper)
```

---

## KEY FILES

```
src/app/layout.tsx                          — Root layout (fonts, providers)
src/app/globals.css                         — Tailwind v4 @theme design tokens
src/app/[locale]/layout.tsx                 — Header + RefreshIndicator + disclaimer banner
src/app/[locale]/[state]/[district]/layout.tsx — Sidebar + MobileTabNav + FeedbackFloatingButton
src/app/[locale]/[state]/[district]/page.tsx   — District overview page (ISR)
src/app/[locale]/admin/page.tsx             — Admin dashboard (6 tabs)
src/app/[locale]/admin/ai-settings/page.tsx — AI Settings with 3-provider cards
src/app/[locale]/admin/security/page.tsx    — 2FA setup, backup codes
src/app/[locale]/admin/review/page.tsx      — AI insight review queue
src/app/[locale]/admin/feedback/page.tsx    — Feedback management
src/app/[locale]/admin/supporters/page.tsx  — Contributors/payments
src/app/[locale]/support/page.tsx           — Contribution/support page (Razorpay)
src/app/[locale]/contribute/page.tsx        — Alternative contribution page
src/app/[locale]/compare/page.tsx           — District comparison page
src/app/[locale]/about/page.tsx             — About page
src/app/[locale]/feedback/page.tsx          — Public feedback page

src/app/api/data/[module]/route.ts          — 29-module API handler (Redis cache)
src/app/api/admin/ai-settings/route.ts      — AI provider settings GET/PUT
src/app/api/admin/api-keys/route.ts         — Encrypted API key management
src/app/api/admin/fact-check/route.ts       — AI fact checker POST/GET
src/app/api/admin/verify-data/route.ts      — AI data QA verifier
src/app/api/admin/sync-razorpay/route.ts    — Razorpay payment sync
src/app/api/admin/security/route.ts         — Auth info + recovery contacts
src/app/api/cron/scrape-news/route.ts       — Daily cron: news + dedup + expire alerts

src/lib/ai-provider.ts                      — Unified AI gateway (callAI, callAIJSON)
src/lib/encryption.ts                       — AES-256-CBC encrypt/decrypt
src/lib/db.ts                               — Prisma singleton (PrismaPg adapter)
src/lib/redis.ts                            — @upstash/redis singleton (Vercel)
src/lib/cache.ts                            — cacheGet, cacheSet, cacheKey, getModuleTTL
src/lib/constants/districts.ts             — INDIA_STATES hierarchy (all 28 states)

src/components/common/FeedbackModal.tsx     — Feedback modal
src/components/common/FeedbackFloatingButton.tsx — Floating button (all district pages)
src/components/common/AIInsightCard.tsx     — AI insight badge per module

src/scraper/scheduler.ts                    — node-cron job scheduler
src/scraper/jobs/                           — 20 scraper job files
src/scraper/logger.ts                       — ScraperLog DB logger

prisma/schema.prisma                        — 48+ models
prisma/seed.ts                              — Full Mandya seed (30 data tables, deleteMany cleanup)
prisma.config.ts                            — Prisma 7 config (DATABASE_URL)
Dockerfile.scraper                          — Railway scraper container
.env.local                                  — Local dev env vars (never commit)
```

---

## COMPLETED FEATURES (ALL 10 SECTIONS)

### Section 1: Foundation
- Next.js 16 + TypeScript + Tailwind v4 setup
- Design system (fonts, colors, tokens in globals.css)
- District routing: `/[locale]/[state]/[district]/[module]`
- Prisma 7 with PrismaPg adapter + Neon PostgreSQL

### Section 2: District Dashboard (29 modules)
- All 29 module pages built for Mandya, Karnataka
- Sidebar navigation with pinned modules + "Show all" toggle + emoji per module
- Mobile sidebar: left hamburger → slide-in drawer
- MobileTabNav: bottom tab strip
- AIInsightCard added to 11 module pages

### Section 3: Interactive Map
- Full India SVG map (react-simple-maps, portrait viewBox 800×900, scale=900, center=[82.5,23])
- CW winding fix on GeoJSON exterior rings (d3-geo quirk)
- Zero-area ring removal
- MapErrorBoundary component
- Mandya Taluk drill-down: TalukMap.tsx + public/geo/mandya-taluks.json
- GeoJSON served with 24h Cache-Control

### Section 4: Leadership Hierarchy
- 10-tier org chart for all Mandya officials
- 2024 MP: Nikhil Kumaraswamy (JD(S))
- 7 MLAs: INC 6, BJP 2, JD(S) 1
- Role field (not designation) in Leader model

### Section 5: Finance & Budget
- Budget values stored in Rupees, display divides by 1e7 → Crores
- Full budget breakdown with lapsed funds tracker

### Section 6: Real-time Data
- Weather (5min), Crops (15min), Dams (30min) scrapers running
- Redis caching with per-module TTL

### Section 7: Citizen Features
- RTI Tracker + File RTI wizard
- Gram Panchayat MGNREGA data
- Citizen Corner (responsibility page)
- Services Guide (certificate how-to)
- Government Offices directory

### Section 8: Scrapers (All 20 running)
- All schedulers set up and running on Railway
- ScraperLog written to DB after each job

### Section 9: Admin Panel (Complete)
- 6-tab admin dashboard
- AI Settings: 3-provider cards, model selection, test connection
- 2FA: Google Authenticator setup/disable/recovery
- Fact Checker: AI verification across 7 modules
- Data Verifier: AI QA per module
- Review Queue: approve/reject AI insights
- Feedback management
- Supporters/payments with Razorpay sync

### Section 10: Launch & Polish
- Support page with 4 Razorpay tiers
- Contributor Wall (public + compact homepage)
- Public API: /api/public/district/[district]
- Health check endpoint
- Feedback system (floating button + modal + DB)
- Sitemap + robots.txt
- NDSAP disclaimer on every page
- Famous Personalities (bornInDistrict validated)
- README.md
- Deployed at https://forthepeople.in

---

## POST-LAUNCH FEATURES ADDED

```
✅ India Map: Full fix — CW winding, zero-area removal, MapErrorBoundary, ?v=4 cache bust
✅ Mandya Taluk D3 Map: TalukMap.tsx + public/geo/mandya-taluks.json
✅ Leadership: 2024 correct leadership data
✅ Finance: Budget ×10M display fix (Rupees → Crores)
✅ InfraProjects: 5 ongoing projects seeded
✅ Overview: Reordered sections
✅ Mobile Sidebar: Left hamburger → slide-in drawer
✅ Support page: /support with Razorpay Live checkout + Contributor Wall
✅ Razorpay: Live keys, webhook, sync
✅ News scraper: URL dedup, 3 queries/district, 50 item limit
✅ Cron: /api/cron/scrape-news — daily 6AM UTC (CRON_SECRET)
✅ Responsibility: /responsibility page (7 citizen duty sections)
✅ Sidebar: Pinned modules + "Show all" toggle + emoji per module
✅ Logo: 🗣️ in Header; Footer: NDSAP + "Built with ❤️ by Jayanth M B"
✅ ISR: revalidate=300 on district page
✅ Seed: deleteMany cleanup + InfraProject records
✅ AIInsightCard: Added to 11 module pages
✅ Public API: /api/public/district/[district] with AI paragraphs
✅ Feedback System: FeedbackModal + floating button on all district pages
✅ Admin Payments tab: /api/admin/payments
✅ Famous Personalities: Fixed (Dr. Rajkumar removed — born Erode TN, not Mandya)
✅ Security: timingSafeEqual for Razorpay, no secrets in client
✅ README.md: Full project README
✅ Multi-Provider AI: OpusCode.pro + Official Anthropic + Google Gemini
✅ 2FA: Google Authenticator TOTP + backup codes + Resend recovery
✅ Fact Checker: AI verification of 7 modules
✅ Data Verifier: AI QA tool in admin
✅ News Intelligence: AI pipeline for generating AIInsight cards
✅ News cron: Auto-expire stale alerts (>14 days), auto-dedup news
✅ Dockerized scraper: Railway-compatible Dockerfile.scraper
✅ GitHub: https://github.com/jayanthmb14/forthepeople (private)
✅ Personal info removed: No hardcoded email/phone in code/schema
✅ Git author: jayanthmbj@gmail.com (required for Vercel deployment)
✅ AI base URL: env var takes priority over DB default
✅ Razorpay sync: fixed (removed invalid &expand[]=order parameter)
✅ Error handling: fact-check + verify-data return graceful 200 on AI failure
```

---

## MONTHLY COSTS (ESTIMATED)

```
Vercel Hobby:         Free
Neon PostgreSQL:      Free (0.5GB limit)
Upstash Redis:        Free (10K req/day limit)
Railway (scraper):    ~$5/month (always-on container)
Razorpay:             2% per transaction (no monthly fee)
Resend:               Free (100 emails/day)
Gemini API:           Free tier sufficient for current load
Anthropic/OpusCode:   ~$10/month (if using paid plan)
Domain (forthepeople.in): ~₹800/year

Total: ~₹500-700/month
```

---

## KNOWN ISSUES & GOTCHAS

```
1. Prisma 7 — NO `url` in datasource block — use prisma.config.ts
2. Prisma dev proxy on port 51214 MUST be running for local DB ops
3. DATABASE_URL uses template1 db (not forthepeople) with local Prisma proxy
4. @upstash/redis on Vercel, ioredis on Railway scraper — different APIs!
5. recharts Tooltip formatter: use (v) not (v: number) — TypeScript issue
6. GeoJSON CW winding required (not CCW RFC7946) for d3-geo
7. Vercel deploy requires git user.email = jayanthmbj@gmail.com
8. npm ci fails for Dockerfile — must use npm install --legacy-peer-deps
9. ANTHROPIC_BASE_URL env var MUST take priority over DB settings.anthropicBaseUrl
10. ElectionResult: winner-per-constituency (not per-candidate)
11. Budget values stored in Rupees (NOT Crores) — display divides by 1e7
12. NewsItem uses `title` field (not `headline`) — scraper must write to `title`
13. ADMIN_RECOVERY_EMAIL and ADMIN_RECOVERY_PHONE must be set in Vercel env
14. ADMIN_PASSWORD: change from default to strong password in Vercel dashboard
```

---

## PENDING / FUTURE WORK

```
□ Add Mysuru and Bengaluru Urban districts (seed + activate)
□ RTI filing: integrate with actual RTI portal (rtionline.gov.in)
□ Multi-language: Kannada translations for all UI strings
□ PWA: service worker for offline mode
□ Native mobile app (React Native / Capacitor)
□ WhatsApp bot: send district data via WhatsApp API
□ Email newsletter: weekly district digest
□ District comparison: /compare page (started)
□ Embed widget: <iframe> for third-party sites
□ Admin ADMIN_PASSWORD: remind to change from default
□ Vercel env: add ADMIN_RECOVERY_EMAIL + ADMIN_RECOVERY_PHONE
□ Consider open-sourcing when stable
```

---

## PROGRESS TRACKER

```
Section 1:  Foundation           ✅ COMPLETE
Section 2:  District Dashboard   ✅ COMPLETE (29 modules)
Section 3:  Interactive Map      ✅ COMPLETE
Section 4:  Leadership           ✅ COMPLETE
Section 5:  Finance              ✅ COMPLETE
Section 6:  Real-time Data       ✅ COMPLETE
Section 7:  Citizen Features     ✅ COMPLETE
Section 8:  Scrapers (20 jobs)   ✅ COMPLETE
Section 9:  Admin Panel          ✅ COMPLETE (6 tabs, 2FA, AI, FactCheck)
Section 10: Launch               ✅ COMPLETE (live at forthepeople.in)
Post-launch: AI Intelligence     ✅ COMPLETE
Post-launch: Security (2FA)      ✅ COMPLETE
Post-launch: Payments            ✅ COMPLETE
Post-launch: Feedback            ✅ COMPLETE
Post-launch: GitHub + Railway    ✅ COMPLETE
```
