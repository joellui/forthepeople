/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { RAZORPAY_PLANS, TIER_CONFIG } from "@/lib/constants/razorpay-plans";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier, name, email, districtId, stateId, socialLink, message } = body as {
      tier: string;
      name: string;
      email?: string;
      districtId?: string;
      stateId?: string;
      socialLink?: string;
      message?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const tierConfig = TIER_CONFIG[tier];
    if (!tierConfig || !tierConfig.isRecurring) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    // Validate district/state requirements
    if (tierConfig.requiresDistrict && !districtId) {
      return NextResponse.json({ error: "District selection is required for this tier" }, { status: 400 });
    }
    if (tierConfig.requiresState && !stateId) {
      return NextResponse.json({ error: "State selection is required for this tier" }, { status: 400 });
    }

    const planId = RAZORPAY_PLANS[tier as keyof typeof RAZORPAY_PLANS];
    if (!planId) {
      return NextResponse.json({ error: "Subscription plan not configured" }, { status: 500 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Create Razorpay subscription
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: 120, // up to 10 years
        notes: {
          name: name.trim(),
          email: email?.trim() || "",
          tier,
          districtId: districtId || "",
          stateId: stateId || "",
          socialLink: socialLink?.trim() || "",
          message: message?.trim().slice(0, 100) || "",
          platform: "forthepeople.in",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[create-subscription] Razorpay error:", err);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const data = await res.json();

    return NextResponse.json({
      subscriptionId: data.id,
      shortUrl: data.short_url,
    });
  } catch (err) {
    console.error("[create-subscription]", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
