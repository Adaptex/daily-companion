import { NextRequest, NextResponse } from "next/server";

type Message = { role: "user" | "assistant"; content: string };

function buildSystemPrompt(): string {
  const date = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `You are Jarvis, an AI companion built into a personal morning briefing dashboard.

The user is a software engineer in Colombo, Sri Lanka. Today is ${date} (UTC+5:30).

He follows: cricket (Sri Lanka, Chennai Super Kings), F1 (Max Verstappen / Red Bull), football (Arsenal). He reads world news, AI & tech, and tracks Sri Lankan bank offers and deals.

Rules — strictly follow these:
- Your reply will be spoken aloud via text-to-speech, so write in plain spoken English
- Never use markdown, bullet points, numbered lists, headers, or symbols like * or #
- Keep responses to 2 to 3 short sentences unless the user explicitly asks to elaborate
- Be warm, direct, and useful — like a knowledgeable friend who happens to know his interests
- If asked what is in today's news or briefing, say you do not have live access to the feed right now but summarise what you know generally`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const messages: Message[] = body?.messages ?? [];

  if (!messages.length) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { reply: "I am not configured yet. Add a Gemini API key to activate me." },
      { status: 200 },
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Gemini uses "model" role instead of "assistant"
  const contents = messages.slice(-6).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: buildSystemPrompt() }] },
      contents,
      generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[jarvis] Gemini error", res.status, err);
    return NextResponse.json({ error: `API error: ${res.status}` }, { status: 502 });
  }

  const data = await res.json();
  const reply =
    (data.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined) ??
    "Sorry, I could not generate a response.";

  return NextResponse.json({ reply: reply.trim() });
}
