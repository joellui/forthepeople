/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Real-time AI Module Insight
// GET /api/ai/insight?module=weather&district=mandya
// Returns { opinion, severity, recommendation, generatedAt }
// Cached in Redis for 30 minutes per district+module
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { callAI } from "@/lib/ai-provider";

const CACHE_TTL = 30 * 60; // 30 minutes

// ── Severity type ──────────────────────────────────────────
type Severity = "good" | "watch" | "alert" | "critical";

interface ModuleInsight {
  opinion: string;
  severity: Severity;
  recommendation: string;
  generatedAt: string;
  aiProvider?: string;
  aiModel?: string;
}

// ── Fetch module-specific data from DB ─────────────────────
async function fetchModuleData(module: string, districtId: string): Promise<string> {
  const now = new Date();

  switch (module) {
    case "weather": {
      const [w, r] = await Promise.all([
        prisma.weatherReading.findFirst({
          where: { districtId },
          orderBy: { recordedAt: "desc" },
          select: { temperature: true, humidity: true, rainfall: true, windSpeed: true, conditions: true, recordedAt: true },
        }),
        prisma.rainfallHistory.findMany({
          where: { districtId, year: { gte: now.getFullYear() - 1 } },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 6,
          select: { month: true, year: true, rainfall: true, normal: true, departure: true },
        }),
      ]);
      if (!w) return "No weather data available.";
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const rainfall = r.map((x) => `${months[x.month-1]} ${x.year}: ${x.rainfall}mm (normal ${x.normal}mm, departure ${x.departure > 0 ? "+" : ""}${x.departure}mm)`).join("; ");
      return `Current: ${w.temperature}°C, ${w.humidity}% humidity, ${w.rainfall}mm rainfall today, ${w.windSpeed} km/h wind, conditions: ${w.conditions}. Recent rainfall: ${rainfall}`;
    }

    case "crops": {
      const prices = await prisma.cropPrice.findMany({
        where: { districtId },
        orderBy: { date: "desc" },
        take: 20,
        select: { commodity: true, modalPrice: true, minPrice: true, maxPrice: true, market: true, date: true },
      });
      if (!prices.length) return "No crop price data available.";
      const latestByComm = new Map<string, typeof prices[0]>();
      prices.forEach((p) => { if (!latestByComm.has(p.commodity)) latestByComm.set(p.commodity, p); });
      const summary = Array.from(latestByComm.values())
        .map((p) => `${p.commodity}: ₹${p.modalPrice}/q at ${p.market} on ${new Date(p.date).toLocaleDateString("en-IN")}`)
        .join("; ");
      return `Mandi prices — ${summary}`;
    }

    case "water": {
      const dams = await prisma.damReading.findMany({
        where: { districtId },
        orderBy: { recordedAt: "desc" },
        take: 10,
        select: { damName: true, waterLevel: true, maxLevel: true, storagePct: true, inflow: true, outflow: true, recordedAt: true },
      });
      if (!dams.length) return "No dam/water data available.";
      const latestByDam = new Map<string, typeof dams[0]>();
      dams.forEach((d) => { if (!latestByDam.has(d.damName)) latestByDam.set(d.damName, d); });
      const summary = Array.from(latestByDam.values())
        .map((d) => `${d.damName}: ${d.waterLevel}/${d.maxLevel} ft (${d.storagePct}% full), inflow ${d.inflow}cusecs, outflow ${d.outflow}cusecs`)
        .join("; ");
      return `Dam levels — ${summary}`;
    }

    case "power": {
      const outages = await prisma.powerOutage.findMany({
        where: { districtId, startTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { startTime: "desc" },
        take: 10,
        select: { area: true, reason: true, duration: true, startTime: true, active: true },
      });
      const activeCount = outages.filter((o) => o.active).length;
      const outageStr = outages.length
        ? `${outages.length} outages in last 7 days (${activeCount} active). Recent: ${outages.slice(0, 3).map((o) => `${o.area} (${o.reason ?? "maintenance"}, ${o.duration ?? "ongoing"})`).join("; ")}`
        : "No recent outages";
      return `Power outages — ${outageStr}`;
    }

    case "police": {
      const crimes = await prisma.crimeStat.findMany({
        where: { districtId, year: { gte: now.getFullYear() - 1 } },
        orderBy: { year: "desc" },
        take: 20,
        select: { category: true, count: true, year: true },
      });
      if (!crimes.length) return "No crime data available.";
      const byCat = new Map<string, number>();
      crimes.forEach((c) => { byCat.set(c.category, (byCat.get(c.category) ?? 0) + c.count); });
      const top = Array.from(byCat.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([cat, cnt]) => `${cat}: ${cnt}`).join(", ");
      return `Crime statistics (last year): ${top}`;
    }

    case "finance": {
      const budgets = await prisma.budgetEntry.findMany({
        where: { districtId },
        orderBy: [{ fiscalYear: "desc" }, { sector: "asc" }],
        take: 15,
        select: { sector: true, allocated: true, spent: true, fiscalYear: true },
      });
      if (!budgets.length) return "No budget data available.";
      const latestYear = budgets[0].fiscalYear;
      const current = budgets.filter((b) => b.fiscalYear === latestYear);
      const total = current.reduce((s, b) => s + b.allocated, 0);
      const spent = current.reduce((s, b) => s + b.spent, 0);
      const utilization = total > 0 ? Math.round((spent / total) * 100) : 0;
      const cats = current.map((b) => `${b.sector}: ₹${Math.round(b.allocated / 1e7)}Cr allocated`).join("; ");
      return `FY ${latestYear} Budget: ₹${Math.round(total / 1e7)}Cr total, ${utilization}% utilized. ${cats}`;
    }

    case "overview": {
      const [alerts, infra, weather, crops] = await Promise.all([
        prisma.localAlert.findMany({
          where: { districtId, active: true },
          orderBy: { severity: "asc" },
          take: 3,
          select: { title: true, severity: true, type: true },
        }),
        prisma.infraProject.findMany({
          where: { districtId, status: "In Progress" },
          take: 3,
          select: { name: true, progressPct: true, budget: true },
        }),
        prisma.weatherReading.findFirst({
          where: { districtId },
          orderBy: { recordedAt: "desc" },
          select: { temperature: true, conditions: true },
        }),
        prisma.cropPrice.findMany({
          where: { districtId },
          orderBy: { date: "desc" },
          take: 3,
          select: { commodity: true, modalPrice: true },
        }),
      ]);
      const alertStr = alerts.length ? `${alerts.length} active alerts: ${alerts.map((a) => `${a.title} (${a.severity})`).join(", ")}` : "No active alerts";
      const infraStr = infra.map((p) => `${p.name} (${p.progressPct ?? 0}% done)`).join(", ");
      const weatherStr = weather ? `Weather: ${weather.temperature}°C, ${weather.conditions}` : "";
      const cropStr = crops.map((c) => `${c.commodity} ₹${c.modalPrice}/q`).join(", ");
      return `District overview — ${alertStr}. Ongoing projects: ${infraStr || "none"}. ${weatherStr}. Crop prices: ${cropStr}`;
    }

    default:
      return `No data context available for module: ${module}`;
  }
}

// ── Generate insight via unified AI provider ───────────────
async function generateInsight(
  module: string,
  districtName: string,
  dataContext: string
): Promise<ModuleInsight> {
  const moduleDescriptions: Record<string, string> = {
    weather: "weather conditions and rainfall patterns",
    crops: "agricultural commodity prices at mandis",
    water: "dam and reservoir water levels",
    power: "electricity supply and outages",
    police: "law enforcement and crime statistics",
    finance: "government budget allocation and utilization",
    overview: "overall district situation",
  };

  const desc = moduleDescriptions[module] ?? module;
  const systemPrompt = `You are an AI analyst for ${districtName} district, India. Analyze the following ${desc} data and provide a citizen-friendly assessment.`;
  const userPrompt = `DATA: ${dataContext}

Respond ONLY with a valid JSON object (no markdown, no extra text):
{
  "opinion": "2-3 sentence plain English assessment of the current situation, what it means for citizens",
  "severity": "good|watch|alert|critical",
  "recommendation": "1 actionable suggestion for citizens or authorities"
}

Severity guide:
- good: Everything normal or better than expected
- watch: Minor concerns, monitor the situation
- alert: Significant issue needing attention
- critical: Urgent action needed

Be specific, factual, and avoid alarmism. Write for ordinary citizens, not experts.`;

  const response = await callAI({ systemPrompt, userPrompt, jsonMode: true });
  const text = response.text.trim();

  const jsonStr = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(jsonStr) as { opinion: string; severity: Severity; recommendation: string };

  return {
    opinion: parsed.opinion,
    severity: parsed.severity ?? "watch",
    recommendation: parsed.recommendation,
    generatedAt: new Date().toISOString(),
    aiProvider: response.provider,
    aiModel: response.model,
  };
}

// ── Route handler ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const moduleSlug = searchParams.get("module");
  const districtSlug = searchParams.get("district");

  if (!moduleSlug || !districtSlug) {
    return NextResponse.json({ error: "module and district params required" }, { status: 400 });
  }

  const SUPPORTED_MODULES = ["weather", "crops", "water", "power", "police", "finance", "overview"];
  if (!SUPPORTED_MODULES.includes(moduleSlug)) {
    return NextResponse.json({ insight: null });
  }

  // Redis cache key
  const cacheKeyStr = `ftp:ai:insight:${districtSlug}:${moduleSlug}`;

  // Check cache first
  const cached = await cacheGet<ModuleInsight>(cacheKeyStr);
  if (cached) {
    return NextResponse.json(
      { insight: cached, fromCache: true },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}` } }
    );
  }

  // Check Gemini API key
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ insight: null, error: "AI not configured" });
  }

  try {
    // Resolve district
    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true, name: true },
    });
    if (!district) {
      return NextResponse.json({ insight: null });
    }

    // Fetch live data context
    const dataContext = await fetchModuleData(moduleSlug, district.id);

    // Generate insight via Gemini
    const insight = await generateInsight(moduleSlug, district.name, dataContext);

    // Cache result
    await cacheSet(cacheKeyStr, insight, CACHE_TTL);

    return NextResponse.json(
      { insight, fromCache: false },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}` } }
    );
  } catch (err) {
    console.error(`[AI insight] ${moduleSlug}/${districtSlug}:`, err);
    return NextResponse.json({ insight: null, error: "Failed to generate insight" });
  }
}
