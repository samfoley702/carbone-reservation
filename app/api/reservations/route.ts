import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { LOCATIONS, PREFERRED_TIMES } from "@/types/reservation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { firstName, lastName, phone, location, date, partySize, preferredTime, specialNote } =
      body as {
        firstName: string;
        lastName: string;
        phone: string;
        location: string;
        date: string;
        partySize: number;
        preferredTime: string;
        specialNote?: string;
      };

    if (!firstName || !lastName || !phone || !location || !date || !partySize || !preferredTime) {
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
    if (!PREFERRED_TIMES.includes(preferredTime)) {
      return NextResponse.json({ error: "Invalid preferred time" }, { status: 400 });
    }

    const VALID_LOCATIONS: string[] = LOCATIONS.map((l) => l.city);
    if (!VALID_LOCATIONS.includes(location)) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const parsedDate = new Date(date + "T00:00:00Z");
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    if (parsedDate < todayUtc) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
      return NextResponse.json({ error: "Invalid party size" }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      INSERT INTO reservation_requests
        (first_name, last_name, phone, location, date, party_size, preferred_time, special_note)
      VALUES
        (${firstName}, ${lastName}, ${phone}, ${location}, ${date}, ${partySize}, ${preferredTime}, ${specialNote ?? null})
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reservation submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
