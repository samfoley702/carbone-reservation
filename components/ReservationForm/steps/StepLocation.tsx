"use client";

import { ReservationData, LOCATIONS } from "@/types/reservation";

interface Props {
  data: ReservationData;
  onChange: (updates: Partial<ReservationData>) => void;
  shaking: boolean;
}

export default function StepLocation({ data, onChange, shaking }: Props) {
  const handleSelect = (city: string) => {
    onChange({ location: city });
  };

  return (
    <div style={{ width: "100%", maxWidth: "700px" }}>
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
        Step 3 of 6
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
        Which Carbone?
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
        Select your preferred location.
      </p>

      <div
        className={shaking ? "shake" : ""}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {LOCATIONS.map((loc) => {
          const selected = data.location === loc.city;
          return (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc.city)}
              style={{
                border: selected ? "1px solid var(--cream)" : "1px solid var(--border)",
                background: selected ? "rgba(255,249,240,0.07)" : "transparent",
                padding: "1.1rem 1.25rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.2s ease, background 0.2s ease",
                position: "relative",
              }}
            >
              {selected && (
                <span
                  style={{
                    position: "absolute",
                    top: "0.6rem",
                    right: "0.75rem",
                    color: "var(--cream)",
                    fontSize: "0.7rem",
                  }}
                >
                  ✓
                </span>
              )}
              <p
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "1.15rem",
                  fontWeight: 400,
                  color: "var(--cream)",
                  marginBottom: "0.2rem",
                }}
              >
                {loc.city}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontSize: "0.55rem",
                  letterSpacing: "0.1em",
                  color: "var(--gold)",
                  textTransform: "uppercase",
                }}
              >
                {loc.descriptor}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
