"use client";

import { useEffect, useRef, useState } from "react";
import ChatEngine from "./ChatEngine";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Reveal FAB after user scrolls past the hero (100px threshold)
  useEffect(() => {
    const onScroll = () => {
      setFabVisible(window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // Also show immediately if already scrolled (e.g. page refresh)
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Return focus to FAB
    requestAnimationFrame(() => fabRef.current?.focus());
  };

  return (
    <>
      {/* Floating action button */}
      <button
        ref={fabRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close chat" : "Open reservation chat"}
        aria-expanded={isOpen}
        aria-controls="chat-popup"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.25rem",
          zIndex: 160,
          fontFamily: "var(--font-oswald), sans-serif",
          fontSize: "0.7rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          background: "var(--gold)",
          color: "#0A1A29",
          border: "none",
          borderRadius: "2px",
          padding: "0.75rem 1.5rem",
          cursor: "pointer",
          whiteSpace: "nowrap",
          opacity: fabVisible ? 1 : 0,
          transform: fabVisible ? "translateY(0)" : "translateY(8px)",
          pointerEvents: fabVisible ? "auto" : "none",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {isOpen ? "✕ Close" : "Concierge"}
      </button>

      {/* Chat popup panel */}
      <div
        id="chat-popup"
        role="dialog"
        aria-label="Carbone reservation request"
        aria-modal="false"
        style={{
          position: "fixed",
          bottom: "5rem",
          right: "1rem",
          left: "1rem",
          zIndex: 150,
          width: "auto",
          maxHeight: "80dvh",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          // Scale-from-corner open animation
          transformOrigin: "bottom right",
          transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "scale(1)" : "scale(0.95)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        // Desktop: fixed width anchored to bottom-right
        className="chat-popup-panel"
      >
        {/* Header */}
        <div
          style={{
            borderTop: "1px solid var(--gold)",
            padding: "0.875rem 1.25rem 0.75rem",
            flexShrink: 0,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.3em",
              color: "var(--cream-muted)",
              textTransform: "uppercase",
              marginBottom: "0.2rem",
            }}
          >
            Carbone
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1.15rem",
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--cream)",
              }}
            >
              Concierge
            </p>
            <button
              onClick={handleClose}
              aria-label="Close chat"
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.2em",
                color: "var(--cream-muted)",
                cursor: "pointer",
                textTransform: "uppercase",
                padding: "0.25rem",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cream-muted)")}
            >
              ESC
            </button>
          </div>
          <div
            style={{
              marginTop: "0.6rem",
              borderTop: "1px solid rgba(201, 168, 76, 0.35)",
            }}
          />
        </div>

        {/* Chat engine — conditionally mounted so state resets on close */}
        {isOpen && <ChatEngine onClose={handleClose} />}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .chat-popup-panel {
            left: auto !important;
            right: 1.5rem !important;
            width: 23rem !important;
          }
        }
      `}</style>
    </>
  );
}
