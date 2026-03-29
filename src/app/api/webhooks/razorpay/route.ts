/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  // If Razorpay keys aren't configured yet, return 200 gracefully
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.log("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping");
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Verify signature
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const expected = createHmac("sha256", webhookSecret).update(body).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event: string;
    payload: {
      payment?: { entity: Record<string, unknown> };
      subscription?: { entity: Record<string, unknown> };
    };
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;

  try {
    if (event === "payment.captured" && paymentEntity) {
      await prisma.supporter.upsert({
        where: { paymentId: String(paymentEntity.id ?? "") },
        update: { status: "success" },
        create: {
          name: String(paymentEntity.contact ?? paymentEntity.email ?? "Anonymous"),
          email: paymentEntity.email ? String(paymentEntity.email) : null,
          phone: paymentEntity.contact ? String(paymentEntity.contact) : null,
          amount: Number(paymentEntity.amount ?? 0) / 100, // paise → rupees
          currency: String(paymentEntity.currency ?? "INR"),
          paymentId: String(paymentEntity.id),
          orderId: paymentEntity.order_id ? String(paymentEntity.order_id) : null,
          method: paymentEntity.method ? String(paymentEntity.method) : null,
          status: "success",
          razorpayData: paymentEntity as object,
        },
      });
    } else if (event === "payment.failed" && paymentEntity) {
      await prisma.supporter.upsert({
        where: { paymentId: String(paymentEntity.id ?? "") },
        update: { status: "failed" },
        create: {
          name: String(paymentEntity.contact ?? paymentEntity.email ?? "Anonymous"),
          email: paymentEntity.email ? String(paymentEntity.email) : null,
          phone: paymentEntity.contact ? String(paymentEntity.contact) : null,
          amount: Number(paymentEntity.amount ?? 0) / 100,
          currency: String(paymentEntity.currency ?? "INR"),
          paymentId: String(paymentEntity.id),
          orderId: paymentEntity.order_id ? String(paymentEntity.order_id) : null,
          method: paymentEntity.method ? String(paymentEntity.method) : null,
          status: "failed",
          razorpayData: paymentEntity as object,
        },
      });
    }
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error("[razorpay-webhook]", event, err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
