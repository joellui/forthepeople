/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ExamStepper — Locked progress bar for exam lifecycle
// Shows: Announced → Applications → Admit Card → Exam → Results
// Locked steps show 🔒 with "Locked" label
// Active steps show date + "Apply Now" button when open
// ═══════════════════════════════════════════════════════════
"use client";
import { ExternalLink } from "lucide-react";

interface ExamStepperProps {
  status: string;
  announcedDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  admitCardDate?: string | null;
  examDate?: string | null;
  resultDate?: string | null;
  applyUrl?: string | null;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "";
  }
}

const STEPS = [
  { key: "announced",  icon: "📢", label: "Announced" },
  { key: "applications", icon: "📝", label: "Applications" },
  { key: "admitCard",   icon: "🎫", label: "Admit Card" },
  { key: "exam",        icon: "✍️", label: "Exam Date" },
  { key: "results",     icon: "🏆", label: "Results" },
];

function getStepState(
  stepKey: string,
  idx: number,
  props: ExamStepperProps
): "completed" | "active" | "locked" {
  const { status, announcedDate, startDate, endDate, admitCardDate, examDate, resultDate } = props;

  // Determine how far this exam has progressed
  const hasAnnounced = !!announcedDate;
  const hasApplications = !!startDate || status === "open" || status === "closed" || status === "results";
  const hasAdmitCard = !!admitCardDate || status === "closed" || status === "results";
  const hasExam = !!examDate || status === "closed" || status === "results";
  const hasResults = !!resultDate || status === "results";

  const progressMap: Record<string, boolean> = {
    announced:   hasAnnounced,
    applications: hasApplications,
    admitCard:   hasAdmitCard,
    exam:       hasExam,
    results:    hasResults,
  };

  const completedCount = Object.values(progressMap).filter(Boolean).length;

  if (progressMap[stepKey as keyof typeof progressMap]) {
    if (idx < completedCount - 1) return "completed";
    if (idx === completedCount - 1) return "active";
    return "locked";
  }
  return "locked";
}

export default function ExamStepper(props: ExamStepperProps) {
  const { status, applyUrl } = props;
  const isOpen = status === "open";

  // Color the connector line
  const connectorColor = status === "open" ? "#16A34A"
    : status === "results" ? "#D97706"
    : "#E8E8E4";

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 0,
      overflowX: "auto",
      paddingBottom: 4,
    }}>
      {STEPS.map((step, idx) => {
        const state = getStepState(step.key, idx, props);
        const isCompleted = state === "completed";
        const isActive = state === "active";
        const isLocked = state === "locked";

        // Step color
        const dotColor = isCompleted ? "#16A34A"
          : isActive ? (status === "open" ? "#16A34A" : status === "results" ? "#D97706" : "#2563EB")
          : "#D1D5DB";

        const bgColor = isCompleted ? "#DCFCE7"
          : isActive ? (status === "open" ? "#DCFCE7" : "#EFF6FF")
          : "#F9FAFB";

        const borderColor = isCompleted ? "#16A34A"
          : isActive ? dotColor
          : "#E8E8E4";

        // Connector line (between steps)
        const connector = idx < STEPS.length - 1 ? (
          <div style={{
            flex: "1 0 20px",
            height: 2,
            background: isCompleted || isActive ? connectorColor : "#E8E8E4",
            marginTop: 20,
            borderRadius: 1,
            transition: "background 400ms ease",
            minWidth: 16,
          }} />
        ) : null;

        // Content for this step
        let stepDate = "";
        let subLabel = "";
        if (step.key === "announced")  stepDate = fmtDate(props.announcedDate);
        if (step.key === "applications") {
          stepDate = fmtDate(props.startDate);
          if (!stepDate && props.endDate) stepDate = `Ends ${fmtDate(props.endDate)}`;
        }
        if (step.key === "admitCard")   stepDate = fmtDate(props.admitCardDate) || fmtDate(props.examDate);
        if (step.key === "exam")        stepDate = fmtDate(props.examDate);
        if (step.key === "results")      stepDate = fmtDate(props.resultDate);

        const isApplicationsStep = step.key === "applications";

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "flex-start", flex: "1 0 auto" }}>
            {/* Step circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: bgColor,
                border: `2px solid ${borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
                transition: "all 400ms ease",
                boxShadow: isActive ? `0 0 0 3px ${dotColor}25` : "none",
              }}>
                {isLocked ? "🔒" : isCompleted ? "✅" : step.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: isLocked ? "#D1D5DB" : "#6B7280", marginTop: 6, textAlign: "center", letterSpacing: "0.03em" }}>
                {step.label}
              </div>
              {stepDate && !isLocked && (
                <div style={{ fontSize: 10, color: "#9B9B9B", marginTop: 2, textAlign: "center" }}>
                  {stepDate}
                </div>
              )}
              {isLocked && (
                <div style={{ fontSize: 10, color: "#D1D5DB", marginTop: 2, textAlign: "center" }}>
                  Locked
                </div>
              )}

              {/* Apply Now button for Applications step */}
              {isApplicationsStep && isOpen && applyUrl && (
                <a
                  href={applyUrl.startsWith("http") ? applyUrl : `https://${applyUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 6,
                    padding: "4px 10px",
                    background: "#16A34A",
                    color: "#FFF",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Apply Now <ExternalLink size={9} />
                </a>
              )}
            </div>
            {connector}
          </div>
        );
      })}
    </div>
  );
}
