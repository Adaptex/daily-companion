// Standalone script — run by GitHub Actions daily.
// dotenv must be configured before any module that reads process.env is loaded.
import { config } from "dotenv";
config({ path: ".env.local" }); // no-op in CI where env vars are injected directly

async function main() {
  // Dynamic import ensures supabase/llm modules load AFTER dotenv has set env vars.
  const { scrapeAllBanks } = await import("../src/lib/scrape-offers");

  const results = await scrapeAllBanks();
  const ok = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log(JSON.stringify({ ok, failed, results, ranAt: new Date().toISOString() }, null, 2));

  if (ok === 0) {
    console.error("All banks failed — exiting with error");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
