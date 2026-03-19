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

  // CSRF: reject cross-origin requests (browser-only endpoint)
  // Browsers omit the Origin header on same-origin GET requests, so a
  // missing Origin is safe — only reject when Origin IS present but
  // doesn't match the Host.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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
