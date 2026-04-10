import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    keyId: process.env.RAZORPAY_KEY_ID?.slice(0, 15) ?? "NOT SET",
    secretLen: process.env.RAZORPAY_KEY_SECRET?.length ?? 0,
    planMonthly: process.env.RAZORPAY_PLAN_MONTHLY ?? "NOT SET",
    planDistrict: process.env.RAZORPAY_PLAN_DISTRICT ?? "NOT SET",
    planState: process.env.RAZORPAY_PLAN_STATE ?? "NOT SET",
    planPatron: process.env.RAZORPAY_PLAN_PATRON ?? "NOT SET",
  });
}
