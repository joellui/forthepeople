/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Map, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import { ModuleHeader, StatCard, SectionLabel, LoadingShell } from "@/components/district/ui";
import TalukMap from "@/components/map/TalukMap";

export default function MapPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data: taluksData, isLoading: taluksLoading } = useTaluks(district, state);
  const { data: overviewData, isLoading: overviewLoading } = useOverview(district, state);

  const taluks = taluksData?.data ?? [];
  const overview = overviewData?.data;
  const isLoading = taluksLoading || overviewLoading;

  const talukList = taluks.map(t => ({
    slug: t.slug,
    name: t.name,
    villageCount: t._count.villages,
  }));

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Map} title="District Map" description="Interactive taluk map — click to explore each taluk" backHref={base} />
      {isLoading && <LoadingShell rows={4} />}

      {!isLoading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            <StatCard label="Taluks" value={taluks.length} icon={Map} />
            <StatCard label="Villages" value={taluks.reduce((s, t) => s + t._count.villages, 0).toLocaleString("en-IN")} />
            {overview?.area && <StatCard label="Area" value={`${overview.area.toLocaleString("en-IN")} km²`} />}
            {overview?.population && <StatCard label="Population" value={`${(overview.population / 1000000).toFixed(2)}M`} />}
          </div>

          {/* D3 Geographic Map */}
          <SectionLabel>Taluk Map</SectionLabel>
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: 16, marginBottom: 24 }}>
            <TalukMap locale={locale} state={state} district={district} taluks={talukList} />
          </div>

          {/* Taluk list with village details */}
          <SectionLabel>Taluks & Villages</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {taluks.map((t) => (
              <div key={t.id} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, overflow: "hidden" }}>
                <Link href={`/${locale}/${state}/${district}/${t.slug}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", textDecoration: "none",
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{t.name}</div>
                    {t.nameLocal && <div style={{ fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{t.nameLocal}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#6B6B6B" }}>{t._count.villages} villages</span>
                    <ChevronRight size={16} style={{ color: "#C0C0C0" }} />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
