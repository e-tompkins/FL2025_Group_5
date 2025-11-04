"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  Chip,
  TextField,
  IconButton,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AppBar from "../components/AppBar";

export default function TopicsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");

  const topics = useMemo(() => {
    try {
      const b64 = sp.get("data");
      if (!b64) return [];
      const json = JSON.parse(
        typeof window !== "undefined"
          ? atob(b64)
          : Buffer.from(b64, "base64").toString("utf-8")
      );
      return Array.isArray(json) ? json.slice(0, 10) : [];
    } catch {
      return [];
    }
  }, [sp]);

  useEffect(() => {
    setSelected(topics);
  }, [topics]);

  const toggle = (t: string) =>
    setSelected((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    );

  const handleAddCustomTopic = () => {
    const trimmed = customTopic.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) setSelected((prev) => [...prev, trimmed]);
    setCustomTopic("");
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      alert("Pick at least one topic to visualize.");
      return;
    }

    const encoded = encodeURIComponent(
      typeof window !== "undefined"
        ? btoa(JSON.stringify(selected))
        : Buffer.from(JSON.stringify(selected)).toString("base64")
    );
    router.push(`/visuals?topics=${encoded}`);
  };

  return (
    <>
      <AppBar />
      <Box
        sx={(theme) => ({
          bgcolor: theme.palette.mode === "light" ? "white" : theme.palette.background.default,
          minHeight: "100dvh",
          transition: "background-color 0.3s ease",
        })}
      >
        <Container maxWidth="md" sx={{ pt: { xs: 4, sm: 6, md: 8 }, pb: 6 }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography
              component="h1"
              sx={{
                fontWeight: 700,
                color: "#3c82af",
                fontSize: { xs: "clamp(22px,6vw,34px)", sm: "clamp(26px,5vw,40px)", md: "48px" },
              }}
            >
              Pick the topics to visualize
            </Typography>

            <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
              We extracted the most important topics from your upload.  
              Select the ones you want turned into visuals — or add your own.
            </Typography>

            <Paper
              elevation={3}
              sx={{
                width: "100%",
                maxWidth: 720,
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                textAlign: "left",
              }}
            >
              <FormGroup>
                {topics.length === 0 ? (
                  <Typography color="text.secondary">No topics found.</Typography>
                ) : (
                  topics.map((t) => (
                    <FormControlLabel
                      key={t}
                      control={<Checkbox checked={selected.includes(t)} onChange={() => toggle(t)} />}
                      label={<Typography sx={{ wordBreak: "break-word" }}>{t}</Typography>}
                    />
                  ))
                )}
              </FormGroup>

              {/* ✅ Custom Topic Input */}
              <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                <TextField
                  label="Add your own topic"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomTopic();
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  color="primary"
                  onClick={handleAddCustomTopic}
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  <AddCircleOutlineIcon />
                </IconButton>
              </Stack>

              {/* ✅ Selected Topics */}
              {selected.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 2, flexWrap: "wrap" }}
                >
                  {selected.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      onDelete={() => toggle(t)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Stack>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected {selected.length} topic{selected.length !== 1 ? "s" : ""}.
                </Typography>
              </Box>

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleContinue}
                  disabled={selected.length === 0}
                  sx={{ borderRadius: 3, textTransform: "none", fontWeight: 600 }}
                >
                  Continue
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
