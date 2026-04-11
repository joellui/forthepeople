/**
 * ForThePeople.in — Data Fix Script (April 2026)
 * Run: DATABASE_URL=... npx tsx scripts/fix-data-april-2026.ts
 *
 * Fixes:
 * - Bug 10: TN Governor update (R.N. Ravi → current governor)
 * - Bug 9: Bengaluru elections data verification flags
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data fixes...\n");

  // ── Bug 10: Update TN Governor ──────────────────────────
  // VERIFY: Check rajbhavan.tn.gov.in for current TN Governor before running
  // As of the user report (April 2026), R.N. Ravi is no longer Governor.
  // TODO: Replace "VERIFY_CURRENT_GOVERNOR" with the actual name from rajbhavan.tn.gov.in
  const chennai = await prisma.district.findFirst({
    where: { slug: "chennai" },
    select: { id: true },
  });

  if (chennai) {
    const updated = await prisma.leader.updateMany({
      where: {
        districtId: chennai.id,
        role: "Governor of Tamil Nadu",
        name: "R.N. Ravi",
      },
      data: {
        // TODO: Replace with verified current governor name from rajbhavan.tn.gov.in
        name: "VERIFY_CURRENT_GOVERNOR",
        since: "2026",
      },
    });
    console.log(`TN Governor records updated: ${updated.count}`);
    console.log("⚠️  IMPORTANT: Verify the governor name at rajbhavan.tn.gov.in before deploying");
  }

  // ── Bug 9: Flag Bengaluru elections for review ──────────
  const bengaluru = await prisma.district.findFirst({
    where: { slug: "bengaluru-urban" },
    select: { id: true },
  });

  if (bengaluru) {
    const electionCount = await prisma.electionResult.count({
      where: { districtId: bengaluru.id },
    });
    const latestYear = await prisma.electionResult.findFirst({
      where: { districtId: bengaluru.id },
      orderBy: { year: "desc" },
      select: { year: true, electionType: true },
    });
    console.log(`\nBengaluru elections: ${electionCount} records, latest: ${latestYear?.year} (${latestYear?.electionType})`);
    console.log("⚠️  VERIFY: Cross-reference with eci.gov.in and cekarnataka.kar.nic.in");
    console.log("   Check: Lok Sabha constituencies, Assembly constituencies, current MPs/MLAs");
  }

  console.log("\n✅ Script complete. Review output above before deploying.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
