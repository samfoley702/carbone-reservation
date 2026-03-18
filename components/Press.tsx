const PRESS = [
  { name: "Vogue", note: "Cult Italian Restaurant" },
  { name: "The New Yorker", note: "How to Get a Table" },
  { name: "Harper's Bazaar", note: "Your Favorite Celeb's Favorite Restaurant" },
  { name: "The Wall Street Journal", note: "Mario Carbone's Keys to Hospitality" },
];

export default function Press() {
  return (
    <section
      style={{
        backgroundColor: "var(--bg-elevated)",
        padding: "5rem 2.5rem",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "3rem 4rem",
        }}
      >
        {PRESS.map((item) => (
          <div key={item.name} className="text-center">
            <p className="press-item">{item.name}</p>
            <p
              style={{
                fontFamily: "var(--font-cormorant), Georgia, serif",
                fontSize: "0.85rem",
                fontStyle: "italic",
                color: "var(--cream-muted)",
                marginTop: "0.25rem",
              }}
            >
              {item.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
