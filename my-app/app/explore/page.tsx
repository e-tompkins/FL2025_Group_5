// app/explore/page.tsx
import { prisma } from "@/lib/prisma";
import AppBar from "../components/AppBar";
import { Box, Container, Stack, Typography, Paper } from "@mui/material";
import PublicVisualList from "./components/PublicVisualList";

export const metadata = {
  title: "Explore Visuals",
  description: "Discover public visuals shared by others",
};

export default async function ExplorePage() {
  // 🔍 Get all visuals where public = true (any user)
  const visuals = await prisma.visual.findMany({
    where: { public: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topic: true,
      html: true,
      modelUsed: true,
      createdAt: true,
      public: true,
      user: { select: { email: true } }, // optional, show who made it
    },
  });

  const items = visuals.map(v => ({
    id: v.id,
    topic: v.topic,
    html: v.html ?? "",
    modelUsed: v.modelUsed ?? "",
    createdAt: v.createdAt.toISOString(),
    author: v.user?.email ?? "Anonymous",
    public: v.public ?? false,
  }));

  return (
    <>
      <AppBar />

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
            {/* Hero */}
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
                Explore Visuals
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  maxWidth: 720,
                  mx: "auto",
                }}
              >
                See visual explanations and models shared publicly by other learners.
              </Typography>
            </Box>

            {/* List container */}
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
              {items.length === 0 ? (
                <Typography color="text.secondary">
                  No public visuals yet — be the first to share!
                </Typography>
              ) : (
                <PublicVisualList visuals={items} />
              )}
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  );
}