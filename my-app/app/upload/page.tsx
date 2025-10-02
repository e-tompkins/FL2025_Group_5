"use client";

import { useState } from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { signOut } from "next-auth/react";


export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
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
        if (droppedFile && droppedFile.type === "application/pdf") {
            setFile(droppedFile);
        } else {
            alert("Please upload a PDF file.");
        }
    };

    const handleUpload = () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }
        alert(`✅ Uploaded: ${file.name}`);
    };

    return (
        <Box
            sx={{
                height: "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "#f5f5f5",
            }}
        >
            <Typography variant="h4" fontWeight={600} color="text.secondary" mb={4}>
                Upload Your PDF
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
                <CloudUploadIcon color={dragActive ? "primary" : "action"} sx={{ fontSize: 50, mb: 2 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                    {file ? file.name : "Drag & drop your PDF here or click to upload"}
                </Typography>

                <Button variant="outlined" component="label" sx={{ borderRadius: 2 }}>
                    Choose File
                    <input type="file" accept="allowedTypes" hidden onChange={handleFileChange} />
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

            <Button
                variant="outlined"
                color="error"
                onClick={() => signOut({ callbackUrl: "/login" })}
                sx={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    borderRadius: 2,
                    textTransform: "none",
                }}
            >
                Logout
            </Button>
        </Box>
    );
}