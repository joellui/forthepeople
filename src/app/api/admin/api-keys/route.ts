/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { encrypt, maskKey } from "@/lib/encryption";
import { getAPIKey, invalidateKeyCache } from "@/lib/ai-provider";

const COOKIE = "ftp_admin_v1";

async function isAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "ok";
}

// GET — return masked key info + source (db vs env)
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const providers = ["gemini", "anthropic"] as const;
  const result: Record<string, { source: string; masked: string | null; isActive: boolean }> = {};

  for (const provider of providers) {
    const row = await prisma.adminAPIKey.findUnique({ where: { provider } }).catch(() => null);
    const envKey =
      provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;

    if (row?.isActive) {
      result[provider] = { source: "database", masked: maskKey(row.encryptedKey.slice(0, 8) + "..."), isActive: true };
    } else if (envKey) {
      result[provider] = { source: "environment", masked: maskKey(envKey), isActive: true };
    } else {
      result[provider] = { source: "none", masked: null, isActive: false };
    }
  }

  return NextResponse.json(result);
}

// POST — save/update a key
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, apiKey } = await req.json() as { provider: string; apiKey: string };
  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider and apiKey required" }, { status: 400 });
  }
  if (provider !== "gemini" && provider !== "anthropic") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const encryptedKey = encrypt(apiKey);
  await prisma.adminAPIKey.upsert({
    where: { provider },
    update: { encryptedKey, isActive: true, lastTestedAt: null, lastTestResult: null },
    create: { provider, encryptedKey, isActive: true },
  });

  invalidateKeyCache(provider);
  return NextResponse.json({ ok: true, masked: maskKey(apiKey) });
}

// DELETE — remove a key from DB (falls back to env var)
export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await req.json() as { provider: string };
  if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });

  await prisma.adminAPIKey.deleteMany({ where: { provider } }).catch(() => {});
  invalidateKeyCache(provider);

  // Check if env var still available
  const envKey =
    provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({ ok: true, fallbackToEnv: !!envKey });
}

// PATCH — test a key
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await req.json() as { provider: string };
  if (!provider) return NextResponse.json({ error: "provider required" }, { status: 400 });

  const key = await getAPIKey(provider as "gemini" | "anthropic");
  const ok = !!key;
  const result = ok ? "Key is configured and accessible" : "No key found";

  await prisma.adminAPIKey
    .update({
      where: { provider },
      data: { lastTestedAt: new Date(), lastTestResult: result },
    })
    .catch(() => {});

  return NextResponse.json({ ok, result });
}
