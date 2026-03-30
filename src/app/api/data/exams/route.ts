/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Exams & Jobs API — /api/data/exams
// Returns: state-level exams + district-level exams
// Cache: 1 hour (TTL 3600)
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import redis from "@/lib/redis";

type RouteContext = { params: Promise<{ module: string }> };

export async function GET(req: NextRequest, _ctx: RouteContext) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district") ?? "";
  const stateSlug = sp.get("state") ?? "";

  if (!districtSlug) {
    return NextResponse.json({ error: "district param required" }, { status: 400 });
  }

  // ── Cache check (1 hour TTL) ─────────────────────────────
  const cacheKey = `ftp:${districtSlug}:exams`;
  try {
    if (redis) {
      const cached = await redis.get<{ data: unknown; meta: Record<string, unknown> }>(cacheKey);
      if (cached) {
        const resp = NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
        resp.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
        return resp;
      }
    }
  } catch {
    // Non-fatal: proceed without cache
  }

  // ── Fetch ────────────────────────────────────────────────
  try {
    const now = new Date().toISOString();
    const meta = { module: "exams", district: districtSlug, updatedAt: now, fromCache: false };

    const district = await prisma.district.findFirst({
      where: { slug: districtSlug },
      select: { id: true, name: true, state: { select: { id: true, name: true } } },
    });

    if (!district) {
      return NextResponse.json({ data: null, meta: { ...meta, error: "District not found" } });
    }

    const stateId = district.state.id;

    // Fetch both state-level and district-level exams in parallel
    const [stateExams, districtExams, staffing] = await Promise.all([
      prisma.governmentExam.findMany({
        where: {
          OR: [
            { stateId },
            // Also include national exams (no stateId but level=state)
            { level: "state", stateId: null },
          ],
        },
        orderBy: [{ status: "asc" }, { announcedDate: "desc" }],
      }),
      prisma.governmentExam.findMany({
        where: { districtId: district.id },
        orderBy: [{ status: "asc" }, { announcedDate: "desc" }],
      }),
      prisma.departmentStaffing.findMany({
        where: { districtId: district.id },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const result = {
      stateExams,
      districtExams,
      staffing,
      summary: {
        totalStateExams: stateExams.length,
        totalDistrictExams: districtExams.length,
        openExams: [...stateExams, ...districtExams].filter((e) => e.status === "open").length,
        upcomingExams: [...stateExams, ...districtExams].filter((e) => e.status === "upcoming").length,
        totalStaffingRecords: staffing.length,
      },
    };

    // Cache for 1 hour
    try {
      if (redis) {
        await redis.set(cacheKey, { data: result, meta }, { ex: 3600 });
      }
    } catch {
      // Non-fatal
    }

    const resp = NextResponse.json({ data: result, meta });
    resp.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
    return resp;
  } catch (err) {
    console.error("[API] exams error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
