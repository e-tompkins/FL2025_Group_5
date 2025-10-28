import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import processUploadedFile from "../process";
import extractWordsFromPDF from "../nlp";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Save uploaded file temporarily
    const uploadDir = path.join(process.cwd(), "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });
    const safeName = path.basename(file.name || `upload-${Date.now()}`);
    const filePath = path.join(uploadDir, `${Date.now()}-${safeName}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    // Parse PDF and extract keywords
    const processed = await processUploadedFile(buffer, filePath);
    const words = extractWordsFromPDF(processed);
    const textSample = words.join(" ");

    // Build prompt for OpenAI
    const prompt = `
You are an expert educator. 
Given the following extracted text/keywords from a study material, list the 5-10 most important and distinct high-level topics (not subpoints).
Return only valid JSON in this exact format:
{"topics":["Topic 1","Topic 2","..."]}

Text:
${textSample}
    `;

    // Request completion
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You extract key educational topics." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const outputText = completion.choices?.[0]?.message?.content ?? "";
    let topics: string[] = [];

    try {
      const parsed = JSON.parse(outputText);
      if (Array.isArray(parsed.topics)) {
        topics = parsed.topics.slice(0, 10);
      } else {
        throw new Error("Invalid JSON");
      }
    } catch {
      // fallback: split on newlines or commas
      topics = outputText
        .split(/[\n,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);
    }

    return NextResponse.json({ topics });
  } catch (err: any) {
    console.error("Topic extraction failed:", err);
    return NextResponse.json(
      { error: "Failed to extract topics", details: err.message },
      { status: 500 }
    );
  }
};
