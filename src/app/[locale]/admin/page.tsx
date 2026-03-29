/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { FactChecker } from "./FactChecker";

const COOKIE = "ftp_admin_v1";
type Params = Promise<{ locale: string }>;

export default async function AdminDashboardPage({ params }: { params: Params }) {
  const { locale } = await params;
  const authed = (await cookies()).get(COOKIE)?.value === "ok";
  if (!authed) redirect(`/${locale}/admin?error=1`);

  // Quick stats
  const [
    pendingReview,
    newFeedback,
    aiSettings,
    successSupporters,
    recentFeedback,
    recentSupporters,
    recentReview,
  ] = await Promise.all([
    prisma.reviewQueue.count({ where: { status: "pending" } }),
    prisma.feedback.count({ where: { status: "new" } }),
    prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } }),
    prisma.supporter.findMany({ where: { status: "success" }, select: { amount: true } }),
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      include: { district: { select: { name: true } } },
    }),
    prisma.supporter.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.reviewQueue.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const totalRevenue = successSupporters.reduce((s, x) => s + x.amount, 0);
  const todayCalls = (aiSettings?.totalGeminiCalls ?? 0) + (aiSettings?.totalAnthropicCalls ?? 0);

  const stats = [
    {
      icon: "🤖",
      label: "AI Provider",
      value: aiSettings?.activeProvider === "anthropic" ? "Claude Active" : "Gemini Active",
      sub: `${todayCalls.toLocaleString("en-IN")} total calls`,
      href: `/${locale}/admin/ai-settings`,
      color: aiSettings?.activeProvider === "anthropic" ? "#7C3AED" : "#16A34A",
    },
    {
      icon: "📰",
      label: "Review Queue",
      value: `${pendingReview} pending`,
      sub: "AI insights awaiting review",
      href: `/${locale}/admin/review`,
      color: pendingReview > 0 ? "#D97706" : "#16A34A",
    },
    {
      icon: "💰",
      label: "Supporters",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      sub: `${successSupporters.length} total supporters`,
      href: `/${locale}/admin/supporters`,
      color: "#2563EB",
    },
    {
      icon: "💬",
      label: "Feedback",
      value: `${newFeedback} new`,
      sub: "Unread feedback items",
      href: `/${locale}/admin/feedback`,
      color: newFeedback > 0 ? "#DC2626" : "#16A34A",
    },
  ];

  // Combined activity feed
  const activity: { ts: Date; icon: string; text: string; href: string }[] = [
    ...recentFeedback.map((f) => ({
      ts: f.createdAt,
      icon: "💬",
      text: `${f.name ?? "Anonymous"} — ${f.type}: "${f.subject.slice(0, 60)}"${f.district ? ` (${f.district.name})` : ""}`,
      href: `/${locale}/admin/feedback`,
    })),
    ...recentSupporters.map((s) => ({
      ts: s.createdAt,
      icon: "💰",
      text: `${s.name} — ₹${s.amount.toLocaleString("en-IN")} (${s.tier}) — ${s.status}`,
      href: `/${locale}/admin/supporters`,
    })),
    ...recentReview.map((r) => ({
      ts: r.createdAt,
      icon: "📰",
      text: `New AI insight in review queue — ${r.status}`,
      href: `/${locale}/admin/review`,
    })),
  ].sort((a, b) => b.ts.getTime() - a.ts.getTime()).slice(0, 10);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
          Admin Dashboard
        </h1>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
          ForThePeople.in — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E8E4",
                borderRadius: 12,
                padding: "16px",
                cursor: "pointer",
                transition: "box-shadow 150ms",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: "#6B6B6B", marginTop: 4 }}>{s.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #F0F0EC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Recent Activity</div>
        </div>
        {activity.length === 0 ? (
          <div style={{ padding: 24, fontSize: 13, color: "#9B9B9B", textAlign: "center" }}>
            No activity yet.
          </div>
        ) : (
          <div>
            {activity.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 20px",
                  borderBottom: i < activity.length - 1 ? "1px solid #F5F5F0" : "none",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.4 }}>{item.text}</div>
                  <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
                    {item.ts.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                    {item.ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <FactChecker />
    </div>
  );
}
