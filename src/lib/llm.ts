// Provider-agnostic LLM call. Swap by env var LLM_PROVIDER.
// Providers: gemini (default) | nim (NVIDIA free tier, OpenAI-compatible)
// Auto-fallback: Gemini → NIM on 429 rate-limit.

type Provider = "gemini" | "nim";

const PROVIDER: Provider = (process.env.LLM_PROVIDER as Provider) || "gemini";

export async function generate(prompt: string): Promise<string> {
  if (PROVIDER === "nim") return callNim(prompt);

  // Gemini primary with NIM fallback on rate-limit.
  try {
    return await callGemini(prompt);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Gemini 429")) {
      console.warn("[llm] Gemini rate-limited, falling back to NIM");
      return callNim(prompt);
    }
    throw err;
  }
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
      max_tokens: 1024,
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
  // DeepSeek-R1 wraps reasoning in <think>...</think> — strip it.
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
