// app/visuals/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Chip,
  TextField,
} from "@mui/material";
import AppBar from "../components/AppBar";
import VisualRunner from "../components/VisualRunner";

type CodeBundle = {
  id?: string;
  topic: string;
  html: string;
  css?: string;
  js: string;
  cached?: boolean;
  rationale?: string;
  public?: boolean;
  userPrompt?: string;
  tags?: string[];
};

export default function VisualsPage() {
  const sp = useSearchParams();
  const router = useRouter();

  // decode ?topics= (base64 JSON: either array (old) or { selected, all })
  const { selectedTopics, allTopics } = useMemo(() => {
    try {
      const raw = sp.get("topics");
      if (!raw) return { selectedTopics: [], allTopics: [] };
      const decoded = JSON.parse(atob(decodeURIComponent(raw)));
      if (Array.isArray(decoded)) {
        return { selectedTopics: decoded.slice(0, 10), allTopics: decoded.slice(0, 10) };
      }
      const selected = Array.isArray(decoded.selected) ? decoded.selected.slice(0, 10) : [];
      const all = Array.isArray(decoded.all) ? decoded.all : selected;
      return { selectedTopics: selected, allTopics: all };
    } catch {
      return { selectedTopics: [], allTopics: [] };
    }
  }, [sp]);

  const tagParam = sp.get("tag"); // support /visuals?tag=...
  const onlyTopic = selectedTopics.length === 1 ? selectedTopics[0] : null;

  const [bundles, setBundles] = useState<CodeBundle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [currentEditText, setCurrentEditText] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Tag filter branch
        if (tagParam) {
          setBundles(null);
          const res = await fetch(`/api/visuals?tag=${encodeURIComponent(tagParam)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "API error");

          const raw = data.visuals ?? data.items ?? [];
          const visuals = (raw || []).map((v: any, i: number) => ({
            id: v.id ?? `${v.topic}-${i}-${Date.now()}`,
            topic: v.topic,
            html: v.html ?? "",
            css: v.css ?? "",
            js: v.js ?? "",
            cached: !!v.cached,
            rationale: v.rationale ?? "",
            public: !!v.public,
            userPrompt: v.userPrompt ?? undefined,
            tags: Array.isArray(v.tags) ? v.tags : (v.tags ? JSON.parse(String(v.tags)) : []),
          }));
          if (!cancelled) setBundles(visuals);
          return;
        }

        // Selected topics flow
        if (!selectedTopics.length) {
          setBundles([]);
          return;
        }

        const results = await Promise.all(
          selectedTopics.map(async (topic: string, idx: number) => {
            // Try to fetch an existing saved visual first
            try {
              const g = await fetch(`/api/visuals?topic=${encodeURIComponent(topic)}`);
              if (g.ok) {
                const gv = await g.json();
                const tags = Array.isArray(gv.tags)
                  ? gv.tags
                  : gv.tags && typeof gv.tags === "string"
                  ? JSON.parse(gv.tags)
                  : Array.isArray(allTopics)
                  ? allTopics.filter((t) => t !== topic)
                  : [topic];
                return {
                  id: gv.id ?? `${topic}-${idx}-${Date.now()}`,
                  topic,
                  html: gv.html ?? "",
                  css: gv.css ?? "",
                  js: gv.js ?? "",
                  cached: !!gv.cached,
                  rationale: gv.rationale ?? "",
                  public: gv.public ?? false,
                  userPrompt: gv.userPrompt ?? undefined,
                  tags,
                } as CodeBundle;
              }
            } catch {
              // fall through to generation
            }

            // Otherwise request generation and include allTopics so server persists tags
            const p = await fetch("/api/visuals", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                topic,
                allTopics,
                relatedTopics: [],
              }),
            });
            const data = await p.json();
            if (!p.ok) throw new Error(data?.error || "API error");

            const tagsFromApi = Array.isArray(data.tags)
              ? data.tags
              : Array.isArray(data.relatedTopics)
              ? data.relatedTopics
              : [];
            const otherFromAll = Array.isArray(allTopics) ? allTopics.filter((t) => t !== topic) : [];
            const tagsSet = new Set<string>([topic, ...tagsFromApi, ...otherFromAll]);
            const tags = Array.from(tagsSet);

            return {
              id: data.id ?? `${topic}-${idx}-${Date.now()}`,
              topic,
              html: data.html,
              css: data.css,
              js: data.js,
              cached: data.cached,
              rationale: data.rationale,
              public: data.public,
              userPrompt: data.userPrompt,
              tags,
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
  }, [selectedTopics, tagParam, allTopics]);

  // Delete handler (accepts id or topic)
  const handleDelete = async (id?: string, topic?: string) => {
    try {
      setBundles((prev) => (prev ?? []).filter((b) => (id ? b.id !== id : b.topic !== topic)));
      await fetch("/api/visuals/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, topic }),
      });
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    }
  };

  const regenerate = async (topic: string, promptOverride?: string) => {
    try {
      setIsRegenerating(true);
      const res = await fetch("/api/visuals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic,
          forceRegenerate: true,
          editPrompt: promptOverride ?? currentEditText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "API error");
      setBundles((prev) =>
        (prev || []).map((b) =>
          b.topic === topic
            ? {
                ...b,
                html: data.html,
                css: data.css,
                js: data.js,
                cached: false,
                rationale: data.rationale,
                public: data.public,
                userPrompt: data.userPrompt,
                tags: Array.isArray(data.tags) ? data.tags : b.tags,
              }
            : b
        )
      );
    } catch (e: any) {
      alert(e.message || "Failed to regenerate");
    } finally {
      setIsRegenerating(false);
    }
  };

  const togglePublic = async (topic: string, next: boolean) => {
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
      setBundles((prev) =>
        (prev || []).map((b) => (b.topic === topic ? { ...b, public: !next } : b))
      );
      alert(e.message || "Failed to update visibility");
    }
  };

  function edit(userPrompt: string | undefined, topic: string): void {
    setEditingTopic((prev) => (prev === topic ? null : topic));
    setCurrentEditText(userPrompt || "");
  }

  async function handleSaveEdit(topic: string) {
    try {
      setIsRegenerating(true);
      await regenerate(topic, currentEditText);
      setEditingTopic(null);
    } catch (err) {
      console.error("Error saving edit:", err);
    } finally {
      setIsRegenerating(false);
    }
  }

  const onClickTag = (tag: string) => {
    router.push(`/visuals?tag=${encodeURIComponent(tag)}`);
  };

  // Loading
  if (bundles === null) {
    return (
      <>
        <AppBar />
        <Box sx={{ bgcolor: "white", minHeight: "100dvh", display: "flex", alignItems: "center" }}>
          <Container maxWidth="md" sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Container>
        </Box>
      </>
    );
  }

  // Error
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
      <Box sx={{ bgcolor: "background.default", minHeight: "100dvh", display: "flex", alignItems: "flex-start" }}>
        <Container maxWidth="md" sx={{ pt: { xs: 4, sm: 6, md: 8 }, pb: { xs: 6, sm: 8 } }}>
          <Stack spacing={{ xs: 3, sm: 4, md: 5 }} alignItems="center" textAlign="center">
            {onlyTopic && (
              <Box>
                <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: "clamp(22px,6vw,34px)", sm: "clamp(26px,5vw,40px)", md: "48px" }, mb: 1 }}>
                  {onlyTopic}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: { xs: "0.95rem", sm: "1.05rem" }, maxWidth: 720, mx: "auto" }}>
                  This is the text to describe your visual.
                </Typography>
              </Box>
            )}

            <Stack spacing={3} sx={{ width: "100%", maxWidth: 720 }}>
              {bundles.length === 0 ? (
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, textAlign: "center" }}>
                  <Typography color="text.secondary">No topics provided.</Typography>
                </Paper>
              ) : (
                bundles.map(({ id, topic, html, css, js, cached, rationale, public: isPublic, userPrompt, tags }) => (
                  <Paper key={id} elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, textAlign: "left" }}>
                    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{topic}</Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControlLabel
                          control={<Switch checked={!!isPublic} onChange={(_, checked) => togglePublic(topic, checked)} color="primary" />}
                          label={isPublic ? "Public" : "Private"}
                          sx={{ ".MuiFormControlLabel-label": { fontWeight: 600, color: isPublic ? "primary.main" : "text.secondary" } }}
                        />

                        <Button size="small" variant="outlined" onClick={() => regenerate(topic)} sx={{ borderRadius: 2, textTransform: "none" }}>
                          Regenerate
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => edit(userPrompt, topic)}>
                          Edit prompt
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => handleDelete(id, topic)} sx={{ borderRadius: 2, textTransform: "none" }}>
                          Delete
                        </Button>
                        
                      </Stack>
                    </Stack>

                    {editingTopic === topic && (
                      <Box sx={{ mb: 2 }}>
                        {isRegenerating ? (
                          <Stack alignItems="center" sx={{ py: 2 }}>
                            <CircularProgress />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Regenerating visual...</Typography>
                          </Stack>
                        ) : (
                          <>
                            <TextField fullWidth multiline minRows={3} value={currentEditText} onChange={(e) => setCurrentEditText(e.target.value)} variant="outlined" sx={{ mb: 1 }} />
                            <Stack direction="row" spacing={1}>
                              <Button variant="contained" onClick={() => handleSaveEdit(topic)}>Regenerate</Button>
                              <Button variant="text" onClick={() => setEditingTopic(null)}>Cancel</Button>
                            </Stack>
                          </>
                        )}
                      </Box>
                    )}

                    {rationale && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{rationale}</Typography>
                    )}

                    <VisualRunner html={html} css={css} js={js} />

                    {/* Tags area */}
                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                      {(tags ?? [topic]).map((t) => (
                        <Chip key={t} label={t} onClick={() => onClickTag(t)} clickable />
                      ))}
                    </Stack>
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