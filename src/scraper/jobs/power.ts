/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Power Outages — BESCOM/CESC planned outage scraper
// Schedule: Every 15 min
// Source: https://bescom.karnataka.gov.in (planned outages)
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

// BESCOM publishes planned outage notices as HTML tables
const BESCOM_URL =
  "https://bescom.karnataka.gov.in/page/Planned+Outage/en";

export async function scrapePower(ctx: JobContext): Promise<ScraperResult> {
  try {
    let newCount = 0;
    const updatedCount = 0;

    const res = await fetch(BESCOM_URL, {
      headers: {
        "User-Agent": "ForThePeople.in/1.0 (citizen transparency platform)",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status} from BESCOM`);

    const html = await res.text();
    const $ = cheerio.load(html);

    // BESCOM outage table: Date | Time | Area | Reason | Duration
    $("table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      const area = $(cells[0]).text().trim();
      const timeText = $(cells[1]).text().trim();
      const reason = $(cells[2]).text().trim() || "Planned maintenance";

      // Filter for our district
      const districtName = ctx.districtSlug.replace(/-/g, " ");
      if (!area.toLowerCase().includes(districtName)) return;
      if (!area) return;

      // Parse time range "09:00 to 17:00" or "09:00 - 17:00"
      const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*(?:to|-)\s*(\d{1,2}:\d{2})/i);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startTime = new Date(today);
      const endTime = new Date(today);

      if (timeMatch) {
        const [sh, sm] = timeMatch[1].split(":").map(Number);
        const [eh, em] = timeMatch[2].split(":").map(Number);
        startTime.setHours(sh, sm);
        endTime.setHours(eh, em);
      } else {
        startTime.setHours(9, 0);
        endTime.setHours(17, 0);
      }

      // Deduplication: same area + same day
      prisma.powerOutage
        .findFirst({
          where: {
            districtId: ctx.districtId,
            area,
            startTime: { gte: today },
          },
        })
        .then((existing) => {
          if (!existing) {
            prisma.powerOutage
              .create({
                data: {
                  districtId: ctx.districtId,
                  area,
                  type: "Planned",
                  reason,
                  startTime,
                  endTime,
                  active: endTime > new Date(),
                  source: "BESCOM",
                },
              })
              .then(() => newCount++);
          }
        });
    });

    // If scraper returned no results (BESCOM may change layout), log it
    if (newCount === 0) {
      ctx.log(`Power: no new outages parsed (HTML structure may have changed)`);
    }

    // Mark past outages as inactive
    await prisma.powerOutage.updateMany({
      where: {
        districtId: ctx.districtId,
        active: true,
        endTime: { lt: new Date() },
      },
      data: { active: false },
    });

    // Wait for async creates above
    await new Promise((r) => setTimeout(r, 500));

    ctx.log(`Power: ${newCount} new outages, ${updatedCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
