// app/visuals/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Stack,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";
import AppBar from "../components/AppBar";
import VisualRunner from "../components/VisualRunner";

type CodeBundle = {
  topic: string;
  html: string;
  css?: string;
  js: string;
  cached?: boolean;
  rationale?: string;
  public?: boolean; // persisted visibility
};

export default function VisualsPage() {
  const sp = useSearchParams();

  // decode ?topics= (base64 JSON array) passed from /topics
  const topics = useMemo(() => {
    try {
      const raw = sp.get("topics");
      if (!raw) return [];
      const arr = JSON.parse(atob(decodeURIComponent(raw)));
      return Array.isArray(arr) ? arr.slice(0, 10) : [];
    } catch {
      return [];
    }
  }, [sp]);

  const [bundles, setBundles] = useState<CodeBundle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onlyTopic = topics.length === 1 ? topics[0] : null;

  // fetch anime.js code for each topic
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!topics.length) {
          setBundles([]);
          return;
        }
        const results = await Promise.all(
          topics.map(async (topic: string) => {
            const res = await fetch("/api/visuals", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ topic }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "API error");
            return {
              topic,
              html: data.html,
              css: data.css,
              js: data.js,
              cached: data.cached,
              rationale: data.rationale,
              public: data.public,
            } as CodeBundle;
          })
        );
        if (!cancelled) setBundles(results);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to generate visuals");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topics]);

  const regenerate = async (topic: string) => {
    try {
      const res = await fetch("/api/visuals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, forceRegenerate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "API error");
      setBundles((prev) =>
        (prev || []).map((b) =>
          b.topic === topic
            ? {
                topic,
                html: data.html,
                css: data.css,
                js: data.js,
                cached: false,
                rationale: data.rationale,
                public: data.public,
              }
            : b
        )
      );
    } catch (e: any) {
      alert(e.message || "Failed to regenerate");
    }
  };

  // toggle public/private (optimistic update + PATCH)
  const togglePublic = async (topic: string, next: boolean) => {
    // optimistic UI
    setBundles((prev) =>
      (prev || []).map((b) => (b.topic === topic ? { ...b, public: next } : b))
    );
    try {
      const res = await fetch("/api/visuals", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, public: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Update failed");
      }
    } catch (e: any) {
      // revert on error
      setBundles((prev) =>
        (prev || []).map((b) => (b.topic === topic ? { ...b, public: !next } : b))
      );
      alert(e.message || "Failed to update visibility");
    }
  };

  // Loading state
  if (bundles === null) {
    return (
      <>
        <AppBar />
        <Box
          sx={{
            bgcolor: "white",
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Container
            maxWidth="md"
            sx={{ display: "flex", justifyContent: "center", py: 8 }}
          >
            <CircularProgress />
          </Container>
        </Box>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <AppBar />
        <Box sx={{ bgcolor: "white", minHeight: "100dvh" }}>
          <Container maxWidth="md" sx={{ pt: { xs: 4, sm: 6, md: 8 }, pb: 6 }}>
            <Typography color="error">{error}</Typography>
          </Container>
        </Box>
      </>
    );
  }

  return (
    <>
      <AppBar />

      {/* Match the Upload page hero & spacing */}
      <Box
        sx={{
          bgcolor: "white",
          minHeight: "100dvh",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            pt: { xs: 4, sm: 6, md: 8 },
            pb: { xs: 6, sm: 8 },
          }}
        >
          <Stack
            spacing={{ xs: 3, sm: 4, md: 5 }}
            alignItems="center"
            textAlign="center"
          >
            {/* Hero (only when a single topic) */}
            {onlyTopic && (
              <Box>
                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: "#3c82af",
                    fontSize: {
                      xs: "clamp(22px, 6vw, 34px)",
                      sm: "clamp(26px, 5vw, 40px)",
                      md: "48px",
                    },
                    mb: { xs: 1, md: 1.5 },
                  }}
                >
                  {onlyTopic}
                </Typography>

                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.95rem", sm: "1.05rem" },
                    maxWidth: 720,
                    mx: "auto",
                  }}
                >
                  This is the text to describe your visual.
                </Typography>
              </Box>
            )}

            {/* Visual cards (no Grid) */}
            <Stack spacing={3} sx={{ width: "100%", maxWidth: 720 }}>
              {bundles.length === 0 ? (
                <Paper
                  elevation={3}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    textAlign: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No topics provided.
                  </Typography>
                </Paper>
              ) : (
                bundles.map(({ topic, html, css, js, cached, rationale, public: isPublic }) => (
                  <Paper
                    key={topic}
                    elevation={3}
                    sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, textAlign: "left" }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1.5}
                      sx={{ mb: 1.5 }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, lineHeight: 1.2 }}
                      >
                        {topic}
                      </Typography>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        {/* Visibility switch */}
                        <FormControlLabel
                          control={
                            <Switch
                              checked={!!isPublic}
                              onChange={(_, checked) => togglePublic(topic, checked)}
                              color="primary"
                            />
                          }
                          label={isPublic ? "Public" : "Private"}
                          sx={{
                            ".MuiFormControlLabel-label": {
                              fontWeight: 600,
                              color: isPublic ? "primary.main" : "text.secondary",
                            },
                          }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => regenerate(topic)}
                          sx={{ borderRadius: 2, textTransform: "none" }}
                        >
                          Regenerate
                        </Button>
                      </Stack>
                    </Stack>

                    {rationale && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5 }}
                      >
                        {rationale}
                      </Typography>
                    )}

                    <VisualRunner html={html} css={css} js={js} />
                  </Paper>
                ))
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
