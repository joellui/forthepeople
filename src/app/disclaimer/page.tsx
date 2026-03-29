/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "ForThePeople.in is an independent citizen platform. Data is sourced from government portals and may have a delay.",
  alternates: { canonical: `${BASE_URL}/en/disclaimer` },
};

export default function DisclaimerPage() {
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
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.4px", marginBottom: 32 }}>
        Disclaimer
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, fontSize: 14, color: "#4B4B4B", lineHeight: 1.7 }}>
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Independent Platform</h2>
          <p style={{ margin: 0 }}>
            ForThePeople.in is an independent, non-partisan, non-profit citizen initiative.
            We are not affiliated with, endorsed by, or a part of any government body,
            political party, or commercial organisation. The views expressed, if any, are
            those of individual contributors and do not represent any government position.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Data Accuracy</h2>
          <p style={{ margin: 0 }}>
            All data on this platform is sourced from official government portals and APIs.
            While we strive for accuracy, data may have a delay of up to 24 hours for
            live modules. Historical data is presented as published by the originating
            government body and has not been independently verified by us.
          </p>
          <p style={{ marginTop: 10 }}>
            <strong>Do not use this platform for critical real-time decisions</strong>{" "}
            (e.g., emergency response, medical decisions, legal filings). Always refer to
            the original government portal for official data.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>No Legal Advice</h2>
          <p style={{ margin: 0 }}>
            The RTI templates, scheme information, and citizen rights content on this
            platform are provided for informational purposes only. They do not constitute
            legal advice. Consult a qualified legal professional for your specific situation.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>External Links</h2>
          <p style={{ margin: 0 }}>
            This platform links to external government websites. We are not responsible
            for the content, availability, or accuracy of those websites. Links to
            external sites do not constitute an endorsement.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Errors and Corrections</h2>
          <p style={{ margin: 0 }}>
            We make every effort to present accurate data. If you believe data on this
            platform is incorrect, please{" "}
            <Link href="/contribute" style={{ color: "#2563EB" }}>
              report it here
            </Link>
            . We will investigate and correct errors within 24 hours and document the
            correction.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Limitation of Liability</h2>
          <p style={{ margin: 0 }}>
            ForThePeople.in and its contributors shall not be liable for any loss or
            damage arising from the use of, or reliance on, information presented on this
            platform. Use of this platform is at your own risk.
          </p>
        </section>
      </div>
    </div>
  );
}
