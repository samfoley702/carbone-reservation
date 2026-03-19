"use client";

import { ReservationData, PREFERRED_TIMES } from "@/types/reservation";

interface Props {
  data: ReservationData;
  onChange: (updates: Partial<ReservationData>) => void;
  shaking: boolean;
}

export default function StepTime({ data, onChange, shaking }: Props) {
  return (
    <div style={{ width: "100%", maxWidth: "520px", margin: "0 auto" }}>
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
        Step 6 of 6
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
        Preferred dining time?
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
        We&apos;ll confirm availability with you directly.
      </p>

      {/* Time picker */}
      <div
        className={shaking ? "shake" : ""}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxHeight: "300px",
          overflowY: "auto",
          paddingRight: "0.25rem",
        }}
      >
        {PREFERRED_TIMES.map((time) => {
          const selected = data.preferredTime === time;
          return (
            <button
              key={time}
              onClick={() => onChange({ preferredTime: time })}
              className={`time-card ${selected ? "time-card--selected" : ""}`}
              style={{ width: "100%", background: "none", cursor: "pointer" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "1.2rem",
                  fontWeight: 400,
                  color: "var(--cream)",
                }}
              >
                {time}
              </span>
              {selected && (
                <span style={{ color: "var(--cream)", fontSize: "1rem" }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Optional special requests */}
      <div style={{ marginTop: "2rem" }}>
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
          Special Requests (optional)
        </label>
        <textarea
          className="form-input"
          placeholder="Anniversaries, dietary restrictions, seating preferences…"
          value={data.specialNote}
          onChange={(e) => onChange({ specialNote: e.target.value })}
          rows={2}
          style={{
            resize: "none",
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "1.1rem",
          }}
        />
      </div>
    </div>
  );
}
