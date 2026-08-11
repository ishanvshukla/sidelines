# Sidelines

A personalized sports news reader. Pick the sports and teams you follow and get a focused feed — headlines from NewsAPI, plus a live "Up Next" widget showing your teams' upcoming games.

## Live site

**[sidelines.onrender.com](https://sidelines.onrender.com)**

Note: the app is hosted on Render's free tier, so it spins down after periods of inactivity — the first load after a while may take up to a minute to wake up.

## Features

- **Personalized onboarding** — two-step setup to select sports and specific teams/players
- **7 sports** — Tennis, NBA Basketball, Soccer, NFL Football, Formula 1, College Football, UFC/MMA
- **Team filtering** — follow specific clubs, players, or programs (e.g. Arsenal, Knicks, Verstappen)
- **Up Next widget** — sidebar showing the next scheduled game for every team and player you follow, powered by TheSportsDB (no NewsAPI quota used)
- **Accounts** — register/log in to sync preferences across devices; guest mode falls back to `localStorage`
- **Server-side caching** — SQLite-backed cache (3h TTL for news, hours-to-days for fixtures) keeps day-to-day browsing well under the NewsAPI free-tier quota, with stale-cache fallback if the API is down or rate-limited
- **Backend proxy** — API key stays server-side; the browser never sees it
- **Edit anytime** — "Edit" button in the header reopens the full onboarding flow

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Framer Motion, Axios |
| Backend | Python 3.12, uvicorn (ASGI), httpx, PyJWT (HS256), PBKDF2-SHA256 |
| Persistence | SQLite (`users.db`) for users/prefs/news cache; Upstash Redis (REST) for the visitor counter in prod, so it survives Render spin-downs |
| Data sources | [NewsAPI](https://newsapi.org) (articles), [TheSportsDB](https://www.thesportsdb.com) (fixtures, free/keyless) |
| Deployment | Docker (multi-stage build), Render (free tier, single web service) |

## Architecture

Sidelines runs as a single Docker service: a Python backend that serves both the JSON API and the built React static files, with no separate frontend host or database server.

```
Browser ── GET /        → static React app
        └─ /api/*        → auth & prefs (SQLite) · news (NewsAPI, cached in SQLite)
                            fixtures (TheSportsDB, cached in SQLite) · visitor count (Redis)
```

- **Auth & prefs** — registration/login issue a JWT (stored client-side); a logged-in user's sport/team selections are saved server-side, while guests fall back to `localStorage` so the app still works without an account.
- **News & fixtures** — the backend proxies every third-party call, so API keys never reach the browser. Each response is cached in SQLite and served from cache while fresh; if an upstream call fails or rate-limits, the last cached response is served regardless of age rather than showing an error.
- **Visitor counter** — the one piece of state not in SQLite. It's backed by Upstash Redis in production because Render's free tier has no persistent disk — a redeploy wipes local SQLite, which would otherwise reset the count on every deploy.
- **Build & deploy** — a multi-stage Docker build compiles the frontend to static assets, then copies them into a slim Python image alongside the backend, so the shipped container has no Node runtime. In local dev, Vite proxies `/api/*` to the backend so both run side by side without CORS configuration.

The frontend authenticates and manages sport/team preferences through the API, storing a JWT and a local copy of prefs in `localStorage` as a guest-mode fallback and offline cache. The backend proxies all third-party calls server-side — the NewsAPI key never reaches the browser — and caches every response in SQLite so repeat requests are served locally instead of re-hitting the upstream APIs, falling back to stale cached data if an upstream call fails. In dev, Vite proxies `/api/*` to the local backend so both run side by side without CORS setup; in prod, the Docker build compiles the frontend into static assets that the same backend process serves directly.

## Running locally

```bash
# backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
echo "NEWS_API_KEY=your_key_here" > .env
uvicorn server:app --reload --port 8000

# frontend (separate terminal)
npm install
npm run dev
```

## Issues run into (and fixes)

**NewsAPI quota exhaustion.** The free NewsAPI tier caps out at 100 requests/day. Early on, the news cache TTL was only 30 minutes, and each unique combination of a user's followed teams minted its own cache key (a per-team query on top of the per-sport one) — so quota usage scaled with the user base instead of staying fixed. Once the app hit the daily cap, a routine redeploy wiped the SQLite file (Render's free tier has no persistent disk), which took the stale-cache fallback down with it and killed headlines for every sport at once. Fixed by (1) raising the cache TTL to 3 hours, keeping worst-case daily requests well under quota even under continuous traffic, and (2) dropping per-team NewsAPI queries entirely — the backend now always fetches the shared sport-wide result set, and team relevance is tagged client-side by scanning that set for followed-team mentions instead of firing a dedicated request per team combination.

**Article rendering: hero card collapse.** The top article in each sport section renders as a large "hero" card that spans two grid rows, sized implicitly by the four compact cards next to/below it. Sports with very few results (boxing had as little as one article on a given day) had no sibling cards to establish that second row's height, so the hero card collapsed to a ~14px sliver. Fixed by only rendering the hero variant when a section has at least 5 articles; below that, everything renders as compact cards.

**Black screen from stale local preferences.** After removing a few sports (cricket, college basketball, boxing) from the app, any browser that still had one of those sport IDs saved in `localStorage` from before the removal would hit an unguarded lookup (`SPORT_MAP[sportId].color`) that returned `undefined`, crashing the whole render tree with no error boundary to catch it — a blank black page with no indication of what went wrong. Fixed with a `sanitizePrefs()` step that strips unrecognized sport IDs wherever preferences are loaded (from `localStorage` or from the server), so retired sport IDs degrade gracefully instead of crashing the app.

**Sparse results from over-narrow queries.** A few sport queries (tennis, NCAA basketball) initially matched only the sport's generic name (e.g. `"tennis"`), which most real headlines don't actually contain — they mention tournaments, tours, or players instead. This produced near-empty sections. Fixed by broadening each query to include tour/event names (ATP, WTA, Wimbledon, March Madness, etc.) and expanding the per-sport domain allowlists against sources confirmed live against NewsAPI.
