/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useState } from "react";
import { Map } from "lucide-react";
import { useInfrastructure, useAIInsight } from "@/hooks/useRealtimeData";
import { ModuleHeader, LoadingShell, ErrorBlock, EmptyBlock, ProgressBar, InfoCard, AIInsightBanner, LastUpdatedBadge } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";

const STATUS_COLORS: Record<string, [string, string]> = {
  completed: ["#16A34A", "#DCFCE7"],
  "in-progress": ["#D97706", "#FEF3C7"],
  ongoing: ["#D97706", "#FEF3C7"],
  planned: ["#6B7280", "#F3F4F6"],
  delayed: ["#DC2626", "#FEE2E2"],
  tendered: ["#7C3AED", "#EDE9FE"],
};

function InfrastructurePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useInfrastructure(district, state);
  const { data: aiInsight } = useAIInsight(district, "infrastructure");
  const [filter, setFilter] = useState("all");

  const projects = data?.data ?? [];
  const categories = ["all", ...Array.from(new Set(projects.map((p) => p.category)))];
  const filtered = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.fundsReleased ?? 0), 0);
  const completed = projects.filter((p) => p.status.toLowerCase().includes("complet")).length;

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Map} title="Infrastructure Tracker" description="Roads, bridges, water projects and other district works" backHref={base}>
        <LastUpdatedBadge lastUpdated={data?.meta?.lastUpdated } />
      </ModuleHeader>
      {aiInsight && (
        <AIInsightBanner
          headline={aiInsight.headline}
          summary={aiInsight.summary}
          sentiment={aiInsight.sentiment}
          confidence={aiInsight.confidence}
          sourceUrls={aiInsight.sourceUrls}
          createdAt={aiInsight.createdAt}
        />
      )}
      {(() => { const _src = getModuleSources("infrastructure", state); return <DataSourceBanner moduleName="infrastructure" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="infrastructure" district={district} />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && projects.length === 0 && <EmptyBlock icon="🔧" message="No infrastructure projects data yet" />}

      {!isLoading && projects.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
            <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Total Projects</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{projects.length}</div>
            </div>
            <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Completed</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#16A34A" }}>{completed}</div>
            </div>
            <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Budget (Cr)</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>₹{(totalBudget / 10000000).toFixed(1)}</div>
            </div>
            <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Released (Cr)</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#2563EB" }}>₹{(totalSpent / 10000000).toFixed(1)}</div>
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {categories.map((c) => (
              <button key={c} onClick={() => setFilter(c)} style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: filter === c ? "#2563EB" : "#F5F5F0",
                color: filter === c ? "#FFF" : "#6B6B6B",
                border: filter === c ? "1px solid #2563EB" : "1px solid #E8E8E4",
              }}>
                {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                {c !== "all" && ` (${projects.filter(p => p.category === c).length})`}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((p) => {
              const statusKey = p.status.toLowerCase();
              const [color] = Object.entries(STATUS_COLORS).find(([k]) => statusKey.includes(k))?.[1] ?? ["#6B7280", "#F3F4F6"];
              return (
                <InfoCard
                  key={p.id}
                  title={p.name}
                  subtitle={p.contractor ? `Contractor: ${p.contractor}` : p.category}
                  badge={p.status}
                  badgeColor={color}
                >
                  <div style={{ marginTop: 10 }}>
                    {p.progressPct !== null && p.progressPct !== undefined && (
                      <ProgressBar value={p.progressPct} label={`Progress`} />
                    )}
                    <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#9B9B9B" }}>
                      {p.budget && <span>Budget: <strong style={{ color: "#1A1A1A", fontFamily: "var(--font-mono)" }}>₹{(p.budget / 10000000).toFixed(2)}Cr</strong></span>}
                      {p.fundsReleased && <span>Released: <strong style={{ color: "#2563EB", fontFamily: "var(--font-mono)" }}>₹{(p.fundsReleased / 10000000).toFixed(2)}Cr</strong></span>}
                      {p.startDate && <span>Started: {new Date(p.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>}
                      {p.expectedEnd && <span>Due: {new Date(p.expectedEnd).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>}
                    </div>
                  </div>
                </InfoCard>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function InfrastructurePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Infrastructure">
      <InfrastructurePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
