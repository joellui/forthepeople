// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Safe Hierarchy Seeder
// Upserts State → District → Taluk WITHOUT deleting any data.
// Safe to run on production Neon DB.
//
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-hierarchy.ts
// Or:  npx tsx prisma/seed-hierarchy.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Upserting Karnataka hierarchy (no deletes)...");

  // ── Karnataka State ──────────────────────────────────────
  const karnataka = await prisma.state.upsert({
    where: { slug: "karnataka" },
    update: { active: true },
    create: { name: "Karnataka", nameLocal: "ಕರ್ನಾಟಕ", slug: "karnataka", active: true, capital: "Bengaluru" },
  });
  console.log("✓ Karnataka state");

  // ── Districts ────────────────────────────────────────────
  const districtDefs = [
    {
      slug: "mandya",
      name: "Mandya", nameLocal: "ಮಂಡ್ಯ",
      tagline: "Sugar Capital of Karnataka", taglineLocal: "ಕರ್ನಾಟಕದ ಸಕ್ಕರೆ ನಗರ",
      population: 1940428, area: 4961, talukCount: 7, villageCount: 1291,
      literacy: 72.8, sexRatio: 982, density: 391.2, avgRainfall: 695,
      taluks: [
        { slug: "mandya",        name: "Mandya",        nameLocal: "ಮಂಡ್ಯ",          tagline: "Sugar Capital of Karnataka",    pop: 516098, area: 727, villages: 193 },
        { slug: "maddur",        name: "Maddur",        nameLocal: "ಮದ್ದೂರು",         tagline: "Gateway to Old Mysore",         pop: 290000, area: 686, villages: 174 },
        { slug: "malavalli",     name: "Malavalli",     nameLocal: "ಮಳವಳ್ಳಿ",         tagline: "Land of Temples & Tanks",       pop: 270000, area: 705, villages: 187 },
        { slug: "srirangapatna", name: "Srirangapatna", nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",    tagline: "Tipu Sultan's Island Fortress", pop: 225000, area: 581, villages: 135 },
        { slug: "nagamangala",   name: "Nagamangala",   nameLocal: "ನಾಗಮಂಗಲ",         tagline: "Heart of the Deccan Plateau",   pop: 220000, area: 791, villages: 200 },
        { slug: "kr-pete",       name: "K R Pete",      nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ",     tagline: "Jewel of the Kaveri Basin",     pop: 235000, area: 727, villages: 210 },
        { slug: "pandavapura",   name: "Pandavapura",   nameLocal: "ಪಾಂಡವಪುರ",        tagline: "Where the Pandavas Rested",     pop: 175000, area: 744, villages: 192 },
      ],
    },
    {
      slug: "mysuru",
      name: "Mysuru", nameLocal: "ಮೈಸೂರು",
      tagline: "City of Palaces", taglineLocal: "ಅರಮನೆಗಳ ನಗರ",
      population: 3248000, area: 6854, talukCount: 7, villageCount: 2629,
      literacy: 72.64, sexRatio: 984, density: 474, avgRainfall: 750,
      taluks: [
        { slug: "mysuru-taluk",  name: "Mysuru",       nameLocal: "ಮೈಸೂರು",                  tagline: "Heritage Capital of Karnataka",       pop: 1800000, area: 1654, villages: 362 },
        { slug: "hunsur",        name: "Hunsur",        nameLocal: "ಹನ್ಸೂರು",                 tagline: "Coffee & Cardamom Country",           pop: 320000,  area: 862,  villages: 284 },
        { slug: "nanjangud",     name: "Nanjangud",     nameLocal: "ನಂಜನಗೂಡು",               tagline: "Temple Town on the Kapila",           pop: 325000,  area: 936,  villages: 325 },
        { slug: "t-narasipur",   name: "T. Narasipur",  nameLocal: "ತಿರುಮಕೂಡಲು ನರಸೀಪುರ",    tagline: "Triveni Sangama — Three Rivers Meet", pop: 260000,  area: 1005, villages: 348 },
        { slug: "hd-kote",       name: "H.D. Kote",     nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ",           tagline: "Gateway to Nagarahole",              pop: 220000,  area: 2374, villages: 370 },
        { slug: "periyapatna",   name: "Periyapatna",   nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ",           tagline: "Land of Turmeric and Pepper",         pop: 210000,  area: 782,  villages: 260 },
        { slug: "kr-nagar",      name: "K.R. Nagar",    nameLocal: "ಕೃಷ್ಣರಾಜನಗರ",           tagline: "Cauvery Heartland",                  pop: 215000,  area: 1079, villages: 305 },
      ],
    },
    {
      slug: "bengaluru-urban",
      name: "Bengaluru Urban", nameLocal: "ಬೆಂಗಳೂರು ನಗರ",
      tagline: "Silicon Valley of India", taglineLocal: "ಭಾರತದ ಸಿಲಿಕಾನ್ ಕಣಿವೆ",
      population: 12765000, area: 741, talukCount: 4, villageCount: 532,
      literacy: 88.48, sexRatio: 916, density: 17232, avgRainfall: 970,
      taluks: [
        { slug: "bengaluru-north", name: "Bengaluru North", nameLocal: "ಬೆಂಗಳೂರು ಉತ್ತರ",  tagline: "Gateway to the Airport",   pop: 3800000, area: 198, villages: 145 },
        { slug: "bengaluru-south", name: "Bengaluru South", nameLocal: "ಬೆಂಗಳೂರು ದಕ್ಷಿಣ", tagline: "Heart of the Garden City", pop: 4200000, area: 186, villages: 120 },
        { slug: "bengaluru-east",  name: "Bengaluru East",  nameLocal: "ಬೆಂಗಳೂರು ಪೂರ್ವ",  tagline: "IT Corridor Hub",          pop: 3100000, area: 194, villages: 150 },
        { slug: "anekal",          name: "Anekal",          nameLocal: "ಆನೇಕಲ್",           tagline: "Electronics City Gateway", pop: 1665000, area: 163, villages: 117 },
      ],
    },
  ];

  for (const def of districtDefs) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: karnataka.id, slug: def.slug } },
      update: { active: true },
      create: {
        stateId: karnataka.id,
        name: def.name, nameLocal: def.nameLocal,
        slug: def.slug,
        tagline: def.tagline, taglineLocal: def.taglineLocal,
        active: true,
        population: def.population, area: def.area,
        talukCount: def.talukCount, villageCount: def.villageCount,
        literacy: def.literacy, sexRatio: def.sexRatio,
        density: def.density, avgRainfall: def.avgRainfall,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          name: t.name, nameLocal: t.nameLocal, slug: t.slug,
          tagline: t.tagline,
          population: t.pop, area: t.area, villageCount: t.villages,
        },
      });
    }
    console.log(`✓ ${def.name} + ${def.taluks.length} taluks`);
  }

  console.log("\n✅ Hierarchy upsert complete — no data deleted.");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
