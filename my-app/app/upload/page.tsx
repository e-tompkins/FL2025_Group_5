"use client";

import { useRef, useState } from "react";
import { Box, Button, Typography, Paper, Container, Stack } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AppBar from "../components/AppBar";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      alert("Please upload a PDF or PowerPoint file.");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = () => setDragActive(false);

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
  
    const formData = new FormData();
    formData.append("file", file);
  
    // ⬇️ call the topics endpoint (ensure your file is at /app/api/process/topics/route.ts)
    const res = await fetch("/api/process/topics", { method: "POST", body: formData });
    const data = await res.json();
  
    if (!res.ok) {
      console.error("topics API error:", data);
      alert(data?.error || "Processing failed");
      return;
    }
  
    const topics: string[] = Array.isArray(data?.topics) ? data.topics : [];
    console.log("DEBUG topics:", topics);
  
    // ⬇️ encode topics for /topics page
    const encoded = encodeURIComponent(btoa(JSON.stringify(topics)));
    router.push(`/topics?data=${encoded}`);
  };
  

  return (
    <>
      <AppBar />

      {/* Single responsive section: no negative margins, no overlap */}
      <Box
        sx={{
          bgcolor: "white",
          minHeight: "100dvh", // respects mobile browser UI
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            pt: { xs: 4, sm: 6, md: 8 }, // push content up a bit but stay responsive
            pb: { xs: 6, sm: 8 },
          }}
        >
          <Stack spacing={{ xs: 3, sm: 4, md: 5 }} alignItems="center" textAlign="center">
            {/* Hero */}
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: "#3c82af",
                  // scales with viewport; clamps prevent extremes
                  fontSize: {
                    xs: "clamp(22px, 6vw, 34px)",
                    sm: "clamp(26px, 5vw, 40px)",
                    md: "48px",
                  },
                  mb: { xs: 1, md: 1.5 },
                }}
              >
                VisuaLize your Learning
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  maxWidth: 720,
                  mx: "auto",
                }}
              >
                Upload to transform your study materials into engaging visual aids with VisuaLearn.
              </Typography>
            </Box>

            {/* Dropzone */}
            <Paper
              elevation={dragActive ? 6 : 3}
              onClick={() => inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                width: "100%",
                maxWidth: 560,
                height: { xs: 160, sm: 200, md: 220 }, // responsive height
                border: "2px dashed",
                borderColor: dragActive ? "primary.main" : "divider",
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: dragActive ? "action.hover" : "background.paper",
                transition: "all 0.2s ease",
                p: { xs: 2, sm: 3 },
              }}
            >
              <CloudUploadIcon color={dragActive ? "primary" : "action"} sx={{ fontSize: { xs: 38, sm: 46 }, mb: 1.5 }} />

              <Typography
                variant="body1"
                sx={{
                  mb: 1.5,
                  px: 1,
                  overflowWrap: "anywhere", // long filenames won't overflow
                  wordBreak: "break-word",
                  maxWidth: "90%",
                }}
              >
                {file ? file.name : "Drag & drop your file here or click to upload"}
              </Typography>

              <Button variant="outlined" component="label" sx={{ borderRadius: 2 }}>
                Choose File
                <input
                  ref={inputRef}
                  type="file"
                  accept={allowedTypes.join(",")}
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Paper>

            {/* Action */}
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={!file}
              sx={{
                px: { xs: 4, sm: 5 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Upload
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
