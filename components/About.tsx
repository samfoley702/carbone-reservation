export default function About() {
  return (
    <section
      id="about"
      style={{ backgroundColor: "var(--bg-elevated)", padding: "8rem 0" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2.5rem" }}>
        {/* Section header */}
        <div className="text-center mb-16">
          <p
            className="font-display mb-4"
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.35em",
              color: "var(--gold)",
            }}
          >
            THE ORIGINAL
          </p>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 400,
              color: "var(--cream)",
              lineHeight: 1.1,
            }}
          >
            New York City
          </h2>
          <div style={{ width: "3rem", height: "1px", background: "var(--gold)", margin: "1.5rem auto 0" }} />
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1.2rem",
                fontWeight: 300,
                lineHeight: 1.8,
                color: "var(--cream-muted)",
                marginBottom: "2rem",
              }}
            >
              Carbone is one of the most celebrated Italian restaurants in America
              and a quintessential New York City dining experience. Located on
              historic Thompson Street, the original location features charismatic
              service, captains sporting tuxedos by Zac Posen, artworks by the
              likes of Julian Schnabel, and a menu filled with signatures inspired
              by the culinary history of Little Italy.
            </p>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1.2rem",
                fontWeight: 300,
                lineHeight: 1.8,
                color: "var(--cream-muted)",
              }}
            >
              In 2013, Chefs Mario Carbone and Rich Torrisi and fellow Major Food
              Group co-founder Jeff Zalaznick set out to create an Italian-American
              restaurant for the modern era: glamorous, fun, and dedicated to the
              highest standards of cuisine and hospitality.
            </p>
          </div>

          {/* Right column — pull quote + design desc */}
          <div>
            <blockquote
              style={{
                borderLeft: "1px solid var(--gold)",
                paddingLeft: "1.75rem",
                marginBottom: "2.5rem",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontSize: "1.4rem",
                  fontStyle: "italic",
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: "var(--cream)",
                  marginBottom: "0.75rem",
                }}
              >
                &ldquo;It is a fancy red-sauce joint as directed by Quentin
                Tarantino, bringing back the punch-in-the-guts thrills of a genre
                that everybody else sees as uncultured and a little embarrassing,
                while exposing the sophistication that was always lurking there.&rdquo;
              </p>
              <cite
                style={{
                  fontFamily: "var(--font-oswald), sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.2em",
                  color: "var(--gold)",
                  fontStyle: "normal",
                }}
              >
                THE NEW YORK TIMES
              </cite>
            </blockquote>

            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1.1rem",
                fontWeight: 300,
                lineHeight: 1.8,
                color: "var(--cream-muted)",
              }}
            >
              The design blends old-world glamour with contemporary sophistication.
              Rich palette of burgundy leather banquettes, gold accents, polished
              wood, and marble fosters an intimate atmosphere enhanced by soft art
              deco lighting.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
