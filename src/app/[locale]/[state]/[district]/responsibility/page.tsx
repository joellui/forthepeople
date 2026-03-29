/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { Flame } from "lucide-react";
import { ModuleHeader, SectionLabel } from "@/components/district/ui";

// Mandya-specific citizen responsibility content
// Based on: district challenges, demographics, and opportunities
// Future: generated dynamically per district using district data

const MANDYA_CONTENT = {
  intro: "Mandya district faces real challenges — and real opportunities. Here's what YOU can do as a citizen to help your district grow.",
  sections: [
    {
      emoji: "🧹",
      title: "Cleanliness & Waste",
      color: "#FFF7ED",
      border: "#FED7AA",
      items: [
        "Mandya generates ~180 tonnes of solid waste per day — only 62% is processed (source: SBM report 2023)",
        "Segregate waste at source: wet waste (green bin) + dry waste (blue bin)",
        "Do NOT dump waste near KRS dam backwaters or irrigation canals",
        "Participate in ward-level Swachh Bharat cleanliness drives (usually first Saturday of month)",
        "Report illegal dumping to Mandya City Municipal Council: 08232-222400",
      ],
    },
    {
      emoji: "💧",
      title: "Water Conservation",
      color: "#EFF6FF",
      border: "#BFDBFE",
      items: [
        "KRS dam is the lifeline of Mandya — it irrigates 1.23 lakh hectares of farmland",
        "Switch to drip irrigation for sugarcane (saves 40-60% water vs flood irrigation)",
        "Fix leaky pipes and taps — a dripping tap wastes 15,000 litres/year",
        "1,087 lakes and tanks exist in Mandya — help protect them from encroachment",
        "Harvest rainwater at home: Mandya gets ~695mm annual rainfall — use it!",
        "Report illegal sand mining from Kaveri river to DC office: 08232-222104",
      ],
    },
    {
      emoji: "🌾",
      title: "Agriculture",
      color: "#F0FDF4",
      border: "#BBF7D0",
      items: [
        "Mandya produces 12+ lakh tonnes of sugarcane annually — India's sugar bowl",
        "Do NOT burn paddy stubble — it causes severe air pollution and kills soil organisms",
        "Get your soil tested free at KVK Mandya: test every 3 years for NPK balance",
        "Join Farmers Producer Organizations (FPOs) for better price negotiation",
        "Diversify beyond sugarcane to reduce water stress: ragi, maize, vegetables",
        "PM-KISAN: ensure you've registered and receiving ₹6,000/year benefits",
      ],
    },
    {
      emoji: "🌳",
      title: "Environment",
      color: "#F0FDF4",
      border: "#BBF7D0",
      items: [
        "Mandya's forest cover is declining — plant native trees (neem, peepal, banyan) in your land/village",
        "Protect village tanks: they recharge groundwater and support biodiversity",
        "Kaveri river basin is under stress — avoid washing vehicles/clothes in the river",
        "Report encroachment of forest land or riverbed to the Forest Department",
        "Use LED bulbs and solar panels — BESCOM offers solar subsidies for farmers",
      ],
    },
    {
      emoji: "🚦",
      title: "Road Safety",
      color: "#FFF1F0",
      border: "#FECACA",
      items: [
        "Mandya records ~200 road accidents annually on NH-275 and SH-17",
        "Always wear helmets on two-wheelers (mandatory in Karnataka)",
        "Report potholes via PotholeRaja app or call PWD Mandya: 08232-222160",
        "Don't drink and drive — report drunk driving to Mandya Traffic Police: 100",
        "NH-275 (Bengaluru-Mysuru highway) is high-risk — use service road wherever available",
      ],
    },
    {
      emoji: "🏛️",
      title: "Civic Duty",
      color: "#F5F3FF",
      border: "#DDD6FE",
      items: [
        "Attend Gram Sabha meetings — held twice a year in your village, open to all adults",
        "Pay property tax on time — unpaid taxes reduce funds for local infrastructure",
        "File RTI applications to question government spending in your area",
        "Verify your name on the electoral roll at voters.eci.gov.in",
        "Report corruption to Karnataka Lokayukta: 1064 (toll-free)",
        "Participate in district planning committee meetings — your voice matters",
      ],
    },
    {
      emoji: "📊",
      title: "What Mandya Can Become in 5 Years",
      color: "#EFF6FF",
      border: "#BFDBFE",
      isProjection: true,
      items: [
        "🏆 Top 5 districts in Karnataka for farmer income — if FPOs scale up and diversify crops",
        "🌊 Model district for water conservation — if drip irrigation adoption reaches 60%",
        "🏙️ Clean city ranking improvement — if 100% waste segregation is achieved",
        "📚 75%+ literacy — 2011 census was 72.8%, achievable with community learning centres",
        "🏃 Zero child malnutrition in anganwadis — if ICDS schemes are utilized fully",
        "🛣️ Zero potholes on all taluk roads — if citizens actively report via apps",
      ],
    },
  ],
};

export default function ResponsibilityPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Flame}
        title="My Responsibility"
        description={MANDYA_CONTENT.intro}
        backHref={base}
      />

      {/* Intro callout */}
      <div
        style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
          border: "1px solid #BFDBFE",
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 28,
          fontSize: 14,
          color: "#1D4ED8",
          lineHeight: 1.7,
          fontWeight: 500,
        }}
      >
        🗣️ <strong>This is YOUR district.</strong> Government alone cannot fix everything.
        As citizens, we have real power — and real responsibility. Small actions by many
        people create big change. Here&apos;s what you can do today.
      </div>

      {MANDYA_CONTENT.sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 24 }}>
          <SectionLabel>
            {section.emoji} {section.title}
          </SectionLabel>
          <div
            style={{
              background: section.color,
              border: `1px solid ${section.border}`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            {section.isProjection ? (
              <div
                style={{
                  fontSize: 13,
                  color: "#1A1A1A",
                  marginBottom: 4,
                  fontStyle: "italic",
                }}
              >
                If citizens and government work together, here&apos;s where Mandya can be by 2030:
              </div>
            ) : null}
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {section.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: "#1A1A1A",
                    lineHeight: 1.6,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* Data quality note */}
      <div
        style={{
          background: "#FAFAF8",
          border: "1px solid #E8E8E4",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 12,
          color: "#9B9B9B",
          marginTop: 8,
        }}
      >
        📌 This content is specific to Mandya district based on verified data from
        mandya.nic.in, SBM reports, and Karnataka government portals. As ForThePeople.in
        expands to more districts, each district will get its own customised responsibility
        guide based on its unique challenges and opportunities.
      </div>
    </div>
  );
}
