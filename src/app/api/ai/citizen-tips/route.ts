/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — AI Citizen Tips
// GET /api/ai/citizen-tips?district=mandya&state=karnataka
// Returns AI-generated, location-aware seasonal tips for citizens
// Cached in Redis for 6 hours per district+month
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { callAI } from "@/lib/ai-provider";

const CACHE_TTL = 6 * 60 * 60; // 6 hours

interface CitizenTip {
  category: string;
  icon: string;
  title: string;
  description: string;
  urgency: "now" | "soon" | "general";
}

interface TipsResponse {
  tips: CitizenTip[];
  month: number;
  year: number;
  generatedAt: string;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

async function generateTips(
  districtName: string,
  stateName: string,
  month: number,
  year: number,
  contextData: string
): Promise<CitizenTip[]> {
  const monthName = MONTHS[month - 1];
  const season = month >= 6 && month <= 9 ? "Kharif/monsoon" : month >= 10 && month <= 11 ? "post-harvest/Rabi sowing" : month >= 12 || month <= 2 ? "Rabi/winter" : "summer/pre-monsoon";

  const prompt = `You are a civic advisor for ${districtName} district, ${stateName}, India. Generate 6 practical, actionable citizen tips for ${monthName} ${year} (${season} season).

Current district context: ${contextData}

Respond ONLY with a valid JSON array (no markdown, no extra text):
[
  {
    "category": "Agriculture|Health|Finance|Water|Rights|Safety|Education|Environment",
    "icon": "single emoji",
    "title": "short action title (max 8 words)",
    "description": "2-3 sentences of specific, practical advice relevant to ${districtName} citizens in ${monthName}",
    "urgency": "now|soon|general"
  }
]

Guidelines:
- Mix categories: 2 agriculture, 1 health, 1 government scheme, 1 safety/emergency, 1 civic duty
- Be hyper-local — mention ${districtName}-specific context where possible
- urgency "now" = must do this week, "soon" = this month, "general" = evergreen advice
- Write for ordinary citizens, not experts
- Use Indian context (schemes, government portals, local practices)`;

  const response = await callAI({ systemPrompt: `You are a civic advisor for ${districtName} district, ${stateName}, India.`, userPrompt: prompt, jsonMode: true });
  const text = response.text.trim();

  const jsonStr = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(jsonStr) as CitizenTip[];
  return parsed;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const districtSlug = searchParams.get("district");
  const stateSlug = searchParams.get("state") ?? "karnataka";

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Redis cache key — invalidates monthly
  const cacheKeyStr = `ftp:ai:citizen-tips:${districtSlug}:${year}:${month}`;

  const cached = await cacheGet<TipsResponse>(cacheKeyStr);
  if (cached) {
    return NextResponse.json(
      { ...cached, fromCache: true },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}` } }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ tips: [], error: "AI not configured" });
  }

  try {
    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true, name: true, population: true },
    });
    if (!district) return NextResponse.json({ tips: [] });

    // Gather quick context
    const [weather, alerts, schemes] = await Promise.all([
      prisma.weatherReading.findFirst({
        where: { districtId: district.id },
        orderBy: { recordedAt: "desc" },
        select: { temperature: true, conditions: true, rainfall: true },
      }),
      prisma.localAlert.findMany({
        where: { districtId: district.id, active: true },
        take: 3,
        select: { title: true, type: true, severity: true },
      }),
      prisma.scheme.findMany({
        where: { districtId: district.id, active: true },
        take: 3,
        select: { name: true },
      }),
    ]);

    const stateName = stateSlug.charAt(0).toUpperCase() + stateSlug.slice(1);
    const contextParts: string[] = [
      weather ? `Weather: ${weather.temperature}°C, ${weather.conditions}` : "",
      alerts.length ? `Active alerts: ${alerts.map((a) => a.title).join(", ")}` : "",
      schemes.length ? `Active government schemes: ${schemes.map((s) => s.name).join(", ")}` : "",
    ].filter(Boolean);

    const contextData = contextParts.join(". ") || "General district context";

    const tips = await generateTips(district.name, stateName, month, year, contextData);

    const response: TipsResponse = {
      tips,
      month,
      year,
      generatedAt: new Date().toISOString(),
    };

    await cacheSet(cacheKeyStr, response, CACHE_TTL);

    return NextResponse.json(
      { ...response, fromCache: false },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}` } }
    );
  } catch (err) {
    console.error(`[AI citizen-tips] ${districtSlug}:`, err);
    return NextResponse.json({ tips: [], error: "Failed to generate tips" });
  }
}
