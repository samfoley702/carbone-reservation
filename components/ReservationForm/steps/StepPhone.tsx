"use client";

import { useEffect, useRef } from "react";
import { ReservationData } from "@/types/reservation";

interface Props {
  data: ReservationData;
  onChange: (updates: Partial<ReservationData>) => void;
  shaking: boolean;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return raw;
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}

export default function StepPhone({ data, onChange, shaking }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow international format (starts with +) or format US
    if (raw.startsWith("+")) {
      onChange({ phone: raw });
    } else {
      onChange({ phone: formatPhone(raw) });
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
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
        Step 2 of 6
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
        And your phone number?
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
        Our concierge team will reach you here to confirm.
      </p>

      <div className={shaking ? "shake" : ""}>
        <input
          ref={inputRef}
          type="tel"
          className="form-input"
          placeholder="(212) 555-0100"
          value={data.phone}
          onChange={handleChange}
        />
        <p
          style={{
            fontFamily: "var(--font-oswald), sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.12em",
            color: "var(--gold)",
            marginTop: "0.5rem",
            textTransform: "uppercase",
          }}
        >
          Include country code if outside the US (e.g. +44)
        </p>
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
