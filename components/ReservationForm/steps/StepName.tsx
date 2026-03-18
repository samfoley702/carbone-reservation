"use client";

import { useEffect, useRef } from "react";
import { ReservationData } from "@/types/reservation";

interface Props {
  data: ReservationData;
  onChange: (updates: Partial<ReservationData>) => void;
  shaking: boolean;
}

export default function StepName({ data, onChange, shaking }: Props) {
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
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
        Step 1 of 6
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
        What&apos;s your name?
      </h2>
      <p
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "1.1rem",
          fontStyle: "italic",
          color: "var(--cream-muted)",
          marginBottom: "2.5rem",
        }}
      >
        We&apos;d like to know who we&apos;re welcoming.
      </p>

      <div className={shaking ? "shake" : ""} style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
              color: "var(--cream-muted)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            First Name
          </label>
          <input
            ref={firstRef}
            type="text"
            className="form-input"
            placeholder="Mario"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
          />
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
              color: "var(--cream-muted)",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            Last Name
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Rossi"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
          />
        </div>
      </div>

      <p
        style={{
          fontFamily: "var(--font-oswald), sans-serif",
          fontSize: "0.6rem",
          letterSpacing: "0.15em",
          color: "var(--cream-muted)",
          marginTop: "2rem",
          textTransform: "uppercase",
        }}
      >
        Press Enter ↵ to continue
      </p>
    </div>
  );
}
