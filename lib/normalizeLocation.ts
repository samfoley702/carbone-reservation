import { LOCATIONS } from "@/types/reservation";

const LOCATION_ALIASES: Record<string, string> = {
  // New York
  nyc: "New York",
  ny: "New York",
  "new york city": "New York",
  manhattan: "New York",
  // Miami
  "south beach": "Miami",
  // Las Vegas
  vegas: "Las Vegas",
  lv: "Las Vegas",
  "las vegas": "Las Vegas",
  // Hong Kong
  hk: "Hong Kong",
  "hong kong": "Hong Kong",
  // Dubai
  uae: "Dubai",
  // Dallas
  dfw: "Dallas",
};

const VALID_CITIES = new Set<string>(LOCATIONS.map((l) => l.city));

/**
 * Normalizes a location string to match the canonical LOCATIONS city names.
 * Maps common aliases (e.g. "NYC" → "New York") and returns the input
 * unchanged if no alias is found.
 */
export function normalizeLocation(input: string): string {
  const trimmed = input.trim();

  // Already a valid city name (exact match)
  if (VALID_CITIES.has(trimmed)) return trimmed;

  // Try alias lookup (case-insensitive)
  return LOCATION_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
