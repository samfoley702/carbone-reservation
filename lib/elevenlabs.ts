// lib/elevenlabs.ts — server-side only helper for ElevenLabs signed URL
// Never import this file from client components.

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

interface SignedUrlResponse {
  signed_url: string;
}

function isSignedUrlResponse(value: unknown): value is SignedUrlResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "signed_url" in value &&
    typeof (value as SignedUrlResponse).signed_url === "string"
  );
}

export function hasElevenLabsConfig(): boolean {
  return Boolean(ELEVENLABS_API_KEY && ELEVENLABS_AGENT_ID);
}

export async function getSignedUrl(): Promise<string> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
    throw new Error("Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID");
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`,
    {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs error: ${res.status}`);
  }

  const body: unknown = await res.json();
  if (!isSignedUrlResponse(body)) {
    throw new Error("Unexpected ElevenLabs response shape");
  }

  return body.signed_url;
}
