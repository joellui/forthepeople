/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export interface TierConfig {
  emoji: string;
  label: string;
  defaultAmount: number;
  accent: string;
  isMonthly?: boolean;
  isCustom?: boolean;
}

type Step = "idle" | "form" | "processing" | "success" | "error";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  tier: TierConfig;
}

export default function SupportCheckout({ tier }: Props) {
  const [amount, setAmount] = useState(tier.defaultAmount);
  const [amountStr, setAmountStr] = useState(String(tier.defaultAmount));
  const [step, setStep] = useState<Step>("idle");
  const [scriptReady, setScriptReady] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Success data
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  function handleAmountBlur() {
    const parsed = parseInt(amountStr.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed) && parsed >= 10 && parsed <= 500000) {
      setAmount(parsed);
      setAmountStr(String(parsed));
    } else {
      setAmountStr(String(amount));
    }
  }

  function adjust(delta: number) {
    const next = Math.max(10, Math.min(500000, amount + delta));
    setAmount(next);
    setAmountStr(String(next));
  }

  async function handlePay() {
    if (!name.trim()) return;
    if (!scriptReady) return;
    setStep("processing");

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          tier: tier.label,
          name: name.trim(),
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          isPublic,
        }),
      });

      if (!res.ok) throw new Error("Order failed");
      const { orderId, amount: orderAmount, currency, contributionId } = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency,
        name: "ForThePeople.in",
        description: tier.label,
        order_id: orderId,
        prefill: { name: name.trim(), email: email.trim() },
        theme: { color: tier.accent },
        modal: {
          ondismiss: () => setStep("form"),
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              contributionId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setPaidAmount(amount);
            setStep("success");
          } else {
            setStep("error");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => setStep("error"));
      rzp.open();
      setStep("form"); // reset to form while checkout is open (modal handles state)
    } catch {
      setStep("error");
    }
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────
  if (step === "success") {
    const shareText = `I just contributed ₹${paidAmount.toLocaleString("en-IN")} to ForThePeople.in — a free platform that brings government data to every Indian citizen! Check it out:`;
    const shareUrl = "https://forthepeople.in/support";
    const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    return (
      <div style={{ textAlign: "center", padding: "24px 16px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A1A", marginBottom: 8 }}>
          Thank You!
        </div>
        <div style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 20 }}>
          Your ₹{paidAmount.toLocaleString("en-IN")} contribution helps keep<br />
          ForThePeople.in running for all citizens.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              background: "#25D366",
              color: "#fff",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Share on WhatsApp
          </a>
          <a
            href={twitterHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 16px",
              background: "#1DA1F2",
              color: "#fff",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Share on X
          </a>
        </div>
        <Link
          href="/en"
          style={{ fontSize: 12, color: "#9B9B9B", textDecoration: "none" }}
        >
          ← Back to Homepage
        </Link>
      </div>
    );
  }

  // ── FORM STEP ─────────────────────────────────────────────
  if (step === "form" || step === "processing") {
    const isLoading = step === "processing";
    return (
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 12 }}>
          Almost there — just your name!
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            placeholder="Your Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            style={{
              padding: "9px 12px",
              border: "1px solid #E8E8E4",
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              background: "#FAFAF8",
            }}
          />
          <input
            type="email"
            placeholder="Email (optional — for receipt)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "9px 12px",
              border: "1px solid #E8E8E4",
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              background: "#FAFAF8",
            }}
          />
          <input
            type="text"
            placeholder="Message (optional, max 100 chars)"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 100))}
            style={{
              padding: "9px 12px",
              border: "1px solid #E8E8E4",
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              background: "#FAFAF8",
            }}
          />

          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ fontSize: 11, color: "#6B6B6B", lineHeight: 1.5 }}>
              Show my contribution on the live contributor wall<br />
              <span style={{ color: "#9B9B9B" }}>(unchecked = shown as &quot;Anonymous&quot;)</span>
            </span>
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={() => setStep("idle")}
            disabled={isLoading}
            style={{
              padding: "10px 14px",
              background: "#F5F5F0",
              border: "1px solid #E8E8E4",
              borderRadius: 8,
              fontSize: 12,
              color: "#6B6B6B",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ← Back
          </button>
          <button
            onClick={handlePay}
            disabled={!name.trim() || isLoading || !scriptReady}
            style={{
              flex: 1,
              padding: "10px",
              background: !name.trim() || isLoading ? "#9B9B9B" : tier.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: !name.trim() || isLoading ? "default" : "pointer",
              transition: "background 150ms ease",
            }}
          >
            {isLoading ? "Opening payment…" : `Pay ₹${amount.toLocaleString("en-IN")} →`}
          </button>
        </div>
      </div>
    );
  }

  // ── ERROR STEP ────────────────────────────────────────────
  if (step === "error") {
    return (
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <div style={{ fontSize: 13, color: "#DC2626", marginBottom: 12 }}>
          Payment failed or was cancelled.
        </div>
        <button
          onClick={() => setStep("idle")}
          style={{
            padding: "9px 20px",
            background: tier.accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── IDLE STEP (amount input + contribute button) ───────────
  return (
    <div>
      {/* Editable amount row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => adjust(-10)}
          style={{
            width: 28, height: 28, border: "1px solid #E8E8E4",
            borderRadius: 6, background: "#F5F5F0",
            cursor: "pointer", fontSize: 16, color: "#6B6B6B",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >−</button>
        <div style={{ display: "flex", alignItems: "center", flex: 1, background: "#FAFAF8", border: "1px solid #E8E8E4", borderRadius: 8, padding: "6px 10px" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: tier.accent, marginRight: 4 }}>₹</span>
          <input
            type="number"
            min={10}
            max={500000}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            onBlur={handleAmountBlur}
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 16, fontWeight: 800, color: "#1A1A1A",
              fontFamily: "var(--font-mono, monospace)",
              outline: "none", minWidth: 0,
            }}
          />
        </div>
        <button
          onClick={() => adjust(10)}
          style={{
            width: 28, height: 28, border: "1px solid #E8E8E4",
            borderRadius: 6, background: "#F5F5F0",
            cursor: "pointer", fontSize: 16, color: "#6B6B6B",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >+</button>
      </div>

      <button
        onClick={() => setStep("form")}
        disabled={!scriptReady}
        style={{
          display: "block", width: "100%",
          textAlign: "center", padding: "10px",
          background: tier.accent, color: "#fff",
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: "pointer", border: "none",
          transition: "opacity 150ms ease",
          opacity: scriptReady ? 1 : 0.7,
        }}
      >
        Contribute ₹{amount.toLocaleString("en-IN")}
      </button>
    </div>
  );
}

// Export timeAgo for use in ContributorWall
export { timeAgo };
