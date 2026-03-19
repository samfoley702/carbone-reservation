import { ReservationData, LOCATIONS, PREFERRED_TIMES } from "@/types/reservation";

/**
 * Converts an unknown/partial object (e.g. ElevenLabs tool params) into a
 * type-safe Partial<ReservationData> for pre-populating ChatEngine's initialData.
 *
 * Validates all values against the same constraints as the API route:
 * - location must be in the LOCATIONS allowlist
 * - date must be YYYY-MM-DD and convert to a valid Date
 * - preferredTime must be in the PREFERRED_TIMES allowlist
 */
export function coercePartialData(
  raw: Partial<Record<string, unknown>> | undefined
): Partial<ReservationData> {
  if (!raw) return {};

  const result: Partial<ReservationData> = {};

  if (typeof raw.firstName === "string" && raw.firstName.trim()) {
    result.firstName = raw.firstName.trim();
  }
  if (typeof raw.lastName === "string" && raw.lastName.trim()) {
    result.lastName = raw.lastName.trim();
  }
  if (typeof raw.phone === "string" && raw.phone.trim()) {
    result.phone = raw.phone.trim();
  }
  if (typeof raw.specialNote === "string") {
    result.specialNote = raw.specialNote;
  }
  if (typeof raw.partySize === "number" && raw.partySize >= 1 && raw.partySize <= 20) {
    result.partySize = Math.round(raw.partySize);
  }

  // Validate location against allowlist
  const validCities = LOCATIONS.map((l) => l.city);
  if (typeof raw.location === "string" && validCities.includes(raw.location as typeof validCities[number])) {
    result.location = raw.location as string;
  }

  // Convert YYYY-MM-DD string to Date
  if (typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)) {
    const d = new Date(raw.date + "T00:00:00Z");
    if (!isNaN(d.getTime())) {
      result.date = d;
    }
  } else if (raw.date instanceof Date && !isNaN(raw.date.getTime())) {
    result.date = raw.date;
  }

  // Validate preferredTime
  if (typeof raw.preferredTime === "string" && PREFERRED_TIMES.includes(raw.preferredTime)) {
    result.preferredTime = raw.preferredTime;
  }

  return result;
}
