import React from "react";

type VisualItem = {
  id: string;
  topic: string;
  html: string;
  modelUsed?: string | null;
  createdAt: string | Date;
};

export default function VisualList({ visuals }: { visuals: VisualItem[] }) {
  if (!visuals || visuals.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          border: "1px dashed #ccc",
          borderRadius: 8,
          maxWidth: 800,
        }}
      >
        No visuals yet.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr", maxWidth: 1200 }}>
      {visuals.map((v) => (
        <article
          key={v.id}
          style={{
            border: "1px solid #e6e6e6",
            borderRadius: 10,
            padding: 14,
            background: "#fff",
            boxShadow: "0 1px 3px rgba(16,24,40,0.03)",
          }}
        >
          <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{v.topic}</h2>
            <div style={{ color: "#666", fontSize: 13 }}>
              {v.modelUsed ?? "No model"} · {new Date(v.createdAt).toLocaleString()}
            </div>
          </header>

          <section style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
            <div
              style={{
                border: "1px solid #f5f5f5",
                borderRadius: 8,
                padding: 10,
                background: "#fafafa",
              }}
              // NOTE: only do this for trusted/sanitized HTML
              dangerouslySetInnerHTML={{ __html: v.html }}
            />
          </section>
        </article>
      ))}
    </div>
  );
}
