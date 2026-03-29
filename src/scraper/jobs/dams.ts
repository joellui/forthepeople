/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Dam/Reservoir Levels — Karnataka Water Resources Dept
// Source: https://water.karnataka.gov.in/ReservoirPublic
// API:    POST CommonXyZABC.aspx/GetReservoirLocs (no auth needed)
// Schedule: Every 30 minutes
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

const KARNATAKA_WATER_URL =
  "https://water.karnataka.gov.in/CommonXyZABC.aspx/GetReservoirLocs";

// Which reservoir names to track per district (from Karnataka water portal)
const DISTRICT_DAMS: Record<string, string[]> = {
  "mandya":          ["K.R.Sagara Dam", "Hemavathy Dam"],
  "mysuru":          ["K.R.Sagara Dam", "Kabini Dam"],
  "bengaluru-urban": ["K.R.Sagara Dam", "Hemavathy Dam"],
};

// Full Reservoir Level (FRL) in ft — static design values
const DAM_FRL: Record<string, number> = {
  "K.R.Sagara Dam":  2624.0,
  "Kabini Dam":      2284.0,
  "Hemavathy Dam":   2922.0,
  "Harangi Dam":     2859.0,
};

interface KarnatakaReservoir {
  ReservoirName: string;
  Date: string;          // "28 Mar 2026"
  PercentFull: number;
  Reservior_Level: number;  // ft (note: typo in source)
  StorageCapacity_AsPerDesign: number;  // TMC
  TMC_GrossCapacity: number;            // TMC current gross
  Flow_Inflow: number;   // cusecs
  Flow_OutFlow: number;  // cusecs
}

function parseDate(dateStr: string): Date | null {
  // "28 Mar 2026" → Date
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return null;
  const [dd, mon, yyyy] = parts;
  const month = months[mon];
  if (month === undefined) return null;
  const d = new Date(Date.UTC(parseInt(yyyy), month, parseInt(dd)));
  return isNaN(d.getTime()) ? null : d;
}

export async function scrapeDams(ctx: JobContext): Promise<ScraperResult> {
  const targetDams = DISTRICT_DAMS[ctx.districtSlug];
  if (!targetDams || targetDams.length === 0) {
    ctx.log(`Dams: no dam config for district ${ctx.districtSlug} — skipping`);
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    const res = await fetch(KARNATAKA_WATER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Referer": "https://water.karnataka.gov.in/ReservoirPublic",
        "User-Agent": "ForThePeople.in Data Aggregator",
      },
      body: "{}",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const geojson = JSON.parse(json.d ?? "{}");
    const features: { properties: KarnatakaReservoir }[] = geojson.features ?? [];

    let newCount = 0;
    for (const feature of features) {
      const p = feature.properties;
      if (!targetDams.includes(p.ReservoirName)) continue;

      const recordedAt = parseDate(p.Date);
      if (!recordedAt) {
        ctx.log(`Dams: could not parse date "${p.Date}" for ${p.ReservoirName}`);
        continue;
      }

      // Skip if we already have a reading for this dam on this date
      const existing = await prisma.damReading.findFirst({
        where: {
          districtId: ctx.districtId,
          damName: p.ReservoirName,
          recordedAt,
        },
      });
      if (existing) continue;

      const maxLevel = DAM_FRL[p.ReservoirName] ?? 0;
      const storagePct = typeof p.PercentFull === "number" ? p.PercentFull : 0;

      await prisma.damReading.create({
        data: {
          districtId: ctx.districtId,
          damName: p.ReservoirName,
          damNameLocal: null,
          waterLevel: p.Reservior_Level ?? 0,
          maxLevel,
          storage: p.TMC_GrossCapacity ?? 0,
          maxStorage: p.StorageCapacity_AsPerDesign ?? 0,
          inflow: p.Flow_Inflow ?? 0,
          outflow: p.Flow_OutFlow ?? 0,
          storagePct,
          recordedAt,
          source: "Karnataka Water Resources Dept",
        },
      });
      newCount++;
    }

    // Keep only last 48 readings per dam
    const damsInDb = await prisma.damReading.findMany({
      where: { districtId: ctx.districtId },
      distinct: ["damName"],
      select: { damName: true },
    });
    for (const { damName } of damsInDb) {
      const old = await prisma.damReading.findMany({
        where: { districtId: ctx.districtId, damName },
        orderBy: { recordedAt: "desc" },
        skip: 48,
        select: { id: true },
      });
      if (old.length > 0) {
        await prisma.damReading.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
      }
    }

    ctx.log(`Dams: ${newCount} new readings for ${ctx.districtSlug} (checked ${targetDams.length} dams)`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
