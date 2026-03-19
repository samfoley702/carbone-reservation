"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReservationData } from "@/types/reservation";
import StepName from "./steps/StepName";
import StepPhone from "./steps/StepPhone";
import StepLocation from "./steps/StepLocation";
import StepDate from "./steps/StepDate";
import StepPartySize from "./steps/StepPartySize";
import StepTime from "./steps/StepTime";
import StepConfirmation from "./steps/StepConfirmation";

const TOTAL_STEPS = 6;

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

interface FormEngineProps {
  onClose: () => void;
}

export default function FormEngine({ onClose }: FormEngineProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [data, setData] = useState<ReservationData>(INITIAL_DATA);
  const [shaking, setShaking] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const update = (updates: Partial<ReservationData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const validate = useCallback((): boolean => {
    switch (step) {
      case 1: return !!(data.firstName.trim() && data.lastName.trim());
      case 2: return /^[\+]?[\d\s\-\(\)]{10,}$/.test(data.phone.replace(/\s/g, ""));
      case 3: return !!data.location;
      case 4: return !!data.date;
      case 5: return data.partySize >= 1;
      case 6: return !!data.preferredTime;
      default: return true;
    }
  }, [step, data]);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const goTo = useCallback((target: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setDirection(target > step ? "forward" : "backward");

    // Exit current step
    const current = stepRefs.current[step - 1];
    if (current) {
      current.classList.remove("form-step--active");
      current.classList.add(target > step ? "form-step--exit-left" : "form-step--exit-right");
    }

    setTimeout(() => {
      if (current) {
        current.classList.remove("form-step--exit-left", "form-step--exit-right");
      }
      setStep(target);
      setTransitioning(false);
    }, 300);
  }, [step, transitioning]);

  // Activate new step after it renders
  useEffect(() => {
    const el = stepRefs.current[step - 1];
    if (!el) return;
    const enterClass = direction === "forward" ? "form-step--enter-right" : "form-step--enter-left";
    el.classList.add(enterClass);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove(enterClass);
        el.classList.add("form-step--active");
      });
    });
  }, [step, direction]);

  const handleNext = useCallback(() => {
    if (step === 7) return; // confirmation screen
    if (!validate()) {
      triggerShake();
      return;
    }
    if (step < TOTAL_STEPS) {
      goTo(step + 1);
    } else {
      // Go to confirmation (step 7)
      goTo(7);
    }
  }, [step, validate, goTo]);

  const handleBack = () => {
    if (step > 1) goTo(step - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        handleNext();
        return;
      }
      if (step === 5) {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") update({ partySize: Math.max(1, data.partySize - 1) });
        if (e.key === "ArrowRight" || e.key === "ArrowUp") update({ partySize: Math.min(20, data.partySize + 1) });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, data.partySize, handleNext, onClose]);

  // Location auto-advance
  useEffect(() => {
    if (step === 3 && data.location) {
      const timer = setTimeout(() => handleNext(), 400);
      return () => clearTimeout(timer);
    }
  }, [data.location, step, handleNext]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        date: data.date ? data.date.toISOString().split("T")[0] : null,
      };
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = step <= TOTAL_STEPS ? (step / TOTAL_STEPS) * 100 : 100;

  const stepComponents = [
    <StepName key={1} data={data} onChange={update} shaking={shaking} />,
    <StepPhone key={2} data={data} onChange={update} shaking={shaking} />,
    <StepLocation key={3} data={data} onChange={update} shaking={shaking} />,
    <StepDate key={4} data={data} onChange={update} shaking={shaking} />,
    <StepPartySize key={5} data={data} onChange={update} />,
    <StepTime key={6} data={data} onChange={update} shaking={shaking} />,
    <StepConfirmation key={7} data={data} onSubmit={handleSubmit} submitting={submitting} submitted={submitted} />,
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Progress bar */}
      <div style={{ height: "2px", background: "var(--border)", flexShrink: 0 }}>
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2.5rem",
          flexShrink: 0,
        }}
      >
        <a
          style={{
            fontFamily: "var(--font-oswald), sans-serif",
            fontSize: "0.9rem",
            letterSpacing: "0.25em",
            color: "var(--cream)",
            textDecoration: "none",
          }}
        >
          CARBONE
        </a>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--cream-muted)",
            cursor: "pointer",
            fontSize: "1.25rem",
            padding: "0.25rem",
            lineHeight: 1,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cream)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cream-muted)")}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Steps container */}
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {stepComponents.map((component, i) => (
          <div
            key={i}
            ref={(el) => { stepRefs.current[i] = el; }}
            className={`form-step${i === 0 ? " form-step--active" : ""}`}
          >
            {component}
          </div>
        ))}
      </div>

      {/* Footer nav */}
      {!submitted && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 2.5rem",
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            onClick={handleBack}
            disabled={step <= 1}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: step <= 1 ? "transparent" : "var(--cream-muted)",
              cursor: step <= 1 ? "default" : "pointer",
              textTransform: "uppercase",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => { if (step > 1) e.currentTarget.style.color = "var(--cream)"; }}
            onMouseLeave={(e) => { if (step > 1) e.currentTarget.style.color = "var(--cream-muted)"; }}
          >
            ← Back
          </button>

          {step <= TOTAL_STEPS && (
            <button onClick={handleNext} className="btn-primary" style={{ fontSize: "0.7rem" }}>
              {step === TOTAL_STEPS ? "Review →" : "Continue →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
