# Sports Card & Subpage — Desk Research

Scope: design inputs for a "Sports" card on the dashboard home (~1/3 of a 3-col grid, editorial "Morning Edition" aesthetic) plus a future `/topic/sports` subpage. Users: cricket (IPL), F1, football (engineer in Sri Lanka) + dad (TBD). Personalize content, not layout.

## 1. What sports users open first

Cross-source consensus: a **live or imminent score** is the single highest-priority surface. Flashscore explicitly positions itself as a "digital second screen" because "fans no longer want to wait for post-match reports... they crave real-time scores" ([Social News Daily](https://socialnewsdaily.com/how-flashscore-redefines-livescore-access-for-modern-sports-fans/)). theScore's home is built around three tabs in priority order — **Favorites → Scores → Leagues** ([Google Play](https://play.google.com/store/apps/details?id=com.fivemobile.thescore&hl=en_US)). IBM's 20,000-fan / 12-country study (cited via WSC Sports) found the two most-valued content traits are **summarised** and **personalised** content; 73% of fans use sports apps, 87% of 18–29s ([WSC Sports](https://wsc-sports.com/blog/industry-insights/the-new-home-court-why-sports-apps-are-becoming-fans-primary-destination/)). BBC Sport's design principle is to "display core information... so users see the most important news in the shortest possible time" ([Mockplus](https://www.mockplus.com/sample/post/bbc-sport)).

Implication: when a match the user cares about is live, score wins. When nothing is live, **next-fixture countdown** + a single editorial headline wins.

## 2. Information hierarchy in winning apps

- **theScore**: Favorites feed first, then live Scores grid, then League index ([Google Play](https://play.google.com/store/apps/details?id=com.fivemobile.thescore&hl=en_US)).
- **Onefootball**: Home is a personalised news/video/transfers feed driven by followed teams ([OneFootball Help](https://onefootballsupport.zendesk.com/hc/en-us/articles/4412970161937)).
- **Cricbuzz**: scores strip pinned at top; commentary tab uses pill-jumps to Graphs / Series Stats / Points Table — ball-by-ball pacing matches TV, faster than Cricinfo's ~2-ball lag ([Apple App Store](https://apps.apple.com/us/app/cricbuzz-live-cricket-scores/id360466413)). UX critique flags clutter from "scores, banners, news, and videos all competing for attention" ([Akshay, Medium](https://medium.com/@akshayacharya96/reimagining-cricbuzz-a-quick-ux-case-study-on-the-website-experience-4478ab359067)).
- **F1 official app**: live timing + session schedule are the centre of gravity; the 2025 redesign was widely panned for hiding the weekend overview behind per-session scrolling ([JustUseApp reviews](https://justuseapp.com/en/app/835022598/formula-1/reviews)).
- **BBC Sport**: editorial mixture of "by category" and "by sport" indices, with a stated goal of minimising scroll-to-find ([Mockplus](https://www.mockplus.com/sample/post/bbc-sport)).
- **Flashscore**: a flat list of today's matches by competition is the entire above-the-fold ([Social News Daily](https://socialnewsdaily.com/how-flashscore-redefines-livescore-access-for-modern-sports-fans/)).

Pattern: **state-strip on top (live/next), personalised story feed below.**

## 3. Personalisation that works

Onboarding favourite teams/competitions drives a "For You / Top Stories" split — users get a tailored feed without losing serendipity ([WSC Sports](https://wsc-sports.com/blog/industry-insights/the-new-home-court-why-sports-apps-are-becoming-fans-primary-destination/)). theScore's "Favorites" tab is the default landing surface and is reorderable ([Google Play](https://play.google.com/store/apps/details?id=com.fivemobile.thescore&hl=en_US)). Lead-story selection should weight by (a) followed team involvement, (b) recency, (c) match-state proximity (live > today > this week).

## 4. Sport-specific notes

- **Cricket / IPL**: live match is the centre — ball-by-ball commentary is culturally load-bearing, and lock-screen score widgets are an explicit Indian-market ask ([Cricket Pulse Live](https://cricketpulse.live/)). During IPL season (Mar–May), expect daily evening match — the card should default to "match starts in Xh" then flip to live-score on toss.
- **F1**: information needs are bimodal. Race weekend (Fri–Sun) wants session schedule + live timing + results; off-week wants standings, news, next-GP countdown ([Formula1.com beginner guide](https://www.formula1.com/en/latest/article/the-beginners-guide-to-the-formula-1-weekend.5RFZzGXNhEi9AEuMXwo987)). Sprint vs. standard weekends differ — the card must show the actual session list, not assume FP1/FP2/FP3/Q/R.
- **Football**: ~53% of UK fans care about fixtures/results/match reports, ~47% about transfer rumours — nearly equal ([Statista via football-talk.co.uk](https://football-talk.co.uk/231466/how-transfer-rumours-shape-fan-expectations-in-modern-football)). Off-season relevance is sustained by transfer news; in-season weight fixtures.

## 5. Anti-patterns / common complaints

- **Notification spam & no granularity**: ESPN users get "5–10 notifications per hour" for sports they don't follow with no per-team mute ([BroBible](https://brobible.com/sports/article/espn-made-significant-updates-to-its-mobile-app-and-now-everyone-hates-it/)). Onefootball user reported "100+ notifications at 2am" and goal alerts that omit the scorer's name ([Trustpilot](https://www.trustpilot.com/review/onefootball.com)).
- **Spoiler leaks in push**: F1 app push notifications reveal results before users open the app ([JustUseApp](https://justuseapp.com/en/app/835022598/formula-1/reviews)).
- **Bloat/perf**: ESPN "video, ads, cookies slow it to a crawl"; app freezes TVs ([HowToGeek](https://www.howtogeek.com/the-espn-app-is-awful-but-i-cant-stop-using-it/)).
- **Ad density**: Onefootball ads "ruin UI and prevent scrolling"; betting promotion is "unavoidable" ([Trustpilot](https://www.trustpilot.com/review/onefootball.com)).
- **Hidden overviews**: F1 2025 redesign forces per-session scrolling instead of one weekend view ([JustUseApp](https://justuseapp.com/en/app/835022598/formula-1/reviews)).
- **Cluttered home**: Cricbuzz critique — equal-weighting of every content type creates cognitive overload ([Medium](https://medium.com/@akshayacharya96/reimagining-cricbuzz-a-quick-ux-case-study-on-the-website-experience-4478ab359067)).

## 6. Recommendation — Sports CARD (dashboard home, ~1/3 col)

Mirror the existing World&AI lead-story + secondary-list pattern, but prepend a **single state-aware status strip** that resolves in this priority:

1. **LIVE NOW** (any followed team/sport) — score + over/lap/minute, one line.
2. **NEXT MATCH IN Xh Ym** — team vs. team, kickoff time local.
3. **YESTERDAY'S RESULT** — only if nothing live and nothing within 24h ahead.

Below the strip: **one lead headline** (editorial weight — match report, big transfer, F1 controversy) + **2–3 secondary headlines**. No score grids, no standings — those belong to the subpage. No images on the card itself (Morning Edition aesthetic, matches World&AI). Sport-tag prefix on each headline (`CRICKET ·`, `F1 ·`, `FOOTBALL ·`) for at-a-glance scanning. Avoid the ESPN/Onefootball anti-pattern of mixing in items the user doesn't follow.

## 7. Recommendation — `/topic/sports` SUBPAGE

Newspaper-section feel, in this order:

1. **Live & Today** — any live matches (followed first, then notable), today's fixtures with kickoff times.
2. **Followed teams strip** — last result + next fixture per team (cricket team, F1 (driver/constructor), football clubs).
3. **Lead editorial** — biggest story of the day across the user's sports, with 2–3 paragraphs.
4. **Sport sections** in priority order based on what's "in season" — e.g. during IPL, Cricket leads with live scorecard + ball-by-ball excerpt + points table; F1 race-week leads with weekend session schedule + last session result; off-week shows standings + countdown.
5. **Transfers / off-field** — football transfer rumours, F1 silly season, IPL auction news (seasonal weighting).
6. **Standings / tables** — collapsed by default, expand-on-click.

Data sources to evaluate: ESPNcricinfo or Cricbuzz (cricket — Cricbuzz has faster ball-by-ball but no public API; Cricinfo via paid feeds), Ergast/Jolpica (F1, free), Football-Data.org or API-Football (football). Pull editorial headlines from BBC Sport RSS + ESPNcricinfo RSS + Autosport RSS to stay vendor-neutral and cheap.

Key discipline: **never push a notification that spoils a result** (F1 lesson), **always allow per-team/per-sport mute** (ESPN/Onefootball lesson), and **keep the card itself sparse** — the subpage is where density lives.
