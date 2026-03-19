"use client";

export default function ReserveCTA() {
  const onReserveClick = () => window.dispatchEvent(new CustomEvent("open-concierge"));
  return (
    <section
      style={{
        background: "var(--cream)",
        padding: "7rem 2.5rem",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-oswald), sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.35em",
          color: "var(--gold)",
          marginBottom: "1.25rem",
          textTransform: "uppercase",
        }}
      >
        RESERVATIONS
      </p>
      <h2
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
          fontWeight: 400,
          color: "var(--bg)",
          lineHeight: 1.1,
          marginBottom: "1rem",
        }}
      >
        Your Table Awaits
      </h2>
      <p
        style={{
          fontFamily: "var(--font-cormorant), Georgia, serif",
          fontSize: "1.2rem",
          fontStyle: "italic",
          fontWeight: 300,
          color: "rgba(10,26,41,0.6)",
          marginBottom: "2.5rem",
        }}
      >
        Our concierge team handles every detail.
      </p>
      <button
        onClick={onReserveClick}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "var(--bg)",
          color: "var(--cream)",
          fontFamily: "var(--font-oswald), sans-serif",
          fontSize: "0.75rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          padding: "0.875rem 2.5rem",
          border: "1px solid var(--bg)",
          borderRadius: "2px",
          cursor: "pointer",
          transition: "background 0.25s ease, color 0.25s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--bg)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--cream)";
        }}
      >
        Contact Our Concierge
      </button>
    </section>
  );
}
