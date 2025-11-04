"use client";

import { useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Stack,
  LinearProgress,
  useTheme,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AppBar from "../components/AppBar";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700"] });

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const theme = useTheme();

  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("HANDLE FILE CHANGE");
    const selectedFile = e.target.files?.[0];
    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      alert("Please upload a PDF or PowerPoint file.");
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && allowedTypes.includes(droppedFile.type)) {
      setFile(droppedFile);
    } else {
      alert("Please upload a PDF or PowerPoint file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/process/topics", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      console.error("topics API error:", data);
      alert(data?.error || "Processing failed");
      return;
    }

    const topics: string[] = Array.isArray(data?.topics) ? data.topics : [];
    const encoded = encodeURIComponent(btoa(JSON.stringify(topics)));
    router.push(`/topics?data=${encoded}`);
  };

  return (
    <>
      <AppBar />

      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, #eef3f9 0%, #fdfdfd 100%)"
              : "linear-gradient(135deg, #0d1117 0%, #1a1d23 100%)",
          transition: "background 0.3s ease",
          px: 3,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={6}
            alignItems="center"
            justifyContent="center"
            sx={{
              textAlign: { xs: "center", md: "left" },
              py: { xs: 8, md: 12 },
            }}
          >
            {/* LEFT: HERO TEXT */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ flex: 1 }}
            >
              <Typography
                variant="h2"
                className={poppins.className}
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: "2rem", md: "3rem" },
                  lineHeight: 1.2,
                  background:
                    theme.palette.mode === "light"
                      ? "linear-gradient(90deg, #1976d2, #9c27b0)"
                      : "linear-gradient(90deg, #90caf9, #ce93d8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Turn your notes into
                <br />
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  visual stories.
                </motion.span>
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  maxWidth: 480,
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                Upload your study slides or documents and let AI craft engaging
                visuals to make concepts stick — beautifully and intuitively.
              </Typography>

              <Button
                onClick={() => inputRef.current?.click()}
                variant="contained"
                size="large"
                sx={{
                  borderRadius: 3,
                  px: 5,
                  py: 1.3,
                  fontSize: "1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 8px 24px rgba(25, 118, 210, 0.2)",
                }}
              >
                Get Started
              </Button>
            </motion.div>

            {/* RIGHT: UPLOAD CARD */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ flex: 1 }}
            >
              <Paper
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                elevation={10}
                sx={{
                  position: "relative",
                  borderRadius: 5,
                  p: 5,
                  textAlign: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(12px)",
                  background:
                    theme.palette.mode === "light"
                      ? "rgba(255, 255, 255, 0.8)"
                      : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CloudUploadIcon
                  sx={{
                    fontSize: 60,
                    color: theme.palette.primary.main,
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {file ? file.name : "Drag & Drop or Click to Upload"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Upload your PDF or PowerPoint presentation
                </Typography>

                <Button
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.2,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // <-- STOPS BUBBLING
                    inputRef.current?.click();
                  }}
                >
                  Choose File
                </Button>

                <input
                  ref={inputRef}
                  type="file"
                  accept={allowedTypes.join(",")}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                {uploading && (
                  <Box sx={{ mt: 3 }}>
                    <LinearProgress />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Processing your file...
                    </Typography>
                  </Box>
                )}

                {file && !uploading && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      handleUpload(); 
                    }}
                    variant="contained"
                    fullWidth
                    sx={{
                      mt: 4,
                      borderRadius: 3,
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Generate Visuals
                  </Button>
                )}
              </Paper>
            </motion.div>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
