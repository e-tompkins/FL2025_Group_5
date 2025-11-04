"use client";

import React, { useState } from "react";
import {
  FormControlLabel,
  Switch,
  Button,
  Box,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

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
  const theme = useTheme();

  const togglePublic = async (topic: string, next: boolean) => {
    // Optimistic update
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
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderStyle: "dashed",
          textAlign: "center",
          color: "text.secondary",
          bgcolor: "background.paper",
        }}
      >
        No visuals yet.
      </Paper>
    );
  }

  return (
    <Box display="grid" gap={2} maxWidth={1200}>
      {rows.map((v) => (
        <Paper
          key={v.id}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: 1,
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          {/* Header */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            mb={1.5}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {v.topic}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {v.modelUsed ?? "No model"} ·{" "}
                {new Date(v.createdAt).toLocaleString()}
              </Typography>
            </Box>

            <Stack direction="row" alignItems="center" gap={1.5}>
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
                    color: v.public ? "primary.main" : "text.secondary",
                  },
                }}
              />
              <Button
                size="small"
                variant="contained"
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
            </Stack>
          </Stack>

          {/* Visual HTML */}
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              pt: 1.5,
            }}
          >
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                p: 1.5,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
              }}
              // Only for trusted/sanitized HTML
              dangerouslySetInnerHTML={{ __html: v.html }}
            />
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
