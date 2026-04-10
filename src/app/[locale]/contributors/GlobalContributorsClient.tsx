/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink, Plus, Lock } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import BadgeExplainer from "@/components/common/BadgeExplainer";

interface Contributor {
  id: string;
  name: string;
  amount: number | null;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
  message: string | null;
  createdAt: string;
}

interface DistrictRanking {
  districtName: string;
  districtSlug: string;
  stateName: string;
  stateSlug: string;
  active: boolean;
  count: number;
  monthlyTotal: number;
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "patron", label: "Patrons" },
  { key: "state", label: "State Champions" },
  { key: "district", label: "District Champions" },
  { key: "monthly", label: "Monthly" },
  { key: "one-time", label: "One-Time" },
] as const;

function ContributorCard({ c, rank, showAmount }: { c: Contributor; rank?: number; showAmount?: boolean }) {
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
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {rank !== undefined && (
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: rank === 1 ? "#FEF3C7" : rank === 2 ? "#F1F5F9" : rank === 3 ? "#FED7AA" : "#F5F5F0",
          color: rank === 1 ? "#92400E" : rank === 2 ? "#475569" : rank === 3 ? "#9A3412" : "#6B6B6B",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {rank}
        </div>
      )}
      <div
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: badgeColors?.bg ?? "#F5F5F0",
          color: badgeColors?.text ?? "#6B6B6B",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, flexShrink: 0,
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
        <div style={{ fontSize: 11, color: "#6B6B6B", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 1 }}>
          <span>{tierConf?.emoji ?? "💝"}</span>
          <span>{tierConf?.name ?? c.tier}</span>
          {showAmount && c.amount && (
            <span style={{ fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono, monospace)" }}>
              ₹{c.amount.toLocaleString("en-IN")}
            </span>
          )}
          {c.monthsActive > 0 && <span style={{ color: "#9B9B9B" }}>· {c.monthsActive}mo</span>}
          {c.badgeLevel && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: badgeColors?.bg, color: badgeColors?.text, textTransform: "uppercase" }}>
              {c.badgeLevel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GlobalContributorsClient({ locale }: { locale: string }) {
  const [filter, setFilter] = useState("all");

  const { data: leaderboard, isLoading: loadingLb } = useQuery<{ contributors: Contributor[] }>({
    queryKey: ["contributors-leaderboard"],
    queryFn: () => fetch("/api/data/contributors?type=leaderboard").then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: allData, isLoading: loadingAll } = useQuery<{ subscribers: Contributor[]; oneTime: Contributor[] }>({
    queryKey: ["contributors-all"],
    queryFn: () => fetch("/api/data/contributors?type=all").then((r) => r.json()),
    staleTime: 120_000,
  });

  const { data: rankingsData } = useQuery<{ rankings: DistrictRanking[]; awaitingLaunch: DistrictRanking[] }>({
    queryKey: ["district-rankings"],
    queryFn: () => fetch("/api/data/contributors?type=district-rankings").then((r) => r.json()),
    staleTime: 120_000,
  });

  const leaders = leaderboard?.contributors ?? [];
  const subscribers = allData?.subscribers ?? [];
  const oneTimers = allData?.oneTime ?? [];
  const rankings = rankingsData?.rankings ?? [];
  const awaitingLaunch = rankingsData?.awaitingLaunch ?? [];

  // Apply filter
  const filteredLeaders = useMemo(() => {
    if (filter === "all" || filter === "one-time") return leaders;
    return leaders.filter((c) => c.tier === filter);
  }, [leaders, filter]);

  const filteredSubscribers = useMemo(() => {
    if (filter === "all" || filter === "one-time") return subscribers;
    return subscribers.filter((c) => c.tier === filter);
  }, [subscribers, filter]);

  const filteredOneTimers = useMemo(() => {
    if (filter === "one-time" || filter === "all") return oneTimers;
    return [];
  }, [oneTimers, filter]);

  const showLeaderboard = filter === "all" || (filter !== "one-time" && filteredLeaders.length > 0);
  const showSubscribers = filter !== "one-time" && filteredSubscribers.length > 0;
  const showOneTime = filter === "all" || filter === "one-time";
  const MEDAL = ["🥇", "🥈", "🥉"];

  return (
    <main style={{ background: "#FAFAF8", minHeight: "calc(100vh - 56px)", paddingBottom: 80 }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.5px", marginBottom: 6 }}>
          Contributors
        </h1>
        <p style={{ fontSize: 14, color: "#6B6B6B", marginBottom: 24, lineHeight: 1.6 }}>
          The people who keep ForThePeople.in running for all 780+ districts. Every contributor is honored here.
        </p>

        <BadgeExplainer />

        {/* Filter buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: filter === f.key ? "1.5px solid #2563EB" : "1px solid #E8E8E4",
                background: filter === f.key ? "#EFF6FF" : "#FFFFFF",
                color: filter === f.key ? "#2563EB" : "#6B6B6B",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {showLeaderboard && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
              🏆 Top Contributors by Tenure
            </h2>
            {loadingLb ? (
              <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B" }}>Loading...</div>
            ) : filteredLeaders.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9B9B9B" }}>No active subscribers yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
                {filteredLeaders.map((c, i) => <ContributorCard key={c.id} c={c} rank={i + 1} />)}
              </div>
            )}
          </>
        )}

        {/* Most Supported Districts */}
        {filter === "all" && (rankings.length > 0 || awaitingLaunch.length > 0) && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
              🏆 Most Supported Districts
            </h2>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "16px 20px" }}>
              {rankings.map((r, i) => (
                <div key={r.districtSlug} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < rankings.length - 1 ? "1px solid #F5F5F0" : undefined }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>
                    {i < 3 ? MEDAL[i] : `${i + 1}.`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/${locale}/${r.stateSlug}/${r.districtSlug}/contributors`}
                      style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", textDecoration: "none" }}
                    >
                      {r.districtName}, {r.stateName}
                    </Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", whiteSpace: "nowrap" }}>
                    {r.count} contributor{r.count !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>
                    ₹{r.monthlyTotal.toLocaleString("en-IN")}/mo
                  </div>
                </div>
              ))}

              {awaitingLaunch.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #E8E8E4" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#9B9B9B", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <Lock size={12} /> Awaiting Launch:
                  </div>
                  {awaitingLaunch.map((r) => (
                    <div key={r.districtSlug} style={{ fontSize: 13, color: "#9B9B9B", padding: "4px 0 4px 28px" }}>
                      🔒 {r.districtName}, {r.stateName} — {r.count} sponsor{r.count !== 1 ? "s" : ""} waiting
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Subscribers */}
        {showSubscribers && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
              🙏 Active Subscribers
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10, marginBottom: 32 }}>
              {filteredSubscribers.map((c) => <ContributorCard key={c.id} c={c} />)}
            </div>
          </>
        )}

        {/* One-Time Contributors */}
        {showOneTime && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>
              💝 One-Time Contributors
            </h2>
            {loadingAll ? (
              <div style={{ padding: 20, textAlign: "center", color: "#9B9B9B" }}>Loading...</div>
            ) : filteredOneTimers.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9B9B9B" }}>No contributions yet. Be the first!</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10, marginBottom: 32 }}>
                {filteredOneTimers.map((c) => <ContributorCard key={c.id} c={c} showAmount />)}
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <Link
          href={`/${locale}/support`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "24px", background: "#F5F5F0", border: "2px dashed #D0D0CC",
            borderRadius: 14, textDecoration: "none", color: "#6B6B6B", fontSize: 14, fontWeight: 600,
          }}
        >
          <Plus size={18} />
          Become a supporter →
        </Link>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href={`/${locale}`} style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none" }}>
            ← Back to ForThePeople.in
          </Link>
        </div>
      </div>
    </main>
  );
}
