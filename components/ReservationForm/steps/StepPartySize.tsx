"use client";

import { ReservationData } from "@/types/reservation";

interface Props {
  data: ReservationData;
  onChange: (updates: Partial<ReservationData>) => void;
}

export default function StepPartySize({ data, onChange }: Props) {
  const adjust = (delta: number) => {
    const next = Math.max(1, Math.min(20, data.partySize + delta));
    onChange({ partySize: next });
  };

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
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
        Step 5 of 6
      </p>
      <h2
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 400,
          color: "var(--cream)",
          lineHeight: 1.15,
          marginBottom: "0.5rem",
        }}
      >
        How many guests?
      </h2>
      <p
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "1.1rem",
          fontStyle: "italic",
          color: "var(--cream-muted)",
          marginBottom: "3rem",
        }}
      >
        Including yourself.
      </p>

      {/* Stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <button
          onClick={() => adjust(-1)}
          disabled={data.partySize <= 1}
          style={{
            width: "3rem",
            height: "3rem",
            border: "1px solid var(--border-active)",
            background: "transparent",
            color: data.partySize <= 1 ? "var(--cream-muted)" : "var(--cream)",
            fontSize: "1.5rem",
            cursor: data.partySize <= 1 ? "not-allowed" : "pointer",
            borderRadius: "2px",
            opacity: data.partySize <= 1 ? 0.35 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          −
        </button>

        <span
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "5rem",
            fontWeight: 300,
            color: "var(--cream)",
            lineHeight: 1,
            minWidth: "3rem",
            textAlign: "center",
          }}
        >
          {data.partySize}
        </span>

        <button
          onClick={() => adjust(1)}
          disabled={data.partySize >= 20}
          style={{
            width: "3rem",
            height: "3rem",
            border: "1px solid var(--border-active)",
            background: "transparent",
            color: data.partySize >= 20 ? "var(--cream-muted)" : "var(--cream)",
            fontSize: "1.5rem",
            cursor: data.partySize >= 20 ? "not-allowed" : "pointer",
            borderRadius: "2px",
            opacity: data.partySize >= 20 ? 0.35 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          +
        </button>
      </div>

      {data.partySize >= 20 && (
        <p
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "0.95rem",
            fontStyle: "italic",
            color: "var(--gold)",
            marginTop: "1.25rem",
          }}
        >
          For larger parties, please contact us directly at reservations@carbonenewyork.com
        </p>
      )}

      <p
        style={{
          fontFamily: "var(--font-oswald), sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.15em",
          color: "var(--cream-muted)",
          marginTop: "2.5rem",
          textTransform: "uppercase",
        }}
      >
        Use ← → arrow keys to adjust
      </p>
    </div>
  );
}
