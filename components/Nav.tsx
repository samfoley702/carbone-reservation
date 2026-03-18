"use client";

import { useEffect, useState } from "react";

interface NavProps {
  onReserveClick: () => void;
}

export default function Nav({ onReserveClick }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setScrolled(current > 80);
      setHidden(current > lastScroll && current > 300);
      setLastScroll(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <nav
      className={`nav ${scrolled ? "nav--scrolled" : ""} ${hidden ? "nav--hidden" : ""}`}
    >
      {/* Wordmark */}
      <a
        href="#"
        className="font-display text-[var(--cream)] tracking-[0.25em] text-sm no-underline"
        style={{ fontFamily: "var(--font-oswald), sans-serif", letterSpacing: "0.25em", textDecoration: "none" }}
      >
        CARBONE
      </a>

      {/* Nav links */}
      <div className="flex items-center gap-8">
        <a
          href="#about"
          className="font-display text-[var(--cream-muted)] hover:text-[var(--cream)] text-xs no-underline transition-colors duration-200"
          style={{ fontFamily: "var(--font-oswald), sans-serif", letterSpacing: "0.15em", textDecoration: "none", color: "var(--cream-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cream-muted)")}
        >
          OUR STORY
        </a>
        <a
          href="#locations"
          className="font-display text-xs no-underline transition-colors duration-200"
          style={{ fontFamily: "var(--font-oswald), sans-serif", letterSpacing: "0.15em", textDecoration: "none", color: "var(--cream-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cream-muted)")}
        >
          LOCATIONS
        </a>
        <button onClick={onReserveClick} className="btn-primary text-xs">
          RESERVE
        </button>
      </div>
    </nav>
  );
}
