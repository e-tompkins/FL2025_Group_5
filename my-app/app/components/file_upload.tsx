"use client";

import React, { useEffect, useRef, useState } from "react";
import "./file_upload.css";

const FileUpload = () => {
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(null);
        setError(null);
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            console.log("Read file bytes:", buffer.byteLength);
        } catch (readErr) {
            console.error("Failed to read file:", readErr);
        }
        const validExt = file.name.toLowerCase().endsWith(".pptx");
        if (!validExt) {
            setError("error: file type must be .pptx");
            // reset input so user can select again
            if (inputRef.current) inputRef.current.value = "";
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            return;
        }
        const url = URL.createObjectURL(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
        setMessage(`Success! ${file.name}`);
    };

    return (
        <>
            <div className="fileUpload">
                <input
                    ref={inputRef}
                    type="file"
                    id="pptx-upload"
                    accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    className="hidden-file-input"
                    onChange={handleChange}
                />
                <label htmlFor="pptx-upload" className="pptx-label">
                    Choose .pptx file
                </label>

                <div style={{ marginTop: 12 }}>
                    {message && (
                        <div className="upload-message" role="status">
                            {message}
                            {previewUrl && (
                                <>
                                    {" "}- <a href={previewUrl} target="_blank" rel="noopener noreferrer">Open preview</a>
                                </>
                            )}
                        </div>
                    )}
                    {error && (
                        <div className="upload-error" role="alert" style={{ color: "#c92a2a" }}>
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FileUpload;