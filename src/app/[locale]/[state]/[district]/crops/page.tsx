/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Wheat, TrendingUp, TrendingDown, Download } from "lucide-react";
import { useCropPrices } from "@/hooks/useRealtimeData";
import { ModuleHeader, SectionLabel, LoadingShell, ErrorBlock, LiveBadge, DataTable, LastUpdatedBadge } from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import NoDataCard from "@/components/common/NoDataCard";
import { getModuleSources } from "@/lib/constants/state-config";
import ShareButtons from "@/components/common/ShareButtons";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import ModuleNews from "@/components/district/ModuleNews";
import { downloadCSV, todayISO } from "@/lib/csv";

function CropsPageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useCropPrices(district, state);
  const [selected, setSelected] = useState<string | null>(null);

  const prices = data?.data ?? [];
  const commodities = Array.from(new Set(prices.map((p) => p.commodity)));
  const activeCrop = selected ?? commodities[0] ?? null;
  const cropPrices = activeCrop ? prices.filter((p) => p.commodity === activeCrop) : [];
  const latestByCrop = commodities.map((c) => prices.find((p) => p.commodity === c)!).filter(Boolean);

  function handleDownload() {
    const rows = prices.slice(0, 100).map((p) => ({
      Date: new Date(p.date).toLocaleDateString("en-IN"),
      Commodity: p.commodity,
      Market: p.market,
      "Min Price (₹/quintal)": p.minPrice,
      "Modal Price (₹/quintal)": p.modalPrice,
      "Max Price (₹/quintal)": p.maxPrice,
    }));
    downloadCSV(rows, `forthepeople_${district}_crop-prices_${todayISO()}.csv`);
  }

  const shareText = latestByCrop.length > 0
    ? `Crop prices in ${district}: ${latestByCrop.slice(0, 3).map((p) => `${p.commodity} ₹${p.modalPrice}/qtl`).join(", ")}`
    : `Crop prices data for ${district}`;

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader icon={Wheat} title="Crop Prices" description="Live mandi prices from AGMARKNET — updated daily" backHref={base} liveTag>
        <LastUpdatedBadge lastUpdated={data?.meta?.lastUpdated } />
      </ModuleHeader>


      {/* AI-crawler readable summary */}
      <p style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 16, padding: "12px 16px", background: "#FAFAF8", borderRadius: 8, borderLeft: "3px solid #16A34A" }}>
        This page shows live agricultural mandi prices for this district, sourced daily from AGMARKNET (Agricultural Marketing Information Network), India&apos;s official government portal for regulated market prices. Prices shown are in Indian Rupees (₹) per quintal. Data covers all commodities traded at APMC (Agricultural Produce Market Committee) mandis in the district, including paddy, sugarcane, ragi, and other major crops.
      </p>
      {(() => { const _src = getModuleSources("crops", state); return <DataSourceBanner moduleName="crops" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="crops" district={district} />

      {isLoading && <LoadingShell rows={5} />}
      {error && <ErrorBlock />}

      {!isLoading && latestByCrop.length > 0 && (
        <>
          {/* Commodity selector */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {commodities.map((c) => (
              <button key={c} onClick={() => setSelected(c)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer",
                background: activeCrop === c ? "#16A34A" : "#F5F5F0",
                color: activeCrop === c ? "#FFF" : "#6B6B6B",
                border: activeCrop === c ? "1px solid #16A34A" : "1px solid #E8E8E4",
              }}>
                {c}
              </button>
            ))}
          </div>

          {/* Latest prices summary cards */}
          <SectionLabel action={<LiveBadge />}>Today&apos;s Prices</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 24 }}>
            {latestByCrop.map((p) => {
              const prev = prices.filter((x) => x.commodity === p.commodity)[1];
              const change = prev ? p.modalPrice - prev.modalPrice : 0;
              return (
                <div key={p.id} style={{
                  background: "#FFF", border: activeCrop === p.commodity ? "1.5px solid #16A34A" : "1px solid #E8E8E4",
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                }} onClick={() => setSelected(p.commodity)}>
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginBottom: 6 }}>{p.commodity}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1A1A1A", letterSpacing: "-0.5px" }}>
                    ₹{p.modalPrice.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>per quintal · {p.market}</div>
                  {prev && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 12, color: change > 0 ? "#16A34A" : change < 0 ? "#DC2626" : "#9B9B9B" }}>
                      {change > 0 ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : null}
                      {change !== 0 ? `₹${Math.abs(change).toLocaleString("en-IN")} from prev` : "No change"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Price trend chart for selected crop */}
          {activeCrop && cropPrices.length > 1 && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>{activeCrop} — Price Trend</SectionLabel>
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[...cropPrices].reverse()} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EC" />
                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} tick={{ fontSize: 10, fill: "#9B9B9B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#9B9B9B" }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
                      labelFormatter={(d) => new Date(d).toLocaleDateString("en-IN")}
                    />
                    <Line type="monotone" dataKey="minPrice" stroke="#9B9B9B" strokeWidth={1} dot={false} name="Min" />
                    <Line type="monotone" dataKey="modalPrice" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 3 }} name="Modal" />
                    <Line type="monotone" dataKey="maxPrice" stroke="#2563EB" strokeWidth={1} dot={false} name="Max" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                  {[["Modal (green)", "#16A34A"], ["Min (gray)", "#9B9B9B"], ["Max (blue)", "#2563EB"]].map(([l, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B6B6B" }}>
                      <div style={{ width: 20, height: 2, background: c }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full price table + actions */}
          <SectionLabel action={
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                onClick={handleDownload}
                aria-label="Download crop prices as CSV"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid #E8E8E4", borderRadius: 8, background: "#FAFAF8", color: "#6B6B6B", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
              >
                <Download size={13} aria-hidden="true" /> CSV
              </button>
              <ShareButtons text={shareText} district={district} module="Crop Prices" />
            </div>
          }>All Prices</SectionLabel>
          <DataTable
            columns={[
              { key: "date", label: "Date" },
              { key: "commodity", label: "Commodity" },
              { key: "market", label: "Market" },
              { key: "min", label: "Min ₹", mono: true, align: "right" },
              { key: "modal", label: "Modal ₹", mono: true, align: "right" },
              { key: "max", label: "Max ₹", mono: true, align: "right" },
            ]}
            rows={prices.slice(0, 30).map((p) => ({
              date: new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
              commodity: p.commodity,
              market: p.market,
              min: p.minPrice.toLocaleString("en-IN"),
              modal: <strong style={{ color: "#16A34A" }}>{p.modalPrice.toLocaleString("en-IN")}</strong>,
              max: p.maxPrice.toLocaleString("en-IN"),
            }))}
          />
        </>
      )}
      <ModuleNews district={district} state={state} locale={locale} module="crops" />
    </div>
  );
}

export default function CropsPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Crop Prices">
      <CropsPageInner params={params} />
    </ModuleErrorBoundary>
  );
}
