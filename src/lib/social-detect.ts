/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

export interface SocialDetectResult {
  cleanUrl: string;
  platform: string;
  icon: string;
  username: string;
}

export function detectSocialPlatform(url: string): { platform: string; icon: string } | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return { platform: "instagram", icon: "instagram" };
  if (lower.includes("linkedin.com")) return { platform: "linkedin", icon: "linkedin" };
  if (lower.includes("github.com")) return { platform: "github", icon: "github" };
  if (lower.includes("twitter.com") || lower.includes("x.com")) return { platform: "twitter", icon: "twitter" };
  return { platform: "website", icon: "external-link" };
}

export function detectAndCleanSocialLink(rawInput: string): SocialDetectResult | null {
  if (!rawInput || rawInput.trim().length < 3) return null;

  let url = rawInput.trim();

  // Handle bare handles: @jayanth_m_b → instagram.com/jayanth_m_b
  if (!url.startsWith("http")) {
    if (url.startsWith("@")) {
      url = `https://instagram.com/${url.slice(1)}`;
    } else if (!url.includes(".")) {
      // Just a username — assume Instagram
      url = `https://instagram.com/${url}`;
    } else {
      url = `https://${url}`;
    }
  }

  // INSTAGRAM
  if (url.includes("instagram.com")) {
    const match = url.match(/instagram\.com\/(?:p|reel|stories\/)?([a-zA-Z0-9._]+)/);
    const username = match?.[1] ?? "";
    if (["p", "reel", "explore", "direct", "accounts"].includes(username)) {
      return null; // can't determine profile from post/reel URL
    }
    if (!username) return null;
    return { cleanUrl: `https://instagram.com/${username}`, platform: "instagram", icon: "instagram", username };
  }

  // LINKEDIN
  if (url.includes("linkedin.com")) {
    const match = url.match(/linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-]+)/);
    const username = match?.[1] ?? "";
    if (!username) return null;
    return { cleanUrl: `https://linkedin.com/in/${username}`, platform: "linkedin", icon: "linkedin", username };
  }

  // GITHUB
  if (url.includes("github.com")) {
    const match = url.match(/github\.com\/([a-zA-Z0-9-]+)/);
    const username = match?.[1] ?? "";
    if (!username || ["settings", "notifications", "marketplace"].includes(username)) return null;
    return { cleanUrl: `https://github.com/${username}`, platform: "github", icon: "github", username };
  }

  // TWITTER / X
  if (url.includes("twitter.com") || url.includes("x.com")) {
    const match = url.match(/(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/);
    const username = match?.[1] ?? "";
    if (!username || ["home", "explore", "search", "settings", "i"].includes(username)) return null;
    return { cleanUrl: `https://x.com/${username}`, platform: "twitter", icon: "twitter", username };
  }

  // GENERIC WEBSITE
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return { cleanUrl: url, platform: "website", icon: "external-link", username: hostname };
  } catch {
    return null;
  }
}
