"use client";

import { useState } from "react";

interface CalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function Calendar({ selected, onSelect }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(
    selected ? selected.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? selected.getMonth() : today.getMonth()
  );

  const navigate = (dir: -1 | 1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day
    );
  };

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < today;
  };

  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  return (
    <div style={{ userSelect: "none", width: "100%", maxWidth: "320px" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cream-muted)", fontSize: "1.1rem", padding: "0.25rem 0.5rem" }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <p
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "1.15rem",
            fontWeight: 500,
            color: "var(--cream)",
            letterSpacing: "0.05em",
          }}
        >
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          onClick={() => navigate(1)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cream-muted)", fontSize: "1.1rem", padding: "0.25rem 0.5rem" }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "0.5rem" }}>
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.1em",
              color: "var(--cream-muted)",
              textAlign: "center",
              textTransform: "uppercase",
              padding: "0.25rem 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const past = isPast(day);
          const sel = isSelected(day);
          const tod = isToday(day);

          let classes = "cal-day";
          if (sel) classes += " cal-day--selected";
          else if (past) classes += " cal-day--disabled";
          else if (tod) classes += " cal-day--today";

          return (
            <button
              key={day}
              onClick={() => !past && onSelect(new Date(viewYear, viewMonth, day))}
              className={classes}
              disabled={past}
              style={{ border: "none", cursor: past ? "not-allowed" : "pointer", background: "none" }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Selected date display */}
      {selected && (
        <p
          style={{
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "1rem",
            fontStyle: "italic",
            color: "var(--gold)",
            marginTop: "1rem",
            textAlign: "center",
          }}
        >
          {selected.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
