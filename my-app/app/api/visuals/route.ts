import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOption } from "@/app/api/auth/[...nextauth]/route"; // <- use options file

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type GenPayload = {
  rationale?: string;
  html: string;
  css?: string;
  js: string;
};

// ----------------------------- GET -----------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOption);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = session.user.email;

  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") ?? "";

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (topic) {
      const v = await prisma.visual.findUnique({
        where: { userId_topic: { userId: user.id, topic } },
        select: { topic: true, html: true, css: true, js: true, public: true, updatedAt: true },
        select: {
          topic: true,
          html: true,
          css: true,
          js: true,
          updatedAt: true,
        },
      });
      if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ...v, css: v.css ?? "" });
    }

    const list = await prisma.visual.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { topic: true, public: true, updatedAt: true,},
    });
    return NextResponse.json({ items: list });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch visuals", details: e.message },
      { status: 500 }
    );
  }
}

// ----------------------------- PATCH (toggle public) -----------------------------
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOption);
  if (!session?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const email = session.user.email;

  try {
    const { topic, public: isPublic } = await req.json();
    if (!topic || typeof isPublic !== "boolean") {
      return NextResponse.json({ error: "Provide { topic, public:boolean }" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updated = await prisma.visual.update({
      where: { userId_topic: { userId: user.id, topic } },
      data: { public: isPublic },
      select: { topic: true, public: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update visibility", details: e.message }, { status: 500 });
  }
}


// ----------------------------- POST -----------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOption);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = session.user.email;

  try {
    const { topic, forceRegenerate, editPrompt = "" } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

    // Create/read user ID (race-safe: try create, fallback to read)
    let userId: string;
    try {
      const u = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email },
        select: { id: true },
      });
      userId = u.id;
    } catch (e: any) {
      const u = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!u) throw e;
      userId = u.id;
    }

    if (!forceRegenerate) {
      const existing = await prisma.visual.findUnique({
        where: { userId_topic: { userId, topic } },
        select: { html: true, css: true, js: true },
      });
      if (existing) {
        return NextResponse.json({
          topic,
          html: existing.html,
          css: existing.css ?? "",
          js: existing.js,
          cached: true,
        });
      }
    }

    // Prompt (general, no topic hints, but requires rationale)
    const systemPrompt = `
You output compact, production-ready anime.js visuals as strict JSON.

RETURN ONLY JSON (no prose, no backticks):
{
  "rationale": "1–2 lines explaining the visual",
  "html": "<div id=\\"viz\\"><svg id=\\"chart\\" viewBox=\\"0 0 800 400\\" role=\\"img\\" aria-label=\\"...\\"/></div>",
  "css": "/* optional, small */",
  "js": "// uses global 'anime'; targets #viz / #chart"
}

HARD REQUIREMENTS
- HTML MUST start with EXACTLY this container (do not remove or rename IDs):
  <div id="viz"><svg id="chart" viewBox="0 0 800 400" ...></svg></div>
- Keep SVG only (no canvas/img/iframe/external fonts).
- No network calls/imports/eval. Anime.js is already on window as 'anime'.
- ≤ ~150 lines total. Stage animation: axes → labels → objects → highlight.
`.trim();

    var userPrompt;
    if (editPrompt.length == 0) {
      userPrompt = `
        TOPIC
        ${topic}

        AUDIENCE
        - Visual learner; needs a correct, minimal diagram.

        REQUIREMENTS
        - Choose an appropriate minimal visual form (function plot, comparison, process-flow, network, etc.).
        - Provide short labels and only essential motion.

        OUTPUT
        - Return ONLY JSON with { rationale, html, css, js }.
        `.trim();
    } else {
      userPrompt = editPrompt;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let payload: (GenPayload & { rationale?: string }) | null = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) payload = JSON.parse(m[0]) as GenPayload & { rationale?: string };
    }

    if (!payload?.html || !payload?.js) {
      return NextResponse.json(
        { error: "Model returned invalid code" },
        { status: 502 }
      );
    }
    // if (!/id=\\"viz\\"/.test(payload.html) || !/id=\\"chart\\"/.test(payload.html)) {
    //   return NextResponse.json({ error: "HTML must include #viz and an <svg id=\"chart\">" }, { status: 502 });
    // }
    // if (!/\banime\./.test(payload.js)) {
    //   return NextResponse.json({ error: "JS must use anime.*" }, { status: 502 });
    // }

    const stripScripts = (s: string) =>
      s.replace(/<script[^>]*>/gi, "").replace(/<\/script>/gi, "");
    const clean = {
      rationale: (payload.rationale ?? "").trim(),
      html: payload.html,
      css: payload.css ? stripScripts(payload.css) : "",
      js: payload.js,
    };

    const saved = await prisma.visual.upsert({
      where: { userId_topic: { userId, topic } },
      update: {
        html: clean.html,
        css: clean.css || null,
        js: clean.js,
        modelUsed: "gpt-4o-mini",
      },
      create: {
        topic,
        html: clean.html,
        css: clean.css || null,
        js: clean.js,
        modelUsed: "gpt-4o-mini",
        user: { connect: { id: userId } },
      },
      select: { html: true, css: true, js: true, public: true},
    });

    return NextResponse.json({
      topic,
      html: saved.html,
      css: saved.css ?? "",
      js: saved.js,
      public: saved.public,
      cached: false,
      userPrompt: userPrompt,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate visual", details: e.message },
      { status: 500 }
    );
  }
}
