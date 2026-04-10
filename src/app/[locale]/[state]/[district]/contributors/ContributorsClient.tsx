/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink, Plus } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import BadgeExplainer from "@/components/common/BadgeExplainer";
import PatronCard from "@/components/common/PatronCard";

interface Contributor {
  id: string;
  name: string;
  amount: number | null;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  districtId: string | null;
  monthsActive: number;
  message: string | null;
  createdAt: string;
}

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  districtName: string;
  stateName: string;
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

function ContributorCard({ c, showAmount }: { c: Contributor; showAmount?: boolean }) {
  const tierConf = TIER_CONFIG[c.tier];
  const badgeColors = c.badgeLevel ? BADGE_COLORS[c.badgeLevel] : null;
  const SocialIcon = c.socialPlatform ? SOCIAL_ICONS[c.socialPlatform] : null;
  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1.5px solid ${badgeColors?.border ?? "#E8E8E4"}`,
        borderRadius: 12,
        padding: "16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: badgeColors?.bg ?? "#F5F5F0",
          color: badgeColors?.text ?? "#6B6B6B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
          border: badgeColors ? `2px solid ${badgeColors.border}` : "1px solid #E8E8E4",
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{c.name}</span>
          {SocialIcon && c.socialLink && (
            <a href={c.socialLink} target="_blank" rel="noopener noreferrer" style={{ color: "#6B6B6B", lineHeight: 0 }}>
              <SocialIcon size={14} />
            </a>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
          <span>{tierConf?.emoji ?? "💝"}</span>
          <span>{tierConf?.name ?? c.tier}</span>
          {showAmount && c.amount && (
            <span style={{ fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
              ₹{c.amount.toLocaleString("en-IN")}
            </span>
          )}
          {c.monthsActive > 0 && (
            <span style={{ color: "#9B9B9B" }}>· {c.monthsActive}mo active</span>
          )}
          {c.badgeLevel && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 4,
                background: badgeColors?.bg,
                color: badgeColors?.text,
                textTransform: "uppercase",
              }}
            >
              {c.badgeLevel}
            </span>
          )}
        </div>
        {c.message && (
          <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 4, fontStyle: "italic" }}>
            &ldquo;{c.message}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContributorsClient({ locale, stateSlug, districtSlug, districtName, stateName }: Props) {
  const { data: leaderboard, isLoading: loadingLb } = useQuery<{ contributors: Contributor[] }>({
    queryKey: ["contributors-leaderboard"],
    queryFn: () => fetch("/api/data/contributors?type=leaderboard").then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: districtSponsors, isLoading: loadingDist } = useQuery<{ contributors: Contributor[] }>({
    queryKey: ["contributors-district", districtSlug, stateSlug],
    queryFn: () => fetch(`/api/data/contributors?district=${districtSlug}&state=${stateSlug}`).then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: allData, isLoading: loadingAll } = useQuery<{ subscribers: Contributor[]; oneTime: Contributor[] }>({
    queryKey: ["contributors-all"],
    queryFn: () => fetch("/api/data/contributors?type=all").then((r) => r.json()),
    staleTime: 120_000,
  });

  const leaders = leaderboard?.contributors?.slice(0, 5) ?? [];
  const allSponsors = districtSponsors?.contributors ?? [];
  const patrons = allSponsors.filter((c) => c.tier === "patron");
  const sponsors = allSponsors.filter((c) => c.tier !== "patron");
  const oneTimers = allData?.oneTime ?? [];

  return (
    <div style={{ padding: "24px 28px", maxWidth: 860 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 4 }}>
          {stateName} → {districtName}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.4px", margin: 0 }}>
          Contributors
        </h1>
        <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
          People who keep this district&apos;s data free and accessible.
        </p>
      </div>

      {/* All-India Patrons — premium display */}
      {patrons.map((p) => (
        <PatronCard key={p.id} patron={p} />
      ))}

      <BadgeExplainer />

      {/* Section 1: Leaderboard */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 12, letterSpacing: "-0.2px" }}>
          🏆 Leaderboard — Top by Tenure
        </h2>
        {loadingLb ? (
          <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>Loading...</div>
        ) : leaders.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
            No active subscribers yet. Be the first!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leaders.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: i === 0 ? "#FEF3C7" : i === 1 ? "#F1F5F9" : i === 2 ? "#FED7AA" : "#F5F5F0",
                  color: i === 0 ? "#92400E" : i === 1 ? "#475569" : i === 2 ? "#9A3412" : "#6B6B6B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}><ContributorCard c={c} /></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Active Subscribers for this district */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 12, letterSpacing: "-0.2px" }}>
          🏛️ Active Sponsors — {districtName}
        </h2>
        {loadingDist ? (
          <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>Loading...</div>
        ) : sponsors.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
            No active sponsors for this district yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {sponsors.map((c) => <ContributorCard key={c.id} c={c} />)}
          </div>
        )}
      </div>

      {/* Section 3: One-Time Contributors */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 12, letterSpacing: "-0.2px" }}>
          💝 One-Time Contributors
        </h2>
        {loadingAll ? (
          <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>Loading...</div>
        ) : oneTimers.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
            No one-time contributors yet.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {oneTimers.map((c) => <ContributorCard key={c.id} c={c} showAmount />)}
          </div>
        )}
      </div>

      {/* Section 4: CTA */}
      <Link
        href={`/${locale}/support`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "24px",
          background: "#F5F5F0",
          border: "2px dashed #D0D0CC",
          borderRadius: 14,
          textDecoration: "none",
          color: "#6B6B6B",
          fontSize: 14,
          fontWeight: 600,
          transition: "background 150ms",
        }}
      >
        <Plus size={18} />
        Become a supporter →
      </Link>
    </div>
  );
}
