/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Unified AI Provider
// Wraps Gemini + Anthropic with auto-fallback
// All AI calls in the codebase should go through callAI()
// ═══════════════════════════════════════════════════════════
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

// ── Key resolution: DB override → env var fallback ──────────
const keyCache: Record<string, { val: string | null; ts: number }> = {};
const KEY_CACHE_TTL = 30_000; // 30 seconds

export async function getAPIKey(provider: "gemini" | "anthropic"): Promise<string | null> {
  // For anthropic, check which source is active (opuscode vs official)
  if (provider === "anthropic") {
    const s = await getSettings();
    const keyName = s.anthropicSource === "official" ? "anthropic_official" : "anthropic";
    const cacheKey = `anthropic_${s.anthropicSource}`;
    const cached = keyCache[cacheKey];
    if (cached && Date.now() - cached.ts < KEY_CACHE_TTL) return cached.val;

    let val: string | null = null;
    try {
      const row = await prisma.adminAPIKey.findUnique({ where: { provider: keyName } });
      if (row?.isActive) val = decrypt(row.encryptedKey);
    } catch { /* fall through */ }

    if (!val) val = process.env.ANTHROPIC_API_KEY ?? null;
    keyCache[cacheKey] = { val, ts: Date.now() };
    return val;
  }

  // Gemini
  const cached = keyCache[provider];
  if (cached && Date.now() - cached.ts < KEY_CACHE_TTL) return cached.val;

  let val: string | null = null;
  try {
    const row = await prisma.adminAPIKey.findUnique({ where: { provider } });
    if (row?.isActive) val = decrypt(row.encryptedKey);
  } catch { /* DB failure → fall through */ }

  if (!val) val = process.env.GEMINI_API_KEY ?? null;
  keyCache[provider] = { val, ts: Date.now() };
  return val;
}

export function invalidateKeyCache(provider?: string) {
  if (provider) {
    delete keyCache[provider];
    delete keyCache[`anthropic_official`];
    delete keyCache[`anthropic_opuscode`];
  } else {
    Object.keys(keyCache).forEach((k) => delete keyCache[k]);
  }
}

// ── Types ───────────────────────────────────────────────────
export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  provider: "gemini" | "anthropic";
  model: string;
  usedFallback: boolean;
}

// ── Settings cache ───────────────────────────────────────────
let cachedSettings: {
  activeProvider: string;
  geminiModel: string;
  anthropicModel: string;
  anthropicBaseUrl: string;
  anthropicSource: string;
  fallbackEnabled: boolean;
  fallbackProvider: string;
  maxTokens: number;
  temperature: number;
} | null = null;
let cacheTs = 0;
const CACHE_TTL = 60_000;

export function invalidateAISettingsCache() {
  cachedSettings = null;
  cacheTs = 0;
}

async function getSettings() {
  if (cachedSettings && Date.now() - cacheTs < CACHE_TTL) return cachedSettings;
  try {
    let s = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });
    if (!s) {
      const envBaseUrlInit = process.env.ANTHROPIC_BASE_URL;
      s = await prisma.aIProviderSettings.create({
        data: {
          id: "singleton",
          activeProvider: "anthropic",
          geminiModel: "gemini-2.5-flash",
          anthropicModel: "claude-opus-4-6",
          anthropicBaseUrl: envBaseUrlInit || "https://api.anthropic.com",
          anthropicSource: envBaseUrlInit?.includes("opuscode") ? "opuscode" : "official",
          fallbackEnabled: true,
          fallbackProvider: "gemini",
          maxTokens: 2048,
          temperature: 0.3,
        },
      });
    }
    const envBaseUrl = process.env.ANTHROPIC_BASE_URL;
    const isOpusCodeEnv = envBaseUrl && envBaseUrl.includes("opuscode");

    cachedSettings = {
      activeProvider: isOpusCodeEnv ? "anthropic" : s.activeProvider,
      geminiModel: s.geminiModel,
      anthropicModel: s.anthropicModel,
      anthropicBaseUrl: envBaseUrl || (s as { anthropicBaseUrl?: string }).anthropicBaseUrl || "https://api.anthropic.com",
      anthropicSource: isOpusCodeEnv ? "opuscode" : ((s as { anthropicSource?: string }).anthropicSource ?? "official"),
      fallbackEnabled: s.fallbackEnabled,
      fallbackProvider: s.fallbackProvider,
      maxTokens: s.maxTokens,
      temperature: s.temperature,
    };
    cacheTs = Date.now();

    // Auto-update DB if env var signals OpusCode but DB still says official
    if (isOpusCodeEnv && (s.activeProvider !== "anthropic" || (s as { anthropicSource?: string }).anthropicSource !== "opuscode")) {
      prisma.aIProviderSettings.update({
        where: { id: "singleton" },
        data: { activeProvider: "anthropic", anthropicSource: "opuscode", anthropicBaseUrl: envBaseUrl, lastSwitchedAt: new Date() },
      }).catch(() => {});
    }

    return cachedSettings;
  } catch {
    return {
      activeProvider: "gemini",
      geminiModel: "gemini-2.5-flash",
      anthropicModel: "claude-opus-4-6",
      anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com",
      anthropicSource: "official",
      fallbackEnabled: true,
      fallbackProvider: "gemini",
      maxTokens: 2048,
      temperature: 0.3,
    };
  }
}

// ── Gemini call ─────────────────────────────────────────────
async function callGemini(
  req: AIRequest,
  model: string,
  maxTokens: number,
  temp: number
): Promise<string> {
  const key = await getAPIKey("gemini");
  if (!key) throw new Error("Gemini API key not set (neither in admin panel nor environment)");
  const genAI = new GoogleGenerativeAI(key);
  const m = genAI.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: temp,
      ...(req.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  });
  const result = await m.generateContent(`${req.systemPrompt}\n\n${req.userPrompt}`);
  return result.response.text();
}

// ── Anthropic call ───────────────────────────────────────────
async function callAnthropic(
  req: AIRequest,
  model: string,
  maxTokens: number,
  temp: number
): Promise<string> {
  const key = await getAPIKey("anthropic");
  if (!key) throw new Error("Anthropic API key not set (neither in admin panel nor environment)");

  const settings = await getSettings();
  const baseURL = process.env.ANTHROPIC_BASE_URL || settings.anthropicBaseUrl || "https://api.anthropic.com";
  console.log(`[AI] Anthropic base URL: ${baseURL} (source: ${settings.anthropicSource})`);

  const client = new Anthropic({ apiKey: key, baseURL });
  let sys = req.systemPrompt;
  if (req.jsonMode) {
    sys += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown fences, no preamble. Pure JSON only.";
  }
  const msg = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature: temp,
    system: sys,
    messages: [{ role: "user", content: req.userPrompt }],
  });
  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block in Anthropic response");
  let text = block.text;
  if (req.jsonMode) {
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  }
  return text;
}

// ── Main callAI function with auto-fallback ─────────────────
export async function callAI(request: AIRequest): Promise<AIResponse> {
  const s = await getSettings();
  const maxTokens = request.maxTokens ?? s.maxTokens;
  const temp = request.temperature ?? s.temperature;
  const provider = s.activeProvider as "gemini" | "anthropic";
  const model = provider === "anthropic" ? s.anthropicModel : s.geminiModel;

  try {
    const text =
      provider === "anthropic"
        ? await callAnthropic(request, model, maxTokens, temp)
        : await callGemini(request, model, maxTokens, temp);

    prisma.aIProviderSettings
      .update({
        where: { id: "singleton" },
        data:
          provider === "anthropic"
            ? { totalAnthropicCalls: { increment: 1 } }
            : { totalGeminiCalls: { increment: 1 } },
      })
      .catch(() => {});

    return { text, provider, model, usedFallback: false };
  } catch (primaryError) {
    console.error(`[AI] ${provider} failed:`, primaryError);

    prisma.aIProviderSettings
      .update({
        where: { id: "singleton" },
        data: {
          lastError: primaryError instanceof Error ? primaryError.message : String(primaryError),
          lastErrorAt: new Date(),
        },
      })
      .catch(() => {});

    if (s.fallbackEnabled && s.fallbackProvider !== provider) {
      const fbProvider = s.fallbackProvider as "gemini" | "anthropic";
      const fbModel = fbProvider === "anthropic" ? s.anthropicModel : s.geminiModel;
      console.log(`[AI] Falling back to ${fbProvider} (${fbModel})`);
      try {
        const text =
          fbProvider === "anthropic"
            ? await callAnthropic(request, fbModel, maxTokens, temp)
            : await callGemini(request, fbModel, maxTokens, temp);

        prisma.aIProviderSettings
          .update({
            where: { id: "singleton" },
            data:
              fbProvider === "anthropic"
                ? { totalAnthropicCalls: { increment: 1 } }
                : { totalGeminiCalls: { increment: 1 } },
          })
          .catch(() => {});

        return { text, provider: fbProvider, model: fbModel, usedFallback: true };
      } catch (fbError) {
        throw new Error(
          `Both providers failed. ${provider}: ${primaryError}. ${fbProvider}: ${fbError}`
        );
      }
    }
    throw primaryError;
  }
}

// ── Convenience: JSON mode ──────────────────────────────────
export async function callAIJSON<T = unknown>(
  request: AIRequest
): Promise<{ data: T } & AIResponse> {
  const res = await callAI({ ...request, jsonMode: true });
  try {
    const data = JSON.parse(res.text) as T;
    return { data, ...res };
  } catch (e) {
    throw new Error(`AI returned invalid JSON from ${res.provider}: ${e}`);
  }
}
