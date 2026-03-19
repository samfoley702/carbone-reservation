"use client";

import React, { memo, useEffect, useReducer, useRef } from "react";
import { ChatMessage, ChatStep } from "@/types/chat";
import { ReservationData, LOCATIONS, PREFERRED_TIMES } from "@/types/reservation";
import ReservationSummaryCard, { buildReviewRows } from "@/components/ReservationSummaryCard";
import { validateStep } from "@/lib/validateReservation";
import Calendar from "@/components/ReservationForm/Calendar";
import { coercePartialData } from "@/lib/coercePartialData";

// ── Constants ─────────────────────────────────────────────────────────────────

const BOT_QUESTIONS: Record<ChatStep, string> = {
  1: "Welcome to Carbone. What is your name?",
  2: "And your best phone number?",
  3: "Which Carbone location?",
  4: "What date were you thinking?",
  5: "How many guests will be joining?",
  6: "What time works best?",
  7: "Here's your request — shall we send it?",
};

const INITIAL_DATA: ReservationData = {
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
  date: null,
  partySize: 2,
  preferredTime: null,
  specialNote: "",
};

// ── State / Reducer ───────────────────────────────────────────────────────────

interface ChatState {
  step: ChatStep;
  data: ReservationData;
  messages: ChatMessage[];
  shaking: boolean;
  submitting: boolean;
  submitted: boolean;
  submitError: string | null;
}

type ChatAction =
  | { type: "STEP_COMPLETE"; userText: string; nextStep: ChatStep }
  | { type: "UPDATE_DATA"; updates: Partial<ReservationData> }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; error: string }
  | { type: "SUBMIT_RETRY" }
  | { type: "SHAKE" }
  | { type: "SHAKE_RESET" };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "STEP_COMPLETE": {
      const userMsg: ChatMessage = {
        role: "user",
        text: action.userText,
        id: `user-${state.step}`,
      };
      const botMsg: ChatMessage = {
        role: "bot",
        text: BOT_QUESTIONS[action.nextStep],
        id: `bot-${action.nextStep}`,
      };
      return {
        ...state,
        step: action.nextStep,
        messages: [...state.messages, userMsg, botMsg],
        shaking: false,
      };
    }
    case "UPDATE_DATA":
      return { ...state, data: { ...state.data, ...action.updates } };
    case "SUBMIT_START":
      return { ...state, submitting: true, submitError: null };
    case "SUBMIT_SUCCESS":
      return { ...state, submitting: false, submitted: true };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, submitError: action.error };
    case "SUBMIT_RETRY":
      return { ...state, submitError: null };
    case "SHAKE":
      return { ...state, shaking: true };
    case "SHAKE_RESET":
      return { ...state, shaking: false };
    default:
      return state;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserText(step: ChatStep, data: ReservationData): string {
  switch (step) {
    case 1:
      return `${data.firstName} ${data.lastName}`;
    case 2:
      return data.phone;
    case 3:
      return data.location;
    case 4:
      return data.date
        ? data.date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "";
    case 5:
      return `${data.partySize} guest${data.partySize !== 1 ? "s" : ""}`;
    case 6:
      return data.preferredTime ?? "";
    case 7:
      return "";
  }
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return raw;
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}

// ── Chat Bubble (memoised — renders once on append, never re-renders) ─────────

const ChatBubble = memo(function ChatBubble({ message }: { message: ChatMessage }) {
  const isBot = message.role === "bot";
  return (
    <div
      className={isBot ? "chat-bubble--bot" : "chat-bubble--user"}
      style={{
        maxWidth: "85%",
        alignSelf: isBot ? "flex-start" : "flex-end",
        padding: "0.6rem 0.875rem",
        borderRadius: "4px",
        fontFamily: "var(--font-cormorant), Georgia, serif",
        fontSize: "1rem",
        color: "var(--cream)",
        lineHeight: 1.45,
        animation: "bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        animationFillMode: "both",
      }}
    >
      {message.text}
    </div>
  );
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatEngineProps {
  onClose: () => void;
  initialData?: Partial<ReservationData>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatEngine({ onClose, initialData }: ChatEngineProps) {
  const [state, dispatch] = useReducer(chatReducer, {
    step: 1,
    data: { ...INITIAL_DATA, ...coercePartialData(initialData) },
    messages: [{ role: "bot", text: BOT_QUESTIONS[1], id: "bot-1" }],
    shaking: false,
    submitting: false,
    submitted: false,
    submitError: null,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Auto-scroll to bottom on new messages (instant — avoids conflict with bubble animation)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
  }, [state.messages, state.submitError, state.submitted]);

  // Focus first input on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        firstNameRef.current?.focus();
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Location auto-advance (400ms after selection, step 3)
  useEffect(() => {
    if (state.step === 3 && state.data.location) {
      const timer = setTimeout(() => {
        if (!mountedRef.current) return;
        const userText = state.data.location;
        dispatch({
          type: "STEP_COMPLETE",
          userText,
          nextStep: 4,
        });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [state.data.location, state.step]);

  // Date auto-advance (300ms after selection, step 4)
  useEffect(() => {
    if (state.step === 4 && state.data.date) {
      const timer = setTimeout(() => {
        if (!mountedRef.current) return;
        const userText = state.data.date!.toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        });
        dispatch({ type: "STEP_COMPLETE", userText, nextStep: 5 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.data.date, state.step]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const update = (updates: Partial<ReservationData>) =>
    dispatch({ type: "UPDATE_DATA", updates });

  const triggerShake = () => {
    dispatch({ type: "SHAKE" });
    setTimeout(() => {
      if (mountedRef.current) dispatch({ type: "SHAKE_RESET" });
    }, 500);
  };

  const handleAdvance = () => {
    if (state.step === 7) return;
    if (!validateStep(state.step, state.data)) {
      triggerShake();
      return;
    }
    const userText = getUserText(state.step, state.data);
    const nextStep = (state.step + 1) as ChatStep;
    dispatch({ type: "STEP_COMPLETE", userText, nextStep });
  };

  const handleSubmit = async () => {
    if (state.submitting) return;
    dispatch({ type: "SUBMIT_START" });
    abortControllerRef.current = new AbortController();
    try {
      const payload = {
        ...state.data,
        date: state.data.date ? state.data.date.toISOString().split("T")[0] : null,
      };
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("Submission failed");
      if (mountedRef.current) dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (mountedRef.current)
        dispatch({ type: "SUBMIT_ERROR", error: "Something went wrong. Please try again." });
    }
  };

  // Keyboard: scoped to this component div, not window
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement) && !state.submitted) {
      e.preventDefault();
      if (state.step === 7) {
        handleSubmit();
      } else {
        handleAdvance();
      }
      return;
    }
    if (state.step === 5) {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown")
        update({ partySize: Math.max(1, state.data.partySize - 1) });
      if (e.key === "ArrowRight" || e.key === "ArrowUp")
        update({ partySize: Math.min(20, state.data.partySize + 1) });
    }
  };

  // ── Review rows (step 7) — uses shared buildReviewRows + ReservationSummaryCard

  // ── Input zone renderer ────────────────────────────────────────────────────

  const renderInputZone = () => {
    const { step, data, shaking } = state;

    switch (step) {
      case 1:
        return (
          <div className={shaking ? "shake" : ""} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                ref={firstNameRef}
                autoFocus
                type="text"
                className="form-input"
                placeholder="Mario"
                value={data.firstName}
                onChange={(e) => update({ firstName: e.target.value })}
                style={{ fontSize: "1.1rem" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Rossi"
                value={data.lastName}
                onChange={(e) => update({ lastName: e.target.value })}
                style={{ fontSize: "1.1rem" }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className={shaking ? "shake" : ""}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="(212) 555-0100"
              value={data.phone}
              onChange={(e) => {
                const raw = e.target.value;
                update({ phone: raw.startsWith("+") ? raw : formatPhone(raw) });
              }}
              style={{ fontSize: "1.1rem" }}
              autoFocus
            />
            <p style={{ ...labelStyle, color: "var(--gold)", marginTop: "0.4rem", letterSpacing: "0.1em" }}>
              Include country code if outside the US (e.g. +44)
            </p>
          </div>
        );

      case 3:
        return (
          <div
            className={shaking ? "shake" : ""}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.5rem",
            }}
          >
            {LOCATIONS.map((loc) => {
              const selected = data.location === loc.city;
              return (
                <button
                  key={loc.id}
                  onClick={() => update({ location: loc.city })}
                  style={{
                    border: selected ? "1px solid var(--cream)" : "1px solid var(--border)",
                    background: selected ? "rgba(255,249,240,0.07)" : "transparent",
                    padding: "0.75rem 0.5rem",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "border-color 0.2s ease, background 0.2s ease",
                  }}
                >
                  <p style={{
                    fontFamily: "var(--font-cormorant), Georgia, serif",
                    fontSize: "0.9rem",
                    color: "var(--cream)",
                  }}>
                    {loc.city}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-oswald), sans-serif",
                    fontSize: "0.5rem",
                    letterSpacing: "0.1em",
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    marginTop: "0.2rem",
                  }}>
                    {loc.descriptor}
                  </p>
                  {selected && (
                    <span style={{ color: "var(--gold)", fontSize: "0.65rem" }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        );

      case 4:
        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Calendar
              selected={data.date}
              onSelect={(date) => update({ date })}
            />
          </div>
        );

      case 5:
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", justifyContent: "center", paddingTop: "0.5rem" }}>
            <button
              onClick={() => update({ partySize: Math.max(1, data.partySize - 1) })}
              disabled={data.partySize <= 1}
              style={{
                width: "2.5rem", height: "2.5rem",
                border: "1px solid var(--border-active)",
                background: "transparent",
                color: data.partySize <= 1 ? "var(--cream-muted)" : "var(--cream)",
                fontSize: "1.25rem",
                cursor: data.partySize <= 1 ? "not-allowed" : "pointer",
                borderRadius: "2px",
                opacity: data.partySize <= 1 ? 0.35 : 1,
              }}
            >
              −
            </button>
            <span style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "3rem",
              fontWeight: 300,
              color: "var(--cream)",
              minWidth: "2rem",
              textAlign: "center",
              lineHeight: 1,
            }}>
              {data.partySize}
            </span>
            <button
              onClick={() => update({ partySize: Math.min(20, data.partySize + 1) })}
              disabled={data.partySize >= 20}
              style={{
                width: "2.5rem", height: "2.5rem",
                border: "1px solid var(--border-active)",
                background: "transparent",
                color: data.partySize >= 20 ? "var(--cream-muted)" : "var(--cream)",
                fontSize: "1.25rem",
                cursor: data.partySize >= 20 ? "not-allowed" : "pointer",
                borderRadius: "2px",
                opacity: data.partySize >= 20 ? 0.35 : 1,
              }}
            >
              +
            </button>
          </div>
        );

      case 6:
        return (
          <div>
            <div
              className={shaking ? "shake" : ""}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxHeight: "200px",
                overflowY: "auto",
                paddingRight: "0.25rem",
              }}
            >
              {PREFERRED_TIMES.map((time) => {
                const selected = data.preferredTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => update({ preferredTime: time })}
                    className={`time-card ${selected ? "time-card--selected" : ""}`}
                    style={{ width: "100%", background: "none", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1rem", color: "var(--cream)" }}>
                      {time}
                    </span>
                    {selected && <span style={{ color: "var(--cream)", fontSize: "0.9rem" }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>Special Requests (optional)</label>
              <textarea
                className="form-input"
                placeholder="Anniversaries, dietary restrictions, seating preferences…"
                value={data.specialNote}
                onChange={(e) => update({ specialNote: e.target.value })}
                rows={2}
                style={{ resize: "none", fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1rem" }}
              />
            </div>
          </div>
        );

      case 7: {
        const rows = buildReviewRows(state.data);
        return (
          <div style={{ border: "1px solid var(--border)", padding: "1rem" }}>
            {rows.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  paddingBottom: i < rows.length - 1 ? "0.65rem" : 0,
                  marginBottom: i < rows.length - 1 ? "0.65rem" : 0,
                  borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ fontFamily: "var(--font-oswald), sans-serif", fontSize: "0.55rem", letterSpacing: "0.18em", color: "var(--cream-muted)", textTransform: "uppercase", flexShrink: 0 }}>
                  {row.label}
                </span>
                <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "0.9rem", color: "var(--cream)", textAlign: "right" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ── Shared label style ─────────────────────────────────────────────────────

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-oswald), sans-serif",
    fontSize: "0.55rem",
    letterSpacing: "0.2em",
    color: "var(--cream-muted)",
    textTransform: "uppercase",
    marginBottom: "0.35rem",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", outline: "none" }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Message thread */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Reservation conversation"
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
        {state.messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Success bubble */}
        {state.submitted && (
          <div
            className="chat-bubble--bot"
            style={{
              maxWidth: "85%",
              alignSelf: "flex-start",
              padding: "0.75rem 0.875rem",
              borderRadius: "4px",
              animation: "bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            <span style={{ color: "var(--gold)", marginRight: "0.5rem" }}>✦</span>
            <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1rem", color: "var(--cream)" }}>
              We&apos;ve received your request. Our concierge will be in touch within 24 hours.
            </span>
          </div>
        )}

        {/* Error bubble */}
        {state.submitError && (
          <div
            className="chat-bubble--bot"
            style={{
              maxWidth: "90%",
              alignSelf: "flex-start",
              padding: "0.75rem 0.875rem",
              borderRadius: "4px",
              animation: "bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            <span style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: "1rem", color: "var(--cream)" }}>
              {state.submitError}{" "}
              <button
                onClick={() => dispatch({ type: "SUBMIT_RETRY" })}
                style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}
              >
                Try again
              </button>
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input zone */}
      {!state.submitted && (
        <div style={{ padding: "1rem", background: "var(--bg)", flexShrink: 0 }}>
          {renderInputZone()}

          {/* Action buttons */}
          {state.step !== 3 && state.step !== 4 && state.step !== 7 && (
            <button
              onClick={handleAdvance}
              className="btn-primary"
              style={{ width: "100%", marginTop: "0.875rem", fontSize: "0.65rem" }}
            >
              Continue →
            </button>
          )}

          {state.step === 7 && (
            <button
              onClick={handleSubmit}
              disabled={state.submitting}
              className="btn-primary"
              style={{ width: "100%", marginTop: "0.875rem", fontSize: "0.65rem", opacity: state.submitting ? 0.6 : 1 }}
            >
              {state.submitting ? "Submitting…" : "Submit Request"}
            </button>
          )}

          {/* Screen reader step progress */}
          <div aria-live="polite" className="sr-only">
            Step {state.step} of 7
          </div>
        </div>
      )}
    </div>
  );
}
