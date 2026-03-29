/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import Link from "next/link";
import FeedbackModal from "@/components/common/FeedbackModal";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ForThePeople.in Privacy Policy — we collect no personal data without consent.",
  alternates: { canonical: `${BASE_URL}/en/privacy` },
};

export default function PrivacyPage() {
  const sections = [
    {
      title: "What we collect",
      content: `ForThePeople.in does not require user registration or login. We do not collect personal information such as name, email, phone number, or Aadhaar. If you use the RTI template generator, all data is processed locally in your browser and never sent to our servers.`,
    },
    {
      title: "Analytics",
      content: `We use privacy-respecting, cookieless analytics to understand aggregate usage patterns (e.g., which districts are most visited). No personally identifiable information is stored. We do not use Google Analytics or Facebook Pixel.`,
    },
    {
      title: "Cookies",
      content: `We use a single functional cookie to remember your preferred district so you land there directly on your next visit. This cookie contains no personal data and expires after 30 days. You can clear it at any time through your browser settings.`,
    },
    {
      title: "Third-party data",
      content: `The data we display is sourced from government portals. When you click an external link (e.g., to agmarknet.gov.in or ejalshakti.gov.in), you are subject to those websites' privacy policies. We do not control or have access to their data collection practices.`,
    },
    {
      title: "Data retention",
      content: `We retain scraped government data for a rolling 90-day period for live modules (weather, crop prices, news). Historical data (elections, census, budget) is retained indefinitely as it is public record. Server logs are retained for 7 days.`,
    },
    {
      title: "Your rights",
      content: `You have the right to know what data (if any) we hold about you, to request deletion, and to opt out of any future data collection. Use the feedback form on this site to reach us and we will respond as soon as possible.`,
    },
    {
      title: "Changes to this policy",
      content: `We may update this policy as the platform evolves. Material changes will be announced on the homepage. The date of last update is shown at the bottom of this page.`,
    },
  ];

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "var(--font-plus-jakarta, system-ui, sans-serif)",
      }}
    >
      <Link
        href="/"
        style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none", display: "inline-block", marginBottom: 16 }}
      >
        ← ForThePeople.in
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.4px", marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 13, color: "#9B9B9B", marginBottom: 32 }}>
        Last updated: March 2025. Effective immediately.
      </p>

      <p style={{ fontSize: 15, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 32 }}>
        ForThePeople.in is built on the principle that public data belongs to the public.
        We are equally committed to protecting the privacy of the people who use our
        platform. This policy explains, plainly and completely, what data we collect and
        how we use it.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {sections.map((s, i) => (
          <div key={s.title}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
              {i + 1}. {s.title}
            </h2>
            <p style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, margin: 0 }}>
              {s.content}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 40,
          padding: "16px 20px",
          background: "#F5F5F0",
          borderRadius: 10,
          fontSize: 13,
          color: "#6B6B6B",
        }}
      >
        Questions?{" "}
        <FeedbackModal label="Use our feedback form →" />
      </div>
    </div>
  );
}
