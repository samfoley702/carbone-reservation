"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ReservationData } from "@/types/reservation";
import type { VoiceAgentHandle } from "./VoiceAgent";

const VoiceAgent = dynamic(() => import("./VoiceAgent"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: "absolute",
        bottom: "2rem",
        fontFamily: "var(--font-oswald), sans-serif",
        fontSize: "0.55rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--cream-muted)",
      }}
    >
      Connecting…
    </div>
  ),
});

interface VoiceOrbModalProps {
  onClose: () => void;
  onSwitchToType: (data: Partial<ReservationData>) => void;
}

export default function VoiceOrbModal({ onClose, onSwitchToType }: VoiceOrbModalProps) {
  const [active, setActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const orbRef = useRef<HTMLDivElement>(null);
  const voiceHandleRef = useRef<VoiceAgentHandle | null>(null);
  const rafRef = useRef<number>(0);

  // Fade in on mount
  useEffect(() => {
    requestAnimationFrame(() => setActive(true));
  }, []);

  // Volume-driven animation loop
  useEffect(() => {
    if (!isConnected) return;

    const loop = () => {
      const orb = orbRef.current;
      const handle = voiceHandleRef.current;
      if (orb && handle) {
        const vol = isSpeaking ? handle.getOutputVolume() : handle.getInputVolume();
        orb.style.setProperty("--vol", String(Math.min(vol, 1)));
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isConnected, isSpeaking]);

  const handleSpeakingChange = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
  }, []);

  // Track connected state from VoiceAgent's internal voiceState via speaking changes
  // When we receive any speaking change callback, the agent is connected
  const handleSpeakingChangeWrapped = useCallback((speaking: boolean) => {
    setIsConnected(true);
    handleSpeakingChange(speaking);
  }, [handleSpeakingChange]);

  const handleClose = useCallback(() => {
    setActive(false);
    setTimeout(onClose, 350); // Wait for fade-out
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  return (
    <div
      className={`voice-orb-modal ${active ? "voice-orb-modal--active" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Voice concierge"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header */}
      <div
        style={{
          width: "100%",
          padding: "1.25rem 2rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.3em",
              color: "var(--cream-muted)",
              textTransform: "uppercase",
              marginBottom: "0.15rem",
            }}
          >
            Carbone
          </p>
          <p
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "1.15rem",
              fontStyle: "italic",
              fontWeight: 400,
              color: "var(--cream)",
            }}
          >
            Voice Concierge
          </p>
        </div>
        <button
          onClick={handleClose}
          aria-label="Close voice concierge"
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--font-oswald), sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.2em",
            color: "var(--cream-muted)",
            cursor: "pointer",
            textTransform: "uppercase",
            padding: "0.5rem",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cream-muted)")}
        >
          ESC
        </button>
      </div>

      {/* Orb */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          minHeight: 0,
        }}
      >
        <div
          ref={orbRef}
          className={`voice-orb ${isConnected ? "voice-orb--active" : ""}`}
        />

        {/* Status text */}
        <p
          style={{
            fontFamily: "var(--font-oswald), sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--cream-muted)",
            height: "1rem",
          }}
        >
          {isConnected
            ? isSpeaking
              ? "Concierge speaking"
              : "Listening"
            : ""}
        </p>
      </div>

      {/* VoiceAgent — renders transcript and controls below the orb */}
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          maxHeight: "40vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignSelf: "center",
          paddingBottom: "env(safe-area-inset-bottom, 1rem)",
        }}
      >
        <VoiceAgent
          onClose={handleClose}
          onSwitchToType={onSwitchToType}
          onSpeakingChange={handleSpeakingChangeWrapped}
          handleRef={voiceHandleRef}
        />
      </div>
    </div>
  );
}
