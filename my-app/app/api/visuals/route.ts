import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOption } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type GenPayload = {
  rationale?: string;
  html: string;
  css?: string;
  js: string;
};

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------

function normalizeTopic(raw: string | null | undefined): string {
  if (!raw) return "";
  let t = decodeURIComponent(raw).trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

const stripScripts = (s: string) =>
  (s || "").replace(/<script[^>]*>/gi, "").replace(/<\/script>/gi, "");

function clean(s: string) {
  return stripScripts(s || "");
}

/**
 * Minimal, white card that ONLY shows a Restart button and the Mermaid diagram.
 * (No inner title or description — those stay in the page chrome.)
 */
function mermaidCardHTML(diagramCode: string) {
  const code =
    diagramCode.trim().startsWith("<pre") && diagramCode.includes("mermaid")
      ? diagramCode.trim()
      : `<pre class="mermaid">\n${diagramCode.trim()}\n</pre>`;

  return `
<div id="viz-card" style="max-width:1000px;margin:0 auto;">
  <div style="display:flex;justify-content:flex-end;margin:6px 0 10px;">
    <button id="restart" style="border:1px solid #e5e7eb;background:#ffffff;border-radius:12px;padding:8px 12px;font-weight:600;cursor:pointer">
      Restart
    </button>
  </div>

  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:auto;padding:12px;min-height:240px">
    ${code}
  </div>
</div>

<!-- Mermaid -->
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    themeVariables: {
      background: "#ffffff",
      primaryTextColor: "#0b0f19",
      lineColor: "#94a3b8"
    }
  });

  async function runAll(){
    try {
      await new Promise(r => setTimeout(r, 0));
      await mermaid.run({ querySelector: ".mermaid" });
    } catch(e) {
      console.error("Mermaid render error:", e);
    }
  }

  runAll();

  const btn = document.getElementById("restart");
  if (btn) {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".mermaid").forEach(n => n.removeAttribute("data-processed"));
      await runAll();
      btn.focus();
    });
  }
</script>
`.trim();
}

// -----------------------------------------------------------
// Hardcoded Mermaid visuals
// -----------------------------------------------------------

const HARD: Record<
  string,
  { rationale: string; html: string; css: string; js: string }
> = {
  "depth first search": {
    rationale:
      "Depth-first search explores one path as far as possible, then backtracks.",
    html: mermaidCardHTML(`
graph TD
  A[Start at node] --> B{Visited?}
  B -- "Yes" --> C[Backtrack]
  B -- "No" --> D[Mark visited]
  D --> E[Pick next neighbor]
  E --> F{Neighbor exists?}
  F -- "Yes" --> A
  F -- "No" --> C
    `),
    css: "",
    js: "",
  },
  "earth's core": {
    rationale:
      "Earth is layered concentrically: crust (thin), mantle (thick), liquid outer core, solid inner core.",
    html: mermaidCardHTML(`
mindmap
  root((Earth))
    Crust["Crust (5–70 km)"]
      Oceanic["Oceanic (thin)"]
      Continental["Continental (thicker)"]
    Mantle["Mantle (~2,900 km)"]
      Upper["Upper mantle"]
      Lower["Lower mantle"]
    OuterCore["Outer core (liquid iron)"]
    InnerCore["Inner core (solid iron)"]
    `),
    css: "",
    js: "",
  },
  "maslow's hierarchy of needs": {
    rationale:
      "Maslow’s theory stacks needs from basic to growth; lower levels support higher motivations.",
    html: mermaidCardHTML(`
flowchart TB
  E[Physiological] --> D[Safety] --> C[Love / Belonging] --> B[Esteem] --> A[Self-Actualization]
  A --> T[Self-Transcendence]
  classDef base fill:#eef2ff,stroke:#1e3a8a,color:#0b0f19;
  classDef mid fill:#e0f2fe,stroke:#0369a1,color:#0b0f19;
  classDef high fill:#dcfce7,stroke:#166534,color:#0b0f19;
  class E,D base
  class C,B mid
  class A,T high
    `),
    css: "",
    js: "",
  },
  "angular momentum": {
    rationale: "Angular momentum grows with moment of inertia and angular velocity.",
    html: mermaidCardHTML(`
flowchart LR
  Torque -->|causes| Angular_Momentum
  Angular_Momentum --> Inertia
  Angular_Momentum --> Angular_Velocity
  Inertia --> Mass
  Inertia --> Radius
    `),
    css: "",
    js: "",
  },
};

function getHardcoded(topic: string) {
  return HARD[topic.toLowerCase().trim()] ?? null;
}

// ----------------------------- GET -----------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOption);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    const url = new URL(req.url);
    const rawTopic = url.searchParams.get("topic");
    const topic = normalizeTopic(rawTopic);
    const tagParam = url.searchParams.get("tag");
    const mine = url.searchParams.get("mine") === "true"; // for /my-visuals

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ---------- Case 1: Get specific visual by topic ----------
    if (topic) {
      const v = await prisma.visual.findFirst({
        where: {
          topic,
          OR: [{ public: true }, { userId: user.id }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          topic: true,
          html: true,
          css: true,
          js: true,
          public: true,
          tags: true,
          userPrompt: true,
          updatedAt: true,
          rationale: true,
          modelUsed: true,
        },
      });
      if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(v);
    }

    // ---------- Case 2: My Visuals ----------
    if (mine) {
      const myVisuals = await prisma.visual.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          topic: true,
          html: true,
          css: true,
          js: true,
          public: true,
          tags: true,
          userPrompt: true,
          updatedAt: true,
          rationale: true,
          modelUsed: true,
        },
      });
      return NextResponse.json({ items: myVisuals });
    }

    // ---------- Case 3: Tagged search ----------
    if (tagParam) {
      const visualsByTag = await prisma.visual.findMany({
        where: {
          OR: [{ public: true }, { userId: user.id }],
          tags: { array_contains: [tagParam] },
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          topic: true,
          html: true,
          css: true,
          js: true,
          tags: true,
          public: true,
          updatedAt: true,
          rationale: true,
          modelUsed: true,
        },
      });
      return NextResponse.json({ items: visualsByTag });
    }

    // ---------- Case 4: Explore / default ----------
    const publicVisuals = await prisma.visual.findMany({
      where: { public: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        topic: true,
        html: true,
        css: true,
        js: true,
        tags: true,
        public: true,
        updatedAt: true,
        rationale: true,
        modelUsed: true,
      },
    });

    return NextResponse.json({ items: publicVisuals });
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
  if (!session?.user?.email)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const email = session.user.email;

  try {
    const { id, topic: rawTopic, public: isPublic } = await req.json();
    if (typeof isPublic !== "boolean") {
      return NextResponse.json(
        { error: "Provide { id|topic, public:boolean }" },
        { status: 400 }
      );
    }

    const topic = rawTopic ? normalizeTopic(rawTopic) : undefined;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    let updated;
    if (id) {
      updated = await prisma.visual.update({
        where: { id },
        data: { public: isPublic },
        select: { id: true, topic: true, public: true, userPrompt: true },
      });
    } else if (topic) {
      const found = await prisma.visual.findFirst({
        where: { userId: user.id, topic },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      if (!found)
        return NextResponse.json(
          { error: "Visual not found" },
          { status: 404 }
        );
      updated = await prisma.visual.update({
        where: { id: found.id },
        data: { public: isPublic },
        select: { id: true, topic: true, public: true, userPrompt: true },
      });
    } else {
      return NextResponse.json(
        { error: "Missing id or topic" },
        { status: 400 }
      );
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update visibility", details: e.message },
      { status: 500 }
    );
  }
}

// ----------------------------- POST (Mermaid-based visuals, V1-compatible API) -----------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOption);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const email = session.user.email;

  try {
    const {
      topic: rawTopic,
      forceRegenerate = false,
      editPrompt = "",
      relatedTopics = [],
      allTopics = [],
      tags = [],
    } = await req.json();

    const topic = normalizeTopic(rawTopic);
    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

    // Create/read user ID (race-safe, from V1)
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

    // V1-style cache: if we already have a visual for this user/topic, return it
    if (!forceRegenerate) {
      const existing = await prisma.visual.findFirst({
        where: { userId, topic },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          html: true,
          css: true,
          js: true,
          userPrompt: true,
          public: true,
          tags: true,
        },
      });
      if (existing) {
        return NextResponse.json({
          topic,
          html: existing.html,
          css: existing.css ?? "",
          js: existing.js,
          cached: true,
          userPrompt: existing.userPrompt ?? "",
          public: existing.public ?? true,
          tags: existing.tags ?? [],
          id: existing.id,
        });
      }
    }

    // Build deduped tags array: include topic + provided/related/all topics
    const providedTags = Array.isArray(tags) ? tags : [];
    const related = Array.isArray(relatedTopics) ? relatedTopics : [];
    const all = Array.isArray(allTopics) ? allTopics : [];
    const tagsSet = new Set<string>(
      [topic, ...providedTags, ...related, ...all].filter(Boolean)
    );
    const tagsArray = Array.from(tagsSet);

    // Hardcoded Mermaid diagrams
    const hard = getHardcoded(topic);
    if (hard && !forceRegenerate) {
      const saved = await prisma.visual.upsert({
        where: { userId_topic: { userId, topic } } as any,
        update: {
          html: hard.html,
          css: hard.css || null,
          js: hard.js,
          modelUsed: "mermaid-hardcoded",
          rationale: hard.rationale || null,
          userPrompt: null,
          public: true,
          tags: tagsArray,
        },
        create: {
          topic,
          html: hard.html,
          css: hard.css || null,
          js: hard.js,
          modelUsed: "mermaid-hardcoded",
          user: { connect: { id: userId } },
          rationale: hard.rationale || null,
          userPrompt: null,
          public: true,
          tags: tagsArray,
        },
        select: {
          id: true,
          html: true,
          css: true,
          js: true,
          public: true,
          tags: true,
          userPrompt: true,
        },
      });

      return NextResponse.json({
        topic,
        html: saved.html,
        css: saved.css ?? "",
        js: saved.js,
        public: saved.public,
        cached: false,
        userPrompt: saved.userPrompt ?? "",
        tags: saved.tags ?? [],
        id: saved.id,
      });
    }

    // LLM: Mermaid-only visual content, wrapped in our card HTML
    const systemPrompt = `
You output ONLY Mermaid diagram code (no backticks, no HTML tags) and a short "rationale".
Respond as strict JSON:
{
  "rationale": "short explanation",
  "html": "MERMAID_CODE",
  "css": "",
  "js": ""
}

Example html field:
graph TD
  A --> B
`.trim();

    let userPrompt: string;
    if (editPrompt && editPrompt.trim().length > 0) {
      userPrompt = editPrompt;
    } else {
      userPrompt = `
Create a clear, beginner-friendly Mermaid diagram for the concept:
"${topic}"

Guidelines:
- Prefer flowchart / sequence / mindmap depending on what best fits the concept.
- Keep labels concise and readable.
- Focus on conceptual clarity for visual learners.
`.trim();
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion?.choices?.[0]?.message?.content ?? "";
    if (!content) {
      return NextResponse.json(
        { error: "Model returned empty response" },
        { status: 502 }
      );
    }

    let payload: GenPayload | null = null;
    try {
      payload = JSON.parse(content) as GenPayload;
    } catch {
      return NextResponse.json(
        { error: "LLM returned invalid JSON", raw: content.slice(0, 1000) },
        { status: 502 }
      );
    }

    if (!payload?.html) {
      return NextResponse.json(
        { error: "Model returned invalid code" },
        { status: 502 }
      );
    }

    const cardHTML = mermaidCardHTML(payload.html.trim());

    const saved = await prisma.visual.upsert({
      where: { userId_topic: { userId, topic } } as any,
      update: {
        html: cardHTML,
        css: clean(payload.css || ""),
        js: clean(payload.js || ""),
        modelUsed: "mermaid-llm",
        rationale: (payload.rationale ?? "").trim() || null,
        userPrompt: userPrompt || null,
        public: true,
        tags: tagsArray,
      },
      create: {
        topic,
        html: cardHTML,
        css: clean(payload.css || "") || null,
        js: clean(payload.js || ""),
        modelUsed: "mermaid-llm",
        user: { connect: { id: userId } },
        rationale: (payload.rationale ?? "").trim() || null,
        userPrompt: userPrompt || null,
        public: true,
        tags: tagsArray,
      },
      select: {
        id: true,
        html: true,
        css: true,
        js: true,
        public: true,
        tags: true,
        userPrompt: true,
      },
    });

    return NextResponse.json({
      topic,
      html: saved.html,
      css: saved.css ?? "",
      js: saved.js,
      public: saved.public,
      cached: false,
      userPrompt: saved.userPrompt ?? userPrompt,
      tags: saved.tags ?? [],
      id: saved.id,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate visual", details: e.message },
      { status: 500 }
    );
  }
}
