// Standalone script — run by GitHub Actions daily.
// Uses the same scraping logic as the Vercel cron route.
import { scrapeAllBanks } from "../src/lib/scrape-offers";

async function main() {
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
