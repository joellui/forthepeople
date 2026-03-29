/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — District Overview Dashboard (Section 5)
// ═══════════════════════════════════════════════════════════
export const revalidate = 300; // ISR: revalidate every 5 minutes

import { notFound } from "next/navigation";
import { getDistrict, getState } from "@/lib/constants/districts";
import OverviewClient from "./OverviewClient";

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state: stateSlug, district: districtSlug } = await params;

  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);
  if (!districtData || !stateData) notFound();

  return (
    <OverviewClient
      locale={locale}
      stateSlug={stateSlug}
      districtSlug={districtSlug}
      districtData={{
        name: districtData.name,
        nameLocal: districtData.nameLocal,
        tagline: districtData.tagline,
        population: districtData.population,
        area: districtData.area,
        talukCount: districtData.talukCount ?? districtData.taluks.length,
        villageCount: districtData.villageCount,
        literacy: districtData.literacy,
        sexRatio: districtData.sexRatio,
        active: districtData.active,
        taluks: districtData.taluks.map((t) => ({
          slug: t.slug,
          name: t.name,
          nameLocal: t.nameLocal,
          tagline: t.tagline,
        })),
      }}
      stateName={stateData.name}
    />
  );
}
