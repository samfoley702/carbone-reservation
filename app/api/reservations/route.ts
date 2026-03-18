import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { firstName, lastName, phone, location, date, partySize, timeSlot, specialNote } =
      body as {
        firstName: string;
        lastName: string;
        phone: string;
        location: string;
        date: string;
        partySize: number;
        timeSlot: string;
        specialNote?: string;
      };

    if (!firstName || !lastName || !phone || !location || !date || !partySize || !timeSlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Server-side field length + enum validation
    if (firstName.length > 100 || lastName.length > 100) {
      return NextResponse.json({ error: "Name too long" }, { status: 400 });
    }
    if (phone.length > 30) {
      return NextResponse.json({ error: "Phone too long" }, { status: 400 });
    }
    if (specialNote && specialNote.length > 1000) {
      return NextResponse.json({ error: "Special note too long" }, { status: 400 });
    }
    if (!["early", "prime", "late"].includes(timeSlot)) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      INSERT INTO reservation_requests
        (first_name, last_name, phone, location, date, party_size, time_slot, special_note)
      VALUES
        (${firstName}, ${lastName}, ${phone}, ${location}, ${date}, ${partySize}, ${timeSlot}, ${specialNote ?? null})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reservation submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
