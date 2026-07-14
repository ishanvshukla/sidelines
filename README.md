# Sidelines

A personalized sports news reader. Pick the sports and teams you follow and get a focused feed — headlines from NewsAPI, plus a live "Up Next" widget showing your teams' upcoming games.

## Features

- **Personalized onboarding** — two-step setup to select sports and specific teams/players
- **10 sports** — Tennis, NBA Basketball, Cricket, Soccer, NFL Football, College Basketball, Formula 1, College Football, UFC/MMA, Boxing
- **Team filtering** — follow specific clubs, players, or programs (e.g. Arsenal, Knicks, Verstappen)
- **Up Next widget** — sidebar showing the next scheduled game for every team and player you follow, powered by TheSportsDB (no NewsAPI quota used)
- **Accounts** — register/log in to sync preferences across devices; guest mode falls back to `localStorage`
- **Server-side caching** — SQLite-backed cache (30-min TTL for news, longer for fixtures) keeps day-to-day browsing well under the NewsAPI free-tier quota, with stale-cache fallback if the API is down or rate-limited
- **Backend proxy** — API key stays server-side; the browser never sees it
- **Edit anytime** — "Edit" button in the header reopens the full onboarding flow

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Framer Motion |
| Backend | Python, Starlette, uvicorn, httpx, SQLite |
| Data | [NewsAPI](https://newsapi.org) (articles), [TheSportsDB](https://www.thesportsdb.com) (fixtures) |

## Getting started

### 1. Get a NewsAPI key

Sign up for a free key at [newsapi.org](https://newsapi.org). TheSportsDB needs no key.

### 2. Configure environment

Create a `.env` file in the project root:

```
NEWS_API_KEY=your_key_here
```

### 3. Install dependencies

```bash
# Python backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install starlette uvicorn httpx python-dotenv

# Frontend
npm install
```

### 4. Run

Start both servers in separate terminals:

```bash
# Terminal 1 — backend (port 8000)
python server.py

# Terminal 2 — frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## How it works

The Vite dev server proxies all `/api` requests to the Python backend on port 8000. The backend holds the `NEWS_API_KEY` and calls NewsAPI server-side, using `searchIn=title,description` to keep results on-topic. Responses are cached in a local SQLite database (`users.db`) so repeated visits don't burn API quota, and the cache is served stale if NewsAPI errors or rate-limits.

When specific teams are selected, the backend replaces the broad sport query with a targeted `"Team A" OR "Team B"` query, so the feed only returns articles that mention those teams in the headline or description.

The Up Next widget resolves each followed team or player to a TheSportsDB ID (sport-aware, so "LA Rams" doesn't match a college basketball team), then fetches upcoming events — including ATP/WTA tennis matches, which are found by scanning the tour's upcoming fixtures for the player's name.
