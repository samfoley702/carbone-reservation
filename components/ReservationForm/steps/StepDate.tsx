"use client";

import { ReservationData } from "@/types/reservation";
import Calendar from "../Calendar";

interface Props {
  data: ReservationData;
  onChange: (updates: Partial<ReservationData>) => void;
  shaking: boolean;
}

export default function StepDate({ data, onChange, shaking }: Props) {
  return (
    <div style={{ width: "100%" }}>
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
        Step 4 of 6
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
        When would you like to dine?
      </h2>
      <p
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "1.1rem",
          fontStyle: "italic",
          color: "var(--cream-muted)",
          marginBottom: "2rem",
        }}
      >
        We&apos;ll do our best to accommodate your preferred date.
      </p>

      <div className={shaking ? "shake" : ""}>
        <Calendar
          selected={data.date}
          onSelect={(date) => onChange({ date })}
        />
      </div>
    </div>
  );
}
