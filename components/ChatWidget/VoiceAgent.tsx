"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { z } from "zod";
import { ReservationData, LOCATIONS } from "@/types/reservation";
import { coercePartialData } from "@/lib/coercePartialData";

// ── Types ─────────────────────────────────────────────────────────────────────

type VoiceState =
  | { status: "idle" }
  | { status: "requesting-mic" }
  | { status: "fetching-session" }
  | { status: "connecting" }
  | { status: "connected" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "mic-denied" }
  | { status: "error"; message: string };

type TranscriptMsg = {
  id: string;
  role: "user" | "agent";
  text: string;
};

// ── Zod schema for submitReservation params ───────────────────────────────────

// Derive valid cities from the canonical LOCATIONS constant so schema stays in sync
const VALID_CITIES = LOCATIONS.map((l) => l.city) as [string, ...string[]];

const SubmitReservationSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().regex(/^[\+]?[\d\s\-\(\)]{10,}$/).max(30),
  location: z.enum(VALID_CITIES),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  timeSlot: z.enum(["early", "prime", "late"]),
  specialNote: z.string().max(1000).optional(),
});

// ── Static constants ──────────────────────────────────────────────────────────

const loadingLabel: Record<string, string> = {
  "requesting-mic": "Requesting microphone…",
  "fetching-session": "Connecting to concierge…",
  connecting: "Connecting to concierge…",
};

// ── Speaking indicator (isolated so isSpeaking changes don't re-render transcript) ──

const SpeakingDot = memo(function SpeakingDot({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "0.45rem",
        height: "0.45rem",
        borderRadius: "50%",
        background: isSpeaking ? "var(--gold)" : "var(--border)",
        marginLeft: "0.5rem",
        verticalAlign: "middle",
        transition: "background 0.3s ease",
        animation: isSpeaking ? "voicePulse 1s ease-in-out infinite" : "none",
        flexShrink: 0,
      }}
    />
  );
});

// ── Transcript bubble (memoised) ──────────────────────────────────────────────

const TranscriptBubble = memo(function TranscriptBubble({ msg }: { msg: TranscriptMsg }) {
  const isAgent = msg.role === "agent";
  return (
    <div
      style={{
        maxWidth: "85%",
        alignSelf: isAgent ? "flex-start" : "flex-end",
        padding: "0.6rem 0.875rem",
        borderRadius: "4px",
        fontFamily: "var(--font-cormorant), Georgia, serif",
        fontSize: "1rem",
        color: "var(--cream)",
        lineHeight: 1.45,
        background: isAgent ? "transparent" : "rgba(255,249,240,0.06)",
        animation: "bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
      className={isAgent ? "chat-bubble--bot" : "chat-bubble--user"}
    >
      {msg.text}
    </div>
  );
});

// ── Status bubble (agent-side messages for non-transcript states) ─────────────

const StatusBubble = memo(function StatusBubble({
  children,
  maxWidth = "85%",
}: {
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="chat-bubble--bot"
      style={{
        maxWidth,
        alignSelf: "flex-start",
        padding: "0.6rem 0.875rem",
        borderRadius: "4px",
        fontFamily: "var(--font-cormorant), Georgia, serif",
        fontSize: "1rem",
        color: "var(--cream)",
        lineHeight: 1.45,
        animation: "bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {children}
    </div>
  );
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface VoiceAgentProps {
  onClose: () => void;
  onSwitchToType: (data: Partial<ReservationData>) => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function VoiceAgent({ onClose, onSwitchToType }: VoiceAgentProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({ status: "idle" });
  const [messages, setMessages] = useState<TranscriptMsg[]>([]);

  // Refs for cleanup and guards
  const isMountedRef = useRef(true);
  const sessionEndedRef = useRef(false);
  const isInitiatingRef = useRef(false);
  const submissionAbortRef = useRef<AbortController | null>(null);
  const sessionFetchAbortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Accumulated partial data from voice session (for Talk→Type carry-over)
  const partialDataRef = useRef<Partial<ReservationData>>({});

  // ── Stable ref for safeEndSession (breaks forward-reference in clientTools) ──

  // safeEndSession depends on `conversation`, which isn't available until after
  // useConversation runs. We use a ref so clientTools can always call the latest
  // version without capturing a stale closure or creating a circular dependency.
  const safeEndSessionRef = useRef<() => Promise<void>>(async () => {});

  // ── Stable callbacks for useConversation ─────────────────────────────────
  // Defined before useConversation so the hook receives referentially stable
  // config across renders, preventing mid-session hook re-initialization.

  const onConnectCb = useCallback(() => {
    if (!isMountedRef.current) return;
    setVoiceState({ status: "connected" });
  }, []);

  const onDisconnectCb = useCallback((details: { reason: string }) => {
    // NEVER call endSession() here — causes WebSocket double-close error
    if (!isMountedRef.current) return;
    if (details.reason === "error") {
      setVoiceState({
        status: "error",
        message: "Connection lost. Try again or switch to typing.",
      });
    }
    // reason === "user" → we called endSession, no UI change needed
    // reason === "agent" → agent ended cleanly (after submitReservation)
  }, []);

  const onErrorCb = useCallback((message: string) => {
    if (!isMountedRef.current) return;
    setVoiceState({ status: "error", message: message || "Connection error. Please try again." });
  }, []);

  const onMessageCb = useCallback(({ message, role }: { message: string; role: string }) => {
    if (!isMountedRef.current) return;
    // Functional updater avoids stale closure; use prev.length for stable unique IDs
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${prev.length}`,
        role: role as "user" | "agent",
        text: message,
      },
    ]);
  }, []);

  const submitReservationTool = useCallback(async (params: unknown): Promise<string> => {
    // Validate agent-supplied params before trusting them
    const parsed = SubmitReservationSchema.safeParse(params);
    if (!parsed.success) {
      return "Validation failed. Please ask the guest to provide the details again.";
    }

    if (!isMountedRef.current) return "Component unmounted.";

    setVoiceState({ status: "submitting" });

    const abortController = new AbortController();
    submissionAbortRef.current = abortController;

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error("Server error");

      // Store for carry-over in case user switches to Type afterward
      partialDataRef.current = coercePartialData(parsed.data as Record<string, unknown>);

      if (!isMountedRef.current) return "Component unmounted.";
      setVoiceState({ status: "success" });
      await safeEndSessionRef.current();
      return "Reservation submitted successfully.";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "Submission cancelled.";
      if (!isMountedRef.current) return "Component unmounted.";
      setVoiceState({
        status: "error",
        message: "Something went wrong submitting. Try again or switch to typing.",
      });
      return "Submission failed. Please inform the guest and try again.";
    }
  }, []);

  const clientTools = useMemo(
    () => ({ submitReservation: submitReservationTool }),
    [submitReservationTool]
  );

  // ── ElevenLabs conversation hook ──────────────────────────────────────────

  const conversation = useConversation({
    preferHeadphonesForIosDevices: true,
    connectionDelay: { android: 3000, ios: 0, default: 0 },
    onConnect: onConnectCb,
    onDisconnect: onDisconnectCb,
    onError: onErrorCb,
    onMessage: onMessageCb,
    clientTools,
  });

  // ── Safe endSession guard (prevents double-close) ─────────────────────────

  const safeEndSession = useCallback(async () => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    try {
      await conversation.endSession();
    } catch {
      // Ignore errors from already-closed sessions
    }
  }, [conversation]);

  // Keep ref in sync so clientTools always calls the latest version
  useEffect(() => {
    safeEndSessionRef.current = safeEndSession;
  }, [safeEndSession]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
  }, [messages, voiceState]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      submissionAbortRef.current?.abort();
      sessionFetchAbortRef.current?.abort();
      safeEndSessionRef.current();
    };
  }, []); // Empty deps — all cleanup uses refs, not closures

  // ── Start talk session (serialized: mic → URL → connect) ─────────────────

  const handleStartTalk = useCallback(async () => {
    // Guard against double-tap
    if (isInitiatingRef.current) return;
    isInitiatingRef.current = true;

    // Step 1: Request mic FIRST (iOS Safari requires direct user gesture)
    // Release immediately after — ElevenLabs acquires the mic itself in startSession.
    // Holding the stream open conflicts with ElevenLabs' own getUserMedia call.
    setVoiceState({ status: "requesting-mic" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      if (!isMountedRef.current) return;
      const name = (err as Error).name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setVoiceState({ status: "mic-denied" });
      } else {
        setVoiceState({ status: "error", message: "No microphone found on this device." });
      }
      isInitiatingRef.current = false;
      return;
    }

    // Step 2: Fetch signed URL AFTER mic is confirmed
    setVoiceState({ status: "fetching-session" });
    const fetchAbort = new AbortController();
    sessionFetchAbortRef.current = fetchAbort;

    let signedUrl: string;
    try {
      const res = await fetch("/api/voice-session", { signal: fetchAbort.signal });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      signedUrl = data.signedUrl;
    } catch (err) {
      if (!isMountedRef.current) return;
      if ((err as Error).name === "AbortError") return;
      setVoiceState({ status: "error", message: "Unable to connect to voice agent. Try again or switch to typing." });
      isInitiatingRef.current = false;
      return;
    }

    // Step 3: Start ElevenLabs session
    setVoiceState({ status: "connecting" });
    try {
      await conversation.startSession({
        signedUrl,
      });
    } catch {
      if (!isMountedRef.current) return;
      setVoiceState({ status: "error", message: "Could not connect to voice agent. Try again or switch to typing." });
    }
    isInitiatingRef.current = false;
  }, [conversation]);

  // ── Retry (cleans up previous attempt first) ──────────────────────────────

  const handleRetry = useCallback(async () => {
    sessionFetchAbortRef.current?.abort();
    sessionEndedRef.current = false;
    isInitiatingRef.current = false;
    setVoiceState({ status: "idle" });
    await handleStartTalk();
  }, [handleStartTalk]);

  // ── Switch to Type (carry over any collected data) ────────────────────────

  const handleSwitchToType = useCallback(() => {
    safeEndSession();
    onSwitchToType(partialDataRef.current);
  }, [safeEndSession, onSwitchToType]);

  // ── ESC key ───────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      safeEndSession();
      onClose();
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const isConnected = voiceState.status === "connected" || voiceState.status === "submitting";
  const isLoading =
    voiceState.status === "requesting-mic" ||
    voiceState.status === "fetching-session" ||
    voiceState.status === "connecting";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", outline: "none" }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Transcript area */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Voice reservation conversation"
        style={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
          background: "var(--bg-elevated)",
        }}
      >
        {/* Loading state */}
        {isLoading && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "0.6rem 0.875rem",
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.18em",
              color: "var(--cream-muted)",
              textTransform: "uppercase",
            }}
          >
            {loadingLabel[voiceState.status]}
          </div>
        )}

        {/* Idle state — prompt to start */}
        {voiceState.status === "idle" && (
          <StatusBubble>Tap the button below to speak with our voice concierge.</StatusBubble>
        )}

        {/* Mic denied */}
        {voiceState.status === "mic-denied" && (
          <StatusBubble maxWidth="90%">
            Microphone access was denied.{" "}
            <button
              onClick={handleSwitchToType}
              style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline", padding: 0 }}
            >
              Switch to typing →
            </button>
          </StatusBubble>
        )}

        {/* Error */}
        {voiceState.status === "error" && (
          <StatusBubble maxWidth="90%">{voiceState.message}</StatusBubble>
        )}

        {/* Transcript bubbles */}
        {messages.map((msg) => (
          <TranscriptBubble key={msg.id} msg={msg} />
        ))}

        {/* Success bubble */}
        {voiceState.status === "success" && (
          <StatusBubble>
            <span style={{ color: "var(--gold)", marginRight: "0.5rem" }}>✦</span>
            <span>We&apos;ve received your request. Our concierge will be in touch within 24 hours.</span>
          </StatusBubble>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      {voiceState.status !== "success" && (
        <div style={{ padding: "1rem", background: "var(--bg)", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>

          {/* Speaking indicator row (only when connected) */}
          {isConnected && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <SpeakingDot isSpeaking={conversation.isSpeaking} />
              <span style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.15em",
                color: "var(--cream-muted)",
                textTransform: "uppercase",
              }}>
                {conversation.isSpeaking ? "Concierge speaking" : "Listening"}
              </span>
            </div>
          )}

          {/* Primary action button */}
          {voiceState.status === "idle" && (
            <button
              onClick={handleStartTalk}
              className="btn-primary"
              style={{ width: "100%", fontSize: "0.65rem" }}
            >
              🎙 Start Speaking
            </button>
          )}

          {isLoading && (
            <button
              disabled
              className="btn-primary"
              style={{ width: "100%", fontSize: "0.65rem", opacity: 0.5, cursor: "not-allowed" }}
            >
              Connecting…
            </button>
          )}

          {isConnected && (
            <button
              onClick={safeEndSession}
              style={{
                width: "100%",
                fontSize: "0.65rem",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--cream-muted)",
                fontFamily: "var(--font-oswald), sans-serif",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.75rem",
                cursor: "pointer",
                borderRadius: "2px",
              }}
            >
              End Conversation
            </button>
          )}

          {voiceState.status === "error" && (
            <button
              onClick={handleRetry}
              className="btn-primary"
              style={{ width: "100%", fontSize: "0.65rem" }}
            >
              Try Again
            </button>
          )}

          {/* Switch to typing — always visible (except success) */}
          <button
            type="button"
            onClick={handleSwitchToType}
            style={{
              background: "none",
              border: "none",
              color: "var(--cream-muted)",
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.5rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "0.25rem",
              textDecoration: "underline",
              alignSelf: "center",
            }}
          >
            {voiceState.status === "idle" ? "Type instead →" : "Switch to typing instead"}
          </button>
        </div>
      )}
    </div>
  );
}
