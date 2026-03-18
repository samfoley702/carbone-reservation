import { LOCATIONS } from "@/types/reservation";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#060f18",
        padding: "5rem 2.5rem 3rem",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "3rem",
            marginBottom: "4rem",
          }}
        >
          {/* Brand */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "1.1rem",
                letterSpacing: "0.3em",
                color: "var(--cream)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              CARBONE
            </p>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "0.95rem",
                fontStyle: "italic",
                color: "var(--cream-muted)",
                lineHeight: 1.7,
              }}
            >
              An Italian-American institution.<br />
              Est. New York City, 2013.
            </p>
          </div>

          {/* Address & Hours */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "var(--gold)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              NEW YORK
            </p>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1rem",
                color: "var(--cream-muted)",
                lineHeight: 1.8,
              }}
            >
              181 Thompson Street<br />
              Between Bleecker &amp; Houston<br />
              New York, NY 10012
            </p>
          </div>

          {/* Hours */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "var(--gold)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              HOURS
            </p>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1rem",
                color: "var(--cream-muted)",
                lineHeight: 1.8,
              }}
            >
              <strong style={{ color: "var(--cream)", fontWeight: 500 }}>Lunch</strong><br />
              Tuesday – Sunday, 11:30am – 2:00pm<br />
              <br />
              <strong style={{ color: "var(--cream)", fontWeight: 500 }}>Dinner</strong><br />
              Monday – Sunday, 5:00pm – 11:30pm
            </p>
          </div>

          {/* Locations list */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "var(--gold)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              WORLDWIDE
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {LOCATIONS.map((loc) => (
                <p
                  key={loc.id}
                  style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "0.95rem",
                    color: "var(--cream-muted)",
                  }}
                >
                  {loc.city}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--border)", marginBottom: "2rem" }} />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              color: "var(--cream-muted)",
              textTransform: "uppercase",
            }}
          >
            © {new Date().getFullYear()} Major Food Group. All rights reserved.
          </p>
          <p
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "0.9rem",
              fontStyle: "italic",
              color: "var(--cream-muted)",
            }}
          >
            <a
              href="mailto:reservations@carbonenewyork.com"
              style={{ color: "inherit", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cream-muted)")}
            >
              reservations@carbonenewyork.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
