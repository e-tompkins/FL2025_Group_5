"use client";
import React, { useState } from "react";
import { FormControlLabel, Switch, Button } from "@mui/material";

type VisualItem = {
  id: string;
  topic: string;
  html: string;
  modelUsed?: string | null;
  createdAt: string | Date;
  public?: boolean;
};

export default function VisualList({ visuals }: { visuals: VisualItem[] }) {
  const [rows, setRows] = useState(visuals);

  const togglePublic = async (topic: string, next: boolean) => {
    // Optimistic UI update
    setRows((prev) =>
      prev.map((v) => (v.topic === topic ? { ...v, public: next } : v))
    );

    try {
      const res = await fetch("/api/visuals", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, public: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update visibility");
      }
    } catch (err: any) {
      // Revert on failure
      setRows((prev) =>
        prev.map((v) => (v.topic === topic ? { ...v, public: !next } : v))
      );
      alert(err.message || "Error updating visibility");
    }
  };

  if (!rows || rows.length === 0) {
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
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "1fr",
        maxWidth: 1200,
      }}
    >
      {rows.map((v) => (
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
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>{v.topic}</h2>
              <div style={{ color: "#666", fontSize: 13 }}>
                {v.modelUsed ?? "No model"} ·{" "}
                {new Date(v.createdAt).toLocaleString()}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!v.public}
                    onChange={(_, checked) => togglePublic(v.topic, checked)}
                    color="primary"
                  />
                }
                label={v.public ? "Public" : "Private"}
                sx={{
                  ".MuiFormControlLabel-label": {
                    fontWeight: 600,
                    color: v.public ? "#1976d2" : "#666",
                  },
                }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  window.open(
                    `/visuals?topics=${encodeURIComponent(
                      btoa(JSON.stringify([v.topic]))
                    )}`,
                    "_blank"
                  )
                }
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Open
              </Button>
            </div>
          </header>

          <section
            style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}
          >
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