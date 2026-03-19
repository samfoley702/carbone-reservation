"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ReservationData } from "@/types/reservation";
import ChatEngine from "./ChatEngine";
import TalkOrTypeScreen from "./TalkOrTypeScreen";

// VoiceOrbModal loaded lazily — keeps ElevenLabs SDK out of the initial bundle
// and avoids SSR errors from WebRTC/AudioContext APIs
const VoiceOrbModal = dynamic(() => import("./VoiceOrbModal"), {
  ssr: false,
});

type ChatMode = null | "type" | "talk";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>(null);
  const [partialData, setPartialData] = useState<Partial<ReservationData>>({});
  const [fabVisible, setFabVisible] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Reveal FAB after user scrolls past the hero
  useEffect(() => {
    const onScroll = () => {
      setFabVisible(window.scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Allow other components to open the chat via a custom event
  useEffect(() => {
    const openFromEvent = () => setIsOpen(true);
    window.addEventListener("open-concierge", openFromEvent);
    return () => window.removeEventListener("open-concierge", openFromEvent);
  }, []);

  const handleOpen = () => setIsOpen(true);

  const handleClose = () => {
    setIsOpen(false);
    setMode(null);
    setPartialData({});
    requestAnimationFrame(() => fabRef.current?.focus());
  };

  const handleSwitchToType = (data: Partial<ReservationData>) => {
    setPartialData(data);
    setMode("type");
  };

  const voiceModalOpen = isOpen && mode === "talk";

  return (
    <>
      {/* Floating action button — hidden when voice modal is open */}
      <button
        ref={fabRef}
        onClick={() => (isOpen ? handleClose() : handleOpen())}
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
          opacity: fabVisible && !voiceModalOpen ? 1 : 0,
          transform: fabVisible && !voiceModalOpen ? "translateY(0)" : "translateY(8px)",
          pointerEvents: fabVisible && !voiceModalOpen ? "auto" : "none",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {isOpen ? "✕ Close" : "Concierge"}
      </button>

      {/* Chat popup panel — hidden when voice modal is open */}
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
          display: voiceModalOpen ? "none" : "flex",
          flexDirection: "column",
          overflow: "hidden",
          transformOrigin: "bottom right",
          transition: "opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: isOpen && !voiceModalOpen ? 1 : 0,
          transform: isOpen && !voiceModalOpen ? "scale(1)" : "scale(0.95)",
          pointerEvents: isOpen && !voiceModalOpen ? "auto" : "none",
        }}
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

        {/* Content — conditionally mounted so state resets on close */}
        {isOpen && mode === null && (
          <TalkOrTypeScreen
            onSelectType={() => setMode("type")}
            onSelectTalk={() => setMode("talk")}
          />
        )}
        {isOpen && mode === "type" && (
          <ChatEngine onClose={handleClose} initialData={partialData} />
        )}
      </div>

      {/* Voice orb modal — full-screen overlay, rendered outside chat panel */}
      {voiceModalOpen && (
        <VoiceOrbModal
          onClose={handleClose}
          onSwitchToType={handleSwitchToType}
        />
      )}

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
