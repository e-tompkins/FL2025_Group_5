import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import processUploadedFile from "./process";
import extractWordsFromPDF from "./nlp"
import imageCreate from "./image_create";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Normalize filename and write file
    const safeName = path.basename(file.name || `upload-${Date.now()}`);
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
  await fs.promises.writeFile(filePath, buffer);

    // Process the uploaded file (server-side) and return the processed result
    const processed = await processUploadedFile(buffer, filename);
    const words = extractWordsFromPDF(processed);
    const test_sentence = await imageCreate(words);
    return NextResponse.json({ test_sentence });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
};
