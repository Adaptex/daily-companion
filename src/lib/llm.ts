// Provider-agnostic LLM call. Swap by env var LLM_PROVIDER.
// Today: gemini. Tomorrow: anthropic | openai | ollama | openrouter — same shape.

type Provider = "gemini";

const PROVIDER: Provider = (process.env.LLM_PROVIDER as Provider) || "gemini";

export async function generate(prompt: string): Promise<string> {
  if (PROVIDER === "gemini") return callGemini(prompt);
  throw new Error(`Unknown LLM provider: ${PROVIDER}`);
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
