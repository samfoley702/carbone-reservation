export interface ReservationData {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  date: Date | null;
  partySize: number;
  preferredTime: string | null;
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

function generatePreferredTimes(): string[] {
  const times: string[] = [];
  for (let hour = 5; hour <= 11; hour++) {
    const maxMinute = hour === 11 ? 0 : 45;
    for (let minute = 0; minute <= maxMinute; minute += 15) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const mm = minute.toString().padStart(2, "0");
      times.push(`${displayHour}:${mm} PM`);
    }
  }
  return times;
}

export const PREFERRED_TIMES = generatePreferredTimes();
