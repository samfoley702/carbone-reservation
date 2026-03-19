"use client";

import { memo } from "react";
import { ReservationData, TIME_SLOTS } from "@/types/reservation";

export interface SummaryRow {
  label: string;
  value: string;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d + "T00:00:00Z") : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeSlot(slot: string | null): string {
  const found = TIME_SLOTS.find((s) => s.id === slot);
  return found ? `${found.label} — ${found.hours}` : "—";
}

export function buildReviewRows(
  data: Pick<ReservationData, "firstName" | "lastName" | "phone" | "location" | "partySize"> & {
    date: Date | string | null;
    timeSlot: string | null;
    specialNote?: string;
  }
): SummaryRow[] {
  return [
    { label: "Guest", value: `${data.firstName} ${data.lastName}` },
    { label: "Phone", value: data.phone },
    { label: "Location", value: `Carbone ${data.location}` },
    { label: "Date", value: formatDate(data.date) },
    { label: "Party", value: `${data.partySize} guest${data.partySize !== 1 ? "s" : ""}` },
    { label: "Time", value: formatTimeSlot(data.timeSlot) },
    ...(data.specialNote ? [{ label: "Notes", value: data.specialNote }] : []),
  ];
}

const ReservationSummaryCard = memo(function ReservationSummaryCard({
  rows,
}: {
  rows: SummaryRow[];
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        padding: "1rem",
        animation: "bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.75rem",
            paddingBottom: i < rows.length - 1 ? "0.65rem" : 0,
            marginBottom: i < rows.length - 1 ? "0.65rem" : 0,
            borderBottom:
              i < rows.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              fontSize: "0.55rem",
              letterSpacing: "0.18em",
              color: "var(--cream-muted)",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {row.label}
          </span>
          <span
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontSize: "0.9rem",
              color: "var(--cream)",
              textAlign: "right",
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
});

export default ReservationSummaryCard;
