"use client";

export default function Hero() {
  const onReserveClick = () => window.dispatchEvent(new CustomEvent("open-concierge"));
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}
    >
      {/* Background image with slow breath animation */}
      <div
        className="hero-bg absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://cdn.sanity.io/images/gb1p0gbj/production/783c85fd5a4b8f6c2d60f3fd0793cb6cec37c6a0-1440x695.png')",
          transformOrigin: "center center",
        }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,26,41,0.55) 0%, rgba(10,26,41,0.3) 40%, rgba(10,26,41,0.7) 80%, rgba(10,26,41,1) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6" style={{ maxWidth: "720px" }}>
        <p
          className="font-display mb-4"
          style={{
            fontFamily: "var(--font-oswald), sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.35em",
            color: "var(--gold)",
          }}
        >
          EST. 2013 · NEW YORK CITY
        </p>

        <h1
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "clamp(5rem, 14vw, 10rem)",
            fontWeight: 400,
            lineHeight: 0.9,
            color: "var(--cream)",
            letterSpacing: "-0.01em",
            marginBottom: "1.5rem",
          }}
        >
          Carbone
        </h1>

        <p
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "1.35rem",
            fontStyle: "italic",
            fontWeight: 300,
            color: "var(--cream-muted)",
            marginBottom: "2.5rem",
            letterSpacing: "0.02em",
          }}
        >
          A quintessential New York dining experience
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button onClick={onReserveClick} className="btn-primary">
            Reserve with Our Concierge
          </button>
          <a
            href="#about"
            className="btn-outline"
            style={{ textDecoration: "none" }}
          >
            Our Story
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2"
        style={{ transform: "translateX(-50%)" }}
      >
        <div
          style={{
            width: "1px",
            height: "3rem",
            background: "linear-gradient(to bottom, transparent, var(--cream-muted))",
            margin: "0 auto",
          }}
        />
      </div>
    </section>
  );
}
