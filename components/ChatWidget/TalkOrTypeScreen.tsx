"use client";

interface TalkOrTypeScreenProps {
  onSelectType: () => void;
  onSelectTalk: () => void;
}

export default function TalkOrTypeScreen({
  onSelectType,
  onSelectTalk,
}: TalkOrTypeScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* Message thread area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
          background: "var(--bg-elevated)",
        }}
      >
        {/* Opening bot bubble */}
        <div
          className="chat-bubble--bot"
          style={{
            maxWidth: "85%",
            alignSelf: "flex-start",
            padding: "0.6rem 0.875rem",
            borderRadius: "4px",
            fontFamily: "var(--font-cormorant), Georgia, serif",
            fontSize: "1rem",
            color: "var(--cream)",
            lineHeight: 1.45,
            animation: "bubbleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          Welcome to Carbone. How would you prefer to make your reservation?
        </div>
      </div>

      {/* Choice buttons */}
      <div
        style={{
          padding: "1rem",
          background: "var(--bg)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <button
          onClick={onSelectTalk}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectTalk()}
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            padding: "1rem 1.25rem",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            transition: "border-color 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--gold)";
            e.currentTarget.style.background = "rgba(201,168,76,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>🎙</span>
          <div>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1.05rem",
                color: "var(--cream)",
                marginBottom: "0.15rem",
              }}
            >
              Talk
            </p>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.18em",
                color: "var(--cream-muted)",
                textTransform: "uppercase",
              }}
            >
              Speak with our voice concierge
            </p>
          </div>
        </button>

        <button
          onClick={onSelectType}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectType()}
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
            padding: "1rem 1.25rem",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            transition: "border-color 0.2s ease, background 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--cream-muted)";
            e.currentTarget.style.background = "rgba(255,249,240,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>⌨</span>
          <div>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "1.05rem",
                color: "var(--cream)",
                marginBottom: "0.15rem",
              }}
            >
              Type
            </p>
            <p
              style={{
                fontFamily: "var(--font-oswald), sans-serif",
                fontSize: "0.5rem",
                letterSpacing: "0.18em",
                color: "var(--cream-muted)",
                textTransform: "uppercase",
              }}
            >
              Fill out the form at your own pace
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
