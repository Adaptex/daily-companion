<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI Quality Gate

- Before declaring any UI or frontend change done, preview it in the browser and verify it with Playwright.
- Check both the rendered screenshot and the live DOM or state so formatting, spacing, labels, and overflow are confirmed, not assumed.
- If the visual result looks off, inconsistent, or cramped, fix it before calling the work complete.
- Treat UI work like a QA review: high standards, conservative changes, and no “done” without a real browser check.

## Functional Quality Gate

- Before declaring behavior or data changes done, verify the real user flow end to end, not just the code path.
- Check edge cases, stale data, empty states, error states, and category or ranking regressions with live data when possible.
- If a change affects shared logic, normalization, or ranking, validate representative examples and make sure the output is explainable.
- Prefer the smallest safe fix, but do not stop at a superficial patch if the underlying behavior is still wrong.
- Think like a functional engineer: correctness, resilience, and user trust come before cosmetic polish.
