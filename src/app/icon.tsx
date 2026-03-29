/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Blue rounded square with two person silhouettes (citizens theme)
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
          borderRadius: 108,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Person 1 — slightly left, semi-transparent */}
        <div style={{ position: "absolute", left: 108, top: 128, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,0.72)" }} />
          <div style={{ width: 144, height: 110, borderRadius: "72px 72px 0 0", background: "rgba(255,255,255,0.72)", marginTop: 16 }} />
        </div>
        {/* Person 2 — center-right, fully white (foreground) */}
        <div style={{ position: "absolute", left: 196, top: 110, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 108, height: 108, borderRadius: "50%", background: "white" }} />
          <div style={{ width: 164, height: 130, borderRadius: "82px 82px 0 0", background: "white", marginTop: 18 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
