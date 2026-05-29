# SportsFeed

A personalized sports news reader. Pick the sports and teams you follow and get a focused feed pulled from NewsAPI — no unrelated stories.

## Features

- **Personalized onboarding** — two-step setup to select sports and specific teams/players
- **8 sports** — Tennis, NBA Basketball, Cricket, Soccer, NFL Football, College Basketball, Formula 1, College Football
- **Team filtering** — follow specific clubs, players, or programs (e.g. Arsenal, Knicks, Verstappen)
- **Backend proxy** — API key stays server-side; the browser never sees it
- **Persistent preferences** — selections saved to `localStorage`, skips onboarding on return visits
- **Edit anytime** — "Edit" button in the header reopens the full onboarding flow

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend | Python, Starlette, uvicorn, httpx |
| Data | [NewsAPI](https://newsapi.org) |

## Getting started

### 1. Get a NewsAPI key

Sign up for a free key at [newsapi.org](https://newsapi.org).

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

The Vite dev server proxies all `/api` requests to the Python backend on port 8000. The backend holds the `NEWS_API_KEY` and calls NewsAPI server-side, using `searchIn=title,description` to keep results on-topic.

When specific teams are selected, the backend replaces the broad sport query with a targeted `"Team A" OR "Team B"` query, so the feed only returns articles that mention those teams in the headline or description.
