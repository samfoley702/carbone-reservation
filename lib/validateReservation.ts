import { ChatStep } from "@/types/chat";
import { ReservationData } from "@/types/reservation";

export function validateStep(step: ChatStep, data: ReservationData): boolean {
  switch (step) {
    case 1:
      return !!(data.firstName.trim() && data.lastName.trim());
    case 2:
      return /^[\+]?[\d\s\-\(\)]{10,}$/.test(data.phone.replace(/\s/g, ""));
    case 3:
      return !!data.location;
    case 4:
      return !!data.date;
    case 5:
      return data.partySize >= 1;
    case 6:
      return !!data.timeSlot;
    case 7:
      return true;
  }
}
