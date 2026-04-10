---
name: forthepeople-blueprint
description: "Complete blueprint for ForThePeople.in — India's citizen transparency platform. Use this skill whenever building ANY component, page, dashboard, scraper, API, database model, or UI element for ForThePeople.in. Triggers: district dashboards, budget trackers, crop prices, interactive maps, government offices, citizen responsibility, real-time alerts, RTI filing, school trackers, dam/water dashboards, sugar factories, elections, transport, housing, power outages, soil health, famous personalities, AI news intelligence, admin review, leadership hierarchy, health scores, feature voting. Also trigger on: 'ForThePeople', 'district dashboard', 'citizen transparency', 'government data India', 'continue from where we left off', 'build the next section'."
---

# ForThePeople.in — Claude Code Skill Reference

## CURRENT STATE

```
STATUS:           Sections 1-10 COMPLETE + Contributor system + All states unlocked. Fully deployed.
LIVE URL:         https://forthepeople.in
GITHUB:           https://github.com/jayanthmb14/forthepeople (PUBLIC — clean history, MIT with Attribution)
VERCEL:           zurvoapp Pro (scope: zurvoapps-projects)
ACTIVE DISTRICTS: 9 across 7 states (Karnataka: Mandya, Mysuru, Bengaluru Urban;
                  Delhi: New Delhi; Maharashtra: Mumbai;
                  West Bengal: Kolkata; Tamil Nadu: Chennai;
                  Uttar Pradesh: Lucknow; Telangana: Hyderabad)
ALL STATES:       36 states/UTs browsable (locked ones show preview + sponsor CTA)
ALL DISTRICTS:    152 districts in DB (locked ones show LockedDistrictPreview)
STATE MAPS:       33 GeoJSON maps from DataMeet Census 2011 + Karnataka hand-tuned
PROJECT ID:       FTP-JMB-2026-IN (watermark ID)
LAST UPDATED:     April 10, 2026
```

---

## TECH STACK SUMMARY

| Layer | Library | Version | Why |
|-------|---------|---------|-----|
| Framework | Next.js | 16.1.7 | App Router, TypeScript, src/ dir |
| React | React | 19.2.3 | Server Components, streaming |
| CSS | Tailwind | v4 CSS @theme | No tailwind.config.ts — tokens in globals.css |
| ORM | Prisma | 7.5.0 | prisma-client-js + @prisma/adapter-pg |
| Database | Neon PostgreSQL | — | Serverless Postgres, free tier |
| Cache | @upstash/redis | REST | Must be REST — ioredis crashes Vercel serverless |
| State | @tanstack/react-query | v5 | Server state, caching, refetch |
| Charts | recharts | v3 | Lazy loaded via next/dynamic |
| Maps | react-simple-maps | — | FINAL choice after D3→Leaflet→this |
| i18n | next-intl | v4 | English + Kannada |
| AI (primary) | @anthropic-ai/sdk | — | Claude Opus via OpusCode proxy |
| AI (fallback) | @google/generative-ai | — | Gemini 2.5 Flash |
| Payments | razorpay | — | Live keys, HMAC-SHA256 signature verification |
| Email | resend | v6 | 2FA recovery emails |
| 2FA | otpauth + qrcode | — | TOTP Google Authenticator |
| Encryption | Node.js crypto | built-in | AES-256-CBC for API keys + TOTP secrets |
| Icons | lucide-react | — | 20px default |
| Scraper | node-cron + cheerio | — | Railway container only |
| Date | date-fns | v4 | — |

**Critical note on ioredis vs @upstash/redis:**
- `@upstash/redis` (REST API) — use on Vercel serverless (all Next.js API routes)
- `ioredis` (TCP) — use ONLY in Railway scraper container (persistent process)

---

## AI ARCHITECTURE

### Provider System (`src/lib/ai-provider.ts`)

```typescript
// ALWAYS use these — never call Anthropic/Gemini directly
callAI(prompt, options?)           // returns string
callAIJSON<T>(prompt, options?)    // returns { data: T, provider: string, model: string }
```

### 3 Provider Sources
```
1. OpusCode.pro proxy (PRIMARY)
   activeProvider = "anthropic", anthropicSource = "opuscode"
   ANTHROPIC_BASE_URL env var (contains "opuscode" → auto-detected)

2. Official Anthropic
   activeProvider = "anthropic", anthropicSource = "official"
   Base URL: https://api.anthropic.com

3. Google Gemini (FALLBACK)
   activeProvider = "gemini"
   Model: gemini-2.5-flash (default)
```

### Auto-Detection
```typescript
// ai-provider.ts auto-sets anthropicSource=opuscode if:
process.env.ANTHROPIC_BASE_URL?.includes("opuscode") === true
// Logs base URL to console for debugging
```

### Base URL Priority (CRITICAL — never change this order)
```typescript
const baseUrl = process.env.ANTHROPIC_BASE_URL
  || settings.anthropicBaseUrl
  || "https://api.anthropic.com";
// Env var ALWAYS wins over DB setting
```

### Response Parsing (CRITICAL)
```typescript
// CORRECT — always find the text block, never assume index
const textBlock = response.content.find(b => b.type === 'text');
const text = textBlock?.text ?? '';

// WRONG — breaks with extended thinking (thinking blocks come before text)
const text = response.content[0].text;

// Extended thinking requirement:
// maxTokens MUST be >= 2048 for extended thinking to work
```

### Fallback
If primary provider fails → auto-falls back to `fallbackProvider` from DB settings.
Returns graceful errors (never throws to user).

---

## 4 AI ENGINES

### Engine 1: News Intelligence Pipeline
```
Location:   src/scraper/jobs/news.ts + ai-analyzer.ts
Trigger:    Cron every 1h (news scrape) + monthly ai-analyzer.ts
Flow:       RSS scraping → Gemini/Opus classification → targetModule + extractedData
            stored in NewsItem.aiAnalyzed + NewsItem.targetModule
Output:     AIInsight records → ReviewQueue (pending until admin approves)
Display:    AIInsightCard badge on module pages (after approval)
```

### Engine 2: News Action Engine
```
Location:   src/lib/news-action-engine.ts
Functions:  classifyArticleWithAI() — extracts structured data from article
            executeNewsAction() — decides what to do with extracted data
Confidence thresholds:
  > 0.85 → auto-execute DB mutation immediately
  0.60–0.85 → queue for human review in NewsActionQueue
  < 0.60 → discard
Models:     NewsActionQueue (pending/executed/rejected/skipped)
Modules:    exams (GovernmentExam), staffing (DepartmentStaffing)
            exams schema: {examTitle, department, vacancies, status, applyUrl}
            staffing schema: {module, department, roleName, sanctionedPosts, workingStrength, vacantPosts}
```

### Engine 3: Pre-computed Module Insights
```
Location:   src/lib/insight-generator.ts
Trigger:    /api/cron/generate-insights every 2h (Vercel cron)
Scope:      30 modules × all active districts
Storage:    AIModuleInsight table with expiresAt TTL
Cache:      Redis (6h) → DB (check expiry) → generate fresh
Display:    AIInsightCard footer shows "Source-verified by Claude/Gemini AI"
            Uses actual aiProvider + aiModel from AIModuleInsight record

ZERO-CREDIT RULE: Public AI routes (/api/ai/insight, /api/ai/citizen-tips) are READ-ONLY.
  They serve ONLY from Redis cache — never call callAI() on public GET.
  Live AI generation is restricted to backend crons (CRON_SECRET) + admin (cookie).
```

### Engine 4: Fact Checker
```
Location:   src/lib/fact-checker.ts
Trigger:    Manual from admin dashboard (POST /api/admin/fact-check)
Checks:     25+ checks across 7 module categories
            leadership, budget, infrastructure, demographics, courts, news/alerts, all
Key rule:   Born-in-district rule for famous personalities (bornInDistrict must be true)
            Dr. Rajkumar was born in Erode TN — NOT Mandya (removed as example)
Storage:    FactCheckStatus table (totalItems, issuesFound, staleItems, duplicates)
Admin view: Dashboard tab → FactChecker component → history of last 20 runs
```

---

## DISTRICT HEALTH SCORE ALGORITHM

```
Location: src/lib/health-score.ts
Storage:  DistrictHealthScore table (pre-computed weekly)
Display:  Homepage district cards + District overview header

10 Categories with BASE weights:
  governance       15%
  education        12%
  health           12%
  infrastructure   12%
  waterSanitation  10%
  economy          10%
  safety           10%
  agriculture       8%
  citizenWelfare    6%
  digitalAccess     5%
  ─────────────────────
  TOTAL            100%

District-type aware weights (getAdjustedWeights):
  metro (pop>5M)         — boosts infrastructure+digitalAccess, reduces agriculture
  urban (pop>1M)         — uses base weights
  semi-urban (den>500)   — uses base weights
  rural (default)        — boosts agriculture+waterSanitation, reduces infra+digital

Precision:
  Category scores: 1 decimal (e.g. 72.4)
  Overall score:   2 decimal (e.g. 54.52)

Grades:
  A+ = >= 90  |  A = >= 80  |  B+ = >= 70  |  B = >= 60
  C+ = >= 50  |  C = >= 40  |  D  = >= 30  |  F = < 30

Current (2026-03-29): Mandya 54.52 (C+), Mysuru 49.38 (C), Bengaluru Urban 55.19 (C+)
Trigger recalculation: npx tsx scripts/calculate-health-scores.ts (with prod DATABASE_URL)
```

---

## FEATURE VOTING SYSTEM

```
Location:  src/app/[locale]/features/page.tsx
Models:    FeatureRequest + FeatureVote
Seeded:    23 feature requests via prisma/seed-features.ts

Fingerprint: SHA-256(IP + User-Agent).slice(0, 32)
Anti-double-vote: @@unique([featureId, fingerprint])
Vote transaction: atomic create + increment (prevents race conditions)

API routes:
  GET  /api/features            — list with vote counts
  POST /api/features/[id]/vote  — cast vote (idempotent via unique constraint)
```

---

## 30 MODULES (by category)

**DATA:** overview, map, leadership, water, industries, finance, crops, population, weather, police

**SERVICES:** schemes, citizen-corner, elections, transport, jjm, housing, power

**GOVERNANCE:** schools, farm, rti, file-rti, gram-panchayat, courts, health, exams

**COMMUNITY:** alerts, offices, responsibility, news, famous-personalities

**API SLUG CORRECTIONS (common mistakes):**
```
/api/data/leaders      (NOT /api/data/leadership)
/api/data/budget       (NOT /api/data/finance)
/api/data/exams        (dedicated route — not under [module])
```

---

## KEY FILES LIST

### Layouts & App Shell
```
src/app/layout.tsx                              — Root (fonts, providers)
src/app/globals.css                             — Tailwind v4 @theme tokens (design system)
src/app/[locale]/layout.tsx                     — Header + disclaimer banner
src/app/[locale]/[state]/[district]/layout.tsx  — Sidebar + MobileTabNav + FeedbackFloatingButton
src/app/[locale]/[state]/[district]/page.tsx    — District overview (ISR revalidate=300)
```

### Library Core
```
src/lib/ai-provider.ts       — callAI() and callAIJSON() — USE THESE, never direct API calls
src/lib/db.ts                — Prisma singleton (PrismaPg adapter)
src/lib/redis.ts             — @upstash/redis singleton
src/lib/cache.ts             — cacheGet, cacheSet, cacheKey, getModuleTTL
src/lib/encryption.ts        — AES-256-CBC encrypt()/decrypt()
src/lib/health-score.ts      — District health score algorithm
src/lib/insight-generator.ts — Pre-computed AI insights generator
src/lib/news-action-engine.ts — News → action classification + execution
src/lib/fact-checker.ts      — AI fact checker (25+ checks)
src/lib/constants/districts.ts — INDIA_STATES hierarchy (all 28 states + UTs)
```

### Components
```
src/components/common/AIInsightCard.tsx         — AI badge on module pages
src/components/common/FeedbackModal.tsx         — User feedback form
src/components/common/FeedbackFloatingButton.tsx — Floating feedback trigger
src/components/ui.tsx                           — EmptyBlock, ProgressBar, LastUpdatedBadge
```

### API Routes
```
src/app/api/data/[module]/route.ts              — 30-module data API (Redis cache)
src/app/api/admin/ai-settings/route.ts          — AI provider config GET/PUT
src/app/api/admin/fact-check/route.ts           — Fact checker POST/GET
src/app/api/admin/verify-data/route.ts          — AI data QA (graceful error)
src/app/api/cron/scrape-news/route.ts           — Daily news cron (6AM UTC)
src/app/api/cron/scrape-crops/route.ts          — Daily crop prices cron (3:30AM UTC = 9AM IST)
src/app/api/cron/generate-insights/route.ts     — Every-2h insights cron
src/app/api/cron/news-intelligence/route.ts     — Every-4h news classify + execute cron
src/app/api/admin/cleanup-news/route.ts         — Cleanup stale/dup articles + bad alerts
src/app/api/data/freshness/route.ts             — Traffic-light freshness monitor per module
src/app/api/payment/verify/route.ts             — Razorpay HMAC sig verification
```

### Scraper
```
src/scraper/scheduler.ts      — node-cron scheduler (getActiveDistricts from DB)
src/scraper/types.ts          — JobContext (districtId, districtSlug, districtName, stateName)
src/scraper/jobs/weather.ts   — OWM weather (OWM_CITY_OVERRIDE for mismatched names)
src/scraper/jobs/crops.ts     — AGMARKNET crops (AGMARKNET_DISTRICT_OVERRIDE)
src/scraper/jobs/news.ts      — RSS news (URL dedup + date validation + title dedup, 3 queries/district)
```

### Database
```
prisma/schema.prisma           — 45+ models (single source of truth for DB)
prisma/seed.ts                 — Full Mandya seed (deleteMany at top, then insert)
prisma/seed-hierarchy.ts       — State→District→Taluk (upsert only, safe for production)
prisma/seed-features.ts        — 23 feature requests
prisma.config.ts               — Prisma 7 config (DATABASE_URL from env)
Dockerfile.scraper             — Railway container (npm install --legacy-peer-deps)
```

---

## PATTERNS TO ALWAYS FOLLOW

### Redis — Always use @upstash/redis on Vercel
```typescript
// CORRECT
import { redis } from '@/lib/redis';
await redis.get(key);
await redis.setex(key, ttl, value);

// WRONG (crashes serverless)
import Redis from 'ioredis';
```

### AI Calls — Always use callAI()
```typescript
// CORRECT
import { callAI, callAIJSON } from '@/lib/ai-provider';
const result = await callAI(prompt);
const { data, provider, model } = await callAIJSON<MyType>(prompt);

// WRONG — bypasses provider switching + fallback logic
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
```

### Response Parsing — Always find text block
```typescript
// CORRECT
const textBlock = response.content.find(b => b.type === 'text');
const text = textBlock?.text ?? '';

// WRONG — breaks with extended thinking
const text = response.content[0].text;
```

### Budget Values — Always store Rupees, display Crores
```typescript
// Storage: raw Rupees (e.g., 500000000 = ₹50 Crore)
// Display: value / 1e7 → shows as "50 Cr"
const crores = (rupeesValue / 1e7).toFixed(2);
```

### Famous Personalities — bornInDistrict rule
```typescript
// Only add if actually born in that district
// Dr. Rajkumar: born Erode TN → removed from Mandya
// Always verify before seeding
```

### Leadership — ADD only, never delete
```typescript
// When updating leaders: upsert with unique key, never deleteMany first
// Historical records must be preserved
```

### Recharts — No type annotation on formatter
```tsx
// CORRECT
<Tooltip formatter={(v) => Number(v).toLocaleString()} />

// WRONG — TypeScript error
<Tooltip formatter={(v: number) => v.toLocaleString()} />
```

### Map components — FRAGILE, never modify casually
```
react-simple-maps viewBox: 800×900 portrait, scale=900, center=[82.5,23]
GeoJSON exterior rings: MUST be CW (clockwise) — d3-geo requirement
Zero-area rings: must be removed (area < 1e-10 → world-spanning fill bug)
NEVER change map without testing all 36 states render correctly in browser
```

### Deployment — git push only
```bash
git push origin main     # triggers auto-deploy via Vercel GitHub integration
# NEVER: npx vercel --prod (scope issues)
# Git email MUST be: jayanthmbj@gmail.com
```

### Watermarking — always preserve
```
Every new source file MUST have this header at top:
/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

The middleware (src/middleware.ts) adds X-Creator, X-Project-ID, X-License to every response.
NEVER remove or alter watermark headers — they are proof of authorship.
Project ID: FTP-JMB-2026-IN
```

### Security — rate limiting
```typescript
// For public API routes that could be abused:
import { rateLimit } from '@/lib/rate-limit';
const { success } = await rateLimit(`${req.ip}:data/${module}`, 60, 60);
if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
```

### Recalculate health scores (when needed)
```bash
DATABASE_URL=<neon-prod-url> npx tsx scripts/calculate-health-scores.ts
```

---

## DATABASE MODELS SUMMARY

### Core (4 models)
`State` → `District` → `Taluk` → `Village`

### Per-District Data (25+ models)
`Leader`, `InfraProject`, `BudgetEntry`, `BudgetAllocation`, `CropPrice`, `WeatherReading`,
`RainfallHistory`, `DamReading`, `CanalRelease`, `NewsItem`, `LocalAlert`, `CrimeStat`,
`PoliceStation`, `TrafficCollection`, `CourtStat`, `RtiStat`, `GramPanchayat`, `Scheme`,
`ServiceGuide`, `JJMStatus`, `HousingScheme`, `PowerOutage`, `SchoolResult`, `SoilHealth`,
`AgriAdvisory`, `ElectionResult`, `BusRoute`, `TrainSchedule`, `GovOffice`, `FamousPersonality`,
`PopulationHistory`, `SugarFactory`, `RtiTemplate`, `MarketData`

### AI & Intelligence (6 models)
`AIModuleInsight`, `AIInsight`, `ReviewQueue`, `NewsActionQueue`, `SharedAIInsight`, `FactCheckStatus`

### New (2 models)
`DistrictHealthScore` (10 categories, weights, grade, breakdown JSON),
`FeatureRequest` + `FeatureVote` (fingerprint anti-double-vote)

### Admin (4 models)
`AdminAuth` (2FA + backup codes, encrypted), `AdminAPIKey` (AES-256 encrypted keys),
`AIProviderSettings` (singleton: active provider + models), `ScraperLog`

### Payments & Sponsors (2 models)
`Contribution` (Razorpay order/payment IDs, paise),
`Supporter` (extended: razorpaySubscriptionId, subscriptionStatus, activatedAt, expiresAt,
  districtId FK→District, stateId FK→State, socialLink, socialPlatform, badgeType, badgeLevel,
  isRecurring, isPublic, message. Reverse relations: District.supporters[], State.supporters[])

### Other (5 models)
`Feedback`, `DistrictRequest`, `DataRefresh`, `NewsIntelligenceLog`, `MarketData`

**CRITICAL field notes:**
- `NewsItem.title` — NOT `.headline` (that was a bug, field is `title`)
- `BudgetEntry.allocated` — stored in RUPEES not Crores (display ÷ 1e7)
- `ElectionResult` — winner-per-constituency, has winnerName/winnerParty/winnerVotes
- `FamousPersonality.bornInDistrict` — MUST be true for district's page

---

## HOMEPAGE STRUCTURE

Unified scrollable layout — same sections on desktop and mobile.
Desktop: 2-col grid (60% map + 40% district cards), Mobile: stacked.

```
1. Header (Logo + nav + district selector)
2. MarketTicker (40px bar: Gold, Silver(/g), Petrol, Diesel, USD/INR, SENSEX, NIFTY, Crude — 5min market hours, 30min off-hours)
3. HomepageStats (animated counters: 9 districts, 29 modules, data points)
4. DrillDownMap + ActiveDistrictsCard (2-col on desktop, stacked on mobile)
   - Map: India states, click to drill into state
   - District cards: all 9 active districts with health grade, weather, dam, crop snippets
5. LiveDataPreview (horizontally scrollable preview cards, links to active districts)
6. HowItWorks (3-column explainer)
7. DistrictRequestSection (vote to add new districts)
8. Support button
9. DisclaimerStrip (NDSAP + "Built by Jayanth M B")
```

---

## ADMIN PANEL CAPABILITIES

URL: `/en/admin`

```
Tab 1 — Dashboard:
  - Stats overview
  - FactChecker: runs AI verification on 7 modules, shows issues/stale/duplicates
  - DataVerifier: AI QA for any specific module (graceful error on AI fail)
  - StaleDataManager: preview + expire stale alerts, deduplicate news

Tab 2 — AI Settings:
  - 3 provider cards: OpusCode.pro / Official Anthropic / Google Gemini
  - Single-select "Activate" per provider
  - Model dropdown per provider
  - API key input (hidden, expandable)
  - Fallback toggle (auto-fall to Gemini if primary fails)
  - maxTokens + temperature advanced settings
  - "Test Connection" button

Tab 3 — Security:
  - 2FA status + setup (TOTP QR code via otpauth + qrcode)
  - Backup codes count (8 codes, AES-256 encrypted in DB)
  - Recovery email/phone (stored in AdminAuth, defaults from env vars)
  - Last login timestamp + failed attempts
  - "Logout All" button

Tab 4 — Review:
  - AI insight review queue (approve/reject generated insights)
  - Each item shows module, district, headline, confidence, AI provider

Tab 5 — Feedback:
  - All user feedback submissions
  - Status management (new/reviewed/resolved)
  - Admin note field per submission

Tab 6 — Supporters:
  - Summary: Active Subscriptions, Monthly Revenue, One-Time Total, Expiring This Week
  - Filters: Tier, Status, Sort (newest/oldest/amount/tenure)
  - Flat list view (full table) + Grouped view (State→District hierarchy)
  - CSV export button
  - SupportersTable.tsx client component with all interactivity
```

---

## DEPLOYMENT PROCESS

```bash
# Standard deploy (ALWAYS use this):
git add [specific files]
git commit -m "commit message"
git push origin main
# Vercel auto-detects push → builds → deploys

# Local dev:
cd "/Users/jayanth/Documents/For The People/forthepeople"
# Terminal 1:
npx prisma dev          # keep running (local DB proxy on port 51214)
# Terminal 2:
npm run dev             # Next.js dev server
# Open: http://localhost:3000/en/karnataka/mandya

# DB operations:
npx prisma db push                    # apply schema
npx prisma generate                   # regenerate client
npx tsx prisma/seed.ts                # seed Mandya data
npx tsx prisma/seed-hierarchy.ts      # seed State→District→Taluk (safe for prod)
```

---

## CONTRIBUTOR & SPONSOR SYSTEM

### 6 Tiers (src/lib/constants/razorpay-plans.ts)
```
☕ Chai           ₹50 one-time     accent #F97316
🏛️ District       ₹200/mo          accent #2563EB  featured  requiresDistrict
🇮🇳 State          ₹2,000/mo        accent #7C3AED  requiresState
🌟 Patron         ₹10,000/mo       accent #DC2626
👑 Founder        ₹50,000/mo       accent #D97706  platinum badge immediately
💝 Custom         ₹10+ one-time    accent #374151
```

### Razorpay Integration
```
Live keys on Vercel (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID)
4 subscription plans (RAZORPAY_PLAN_DISTRICT/STATE/PATRON/FOUNDER)
Webhook: forthepeople.in/api/webhooks/razorpay (6 events)
  payment.captured, payment.failed
  subscription.charged (extends expiry +30d, recalc badge)
  subscription.halted (→expired), subscription.cancelled, subscription.paused
```

### Badge Progression (src/lib/badge-level.ts)
```
Bronze  3+ months  |  Silver 6+ months  |  Gold 12+ months  |  Platinum 24+ months
Founders get platinum immediately regardless of tenure
```

### Key API Routes
```
POST /api/payment/create-subscription    — creates Razorpay subscription
POST /api/payment/verify-subscription    — verifies + creates Supporter record
GET  /api/data/contributors              — ?district=&state= | ?type=leaderboard | ?type=all | ?type=district-rankings
GET  /api/data/resolve-ids               — ?state=slug&district=slug → DB IDs
```

### Key Components
```
src/components/support/SupportCheckout.tsx         — Payment flow (one-time + subscription + auto-scroll from URL params)
src/components/common/DistrictSponsorBanner.tsx    — Gold banner on district pages (max 6, tier-colored borders)
src/components/common/PatronCard.tsx               — Premium card for founders (👑 gold gradient) and patrons (🌟)
src/components/common/BadgeExplainer.tsx            — Collapsible tier + badge explanation
src/components/support/SupporterQuotes.tsx          — Shows supporter messages on support page
src/app/[locale]/contributors/                     — Global leaderboard + district rankings + filters
src/app/[locale]/[state]/[district]/contributors/  — District-level contributor page
```

### Social Link Detection (src/lib/social-detect.ts)
```
detectAndCleanSocialLink(rawInput) handles:
  @handle → Instagram, bare usernames, reel/post URLs, LinkedIn /in/ and /company/,
  Twitter/X.com, GitHub, generic websites. Cleans to canonical profile URL.
```

### Sponsor Flow
```
District pages: "❤️ Sponsor Mandya — ₹200/mo →" (pink gradient button)
  + "or: Sponsor Karnataka — ₹2,000/mo →" + "or: Sponsor India — ₹10,000/mo →"
  All link to /support?tier=district&state=karnataka&district=mandya (auto-fills + auto-scrolls)
Locked districts: same CTA with "Sponsor this district" → LockedDistrictPreview
```

---

## ALL STATES + LOCKED DISTRICTS

### Browsable Preview Mode
```
All 36 states navigable from header dropdown
All 152 districts in DB — locked ones show LockedDistrictPreview:
  - District header (name, population, area, literacy, taluks from districts.ts)
  - "29 dashboards waiting to be unlocked" CTA
  - Sponsor CTA with URL params
  - Sponsors waiting section (if any)
  - 29 locked module cards (lock icon + module icon + label)
When district.active flips to true → preview disappears, full dashboard shows. Zero code changes.
```

### State District Maps (33 states)
```
Source: DataMeet Census 2011 district boundaries (CC-BY 4.0)
Files: public/geo/{state-slug}-districts.json (33 files, Karnataka separate)
Component: src/components/map/GenericStateMap.tsx
  - Auto center/scale from GeoJSON bounds
  - Active districts: blue fill, clickable
  - Locked districts: gray fill, clickable → preview
  - Falls back if GeoJSON doesn't load
StateMapSection.tsx: KarnatakaMap for Karnataka, GenericStateMap for others
```

### Scripts
```
scripts/sync-all-districts.ts          — Syncs districts.ts → DB (upsert, never downgrades active)
scripts/setup-razorpay-plans.ts        — Creates subscription plans on Razorpay
scripts/setup-state-maps.ts            — Processes GeoJSON into per-state files
scripts/seed-test-contributors.ts      — Seeds 20 test contributors (dev only)
scripts/cleanup-test-contributors.ts   — Removes [TEST] records before deploy
```

---

## SUPPORT PAGE STRUCTURE (src/app/support/page.tsx)

```
1. Hero (₹1.50/district/day at full scale + cost disclaimer)
2. International disclaimer at TOP (@forthepeople_in Instagram)
3. 6 tier cards (from TIER_CONFIG, "MOST POPULAR" on District Champion)
4. Contributor wall (scrolling subscribers + one-time list)
5. Supporter quotes (from DB messages)
6. Personal bio (Jayanth M B)
7. Scale section + "Early supporters lock in current rates"
8. Cost at Scale (3 cards)
9. Where Your Money Goes (cost breakdown bars)
10. Other Ways to Help (GitHub, share, contribute, feedback)
11. Bottom CTA + small international reminder
```

---

## CRITICAL WARNINGS

1. **Map is FRAGILE** — react-simple-maps, portrait 800×900, CW GeoJSON winding. Never modify without testing all 36 states.

2. **ioredis vs @upstash/redis** — Never use ioredis in Next.js API routes (Vercel). Only in Railway scraper.

3. **AI response parsing** — Always `content.find(b => b.type === 'text')`. Never `content[0]`.

4. **Budget values** — Stored as Rupees. Display divides by 1e7. Never store as Crores.

5. **Born-in-district rule** — FamousPersonality must have bornInDistrict=true for that district's page.

6. **Leaders are ADD-only** — Never deleteMany leaders before re-seeding. Use upsert.

7. **Deploy via git push** — Never `npx vercel --prod`. Uses wrong scope.

8. **git email** — Must be `jayanthmbj@gmail.com`. Vercel rejects other authors.

9. **ANTHROPIC_BASE_URL env priority** — Env var ALWAYS beats DB setting. Never change the priority order.

10. **npm install --legacy-peer-deps** in Dockerfile — `npm ci` fails due to peer dep conflicts.

11. **recharts Tooltip formatter** — Use `(v)` with `Number(v)` cast. Never `(v: number)`.

12. **Header nav overflow** — Must be `overflow:visible`. Never set to `hidden` (clips dropdowns).

13. **API slugs** — Use `leaders` not `leadership`, `budget` not `finance`.

14. **NewsItem field** — `title` not `headline`. (was a historical bug, now fixed)

15. **maxTokens for extended thinking** — Must be >= 2048.

16. **CRON_SECRET** — Read from `Authorization: Bearer` header ONLY. Never from URL query params (they appear in server logs). Fixed in audit 2026-03-29.

17. **Unbounded queries** — Always add `take: N` to findMany() on high-cardinality tables. schools: take:200, elections: take:100.

18. **2FA recovery token** — Must use `crypto.timingSafeEqual()` for constant-time comparison. Never string equality `===` on security tokens.

19. **LIVE_MODULES list** — Keep in sync between `src/lib/cache.ts` (server TTLs) and `src/hooks/useDistrictData.ts` (client stale times). Includes: crops, weather, water, dam, alerts, news, power.
