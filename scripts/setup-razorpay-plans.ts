/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Run ONCE to create subscription plans on Razorpay:
 *   npx tsx scripts/setup-razorpay-plans.ts
 *
 * After running, add the returned plan IDs to your .env:
 *   RAZORPAY_PLAN_MONTHLY=plan_xxx
 *   RAZORPAY_PLAN_DISTRICT=plan_xxx
 *   RAZORPAY_PLAN_STATE=plan_xxx
 *   RAZORPAY_PLAN_PATRON=plan_xxx
 */

const PLANS = [
  {
    envKey: "RAZORPAY_PLAN_MONTHLY",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "ForThePeople.in Monthly Supporter",
        amount: 20000, // ₹200 in paise
        currency: "INR",
        description: "Monthly supporter — keeps one taluk's data pipeline running",
      },
    },
  },
  {
    envKey: "RAZORPAY_PLAN_DISTRICT",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "ForThePeople.in District Champion",
        amount: 200000, // ₹2,000 in paise
        currency: "INR",
        description: "District Champion — sponsors one full district dashboard",
      },
    },
  },
  {
    envKey: "RAZORPAY_PLAN_STATE",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "ForThePeople.in State Champion",
        amount: 1000000, // ₹10,000 in paise
        currency: "INR",
        description: "State Champion — sponsors all districts in one state",
      },
    },
  },
  {
    envKey: "RAZORPAY_PLAN_PATRON",
    plan: {
      period: "monthly",
      interval: 1,
      item: {
        name: "ForThePeople.in All-India Patron",
        amount: 5000000, // ₹50,000 in paise
        currency: "INR",
        description: "All-India Patron — help cover all 780 districts",
      },
    },
  },
];

async function main() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    console.error("❌ Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env");
    process.exit(1);
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  console.log("Creating Razorpay subscription plans...\n");

  const envLines: string[] = [];

  for (const { envKey, plan } of PLANS) {
    try {
      const res = await fetch("https://api.razorpay.com/v1/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(plan),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`❌ Failed to create ${plan.item.name}: ${err}`);
        continue;
      }

      const data = await res.json();
      console.log(`✅ ${plan.item.name}`);
      console.log(`   Plan ID: ${data.id}`);
      console.log(`   Amount: ₹${plan.item.amount / 100}/month\n`);
      envLines.push(`${envKey}=${data.id}`);
    } catch (err) {
      console.error(`❌ Error creating ${plan.item.name}:`, err);
    }
  }

  if (envLines.length > 0) {
    console.log("\n═══════════════════════════════════════");
    console.log("Add these to your .env file:\n");
    console.log(envLines.join("\n"));
    console.log("\n═══════════════════════════════════════");
  }
}

main();
