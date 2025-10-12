"use client";

import { useState, useEffect } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { signOut } from "next-auth/react";
import AppBar from "../components/AppBar";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  useEffect(() => {
    var url = "";
    if (file) {
      url = URL.createObjectURL(file);
    }
    console.log(url);
    console.log("file", file);
  }, [file]);

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

    const res = await fetch("/api/process", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Server file path:", data);
    alert(`✅ Uploaded: ${file.name}`);
  };

  return (
    <>
      {/* ✅ Top Navbar */}
      <AppBar />

      {/* ✅ Main Upload Section */}
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "white", // white background as you wanted
        }}
      >
        <Typography variant="h4" fontWeight={600} color="text.secondary" mb={4}>
          Upload Your PDF or PPT
        </Typography>

        <Paper
          elevation={dragActive ? 6 : 3}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            width: "90%",
            maxWidth: 500,
            height: 220,
            border: "2px dashed #aaa",
            borderColor: dragActive ? "#1976d2" : "#ccc",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: dragActive ? "#e3f2fd" : "white",
            transition: "all 0.2s ease",
            textAlign: "center",
            p: 3,
          }}
        >
          <CloudUploadIcon
            color={dragActive ? "primary" : "action"}
            sx={{ fontSize: 50, mb: 2 }}
          />
          <Typography variant="body1" sx={{ mb: 1 }}>
            {file ? file.name : "Drag & drop your file here or click to upload"}
          </Typography>

          <Button variant="outlined" component="label" sx={{ borderRadius: 2 }}>
            Choose File
            <input
              type="file"
              accept={allowedTypes.join(",")}
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Paper>

        <Button
          onClick={handleUpload}
          variant="contained"
          color="primary"
          disabled={!file}
          sx={{ mt: 4, px: 5, py: 1.2, borderRadius: 3 }}
        >
          Upload
        </Button>
      </Box>
    </>
  );
}
