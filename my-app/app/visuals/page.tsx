"use client";

import { useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AppBar from "../components/AppBar";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sampleDescription =
    searchParams?.get("desc") ??
    "A brief description of the concept goes here. This text provides context and information about the concept being presented.";

  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  return (
    <>
      {/* ✅ Top Navbar */}
      <AppBar />

      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "white",
          marginTop: -40,
        }}
      >
        <Typography
          variant="h4"
          color="#3c82af"
          align="center"
          mt={4}
          mb={2}
          fontWeight={600}
        >
          Name of concept here
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          mb={4}
          px={2}
        >
          {sampleDescription}
        </Typography>
      </Box>

      {/* ✅ Main Upload Section */}
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "white",
          marginTop: -70,
        }}
      ></Box>
    </>
  );
}
