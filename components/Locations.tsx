"use client";

import { LOCATIONS } from "@/types/reservation";

interface LocationsProps {
  onReserveClick?: () => void;
}

export default function Locations({ onReserveClick }: LocationsProps) {
  return (
    <section
      id="locations"
      style={{ backgroundColor: "var(--bg)", padding: "8rem 0" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2.5rem" }}>
        {/* Header */}
        <div className="text-center mb-16">
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.35em",
              color: "var(--gold)",
              marginBottom: "1rem",
              textTransform: "uppercase",
            }}
          >
            WORLDWIDE
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 400,
              color: "var(--cream)",
            }}
          >
            Where to Find Us
          </h2>
          <div style={{ width: "3rem", height: "1px", background: "var(--gold)", margin: "1.5rem auto 0" }} />
        </div>

        {/* Locations grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1px",
            background: "var(--border)",
          }}
        >
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              onClick={onReserveClick}
              className="location-card text-left"
              style={{ width: "100%", background: "var(--bg)" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "1.6rem",
                  fontWeight: 400,
                  color: "var(--cream)",
                  marginBottom: "0.5rem",
                  lineHeight: 1.1,
                }}
              >
                {loc.city}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                  color: "var(--gold)",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                {loc.descriptor}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                  color: "var(--cream-muted)",
                  textTransform: "uppercase",
                }}
              >
                Reserve →
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
