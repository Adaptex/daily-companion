# Design Principles — Daily Companion

Distilled from Nielsen Norman Group, Baymard Institute, Refactoring UI, and observed patterns in indie apps that punch above their weight (Linear, Things, Arc, Granola, NYT, Apple News).

Use as a checklist. Anything that violates 2+ principles = redesign.

---

## Hierarchy & scan-ability

1. **F-pattern reading on dashboards.** Most-important info top-left, decreasing importance down and right. People skim, they don't read.
2. **One hero per surface.** A page with two equally-weighted "main things" has zero. The lead earns the first 2 seconds.
3. **Density follows task.** Briefing surface = airy. Reference data (offer list, calendar) = dense. Match info to intent.

## Typography

4. **Two typefaces max** — display + body. One mono for tabular data and timestamps.
5. **Body line length 50–75 characters.** Wider feels like a comment thread.
6. **Tabular numerals** for any aligned numbers (prices, times, scores).

## Color

7. **Dominant + accent (80/20).** 80% paper/ink, 20% accent. Even palettes look corporate.
8. **Test against grayscale.** If hierarchy collapses without color, the layout is wrong — color is garnish.

## Motion

9. **Animate purpose, not decoration.** Loading, state change, focus shift — yes. Idle hover wiggle — no.
10. **Durations 120–250ms.** Anything longer feels laggy; shorter feels jumpy.
11. **Respect `prefers-reduced-motion`.** Non-negotiable for accessibility.

## Personalization (the core USP rule)

12. **Adapt content, never layout.** Spotify model. Same shelves for everyone; different songs.
13. **Onboarding survey seeds taste, not chrome.** Topics, sources, tone — yes. Colors, fonts, layout — no.
14. **Lightweight 👍/👎 beats long surveys.** Continuous signal > one-time form. Use it on every AI output.

## Trust

15. **Show source on every claim.** Especially AI-curated. One bad summary destroys six good ones.
16. **Fail visibly.** If a feed is down, say so. Silent empty state = broken app to the user.
17. **Editorial date/time visible.** "Composed at 7:42" tells the user this is fresh, not stale.

## Performance

18. **First meaningful paint <1.5s.** Skeleton states, never blank screens.
19. **Cache aggressively, refresh intentionally.** Same content for 10–15 min is fine. Re-render only on user action or interval.

## Information architecture

20. **One scrollable home for daily skim.** Tabs add a click; people don't tap them.
21. **Deep dives get routes, not modals.** `/topic/[slug]` — modals don't bookmark, don't share.
22. **Persistent left rail = navigation. Right drawer = transient AI chat.** Don't double-rail.

---

## Anti-patterns we will not ship

- Adaptive layout based on usage (breaks muscle memory)
- Purple-gradient-on-white (the AI-app cliché)
- More than three font weights on a screen
- Loading spinners > 200ms with no skeleton context
- Auto-playing video, sound, or motion
- Animations that re-trigger on every interaction (motion fatigue)
- "AI generated" labels without source attribution
- Top tab bars for primary navigation
- Forcing onboarding before showing value
