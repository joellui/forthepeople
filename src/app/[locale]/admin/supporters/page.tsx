/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SyncButton } from "./SyncButton";
import SupportersTable from "./SupportersTable";

const COOKIE = "ftp_admin_v1";
type Params = Promise<{ locale: string }>;

export default async function SupportersPage({ params }: { params: Params }) {
  const { locale } = await params;
  const authed = (await cookies()).get(COOKIE)?.value === "ok";
  if (!authed) redirect(`/${locale}/admin`);

  const supporters = await prisma.supporter.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      sponsoredDistrict: { select: { name: true, slug: true, stateId: true } },
      sponsoredState: { select: { name: true, slug: true } },
    },
  });

  const successList = supporters.filter((s) => s.status === "success");
  const activeSubscriptions = successList.filter((s) => s.isRecurring && s.subscriptionStatus === "active");
  const totalRevenue = successList.reduce((t, s) => t + s.amount, 0);

  const now = new Date();
  const oneWeekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringThisWeek = activeSubscriptions.filter(
    (s) => s.expiresAt && s.expiresAt <= oneWeekOut
  ).length;

  const monthlyRecurring = activeSubscriptions.reduce((t, s) => t + s.amount, 0);
  const oneTimeTotal = successList.filter((s) => !s.isRecurring).reduce((t, s) => t + s.amount, 0);

  // Serialize for client component
  const serialized = supporters.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    amount: s.amount,
    tier: s.tier,
    status: s.status,
    method: s.method,
    isRecurring: s.isRecurring,
    subscriptionStatus: s.subscriptionStatus,
    activatedAt: s.activatedAt?.toISOString() ?? null,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    districtName: s.sponsoredDistrict?.name ?? null,
    districtSlug: s.sponsoredDistrict?.slug ?? null,
    stateName: s.sponsoredState?.name ?? null,
    stateSlug: s.sponsoredState?.slug ?? null,
    socialLink: s.socialLink,
    badgeLevel: s.badgeLevel,
    badgeType: s.badgeType,
    message: s.message,
    isPublic: s.isPublic,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
            💰 Supporters
          </h1>
          <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
            All payment records — subscriptions, one-time, and historical
          </div>
        </div>
        <SyncButton />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Active Subscriptions", value: activeSubscriptions.length.toString(), color: "#16A34A" },
          { label: "Monthly Revenue", value: `₹${monthlyRecurring.toLocaleString("en-IN")}`, color: "#2563EB" },
          { label: "One-Time Total", value: `₹${oneTimeTotal.toLocaleString("en-IN")}`, color: "#D97706" },
          { label: "Expiring This Week", value: expiringThisWeek.toString(), color: expiringThisWeek > 0 ? "#DC2626" : "#9B9B9B" },
          { label: "All-Time Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "var(--font-mono, monospace)" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <SupportersTable supporters={serialized} />
    </div>
  );
}
