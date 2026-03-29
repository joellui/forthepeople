/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifyTOTP, verifyBackupCode } from "@/lib/totp";

const COOKIE = "ftp_admin_v1";
const TOTP_PENDING_COOKIE = "admin_totp_pending";

type Params = Promise<{ locale: string }>;

// ── In-memory rate limiter for login ────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_ATTEMPTS) return false;
  record.count++;
  return true;
}

function resetLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// ── Server Actions ───────────────────────────────────────────
async function loginAction(formData: FormData) {
  "use server";
  const pw = formData.get("password") as string;
  const locale = formData.get("locale") as string;

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  if (!checkLoginRateLimit(ip)) {
    redirect(`/${locale}/admin?error=rate`);
  }

  if (pw === (process.env.ADMIN_PASSWORD ?? "")) {
    // Check if 2FA is enabled
    const adminAuth = await prisma.adminAuth.findUnique({ where: { id: "admin" } }).catch(() => null);

    if (adminAuth?.totpEnabled && adminAuth?.totpSecret) {
      // Password correct, 2FA needed — set temp cookie
      (await cookies()).set(TOTP_PENDING_COOKIE, "ok", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 300, // 5 minutes to enter code
        path: "/",
        sameSite: "strict",
      });
      redirect(`/${locale}/admin?step=totp`);
    }

    // No 2FA — login complete
    resetLoginAttempts(ip);
    (await cookies()).set(COOKIE, "ok", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600,
      path: "/",
      sameSite: "strict",
    });
    await prisma.adminAuth.upsert({
      where: { id: "admin" },
      update: { lastLoginAt: new Date(), lastLoginIp: ip, failedAttempts: 0 },
      create: { id: "admin", lastLoginAt: new Date(), lastLoginIp: ip },
    }).catch(() => {});
    redirect(`/${locale}/admin`);
  }

  redirect(`/${locale}/admin?error=1`);
}

async function totpAction(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const code = formData.get("code") as string;
  const backupCode = formData.get("backupCode") as string;

  const jar = await cookies();
  if (jar.get(TOTP_PENDING_COOKIE)?.value !== "ok") {
    redirect(`/${locale}/admin?error=1`);
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";

  const adminAuth = await prisma.adminAuth.findUnique({ where: { id: "admin" } }).catch(() => null);
  if (!adminAuth?.totpSecret) {
    redirect(`/${locale}/admin?error=1`);
  }

  let verified = false;

  if (code && adminAuth.totpSecret) {
    verified = verifyTOTP(adminAuth.totpSecret, code.replace(/\s/g, ""));
  } else if (backupCode && adminAuth.backupCodes) {
    const result = verifyBackupCode(adminAuth.backupCodes, backupCode);
    verified = result.valid;
    if (result.valid) {
      await prisma.adminAuth.update({
        where: { id: "admin" },
        data: { backupCodes: result.updatedEncryptedCodes },
      }).catch(() => {});
    }
  }

  if (!verified) {
    redirect(`/${locale}/admin?step=totp&error=code`);
  }

  // 2FA verified
  resetLoginAttempts(ip);
  jar.set(COOKIE, "ok", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 3600,
    path: "/",
    sameSite: "strict",
  });
  jar.delete(TOTP_PENDING_COOKIE);

  await prisma.adminAuth.update({
    where: { id: "admin" },
    data: { lastLoginAt: new Date(), lastLoginIp: ip, failedAttempts: 0 },
  }).catch(() => {});

  redirect(`/${locale}/admin`);
}

async function logoutAction(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(TOTP_PENDING_COOKIE);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin`);
}

// ── Layout ───────────────────────────────────────────────────
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { locale } = await params;
  const jar = await cookies();
  const authed = jar.get(COOKIE)?.value === "ok";
  const totpPending = jar.get(TOTP_PENDING_COOKIE)?.value === "ok";

  if (!authed) {
    // Determine which step to show
    const showTOTP = totpPending;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 16,
          background: "#FAFAF8",
        }}
      >
        <div style={{ fontSize: 24 }}>{showTOTP ? "🔐" : "🛡️"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>Admin Dashboard</div>
        <div style={{ fontSize: 13, color: "#6B6B6B" }}>ForThePeople.in</div>

        {showTOTP ? (
          /* ── TOTP Step ── */
          <div style={{ width: 320 }}>
            <div style={{ fontSize: 13, color: "#6B6B6B", textAlign: "center", marginBottom: 16 }}>
              Enter the 6-digit code from Google Authenticator
            </div>
            <form
              action={totpAction}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
              id="totp-form"
            >
              <input type="hidden" name="locale" value={locale} />
              <input
                type="text"
                name="code"
                placeholder="000 000"
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={7}
                style={{
                  padding: "12px 14px",
                  border: "1.5px solid #E8E8E4",
                  borderRadius: 8,
                  fontSize: 24,
                  letterSpacing: "0.3em",
                  textAlign: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px 0",
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Verify
              </button>
            </form>
            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 12, color: "#6B6B6B", cursor: "pointer" }}>
                Lost your phone? Use backup code
              </summary>
              <form
                action={totpAction}
                style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}
              >
                <input type="hidden" name="locale" value={locale} />
                <input
                  type="text"
                  name="backupCode"
                  placeholder="XXXX-XXXX"
                  style={{
                    padding: "8px 10px",
                    border: "1.5px solid #E8E8E4",
                    borderRadius: 7,
                    fontSize: 14,
                    letterSpacing: "0.1em",
                    fontFamily: "monospace",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "8px 0",
                    background: "#7C3AED",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Use Backup Code
                </button>
              </form>
            </details>
            <div style={{ marginTop: 10, textAlign: "center" }}>
              <a
                href={`/${locale}/admin`}
                style={{ fontSize: 11, color: "#9B9B9B", textDecoration: "underline" }}
              >
                Back to password
              </a>
              {" · "}
              <a
                href={`/${locale}/admin/recover`}
                style={{ fontSize: 11, color: "#9B9B9B", textDecoration: "underline" }}
              >
                Send recovery email
              </a>
            </div>
          </div>
        ) : (
          /* ── Password Step ── */
          <form
            action={loginAction}
            style={{ display: "flex", flexDirection: "column", gap: 8, width: 280 }}
          >
            <input type="hidden" name="locale" value={locale} />
            <input
              type="password"
              name="password"
              placeholder="Admin password"
              autoFocus
              required
              style={{
                padding: "10px 12px",
                border: "1.5px solid #E8E8E4",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 0",
                background: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Login
            </button>
          </form>
        )}
      </div>
    );
  }

  const NAV_ITEMS = [
    { href: `/${locale}/admin`, label: "📊 Dashboard", exact: true },
    { href: `/${locale}/admin/review`, label: "📰 Review Queue", exact: false },
    { href: `/${locale}/admin/ai-settings`, label: "🤖 AI Settings", exact: false },
    { href: `/${locale}/admin/supporters`, label: "💰 Supporters", exact: false },
    { href: `/${locale}/admin/feedback`, label: "💬 Feedback", exact: false },
    { href: `/${locale}/admin/security`, label: "🔐 Security", exact: false },
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#FAFAF8" }}>
      {/* Admin top bar */}
      <div
        style={{
          background: "#1A1A1A",
          borderBottom: "1px solid #333",
          padding: "0 20px",
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.03em" }}>
            🛡️ ForThePeople Admin
          </span>
          <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  color: "#C0C0C0",
                  textDecoration: "none",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/"
            style={{ fontSize: 11, color: "#9B9B9B", textDecoration: "none" }}
          >
            ← Main Site
          </Link>
          <form action={logoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              style={{
                fontSize: 11,
                color: "#9B9B9B",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 6px",
              }}
            >
              Logout
            </button>
          </form>
        </div>
      </div>
      {/* Page content */}
      {children}
    </div>
  );
}
