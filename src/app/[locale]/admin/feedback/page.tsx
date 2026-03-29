/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const COOKIE = "ftp_admin_v1";
type Params = Promise<{ locale: string }>;
type SearchParams = Promise<{ type?: string; status?: string; district?: string }>;

async function updateFeedbackAction(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const status = formData.get("status") as string | null;
  const adminNote = formData.get("adminNote") as string | null;
  const locale = formData.get("locale") as string;
  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (adminNote !== null) data.adminNote = adminNote;
  await prisma.feedback.update({ where: { id }, data });
  revalidatePath(`/${locale}/admin/feedback`);
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  bug: { label: "Bug", color: "#DC2626", bg: "#FFF1F2", emoji: "🐛" },
  wrong_data: { label: "Data Error", color: "#D97706", bg: "#FFFBEB", emoji: "📊" },
  suggestion: { label: "Feature", color: "#2563EB", bg: "#EFF6FF", emoji: "💡" },
  praise: { label: "Praise", color: "#16A34A", bg: "#F0FDF4", emoji: "👍" },
  other: { label: "General", color: "#6B6B6B", bg: "#F5F5F0", emoji: "💬" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "#DC2626" },
  reviewed: { label: "Read", color: "#D97706" },
  resolved: { label: "Replied", color: "#16A34A" },
  archived: { label: "Archived", color: "#9B9B9B" },
};

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default async function FeedbackAdminPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  const { type, status } = await searchParams;

  const authed = (await cookies()).get(COOKIE)?.value === "ok";
  if (!authed) redirect(`/${locale}/admin`);

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const [items, totalCount, newCount, bugCount, ratingAgg] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { district: { select: { name: true } } },
    }),
    prisma.feedback.count(),
    prisma.feedback.count({ where: { status: "new" } }),
    prisma.feedback.count({ where: { type: { in: ["bug", "wrong_data"] } } }),
    prisma.feedback.aggregate({ _avg: { rating: true }, where: { rating: { not: null } } }),
  ]);

  const avgRating = ratingAgg._avg.rating;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
          💬 Feedback Manager
        </h1>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
          All user feedback from the floating button and feedback forms
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Feedback", value: totalCount.toString(), color: "#2563EB" },
          { label: "New (Unread)", value: newCount.toString(), color: newCount > 0 ? "#DC2626" : "#16A34A" },
          { label: "Bugs Reported", value: bugCount.toString(), color: bugCount > 0 ? "#D97706" : "#16A34A" },
          { label: "Avg Rating", value: avgRating ? `${avgRating.toFixed(1)} / 5 ⭐` : "N/A", color: "#7C3AED" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "All", href: `/${locale}/admin/feedback` },
          { label: "🆕 New", href: `/${locale}/admin/feedback?status=new` },
          { label: "🐛 Bugs", href: `/${locale}/admin/feedback?type=bug` },
          { label: "📊 Data Errors", href: `/${locale}/admin/feedback?type=wrong_data` },
          { label: "💡 Features", href: `/${locale}/admin/feedback?type=suggestion` },
          { label: "👍 Praise", href: `/${locale}/admin/feedback?type=praise` },
          { label: "📦 Archived", href: `/${locale}/admin/feedback?status=archived` },
        ].map((f) => (
          <a
            key={f.label}
            href={f.href}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              fontSize: 12,
              textDecoration: "none",
              background: "#FFFFFF",
              border: "1px solid #E8E8E4",
              color: "#6B6B6B",
            }}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Feedback list */}
      {items.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 13, color: "#9B9B9B" }}>No feedback yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => {
            const tc = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other;
            const sc = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.new;
            return (
              <div
                key={item.id}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8E8E4",
                  borderRadius: 10,
                  padding: 16,
                  borderLeft: `3px solid ${tc.color}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{tc.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{item.subject}</span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: tc.bg, color: tc.color, fontWeight: 600 }}>
                        {tc.label}
                      </span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: "#F5F5F0", color: sc.color, fontWeight: 600 }}>
                        {sc.label}
                      </span>
                      {item.rating && (
                        <span style={{ fontSize: 11, color: "#D97706" }}>{"⭐".repeat(item.rating)}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#1A1A1A", lineHeight: 1.5, marginBottom: 6 }}>
                      {item.message}
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9B9B9B", flexWrap: "wrap" }}>
                      {item.name && <span>👤 {item.name}</span>}
                      {item.email && <span>✉️ {item.email}</span>}
                      {item.district && <span>📍 {item.district.name}</span>}
                      {item.module && <span>📦 {item.module}</span>}
                      <span>🕐 {fmtDate(item.createdAt)}</span>
                    </div>
                    {item.adminNote && (
                      <div style={{ marginTop: 8, padding: "6px 10px", background: "#FFFBEB", borderRadius: 6, fontSize: 12, color: "#92400E" }}>
                        📝 Note: {item.adminNote}
                      </div>
                    )}
                  </div>
                  {/* Quick actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    {item.status === "new" && (
                      <form action={updateFeedbackAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="reviewed" />
                        <input type="hidden" name="locale" value={locale} />
                        <button type="submit" style={{ padding: "4px 8px", fontSize: 11, background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0", borderRadius: 5, cursor: "pointer" }}>
                          Mark Read
                        </button>
                      </form>
                    )}
                    {item.status !== "archived" && (
                      <form action={updateFeedbackAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="status" value="archived" />
                        <input type="hidden" name="locale" value={locale} />
                        <button type="submit" style={{ padding: "4px 8px", fontSize: 11, background: "#F5F5F0", color: "#9B9B9B", border: "1px solid #E8E8E4", borderRadius: 5, cursor: "pointer" }}>
                          Archive
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
