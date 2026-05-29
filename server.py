import os
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

load_dotenv()

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
NEWS_API_BASE = "https://newsapi.org/v2/everything"

SPORT_QUERIES: dict[str, str] = {
    "tennis": "tennis",
    "basketball": "basketball NBA",
    "cricket": "cricket IPL",
    "soccer": 'soccer OR "Premier League" OR "La Liga" OR MLS',
    "nfl": 'NFL OR "American football" OR quarterback',
    "ncaa-basketball": '"college basketball" OR "NCAA basketball" OR "March Madness"',
    "formula1": '"Formula 1" OR "Formula One" OR "Grand Prix"',
    "ncaa-football": '"college football" OR "NCAA football" OR "bowl game"',
}

http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: Starlette):
    global http_client
    http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await http_client.aclose()


async def _fetch_news(q: str, page_size: int, search_in: str = "title,description") -> JSONResponse:
    if not NEWS_API_KEY:
        return JSONResponse({"error": "NEWS_API_KEY not configured on server"}, status_code=500)
    resp = await http_client.get(
        NEWS_API_BASE,
        params={"q": q, "searchIn": search_in, "language": "en", "sortBy": "publishedAt", "pageSize": page_size, "apiKey": NEWS_API_KEY},
    )
    return JSONResponse(resp.json(), status_code=resp.status_code)


async def top_stories(request: Request) -> JSONResponse:
    return await _fetch_news("tennis OR basketball OR cricket", 6)


async def sport_news(request: Request) -> JSONResponse:
    sport_id = request.path_params["sport_id"]
    if sport_id not in SPORT_QUERIES:
        return JSONResponse({"error": f"Unknown sport: {sport_id}"}, status_code=404)
    page_size = int(request.query_params.get("pageSize", "8"))

    teams_param = request.query_params.get("teams", "")
    if teams_param:
        terms = [t.strip() for t in teams_param.split(",") if t.strip()]
        query = " OR ".join(f'"{t}"' for t in terms)
    else:
        query = SPORT_QUERIES[sport_id]

    return await _fetch_news(query, page_size)


app = Starlette(
    lifespan=lifespan,
    routes=[
        Route("/api/news/top", top_stories),
        Route("/api/news/sport/{sport_id}", sport_news),
    ],
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:5173"],
            allow_methods=["GET"],
            allow_headers=["*"],
        )
    ],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
