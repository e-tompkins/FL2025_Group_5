"use client";

import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useMemo, useState, useEffect } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"] });

export default function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as "light" | "dark" | null;
    if (saved) setMode(saved);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                background: {
                  default: "#eef3f9",
                  paper: "rgba(255,255,255,0.8)",
                },
              }
            : {
                background: {
                  default: "#0d1117",
                  paper: "rgba(255,255,255,0.05)",
                },
              }),
          primary: { main: "#1976d2" },
          secondary: { main: "#9c27b0" },
        },
        typography: {
          fontFamily: `${poppins.style.fontFamily}, sans-serif`,
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 700 },
          button: { textTransform: "none", fontWeight: 600 },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
              },
            },
          },
        },
      }),
    [mode]
  );

  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}
