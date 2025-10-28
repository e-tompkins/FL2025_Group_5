// app/topics/page.tsx
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
} from "@mui/material";
import AppBar from "../components/AppBar";

export default function TopicsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

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
    setSelected(topics); // preselect all by default; tweak if you want none selected initially
  }, [topics]);

  const toggle = (t: string) =>
    setSelected((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    );

  const handleContinue = async () => {
    if (selected.length === 0) {
      alert("Pick at least one topic to visualize.");
      return;
    }

    // Option A: go straight to your /visuals page with selected topics:
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
      <Box sx={{ bgcolor: "white", minHeight: "100dvh" }}>
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
              We extracted the most important topics from your upload. Select the ones you want turned into visuals.
            </Typography>

            <Paper
              elevation={3}
              sx={{ width: "100%", maxWidth: 720, p: { xs: 2, sm: 3 }, borderRadius: 3, textAlign: "left" }}
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

              {selected.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                  {selected.map((t) => (
                    <Chip key={t} label={t} />
                  ))}
                </Stack>
              )}

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
