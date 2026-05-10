// Provider-agnostic LLM call. Swap by env var LLM_PROVIDER.
// Providers: gemini (default) | nim | groq
// Auto-fallback chain: Gemini → NIM → Groq on 429 rate-limit.
// Dev mode: skips LLM entirely to avoid burning free-tier quota on hot-reloads.

type Provider = "gemini" | "nim" | "groq";

const PROVIDER: Provider = (process.env.LLM_PROVIDER as Provider) || "gemini";

export async function generate(prompt: string): Promise<string> {
  if (process.env.NODE_ENV === "development") {
    console.info("[llm] dev mode — skipping LLM, using raw RSS fallback");
    return '{"picks":[]}';
  }

  if (PROVIDER === "nim") return callNim(prompt);
  if (PROVIDER === "groq") return callGroq(prompt);

  // Gemini primary → NIM → Groq on rate-limit.
  try {
    return await callGemini(prompt);
  } catch (err) {
    if (!isRateLimit(err, "Gemini")) throw err;
    console.warn("[llm] Gemini rate-limited, falling back to NIM");
  }

  try {
    return await callNim(prompt);
  } catch (err) {
    if (!isRateLimit(err, "NIM")) throw err;
    console.warn("[llm] NIM rate-limited, falling back to Groq");
  }

  return callGroq(prompt);
}

function isRateLimit(err: unknown, prefix: string): boolean {
  return err instanceof Error && err.message.startsWith(`${prefix} 429`);
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error("GOOGLE_GEMINI_API_KEY missing in .env.local");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error(`Gemini returned no text: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return text;
}

async function callNim(prompt: string): Promise<string> {
  const key = process.env.NIM_API_KEY;
  if (!key) throw new Error("NIM_API_KEY missing in .env.local");

  const model = process.env.NIM_MODEL || "deepseek-ai/deepseek-v4-flash";

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 4096,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[nim] ${res.status} for model=${model} body=${body.slice(0, 500)}`);
    throw new Error(`NIM ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error(`NIM returned no text: ${JSON.stringify(data).slice(0, 300)}`);
  }
  // DeepSeek models wrap reasoning in <think>...</think> — strip it.
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

async function callGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY missing in .env.local");

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 4096,
      }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        throw new Error(`Groq returned no text: ${JSON.stringify(data).slice(0, 300)}`);
      }
      return text;
    }

    const body = await res.text();

    if (res.status === 429) {
      const match = body.match(/try again in (\d+(?:\.\d+)?)s/);
      const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : 20_000;
      console.warn(`[groq] rate limited, retrying in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    console.error(`[groq] ${res.status} for model=${model} body=${body.slice(0, 500)}`);
    throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
  }

  throw new Error("Groq: max retries exceeded");
}
