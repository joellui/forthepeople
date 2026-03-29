/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { SyncButton } from "./SyncButton";

const COOKIE = "ftp_admin_v1";
type Params = Promise<{ locale: string }>;

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SupportersPage({ params }: { params: Params }) {
  const { locale } = await params;
  const authed = (await cookies()).get(COOKIE)?.value === "ok";
  if (!authed) redirect(`/${locale}/admin`);

  const supporters = await prisma.supporter.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const successList = supporters.filter((s) => s.status === "success");
  const totalRevenue = successList.reduce((t, s) => t + s.amount, 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = successList
    .filter((s) => s.createdAt >= thisMonthStart)
    .reduce((t, s) => t + s.amount, 0);
  const recurringCount = successList.filter((s) => s.isRecurring).length;

  const STATUS_COLORS: Record<string, string> = {
    success: "#16A34A",
    failed: "#DC2626",
    pending: "#D97706",
    refunded: "#7C3AED",
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
            💰 Supporters
          </h1>
          <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
            All payment records from Razorpay webhook
          </div>
        </div>
        <SyncButton />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "#2563EB" },
          { label: "Total Supporters", value: successList.length.toString(), color: "#16A34A" },
          { label: "This Month", value: `₹${thisMonthRevenue.toLocaleString("en-IN")}`, color: "#D97706" },
          { label: "Recurring", value: recurringCount.toString(), color: "#7C3AED" },
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

      {/* Table */}
      {supporters.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E8E4",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            fontSize: 13,
            color: "#9B9B9B",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
          No supporters yet. Share your{" "}
          <Link href="/support" style={{ color: "#2563EB" }}>/support</Link> page to start receiving contributions.
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E4", background: "#FAFAF8" }}>
                {["Name", "Email", "Amount (₹)", "Tier", "Method", "Date", "Status", "Message"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supporters.map((s, i) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: i < supporters.length - 1 ? "1px solid #F5F5F0" : "none" }}
                >
                  <td style={{ padding: "10px 14px", fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: "10px 14px", color: "#6B6B6B" }}>{s.email ?? "—"}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono, monospace)", fontWeight: 600, color: "#2563EB" }}>
                    ₹{s.amount.toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6B6B6B" }}>{s.tier}</td>
                  <td style={{ padding: "10px 14px", color: "#6B6B6B" }}>{s.method ?? "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#6B6B6B", whiteSpace: "nowrap" }}>{fmtDate(s.createdAt)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span
                      style={{
                        background: `${STATUS_COLORS[s.status] ?? "#9B9B9B"}15`,
                        color: STATUS_COLORS[s.status] ?? "#9B9B9B",
                        padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6B6B6B", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
