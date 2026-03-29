/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import prisma from "@/lib/db";

const MIN_AMOUNT = 10;
const MAX_AMOUNT = 500000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, tier, name, email, message, isPublic } = body as {
      amount: number;
      tier: string;
      name: string;
      email?: string;
      message?: string;
      isPublic: boolean;
    };

    // Validate
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString("en-IN")}` },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();

    // Create Prisma record first to get contributionId for receipt
    const contribution = await prisma.contribution.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        amount: amount * 100, // store in paise
        tier: tier || "custom",
        message: message?.trim().slice(0, 100) || null,
        isPublic: isPublic !== false,
        status: "created",
      },
    });

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `ftp_${contribution.id}`,
      notes: {
        tier,
        platform: "forthepeople.in",
        contributionId: contribution.id,
      },
    });

    // Save orderId back to contribution
    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { razorpayOrderId: order.id },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      contributionId: contribution.id,
    });
  } catch (err) {
    console.error("[create-order]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
