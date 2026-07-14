import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from urllib.parse import quote

import httpx
import jwt
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
DB_PATH = os.environ.get("DB_PATH", "users.db")

_jwt_secret = os.environ.get("JWT_SECRET", "")
if not _jwt_secret:
    _jwt_secret = secrets.token_hex(32)
    print("WARNING: JWT_SECRET not set — tokens will reset on each server restart. Add JWT_SECRET to .env")
JWT_SECRET = _jwt_secret
JWT_ALG = "HS256"
JWT_EXPIRE_DAYS = 30

SPORT_QUERIES: dict[str, str] = {
    "tennis": "tennis",
    "basketball": "basketball NBA",
    "cricket": "cricket IPL",
    "soccer": 'soccer OR "Premier League" OR "La Liga" OR MLS',
    "nfl": 'NFL OR "American football" OR quarterback',
    "ncaa-basketball": '"college basketball" OR "NCAA basketball" OR "March Madness"',
    "formula1": '"Formula 1" OR "Formula One" OR "Grand Prix"',
    "ncaa-football": '"college football" OR "NCAA football" OR "bowl game"',
    "ufc": 'UFC OR MMA OR "mixed martial arts"',
    "boxing": 'boxing OR "heavyweight boxing" OR "world championship boxing"',
}

# Per-sport domain allowlists: mainstream sports media + SB Nation/FanSided team blogs.
# Using an allowlist means shopping/deal sites are excluded by default, while quality
# team blogs are pulled in alongside major outlets.
def _d(*domains: str) -> str:
    return ",".join(domains)

_MAINSTREAM = _d(
    "espn.com", "cbssports.com", "nbcsports.com", "si.com", "bleacherreport.com",
    "theathletic.com", "usatoday.com", "sportingnews.com", "theringer.com",
    "apnews.com", "reuters.com",
)

SPORT_DOMAINS: dict[str, str] = {
    "basketball": _d(
        _MAINSTREAM, "nba.com",
        # NBA-specialist sites
        "hoopshype.com", "hoopsrumors.com", "slamonline.com",
        "basketballnews.com", "clutchpoints.com",
        # SB Nation NBA team blogs
        "sbnation.com",
        "silverscreenandroll.com",   # Lakers
        "celticsblog.com",           # Celtics
        "goldenstateofmind.com",     # Warriors
        "postingandtoasting.com",    # Knicks
        "poundingtherock.com",       # Spurs
        "hothothoops.com",           # Heat
        "clipsnation.com",           # Clippers
        "libertyballers.com",        # 76ers
        "peachtreehoops.com",        # Hawks
        "netsdaily.com",             # Nets
        "welcometoloudcity.com",     # Thunder
        "mavsmaniacs.com",           # Mavericks
        "nuggetsnews.com",           # Nuggets
        # FanSided (covers all NBA teams)
        "fansided.com",
    ),

    "nfl": _d(
        _MAINSTREAM, "nfl.com",
        # NFL-specialist sites
        "profootballfocus.com", "footballoutsiders.com",
        # SB Nation NFL team blogs
        "sbnation.com",
        "ninersnation.com",          # 49ers
        "bloggingtheboys.com",       # Cowboys
        "arrowheadpride.com",        # Chiefs
        "acmepackingcompany.com",    # Packers
        "bleedingreennation.com",    # Eagles
        "behindthesteelcurtain.com", # Steelers
        "bigblueview.com",           # Giants
        "ganggreennation.com",       # Jets
        "dawgsbynature.com",         # Browns
        "fieldgulls.com",            # Seahawks
        "milehighreport.com",        # Broncos
        "bucsnation.com",            # Buccaneers
        "canalstreetchronicles.com", # Saints
        "dailynorseman.com",         # Vikings
        "patspulpit.com",            # Patriots
        "windycitygridiron.com",     # Bears
        "cincinnatijungle.com",      # Bengals
        "thephinsider.com",          # Dolphins
        "silverandblackpride.com",   # Raiders
        "turfshowtimes.com",         # Rams
        # FanSided (covers all NFL teams)
        "fansided.com",
    ),

    "cricket": _d(
        "bbc.co.uk", "theguardian.com", "skysports.com", "reuters.com", "apnews.com",
        # Indian outlets (massive cricket audience)
        "timesofindia.com", "hindustantimes.com", "ndtv.com",
        # Cricket-specialist sites & blogs
        "espncricinfo.com", "cricbuzz.com", "wisden.com",
        "cricket.com.au", "icc-cricket.com", "sportskeeda.com", "cricblog.net",
    ),

    "soccer": _d(
        "espn.com", "cbssports.com", "si.com", "bleacherreport.com",
        "theathletic.com", "bbc.co.uk", "theguardian.com", "skysports.com",
        "reuters.com", "apnews.com",
        # Soccer-specialist sites
        "goal.com", "90min.com", "givemesport.com", "worldsoccertalk.com",
        "caughtoffside.com", "mlssoccer.com", "americansoccernow.com",
        "soccernews.com", "transfermarkt.us",
        # SB Nation soccer blogs
        "sbnation.com", "theshortfuse.com",   # Arsenal
        # FanSided
        "fansided.com",
    ),

    "formula1": _d(
        "espn.com", "bbc.co.uk", "theguardian.com", "skysports.com",
        "reuters.com", "apnews.com", "si.com",
        # F1-specialist sites & blogs
        "racefans.net", "planetf1.com", "motorsport.com", "autosport.com",
        "the-race.com", "grandprix.com", "f1-fansite.com", "beyondtheflag.com",
        "formula1.com",
    ),

    "ncaa-basketball": _d(
        "espn.com", "cbssports.com", "si.com", "bleacherreport.com",
        "theathletic.com", "usatoday.com", "sportingnews.com", "apnews.com",
        # College sports specialists
        "247sports.com", "rivals.com", "on3.com", "collegespun.com",
        "sbnation.com", "fansided.com",
    ),

    "ncaa-football": _d(
        "espn.com", "cbssports.com", "si.com", "bleacherreport.com",
        "theathletic.com", "usatoday.com", "sportingnews.com", "apnews.com",
        # College sports specialists
        "247sports.com", "rivals.com", "on3.com", "collegefootballnews.com",
        "sbnation.com", "fansided.com",
    ),

    "tennis": _d(
        "espn.com", "si.com", "bbc.co.uk", "theguardian.com",
        "reuters.com", "apnews.com", "skysports.com",
        # Tennis-specialist sites & blogs
        "tennishead.net", "tennisnow.com", "tennis.com",
        "atptour.com", "wtatennis.com", "ubitennis.net", "sportskeeda.com",
    ),

    "ufc": _d(
        "espn.com", "cbssports.com", "si.com", "bleacherreport.com",
        "reuters.com", "apnews.com",
        # MMA/UFC-specialist sites — mmafighting.com and bloodyelbow.com are SB Nation properties
        "ufc.com", "mmafighting.com", "mmajunkie.com", "bloodyelbow.com",
        "sherdog.com", "mmamania.com", "lowkickmma.com", "tapology.com",
        "fansided.com", "sbnation.com",
    ),

    "boxing": _d(
        "espn.com", "cbssports.com", "si.com", "bleacherreport.com",
        "reuters.com", "apnews.com",
        # Boxing-specialist sites — badlefthook.com is the SB Nation boxing blog
        "boxingscene.com", "ringtv.com", "secondsout.com", "badlefthook.com",
        "fightnews.com", "boxingnewsonline.net", "boxing247.co.uk",
        "fansided.com", "sbnation.com",
    ),
}

# Fallback blocklist used only for top_stories (broad multi-sport query)
_TOP_STORIES_EXCLUDE = ",".join([
    "slickdeals.net", "dealnews.com", "amazon.com", "ebay.com",
    "walmart.com", "target.com", "bestbuy.com", "fanatics.com",
])

http_client: httpx.AsyncClient | None = None


# ── Database ──────────────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at    TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_prefs (
                user_id    INTEGER PRIMARY KEY,
                prefs_json TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS news_cache (
                cache_key  TEXT PRIMARY KEY,
                payload    TEXT NOT NULL,
                fetched_at TEXT NOT NULL
            )
        """)
        conn.commit()


# ── Password hashing (PBKDF2-SHA256, 260k iterations) ────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, dk_hex = stored.split("$", 1)
    except ValueError:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
    return hmac.compare_digest(dk.hex(), dk_hex)


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        return None


def current_user(request: Request) -> dict | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return decode_token(auth[7:])


# ── Auth routes ───────────────────────────────────────────────────────────────

async def register(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return JSONResponse({"error": "Email and password required"}, status_code=400)
    if len(password) < 8:
        return JSONResponse({"error": "Password must be at least 8 characters"}, status_code=400)
    if len(password) > 1024:
        return JSONResponse({"error": "Password too long"}, status_code=400)

    pw_hash = hash_password(password)
    now = datetime.now(timezone.utc).isoformat()

    try:
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                (email, pw_hash, now),
            )
            user_id = cur.lastrowid
            conn.commit()
    except sqlite3.IntegrityError:
        return JSONResponse({"error": "Email already registered"}, status_code=409)

    return JSONResponse({"token": create_token(user_id, email), "email": email})


async def login(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE email = ?", (email,)
        ).fetchone()

    if not row or not verify_password(password, row["password_hash"]):
        return JSONResponse({"error": "Invalid email or password"}, status_code=401)

    return JSONResponse({"token": create_token(row["id"], email), "email": email})


# ── Prefs routes ──────────────────────────────────────────────────────────────

async def prefs(request: Request) -> JSONResponse:
    user = current_user(request)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    user_id = int(user["sub"])

    if request.method == "GET":
        with get_db() as conn:
            row = conn.execute(
                "SELECT prefs_json FROM user_prefs WHERE user_id = ?", (user_id,)
            ).fetchone()
        return JSONResponse({"prefs": json.loads(row["prefs_json"]) if row else None})

    # PUT
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    with get_db() as conn:
        conn.execute(
            """INSERT INTO user_prefs (user_id, prefs_json) VALUES (?, ?)
               ON CONFLICT(user_id) DO UPDATE SET prefs_json = excluded.prefs_json""",
            (user_id, json.dumps(body)),
        )
        conn.commit()

    return JSONResponse({"ok": True})


# ── News routes ───────────────────────────────────────────────────────────────

# Successful NewsAPI responses are cached in SQLite: served as-is while fresh
# (no quota spent), and served stale — any age — when the upstream fails, so a
# rate-limited key degrades to older headlines instead of an error.
NEWS_CACHE_TTL = timedelta(minutes=30)


def _news_cache_get(cache_key: str) -> tuple[dict, datetime] | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT payload, fetched_at FROM news_cache WHERE cache_key = ?",
            (cache_key,),
        ).fetchone()
    if not row:
        return None
    return json.loads(row["payload"]), datetime.fromisoformat(row["fetched_at"])


def _news_cache_put(cache_key: str, data: dict) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO news_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)",
            (cache_key, json.dumps(data), datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()


async def _fetch_news(
    q: str,
    page_size: int,
    *,
    domains: str | None = None,
    exclude_domains: str | None = None,
) -> JSONResponse:
    if not NEWS_API_KEY:
        return JSONResponse({"error": "NEWS_API_KEY not configured on server"}, status_code=500)

    cache_key = hashlib.sha256(
        json.dumps([q, page_size, domains, exclude_domains]).encode()
    ).hexdigest()
    cached = _news_cache_get(cache_key)
    if cached and datetime.now(timezone.utc) - cached[1] < NEWS_CACHE_TTL:
        return JSONResponse(cached[0])

    from_date = (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d")
    params: dict = {
        "q": q,
        "searchIn": "title",
        "language": "en",
        "sortBy": "publishedAt",
        "from": from_date,
        "pageSize": page_size,
        "apiKey": NEWS_API_KEY,
    }
    if domains:
        params["domains"] = domains
    if exclude_domains:
        params["excludeDomains"] = exclude_domains

    try:
        resp = await http_client.get(NEWS_API_BASE, params=params)
        data = resp.json()
        # Free-plan keys only allow a recent date window, validated against
        # NewsAPI's clock — if our `from` falls outside it, retry without one
        # (results are sorted by publishedAt, so we still get the newest).
        if (
            resp.status_code != 200
            and data.get("code") == "parameterInvalid"
            and "in the past" in data.get("message", "")
        ):
            del params["from"]
            resp = await http_client.get(NEWS_API_BASE, params=params)
            data = resp.json()
    except httpx.HTTPError:
        if cached:
            return JSONResponse(cached[0])
        return JSONResponse({"error": "News service unreachable"}, status_code=502)

    if resp.status_code == 200 and data.get("status") == "ok":
        _news_cache_put(cache_key, data)
        return JSONResponse(data)

    # Upstream error (e.g. rate limit) — stale headlines beat an error card.
    if cached:
        return JSONResponse(cached[0])
    return JSONResponse(data, status_code=resp.status_code)


async def top_stories(request: Request) -> JSONResponse:
    return await _fetch_news(
        "tennis OR basketball OR cricket OR soccer OR NFL",
        6,
        exclude_domains=_TOP_STORIES_EXCLUDE,
    )


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

    return await _fetch_news(
        query,
        page_size,
        domains=SPORT_DOMAINS.get(sport_id),
    )


# ── Upcoming games (TheSportsDB) ──────────────────────────────────────────────
# Free, keyless API used only for the "Up Next" widget. Team/player name →
# team id resolution rarely changes (cached 7 days); next fixtures change
# after games are played (cached 2 hours). Reuses the news_cache table.

TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123"
TSDB_RESOLVE_TTL = timedelta(days=7)
TSDB_EVENT_TTL = timedelta(hours=2)


async def _tsdb_get(url: str, ttl: timedelta) -> dict | None:
    cache_key = "tsdb:" + hashlib.sha256(url.encode()).hexdigest()
    cached = _news_cache_get(cache_key)
    if cached and datetime.now(timezone.utc) - cached[1] < ttl:
        return cached[0]
    try:
        resp = await http_client.get(url)
        if resp.status_code == 200:
            data = resp.json()
            _news_cache_put(cache_key, data)
            return data
    except (httpx.HTTPError, ValueError):
        pass
    return cached[0] if cached else None


# TheSportsDB sport names per Sidelines sport id — search results are filtered
# on this so e.g. "LA Rams" can't fuzzy-match a college basketball team.
TSDB_SPORT_NAMES = {
    "tennis": "Tennis",
    "basketball": "Basketball",
    "ncaa-basketball": "Basketball",
    "cricket": "Cricket",
    "soccer": "Soccer",
    "nfl": "American Football",
    "ncaa-football": "American Football",
    "formula1": "Motorsport",
    "ufc": "Fighting",
    "boxing": "Fighting",
}
TENNIS_LEAGUE_IDS = {"ATP": "4464", "WTA": "4517"}


def _first_with_sport(candidates: list, sport: str | None) -> dict | None:
    for c in candidates:
        if not sport or c.get("strSport") == sport:
            return c
    return None


_CITY_ABBREVIATIONS = {"LA ": "Los Angeles ", "NY ": "New York "}


async def _search_team(name: str, sport: str | None) -> dict | None:
    """Try the name as given, then with city abbreviations expanded, then the
    bare nickname — TheSportsDB only matches full or alternate team names."""
    attempts = [name]
    for abbr, full in _CITY_ABBREVIATIONS.items():
        if name.startswith(abbr):
            attempts.append(full + name[len(abbr):])
    if " " in name:
        attempts.append(name.rsplit(" ", 1)[1])
    for attempt in attempts:
        data = await _tsdb_get(f"{TSDB_BASE}/searchteams.php?t={quote(attempt)}", TSDB_RESOLVE_TTL)
        team = _first_with_sport((data or {}).get("teams") or [], sport)
        if team:
            return team
    return None


async def _tennis_next_match(search_names: str, pseudo_team: str) -> dict | None:
    """Tennis players have no club, so scan the tour's upcoming matches
    (event names carry surnames, e.g. "… Sinner vs Alcaraz")."""
    league_id = TENNIS_LEAGUE_IDS["WTA" if "WTA" in pseudo_team else "ATP"]
    data = await _tsdb_get(f"{TSDB_BASE}/eventsnextleague.php?id={league_id}", TSDB_EVENT_TTL)
    tokens = {t.lower() for t in search_names.split() if len(t) >= 3}
    for ev in (data or {}).get("events") or []:
        event_name = (ev.get("strEvent") or "").lower()
        if any(t in event_name for t in tokens):
            return ev
    return None


async def next_games(request: Request) -> JSONResponse:
    """?e=team:nfl:LA Rams&e=player:soccer:Kylian Mbappe → next fixture per follow."""
    entities = request.query_params.getlist("e")[:12]
    games: dict[str, dict] = {}  # idEvent → game (dedupes shared fixtures)
    for entity in entities:
        parts = entity.split(":", 2)
        if len(parts) != 3:
            continue
        kind, sport_id, name = parts
        name = name.strip()
        sport = TSDB_SPORT_NAMES.get(sport_id)
        if kind not in ("team", "player") or not name:
            continue

        ev: dict | None = None
        team_id: str | None = None
        label = name
        if kind == "team":
            team = await _search_team(name, sport)
            if team:
                team_id = team["idTeam"]
                label = team.get("strTeam") or name
        else:
            data = await _tsdb_get(f"{TSDB_BASE}/searchplayers.php?p={quote(name)}", TSDB_RESOLVE_TTL)
            player = _first_with_sport((data or {}).get("player") or [], sport)
            if player:
                label = player.get("strPlayer") or name
                if player.get("strSport") == "Tennis":
                    ev = await _tennis_next_match(f"{name} {label}", player.get("strTeam") or "")
                elif player.get("idTeam"):
                    team_id = player["idTeam"]

        if ev is None and team_id:
            data = await _tsdb_get(f"{TSDB_BASE}/eventsnext.php?id={team_id}", TSDB_EVENT_TTL)
            events = (data or {}).get("events") or []
            ev = events[0] if events else None
        if ev is None:
            continue

        event_id = ev.get("idEvent") or f"{label}-{ev.get('dateEvent')}"
        if event_id in games:
            games[event_id]["follows"].append(label)
            continue
        games[event_id] = {
            "follows": [label],
            "name": ev.get("strEvent"),
            "followedSide": "home" if ev.get("idHomeTeam") == team_id else "away",
            "home": ev.get("strHomeTeam"),
            "away": ev.get("strAwayTeam"),
            "homeBadge": ev.get("strHomeTeamBadge"),
            "awayBadge": ev.get("strAwayTeamBadge"),
            "homeScore": ev.get("intHomeScore"),
            "awayScore": ev.get("intAwayScore"),
            "league": ev.get("strLeague"),
            "venue": ev.get("strVenue"),
            "timestamp": ev.get("strTimestamp"),
        }
    ordered = sorted(games.values(), key=lambda g: g.get("timestamp") or "9999")
    return JSONResponse({"games": ordered})


# ── App ───────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: Starlette):
    init_db()
    global http_client
    http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await http_client.aclose()


app = Starlette(
    lifespan=lifespan,
    routes=[
        Route("/api/auth/register", register, methods=["POST"]),
        Route("/api/auth/login", login, methods=["POST"]),
        Route("/api/prefs", prefs, methods=["GET", "PUT"]),
        Route("/api/news/top", top_stories),
        Route("/api/news/sport/{sport_id}", sport_news),
        Route("/api/scores/next", next_games),
    ],
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:5173"],
            allow_methods=["GET", "POST", "PUT"],
            allow_headers=["*"],
        )
    ],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
