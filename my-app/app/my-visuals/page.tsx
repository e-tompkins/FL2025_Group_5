// app/my-visuals/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOption } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// UI (server-safe MUI usage)
import AppBar from "../components/AppBar";
import { Box, Container, Stack, Typography, Paper } from "@mui/material";

// Your existing list renderer
import VisualList from "./components/VisualList";

export const metadata = {
  title: "My Visuals",
  description: "A list of your saved visuals",
};

export default async function MyVisualsPage() {
  const session = await getServerSession(authOption);
  if (!session?.user?.email) redirect("/api/auth/signin");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!dbUser) redirect("/api/auth/signin");

  const visuals = await prisma.visual.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topic: true,
      html: true,
      modelUsed: true,
      createdAt: true,
    },
  });

  return (
    <>
      <AppBar />

      {/* Match the Upload/Visuals layout */}
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
                My Visuals
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  maxWidth: 720,
                  mx: "auto",
                }}
              >
                A list of your saved visuals with topic, model used, and the rendered output.
              </Typography>
            </Box>

            {/* List container (keeps style consistent with other pages) */}
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
              {visuals.length === 0 ? (
                <Typography color="text.secondary">
                  You haven't saved any visuals yet.
                </Typography>
              ) : (
                <VisualList visuals={visuals} />
              )}
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
