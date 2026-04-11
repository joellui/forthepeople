/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Linkedin, Github, Twitter, ExternalLink } from "lucide-react";
import { BADGE_COLORS } from "@/lib/badge-level";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";

interface Sponsor {
  id: string;
  name: string;
  tier: string;
  badgeType: string | null;
  badgeLevel: string | null;
  socialLink: string | null;
  socialPlatform: string | null;
  monthsActive: number;
}

interface DistrictSponsorBannerProps {
  district: string;
  state: string;
  locale?: string;
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: ExternalLink,
};

const MAX_VISIBLE = 6;

export default function DistrictSponsorBanner({ district, state, locale = "en" }: DistrictSponsorBannerProps) {
  const { data } = useQuery<{ contributors: Sponsor[] }>({
    queryKey: ["district-sponsors", district, state],
    queryFn: () =>
      fetch(`/api/data/contributors?district=${district}&state=${state}`).then((r) => r.json()),
    staleTime: 30_000,       // 30s — so invalidation triggers refetch quickly
    refetchInterval: 120_000, // 2min auto-refresh
  });

  const allSponsors = data?.contributors ?? [];

  if (allSponsors.length === 0) return null;

  const visible = allSponsors.slice(0, MAX_VISIBLE);
  const overflowCount = allSponsors.length - MAX_VISIBLE;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        border: "1px solid #FDE68A",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Sponsored By
        </div>
        {overflowCount > 0 && (
          <Link
            href={`/${locale}/${state}/${district}/contributors`}
            style={{ fontSize: 11, color: "#92400E", textDecoration: "none", fontWeight: 600 }}
          >
            View all {allSponsors.length} contributors →
          </Link>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 10,
          maxHeight: 160,
          overflow: "hidden",
        }}
      >
        {visible.map((s) => {
          const tierConf = TIER_CONFIG[s.tier];
          const badgeColors = s.badgeLevel ? BADGE_COLORS[s.badgeLevel] : null;
          const SocialIcon = s.socialPlatform ? SOCIAL_ICONS[s.socialPlatform] : null;
          const initials = s.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#FFFFFF",
                border: `2px solid ${tierConf?.accent ?? badgeColors?.border ?? "#FDE68A"}`,
                borderRadius: 10,
                padding: "8px 12px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: badgeColors?.bg ?? "#FEF3C7",
                  color: badgeColors?.text ?? "#92400E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  border: badgeColors ? `2px solid ${badgeColors.border}` : undefined,
                }}
              >
                {initials}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name}
                  </span>
                  {SocialIcon && s.socialLink && (
                    <a href={s.socialLink} target="_blank" rel="noopener noreferrer" style={{ color: "#6B6B6B", lineHeight: 0 }}>
                      <SocialIcon size={13} />
                    </a>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "#92400E", display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{tierConf?.emoji ?? "🙏"}</span>
                  <span>{tierConf?.name ?? s.tier}</span>
                  {s.monthsActive > 0 && (
                    <span style={{ color: "#B45309" }}>· {s.monthsActive}mo</span>
                  )}
                  {s.badgeLevel && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: badgeColors?.bg,
                        color: badgeColors?.text,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.badgeLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
