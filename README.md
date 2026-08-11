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
| Backend | Python 3.12, Starlette, uvicorn (ASGI), httpx |
| Auth | PyJWT (HS256), PBKDF2-SHA256 password hashing |
| Persistence | SQLite (`users.db`) — users, prefs, news cache, visitor counter |
| Persistence (prod) | Upstash Redis (REST API) — visitor counter only, survives Render spin-downs |
| Data sources | [NewsAPI](https://newsapi.org) (articles), [TheSportsDB](https://www.thesportsdb.com) (fixtures, free/keyless) |
| Deployment | Docker (multi-stage build), Render (free tier, single web service) |

## Architecture

Sidelines is a single Docker service: a Python/Starlette backend that serves both the JSON API and the built React static files. There's no separate frontend host and no database server — everything lives in one container.

```
Browser
  │
  ├─ GET /                     → static React app (dist/)
  └─ GET/POST /api/*           → Starlette ASGI app (server.py)
                                    │
                                    ├─ /api/auth/register, /api/auth/login   → SQLite users table, JWT issued
                                    ├─ /api/prefs                            → SQLite user_prefs (JSON blob per user)
                                    ├─ /api/visitor                          → Upstash Redis (prod) / SQLite (local)
                                    ├─ /api/news/top, /api/news/sport/{id}   → NewsAPI, cached in SQLite news_cache
                                    └─ /api/scores/next                      → TheSportsDB, cached in SQLite news_cache
```

**Build**: `Dockerfile` is a two-stage build. Stage 1 (`node:20-slim`) runs `npm ci` and `vite build`, producing static assets in `dist/`. Stage 2 (`python:3.12-slim`) installs backend dependencies and copies only `server.py` and the built `dist/` output — no Node runtime ships in the final image. The container runs `uvicorn server:app` on `$PORT` (Render sets this; defaults to 8000 locally).

**Backend (`server.py`)** — a single-file Starlette app:
- **Auth** — `/api/auth/register` and `/api/auth/login` hash passwords with PBKDF2-SHA256 (260k iterations, random salt) and issue a 30-day JWT (HS256). `JWT_SECRET` comes from the environment in production; if unset, a random secret is generated at process start (tokens then reset on every restart — fine for local dev, not for prod).
- **Preferences** — `/api/prefs` (GET/PUT) stores each user's selected sports/teams as a JSON blob in `user_prefs`, keyed by user id. Logged-out users get the same shape persisted to `localStorage` on the client instead.
- **News proxy** — `/api/news/top` and `/api/news/sport/{sport_id}` call NewsAPI's `/v2/everything` endpoint server-side, so `NEWS_API_KEY` never reaches the browser. Each sport has a hand-tuned OR-query (e.g. tennis matches `tennis OR ATP OR WTA OR Wimbledon OR ...`) plus a curated allowlist of source domains (mainstream outlets like ESPN/CBS Sports plus sport-specific blogs, e.g. SB Nation team blogs for NBA). `searchIn=title` keeps results on-topic. Responses are cached in the `news_cache` SQLite table, keyed by a SHA-256 hash of the query params, and served from cache while fresh; if NewsAPI errors or rate-limits, the last cached response is served regardless of age.
- **Fixtures** — `/api/scores/next` resolves each followed team/player to a TheSportsDB team ID (sport-aware, so "LA Rams" doesn't collide with an unrelated team of the same name), then fetches upcoming events. Tennis is special-cased: ATP/WTA don't expose per-player fixture lookups, so the tour's upcoming-match list is scanned for the player's name. Team-ID resolution is cached 7 days; fixtures are cached 2 hours.
- **Visitor counter** — backed by Upstash Redis (REST API, no persistent connection) in production so the count survives Render's free-tier container restarts, which wipe the local SQLite file. Falls back to the SQLite `visitor_counter` table when Redis env vars are unset (e.g. local dev).

**Frontend (`src/`)** — Vite + React 19 + TypeScript:
- `App.tsx` — top-level state machine: onboarding (`SportPicker` → `TeamPicker`) vs. main feed, prefs loaded from `localStorage` or (if logged in) the server, with the server copy taking precedence once auth resolves.
- `contexts/AuthContext.tsx` — JWT stored in `localStorage`, exposes login/register/logout and syncs prefs to the server on change.
- `hooks/useNews.ts` — TanStack Query wrapper around the news endpoints (caching, retry, loading states on the client side, on top of the server-side cache).
- `components/sports/SportSection.tsx` / `ArticleCard.tsx` — renders each sport's articles in a hero + compact grid; `components/sports/NextGameWidget.tsx` renders the "Up Next" sidebar.
- `components/onboarding/` — two-step sport/team picker shown on first visit or via the header's "Edit" button.
- In dev, Vite's dev server proxies `/api/*` to `http://localhost:8000` (see `vite.config.ts`), so `npm run dev` and `uvicorn server:app` run side by side without CORS configuration.

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
