/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";
import { calculateBadgeLevel, getMonthsActive } from "@/lib/badge-level";
import { TIER_PRIORITY } from "@/lib/constants/razorpay-plans";

const CACHE_TTL = 120; // 2 minutes

// Public-safe fields only — never expose email, phone, paymentId, razorpayData
interface PublicContributor {
  id: string;
  name: string;
  amount: number | null; // only for one-time
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtId: string | null;
  stateId: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  monthsActive: number;
  message: string | null;
  createdAt: string;
}

function toPublic(s: {
  id: string;
  name: string;
  amount: number;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtId: string | null;
  stateId: string | null;
  activatedAt: Date | null;
  expiresAt: Date | null;
  isRecurring: boolean;
  message: string | null;
  isPublic: boolean;
  createdAt: Date;
}): PublicContributor {
  const isAnon = !s.isPublic;
  return {
    id: s.id,
    name: isAnon ? "Anonymous" : s.name,
    amount: s.isRecurring ? null : s.amount,
    tier: s.tier,
    badgeType: s.badgeType,
    badgeLevel: s.badgeLevel ?? calculateBadgeLevel(s.activatedAt),
    socialLink: isAnon ? null : s.socialLink,
    socialPlatform: isAnon ? null : s.socialPlatform,
    districtId: s.districtId,
    stateId: s.stateId,
    activatedAt: s.activatedAt?.toISOString() ?? null,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    monthsActive: getMonthsActive(s.activatedAt),
    message: isAnon ? null : s.message,
    createdAt: s.createdAt.toISOString(),
  };
}

const SELECT_FIELDS = {
  id: true,
  name: true,
  amount: true,
  tier: true,
  badgeType: true,
  badgeLevel: true,
  socialLink: true,
  socialPlatform: true,
  districtId: true,
  stateId: true,
  activatedAt: true,
  expiresAt: true,
  isRecurring: true,
  message: true,
  isPublic: true,
  createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const districtSlug = url.searchParams.get("district");
    const stateSlug = url.searchParams.get("state");

    // ── District page sponsors ──────────────────────────────
    if (districtSlug || stateSlug) {
      const cacheKey = `ftp:contributors:district:${districtSlug ?? ""}:${stateSlug ?? ""}`;
      const cached = await cacheGet<PublicContributor[]>(cacheKey);
      if (cached) return NextResponse.json({ contributors: cached });

      // Resolve district → get its stateId
      let resolvedStateId: string | null = null;
      let resolvedDistrictId: string | null = null;

      if (districtSlug) {
        const district = await prisma.district.findFirst({
          where: { slug: districtSlug },
          select: { id: true, stateId: true },
        });
        if (district) {
          resolvedDistrictId = district.id;
          resolvedStateId = district.stateId;
        }
      }
      if (stateSlug && !resolvedStateId) {
        const state = await prisma.state.findFirst({
          where: { slug: stateSlug },
          select: { id: true },
        });
        if (state) resolvedStateId = state.id;
      }

      // Fetch active sponsors: patrons + state champions + district champions
      const sponsors = await prisma.supporter.findMany({
        where: {
          isRecurring: true,
          subscriptionStatus: "active",
          status: "success",
          OR: [
            { tier: "patron" }, // All-India Patrons always shown
            ...(resolvedStateId ? [{ tier: "state", stateId: resolvedStateId }] : []),
            ...(resolvedDistrictId ? [{ tier: "district", districtId: resolvedDistrictId }] : []),
          ],
        },
        select: SELECT_FIELDS,
        orderBy: { activatedAt: "asc" }, // longest tenure first
      });

      // Sort: patrons → state → district, then by tenure
      const sorted = sponsors
        .map(toPublic)
        .sort((a, b) => {
          const pa = TIER_PRIORITY[a.tier] ?? 0;
          const pb = TIER_PRIORITY[b.tier] ?? 0;
          if (pa !== pb) return pb - pa;
          return b.monthsActive - a.monthsActive;
        });

      await cacheSet(cacheKey, sorted, CACHE_TTL);
      return NextResponse.json({ contributors: sorted });
    }

    // ── Leaderboard ─────────────────────────────────────────
    if (type === "leaderboard") {
      const cacheKey = "ftp:contributors:leaderboard";
      const cached = await cacheGet<PublicContributor[]>(cacheKey);
      if (cached) return NextResponse.json({ contributors: cached });

      const leaders = await prisma.supporter.findMany({
        where: {
          isRecurring: true,
          subscriptionStatus: "active",
          status: "success",
        },
        select: SELECT_FIELDS,
        orderBy: { activatedAt: "asc" }, // longest active first
        take: 10,
      });

      const sorted = leaders
        .map(toPublic)
        .sort((a, b) => {
          if (a.monthsActive !== b.monthsActive) return b.monthsActive - a.monthsActive;
          const pa = TIER_PRIORITY[a.tier] ?? 0;
          const pb = TIER_PRIORITY[b.tier] ?? 0;
          if (pa !== pb) return pb - pa;
          return (b.amount ?? 0) - (a.amount ?? 0);
        });

      await cacheSet(cacheKey, sorted, CACHE_TTL);
      return NextResponse.json({ contributors: sorted });
    }

    // ── District rankings ─────────────────────────────────
    if (type === "district-rankings") {
      const rkCacheKey = "ftp:contributors:district-rankings";
      const rkCached = await cacheGet<unknown>(rkCacheKey);
      if (rkCached) return NextResponse.json(rkCached);

      const districtSupporters = await prisma.supporter.findMany({
        where: {
          isRecurring: true,
          subscriptionStatus: "active",
          status: "success",
          districtId: { not: null },
        },
        select: {
          districtId: true,
          amount: true,
          name: true,
          isPublic: true,
          sponsoredDistrict: {
            select: { name: true, slug: true, active: true, state: { select: { name: true, slug: true } } },
          },
        },
      });

      // Group by district
      const districtMap: Record<string, {
        districtName: string;
        districtSlug: string;
        stateName: string;
        stateSlug: string;
        active: boolean;
        count: number;
        monthlyTotal: number;
      }> = {};

      for (const s of districtSupporters) {
        const dId = s.districtId!;
        if (!districtMap[dId]) {
          districtMap[dId] = {
            districtName: s.sponsoredDistrict?.name ?? "Unknown",
            districtSlug: s.sponsoredDistrict?.slug ?? "",
            stateName: s.sponsoredDistrict?.state?.name ?? "",
            stateSlug: s.sponsoredDistrict?.state?.slug ?? "",
            active: s.sponsoredDistrict?.active ?? false,
            count: 0,
            monthlyTotal: 0,
          };
        }
        districtMap[dId].count++;
        districtMap[dId].monthlyTotal += s.amount;
      }

      const rankings = Object.values(districtMap)
        .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

      const activeRankings = rankings.filter((r) => r.active);
      const awaitingLaunch = rankings.filter((r) => !r.active);

      const rkResult = { rankings: activeRankings, awaitingLaunch };
      await cacheSet(rkCacheKey, rkResult, CACHE_TTL);
      return NextResponse.json(rkResult);
    }

    // ── All contributors (one-time + subscriptions) ─────────
    const cacheKey = "ftp:contributors:all";
    const cached = await cacheGet<{ subscribers: PublicContributor[]; oneTime: PublicContributor[] }>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const [subscribers, oneTime] = await Promise.all([
      prisma.supporter.findMany({
        where: {
          isRecurring: true,
          subscriptionStatus: "active",
          status: "success",
        },
        select: SELECT_FIELDS,
        orderBy: { activatedAt: "asc" },
      }),
      prisma.supporter.findMany({
        where: {
          isRecurring: false,
          status: "success",
        },
        select: SELECT_FIELDS,
        orderBy: { amount: "desc" },
      }),
    ]);

    const result = {
      subscribers: subscribers.map(toPublic).sort((a, b) => {
        const pa = TIER_PRIORITY[a.tier] ?? 0;
        const pb = TIER_PRIORITY[b.tier] ?? 0;
        if (pa !== pb) return pb - pa;
        return b.monthsActive - a.monthsActive;
      }),
      oneTime: oneTime.map(toPublic),
    };

    await cacheSet(cacheKey, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[data/contributors]", err);
    return NextResponse.json({ contributors: [], subscribers: [], oneTime: [] });
  }
}
