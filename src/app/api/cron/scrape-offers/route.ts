import { NextResponse } from "next/server";
import { scrapeAllBanks } from "@/lib/scrape-offers";

export const maxDuration = 300;

export async function GET(req: Request) {
  // Vercel cron sends Authorization: Bearer {CRON_SECRET}
  // Manual trigger can pass ?secret= for testing
  const authHeader = req.headers.get("authorization") ?? "";
  const querySecret = new URL(req.url).searchParams.get("secret") ?? "";
  const provided = authHeader.replace("Bearer ", "") || querySecret;

  if (provided !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await scrapeAllBanks();

  const summary = {
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    ranAt: new Date().toISOString(),
  };

  console.info("[cron] scrape-offers complete", summary);
  return NextResponse.json(summary);
}
