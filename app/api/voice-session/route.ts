import { NextResponse } from "next/server";
import { getSignedUrl, hasElevenLabsConfig } from "@/lib/elevenlabs";

export async function GET(request: Request) {
  // Env var check — return 503 if not configured
  if (!hasElevenLabsConfig()) {
    return NextResponse.json(
      { error: "Voice agent not configured" },
      { status: 503 }
    );
  }

  // CSRF: reject cross-origin requests
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const signedUrl = await getSignedUrl();
    return NextResponse.json({ signedUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to create voice session" },
      { status: 503 }
    );
  }
}
