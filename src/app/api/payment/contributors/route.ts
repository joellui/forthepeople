/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/cache";

const CACHE_KEY = "ftp:contributors:v1";
const CACHE_TTL = 60; // 60 seconds

export interface ContributorItem {
  name: string;
  amountRupees: number;
  tier: string | null;
  message: string | null;
  paidAt: string;
}

export interface ContributorsResponse {
  contributors: ContributorItem[];
  totalRupees: number;
  count: number;
}

export async function GET() {
  try {
    const cached = await cacheGet<ContributorsResponse>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const rows = await prisma.contribution.findMany({
      where: { status: "paid" },
      orderBy: { paidAt: "desc" },
      take: 50,
      select: {
        name: true,
        amount: true,
        tier: true,
        message: true,
        isPublic: true,
        paidAt: true,
      },
    });

    const totals = await prisma.contribution.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
      _count: { id: true },
    });

    const contributors: ContributorItem[] = rows.map((r) => ({
      name: r.isPublic ? r.name : "Anonymous",
      amountRupees: Math.floor(r.amount / 100),
      tier: r.tier,
      message: r.isPublic ? (r.message ?? null) : null,
      paidAt: r.paidAt?.toISOString() ?? new Date().toISOString(),
    }));

    const result: ContributorsResponse = {
      contributors,
      totalRupees: Math.floor((totals._sum.amount ?? 0) / 100),
      count: totals._count.id,
    };

    await cacheSet(CACHE_KEY, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[contributors]", err);
    return NextResponse.json({ contributors: [], totalRupees: 0, count: 0 });
  }
}
