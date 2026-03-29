/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import dynamic from "next/dynamic";

const KarnatakaMap = dynamic(() => import("@/components/map/KarnatakaMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 360,
        background: "#F5F7FF",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ color: "#9B9B9B", fontSize: 13 }}>Loading map…</span>
    </div>
  ),
});

interface StateMapSectionProps {
  locale: string;
  activeDistrictSlugs: string[];
}

export default function StateMapSection({ locale, activeDistrictSlugs }: StateMapSectionProps) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#9B9B9B",
          }}
        >
          Click a district to explore
        </span>
      </div>
      <KarnatakaMap locale={locale} activeDistricts={new Set(activeDistrictSlugs)} />
    </div>
  );
}
