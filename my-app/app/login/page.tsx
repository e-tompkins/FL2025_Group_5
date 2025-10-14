"use client";

import { signIn } from "next-auth/react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Container,
  Box,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

export default function LoginPage() {
  return (
    <Box
      sx={{
        height: "100vh", // full screen height
        width: "100vw", // full screen width
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5", // light gray background
      }}
    >
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: 3,
          boxShadow: 3,
          p: 5,
          textAlign: "center",
          width: "100%",
          maxWidth: 400,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={600}
          color="text.secondary"
          gutterBottom
        >
          Welcome
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sign in to continue
        </Typography>

        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={() =>
            signIn("google", {
              callbackUrl: "/upload",
            })
          }
          fullWidth
          sx={{ borderRadius: 2, textTransform: "none", py: 1.5, mt: 3 }}
        >
          Continue with Google
        </Button>
      </Box>
    </Box>
  );
}
