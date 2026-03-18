"use client";

import { ReservationData } from "@/types/reservation";

interface Props {
  data: ReservationData;
  onSubmit: () => void;
  submitting: boolean;
  submitted: boolean;
}

export default function StepConfirmation({ data, onSubmit, submitting, submitted }: Props) {
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (slot: string | null) => {
    if (slot === "early") return "Early (5:30 – 7:00 PM)";
    if (slot === "prime") return "Prime (7:00 – 9:00 PM)";
    if (slot === "late") return "Late (9:00 – 11:00 PM)";
    return "—";
  };

  const rows = [
    { label: "Guest", value: `${data.firstName} ${data.lastName}` },
    { label: "Phone", value: data.phone },
    { label: "Location", value: `Carbone ${data.location}` },
    { label: "Date", value: formatDate(data.date) },
    { label: "Party", value: `${data.partySize} guest${data.partySize !== 1 ? "s" : ""}` },
    { label: "Time", value: formatTime(data.timeSlot) },
    ...(data.specialNote ? [{ label: "Notes", value: data.specialNote }] : []),
  ];

  return (
    <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
      {submitted ? (
        <>
          {/* Success state */}
          <div
            className="confirm-icon"
            style={{ fontSize: "2.5rem", marginBottom: "1.5rem", color: "var(--gold)" }}
          >
            ✦
          </div>
          <h2
            className="stagger-in"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              color: "var(--cream)",
              lineHeight: 1.2,
              marginBottom: "0.5rem",
              animationDelay: "0.2s",
            }}
          >
            We&apos;ve Received Your Request
          </h2>
          <p
            className="stagger-in"
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "1.1rem",
              fontStyle: "italic",
              color: "var(--cream-muted)",
              marginBottom: "2.5rem",
              animationDelay: "0.3s",
            }}
          >
            A member of our concierge team will contact you within 24 hours.
          </p>

          {/* Summary */}
          <div
            style={{
              border: "1px solid var(--border-active)",
              padding: "1.75rem",
            }}
          >
            {rows.map((row, i) => (
              <div
                key={row.label}
                className="stagger-in"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  paddingBottom: i < rows.length - 1 ? "0.85rem" : 0,
                  marginBottom: i < rows.length - 1 ? "0.85rem" : 0,
                  borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                  animationDelay: `${0.35 + i * 0.08}s`,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.18em",
                    color: "var(--cream-muted)",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "1rem",
                    color: "var(--cream)",
                    textAlign: "right",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Pre-submit review */}
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.25em",
              color: "var(--gold)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
            }}
          >
            Review & Submit
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              color: "var(--cream)",
              lineHeight: 1.2,
              marginBottom: "2rem",
            }}
          >
            Confirm your request
          </h2>

          <div
            style={{
              border: "1px solid var(--border)",
              padding: "1.75rem",
              marginBottom: "2rem",
            }}
          >
            {rows.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  paddingBottom: i < rows.length - 1 ? "0.85rem" : 0,
                  marginBottom: i < rows.length - 1 ? "0.85rem" : 0,
                  borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.18em",
                    color: "var(--cream-muted)",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "1rem",
                    color: "var(--cream)",
                    textAlign: "right",
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary"
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </>
      )}
    </div>
  );
}
