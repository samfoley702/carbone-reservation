export type TimeSlot = "early" | "prime" | "late";

export interface ReservationData {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  date: Date | null;
  partySize: number;
  timeSlot: TimeSlot | null;
  specialNote: string;
}

export const LOCATIONS = [
  { id: "new-york", city: "New York", descriptor: "The Original · West Village" },
  { id: "miami", city: "Miami", descriptor: "South Beach" },
  { id: "las-vegas", city: "Las Vegas", descriptor: "ARIA Resort & Casino" },
  { id: "dallas", city: "Dallas", descriptor: "Highland Park Village" },
  { id: "hong-kong", city: "Hong Kong", descriptor: "Central" },
  { id: "london", city: "London", descriptor: "Mayfair" },
  { id: "dubai", city: "Dubai", descriptor: "DIFC" },
  { id: "doha", city: "Doha", descriptor: "Al Maha Island" },
  { id: "riyadh", city: "Riyadh", descriptor: "Kingdom Centre" },
] as const;

export const TIME_SLOTS = [
  { id: "early" as TimeSlot, label: "Early Seating", hours: "5:30 – 7:00 PM" },
  { id: "prime" as TimeSlot, label: "Prime Seating", hours: "7:00 – 9:00 PM" },
  { id: "late" as TimeSlot, label: "Late Seating", hours: "9:00 – 11:00 PM" },
] as const;
