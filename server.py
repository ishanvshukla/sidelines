import hashlib
import json
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from typing import Any
from urllib.parse import quote

import httpx
import jwt
from dotenv import load_dotenv
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles

load_dotenv()

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
NEWS_API_BASE = "https://newsapi.org/v2/everything"

# Upstash Redis (REST API, no persistent connection needed) is the sole
# datastore — users, prefs, and the news/fixtures cache all live here, not
# just the visitor counter. Render's free tier has no persistent disk, so
# anything kept in a local file (SQLite, as this used to be) gets wiped on
# every redeploy; Redis is external and survives that.
UPSTASH_REDIS_REST_URL = os.environ.get("UPSTASH_REDIS_REST_URL", "")
UPSTASH_REDIS_REST_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")

_jwt_secret = os.environ.get("JWT_SECRET", "")
if not _jwt_secret:
    _jwt_secret = secrets.token_hex(32)
    print("WARNING: JWT_SECRET not set — tokens will reset on each server restart. Add JWT_SECRET to .env")
JWT_SECRET = _jwt_secret
JWT_ALG = "HS256"
JWT_EXPIRE_DAYS = 30

# Google Sign-In: the frontend uses Google Identity Services to get an ID
# token, which we verify here against Google's public keys before minting
# our own session JWT (above). GOOGLE_CLIENT_ID must match the OAuth client
# id configured on the frontend (VITE_GOOGLE_CLIENT_ID) — Google embeds the
# frontend's client id as the token's audience, so a mismatch here rejects
# every sign-in.
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
if not GOOGLE_CLIENT_ID:
    print("WARNING: GOOGLE_CLIENT_ID not set — Google sign-in will reject all tokens. Add GOOGLE_CLIENT_ID to .env")
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
_google_jwks_client = jwt.PyJWKClient(GOOGLE_JWKS_URL)

# Feedback inbox access: comma-separated list of Google account emails allowed
# to read submitted reports. Anyone can submit; only these accounts can read.
ADMIN_EMAILS = {
    e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()
}
if not ADMIN_EMAILS:
    print("WARNING: ADMIN_EMAILS not set — no account can read the feedback inbox. Add ADMIN_EMAILS to .env")

# Mirrored by FEEDBACK_CATEGORIES in src/constants/feedback.ts — keep in sync.
FEEDBACK_CATEGORY_LABELS = {
    "articles-not-loading": "Articles aren't loading",
    "irrelevant-articles": "My team's articles aren't relevant",
    "scores-wrong-team": "Scores widget shows the wrong team",
    "sign-in-issues": "Trouble signing in",
    "other": "Other",
}
FEEDBACK_CATEGORIES = set(FEEDBACK_CATEGORY_LABELS)
FEEDBACK_KEY = "feedback"
FEEDBACK_MAX_ENTRIES = 500
FEEDBACK_MAX_MESSAGE = 1000

# Email notifications for feedback, via Brevo's HTTP API — HTTPS only, so it
# works on hosts that block outbound SMTP ports, and its free tier covers this
# app's volume. FEEDBACK_FROM_EMAIL must be a sender address verified in the
# Brevo account. Left unset, notifications are skipped and feedback still works.
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
FEEDBACK_FROM_EMAIL = os.environ.get("FEEDBACK_FROM_EMAIL", "")
if not (BREVO_API_KEY and FEEDBACK_FROM_EMAIL):
    print("WARNING: BREVO_API_KEY / FEEDBACK_FROM_EMAIL not set — feedback email notifications are disabled.")

SPORT_QUERIES: dict[str, str] = {
    "tennis": 'tennis OR ATP OR WTA OR Wimbledon OR "US Open" OR "French Open" OR "Australian Open"',
    "basketball": "basketball OR NBA",
    "soccer": 'soccer OR "Premier League" OR "La Liga" OR MLS',
    "nfl": 'NFL OR "American football" OR quarterback',
    "formula1": '"Formula 1" OR "Formula One" OR "Grand Prix" OR F1 OR "pole position" OR "starting grid" OR "constructors\' championship"',
    "ncaa-football": '"college football" OR "NCAA football" OR "bowl game" OR "transfer portal" OR "signing day"',
    "ufc": 'UFC OR MMA OR "mixed martial arts"',
}

# Per-sport domain allowlists: mainstream sports media + SB Nation/FanSided team blogs.
# Using an allowlist means shopping/deal sites are excluded by default, while quality
# team blogs are pulled in alongside major outlets.
def _d(*domains: str) -> str:
    return ",".join(domains)

_MAINSTREAM = _d(
    "espn.com", "cbssports.com", "nbcsports.com", "foxsports.com", "si.com", "bleacherreport.com",
    "usatoday.com", "sportingnews.com", "theringer.com",
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
        "cincyjungle.com",           # Bengals
        "thephinsider.com",          # Dolphins
        "silverandblackpride.com",   # Raiders
        "turfshowtimes.com",         # Rams
        # FanSided (covers all NFL teams)
        "fansided.com",
    ),

    "soccer": _d(
        "espn.com", "cbssports.com", "si.com", "bleacherreport.com",
        "bbc.co.uk", "theguardian.com", "skysports.com",
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
        "formula1.com", "crash.net", "f1i.com",
    ),

    "ncaa-football": _d(
        _MAINSTREAM,
        # College sports specialists
        "247sports.com", "rivals.com", "on3.com", "collegefootballnews.com",
        "collegefootballnetwork.com", "sbnation.com", "fansided.com",
    ),

    "tennis": _d(
        _MAINSTREAM, "bbc.co.uk", "theguardian.com", "skysports.com",
        "nypost.com", "businessinsider.com",
        # Tennis-specialist sites & blogs
        "tennishead.net", "tennisnow.com", "tennis.com", "tennisworldusa.org",
        "atptour.com", "wtatennis.com", "ubitennis.net", "sportskeeda.com",
        "essentiallysports.com", "talksport.com", "eurosport.com",
    ),

    "ufc": _d(
        "espn.com", "cbssports.com", "si.com", "bleacherreport.com",
        "reuters.com", "apnews.com",
        # MMA/UFC-specialist sites — mmafighting.com and bloodyelbow.com are SB Nation properties
        "ufc.com", "mmafighting.com", "mmajunkie.com", "bloodyelbow.com",
        "sherdog.com", "mmamania.com", "lowkickmma.com", "tapology.com",
        "fansided.com", "sbnation.com",
    ),
}

# Dedicated team blogs (SB Nation + USA Today Wire — domain-clean sources only;
# A to Z Sports/On SI/Independent sites in the source list are single-domain
# with per-team URL *paths*, which NewsAPI's `domains` filter can't scope to,
# so they're left out here) for team_news below. Keyed by our own team ids
# (constants/teams.ts), not the source list's ids or display names, since
# those don't always match ours (e.g. our "rams" is named "LA Rams", not
# "Los Angeles Rams"). Only sports/teams covered by the source list are here —
# team_news falls back to the sport-wide SPORT_DOMAINS above for the rest
# (tennis, soccer, F1, UFC, and any NFL/NBA/NCAA team not in this map).
TEAM_BLOG_DOMAINS: dict[str, str] = {
    # NFL
    "patriots": _d("patspulpit.com", "patriotswire.usatoday.com"),
    "cowboys":  _d("bloggingtheboys.com", "cowboyswire.usatoday.com"),
    "packers":  _d("acmepackingcompany.com", "packerswire.usatoday.com"),
    "49ers":    _d("ninersnation.com", "ninerswire.usatoday.com"),
    "chiefs":   _d("arrowheadpride.com", "chiefswire.usatoday.com"),
    "bills":    _d("buffalorumblings.com", "billswire.usatoday.com"),
    "eagles":   _d("bleedinggreennation.com"),
    "ravens":   _d("baltimorebeatdown.com", "ravenswire.usatoday.com"),
    "giants":   _d("bigblueview.com", "giantswire.usatoday.com"),
    "bears":    _d("windycitygridiron.com", "bearswire.usatoday.com"),
    "rams":     _d("turfshowtimes.com", "theramswire.usatoday.com"),
    "seahawks": _d("fieldgulls.com", "seahawkswire.usatoday.com"),
    "raiders":  _d("silverandblackpride.com", "raiderswire.usatoday.com"),
    "steelers": _d("behindthesteelcurtain.com", "steelerswire.usatoday.com"),
    "bengals":  _d("cincyjungle.com"),
    "dolphins": _d("thephinsider.com"),
    "broncos":  _d("milehighreport.com", "broncoswire.usatoday.com"),
    "vikings":  _d("dailynorseman.com", "vikingswire.usatoday.com"),
    "texans":   _d("battleredblog.com", "texanswire.usatoday.com"),
    "lions":    _d("prideofdetroit.com", "lionswire.usatoday.com"),
    "colts":    _d("stampedeblue.com", "coltswire.usatoday.com"),
    "jets":     _d("ganggreennation.com"),
    # NBA
    "celtics":  _d("celticsblog.com", "celticswire.usatoday.com"),
    "warriors": _d("goldenstateofmind.com", "warriorswire.usatoday.com"),
    "lakers":   _d("silverscreenandroll.com", "lakerswire.usatoday.com"),
    "sixers":   _d("libertyballers.com"),
    "knicks":   _d("postingandtoasting.com"),
    "raptors":  _d("raptorshq.com"),
    "spurs":    _d("poundingtherock.com"),
    "rockets":  _d("rocketswire.usatoday.com"),
}

# Fallback blocklist used only for top_stories (broad multi-sport query)
_TOP_STORIES_EXCLUDE = ",".join([
    "slickdeals.net", "dealnews.com", "amazon.com", "ebay.com",
    "walmart.com", "target.com", "bestbuy.com", "fanatics.com",
])

http_client: httpx.AsyncClient | None = None


# ── Redis (Upstash REST API) ────────────────────────────────────────────────

async def _redis(*args: Any) -> Any:
    resp = await http_client.post(
        UPSTASH_REDIS_REST_URL,
        headers={"Authorization": f"Bearer {UPSTASH_REDIS_REST_TOKEN}"},
        json=list(args),
    )
    resp.raise_for_status()
    return resp.json()["result"]


async def _redis_pipeline(commands: list[list]) -> list:
    resp = await http_client.post(
        f"{UPSTASH_REDIS_REST_URL}/pipeline",
        headers={"Authorization": f"Bearer {UPSTASH_REDIS_REST_TOKEN}"},
        json=commands,
    )
    resp.raise_for_status()
    return resp.json()


# ── JWT (our own session tokens, issued after Google verification) ──────────

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


def verify_google_id_token(id_token: str) -> dict | None:
    """Verify a Google Identity Services ID token and return its claims.

    Signature is checked against Google's published JWKS (fetched once and
    cached by PyJWKClient, which also handles key rotation), and we pin the
    audience to our own OAuth client id so a token minted for someone else's
    app can't be replayed here.
    """
    try:
        signing_key = _google_jwks_client.get_signing_key_from_jwt(id_token)
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=GOOGLE_CLIENT_ID,
            issuer=["https://accounts.google.com", "accounts.google.com"],
        )
    except jwt.PyJWTError:
        return None
    if not claims.get("email_verified"):
        return None
    return claims


# ── Auth: users in Redis ─────────────────────────────────────────────────────
# user:email:{email} -> user id, claimed with SET NX so two concurrent
# first-time sign-ins for the same email can't both succeed. user:{id} ->
# JSON blob {email, google_sub, created_at}.

USER_ID_SEQ_KEY = "user_id_seq"


async def _get_user_by_email(email: str) -> dict | None:
    user_id = await _redis("GET", f"user:email:{email}")
    if not user_id:
        return None
    raw = await _redis("GET", f"user:{user_id}")
    if not raw:
        return None
    user = json.loads(raw)
    user["id"] = int(user_id)
    return user


async def _create_user(email: str, google_sub: str) -> int | None:
    user_id = await _redis("INCR", USER_ID_SEQ_KEY)
    claimed = await _redis("SET", f"user:email:{email}", str(user_id), "NX")
    if not claimed:
        return None
    await _redis(
        "SET",
        f"user:{user_id}",
        json.dumps({
            "email": email,
            "google_sub": google_sub,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }),
    )
    return user_id


async def google_auth(request: Request) -> JSONResponse:
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    id_token = body.get("credential") or ""
    if not id_token:
        return JSONResponse({"error": "Missing credential"}, status_code=400)

    claims = verify_google_id_token(id_token)
    if claims is None:
        return JSONResponse({"error": "Invalid Google credential"}, status_code=401)

    email = (claims.get("email") or "").strip().lower()
    google_sub = claims["sub"]
    if not email:
        return JSONResponse({"error": "Invalid Google credential"}, status_code=401)

    try:
        user = await _get_user_by_email(email)
        if user is None:
            user_id = await _create_user(email, google_sub)
            if user_id is None:
                # Lost a race with a concurrent first sign-in for this email — re-fetch.
                user = await _get_user_by_email(email)
        else:
            user_id = user["id"]
    except httpx.HTTPError:
        return JSONResponse({"error": "Datastore unreachable"}, status_code=502)

    if user_id is None:
        return JSONResponse({"error": "Datastore unreachable"}, status_code=502)

    return JSONResponse({"token": create_token(user_id, email), "email": email})


# ── Prefs routes ──────────────────────────────────────────────────────────────

async def prefs(request: Request) -> JSONResponse:
    user = current_user(request)
    if not user:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    user_id = int(user["sub"])

    if request.method == "GET":
        try:
            raw = await _redis("GET", f"prefs:{user_id}")
        except httpx.HTTPError:
            return JSONResponse({"error": "Datastore unreachable"}, status_code=502)
        return JSONResponse({"prefs": json.loads(raw) if raw else None})

    # PUT
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    try:
        await _redis("SET", f"prefs:{user_id}", json.dumps(body))
    except httpx.HTTPError:
        return JSONResponse({"error": "Datastore unreachable"}, status_code=502)

    return JSONResponse({"ok": True})


# ── Feedback ──────────────────────────────────────────────────────────────────
# Reports live in one capped Redis list, newest first. Submitting is open to
# everyone — signed in or not, since the person hitting a bug may be the one
# who can't sign in — while reading is restricted to ADMIN_EMAILS accounts.


def _is_admin(request: Request) -> bool:
    user = current_user(request)
    return bool(user) and user.get("email", "").lower() in ADMIN_EMAILS


async def _send_email(to: str, subject: str, text: str) -> bool:
    """Best-effort email via Brevo. Never raises — a failed or unconfigured
    email must not fail the request that triggered it."""
    if not (BREVO_API_KEY and FEEDBACK_FROM_EMAIL):
        return False
    try:
        resp = await http_client.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={"api-key": BREVO_API_KEY},
            json={
                "sender": {"name": "Sidelines", "email": FEEDBACK_FROM_EMAIL},
                "to": [{"email": to}],
                "subject": subject,
                "textContent": text,
            },
        )
        return resp.status_code < 300
    except httpx.HTTPError:
        return False


# Reports filed before ids existed can't be resolved (nothing to address them
# by), so they're given one on first read. Ids are generated in Python and
# passed in, since Redis Lua has no dependable randomness; the script assigns
# them only to entries actually missing an id, so it's idempotent and safe to
# run against a list another request is pushing onto. Every stored entry is a
# json.dumps object, so "^{" is always its opening brace.
_BACKFILL_IDS_SCRIPT = """
local items = redis.call('LRANGE', KEYS[1], 0, -1)
local n = 0
for i, raw in ipairs(items) do
  if not string.find(raw, '"id": "', 1, true) then
    n = n + 1
    if ARGV[n] then
      local patched = string.gsub(raw, '^{', '{"id": "' .. ARGV[n] .. '", "status": "open", ', 1)
      redis.call('LSET', KEYS[1], i - 1, patched)
    end
  end
end
return n
"""


async def _backfill_report_ids(raw_items: list[str]) -> bool:
    """Returns True if anything was patched (caller should re-read)."""
    missing = sum(1 for raw in raw_items if '"id": "' not in raw)
    if not missing:
        return False
    new_ids = [secrets.token_hex(8) for _ in range(missing)]
    try:
        await _redis("EVAL", _BACKFILL_IDS_SCRIPT, 1, FEEDBACK_KEY, *new_ids)
    except httpx.HTTPError:
        return False
    return True


async def feedback(request: Request) -> JSONResponse:
    if request.method == "GET":
        if not _is_admin(request):
            return JSONResponse({"error": "Forbidden"}, status_code=403)
        try:
            raw_items = await _redis("LRANGE", FEEDBACK_KEY, 0, FEEDBACK_MAX_ENTRIES - 1)
            if await _backfill_report_ids(raw_items or []):
                raw_items = await _redis("LRANGE", FEEDBACK_KEY, 0, FEEDBACK_MAX_ENTRIES - 1)
        except httpx.HTTPError:
            return JSONResponse({"error": "Datastore unreachable"}, status_code=502)
        items = [json.loads(raw) for raw in raw_items or []]
        counts: dict[str, int] = {}
        for item in items:
            cat = item.get("category", "other")
            counts[cat] = counts.get(cat, 0) + 1
        return JSONResponse({"items": items, "counts": counts})

    # POST
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    category = body.get("category")
    if category not in FEEDBACK_CATEGORIES:
        return JSONResponse({"error": "Unknown category"}, status_code=400)

    message = str(body.get("message") or "").strip()[:FEEDBACK_MAX_MESSAGE]
    if category == "other" and not message:
        return JSONResponse({"error": "Please describe what went wrong"}, status_code=400)

    # The reporter's followed sports/teams travel with the report — most
    # categories are only debuggable knowing which team's query misbehaved.
    # Client-supplied, so shapes and sizes are clamped before storing.
    prefs = body.get("prefs") if isinstance(body.get("prefs"), dict) else {}
    raw_sports = prefs.get("sports") if isinstance(prefs.get("sports"), list) else []
    raw_teams = prefs.get("teams") if isinstance(prefs.get("teams"), dict) else {}
    sports = [str(s)[:40] for s in raw_sports[:12]]
    teams = {
        str(k)[:40]: [str(t)[:60] for t in v[:20]]
        for k, v in list(raw_teams.items())[:12]
        if isinstance(v, list)
    }

    user = current_user(request)  # optional — anonymous reports are accepted
    report = {
        "id": secrets.token_hex(8),
        "status": "open",
        "category": category,
        "message": message,
        "email": user.get("email") if user else None,
        "sports": sports,
        "teams": teams,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await _redis_pipeline([
            ["LPUSH", FEEDBACK_KEY, json.dumps(report)],
            ["LTRIM", FEEDBACK_KEY, 0, FEEDBACK_MAX_ENTRIES - 1],
        ])
    except httpx.HTTPError:
        return JSONResponse({"error": "Datastore unreachable"}, status_code=502)

    # Best-effort admin heads-up — a failed email never fails the report.
    label = FEEDBACK_CATEGORY_LABELS[category]
    lines = [f"Category: {label}", f"Reporter: {report['email'] or 'anonymous'}"]
    if message:
        lines.append(f"Message: {message}")
    if teams:
        lines.append("Follows: " + " | ".join(f"{s}: {', '.join(t)}" for s, t in teams.items()))
    lines.append("\nOpen the feedback inbox on the site to mark it fixed.")
    for admin_email in ADMIN_EMAILS:
        await _send_email(admin_email, f"Sidelines: new issue report — {label}", "\n".join(lines))

    return JSONResponse({"ok": True})


async def feedback_access(request: Request) -> JSONResponse:
    """Lets the frontend decide whether to show the admin inbox link without
    downloading the inbox itself."""
    return JSONResponse({"admin": _is_admin(request)})


# Swaps one report for its resolved version atomically, so a concurrent LPUSH
# can't shift indices between finding the entry and LSET-ing it. The entry is
# located by the exact json.dumps byte sequence for its id (quotes inside a
# user's message are escaped as \" in storage, so the needle can't appear
# inside one). The write only happens if the entry is still open, so two
# admins resolving at once can't clobber each other's note or double-email;
# the pre-write entry is returned either way so the caller can tell which
# case it got.
_RESOLVE_SCRIPT = """
local items = redis.call('LRANGE', KEYS[1], 0, -1)
local needle = '"id": "' .. ARGV[1] .. '"'
for i, raw in ipairs(items) do
  if string.find(raw, needle, 1, true) then
    if string.find(raw, '"status": "open"', 1, true) then
      redis.call('LSET', KEYS[1], i - 1, ARGV[2])
    end
    return raw
  end
end
return false
"""


async def resolve_feedback(request: Request) -> JSONResponse:
    if not _is_admin(request):
        return JSONResponse({"error": "Forbidden"}, status_code=403)
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid JSON"}, status_code=400)

    report_id = str(body.get("id") or "")
    if len(report_id) != 16 or any(c not in "0123456789abcdef" for c in report_id):
        return JSONResponse({"error": "Invalid report id"}, status_code=400)
    note = str(body.get("note") or "").strip()[:FEEDBACK_MAX_MESSAGE]

    try:
        raw_items = await _redis("LRANGE", FEEDBACK_KEY, 0, FEEDBACK_MAX_ENTRIES - 1)
    except httpx.HTTPError:
        return JSONResponse({"error": "Datastore unreachable"}, status_code=502)

    needle = f'"id": "{report_id}"'
    current = next((json.loads(raw) for raw in raw_items or [] if needle in raw), None)
    if current is None:
        return JSONResponse({"error": "Report not found"}, status_code=404)

    resolved = {
        **current,
        "status": "fixed",
        "note": note,
        "fixed_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        prev_raw = await _redis(
            "EVAL", _RESOLVE_SCRIPT, 1, FEEDBACK_KEY, report_id, json.dumps(resolved)
        )
    except httpx.HTTPError:
        return JSONResponse({"error": "Datastore unreachable"}, status_code=502)
    if not prev_raw:
        return JSONResponse({"error": "Report not found"}, status_code=404)

    # Notify the reporter — only if this call is what actually closed the
    # report (not a re-click or a race), and only if they were signed in when
    # they reported, since an anonymous report has no address to reach.
    prev = json.loads(prev_raw)
    if prev.get("status") != "open":
        return JSONResponse({"ok": True, "notified": False, "alreadyFixed": True})

    notified = False
    if prev.get("email"):
        label = FEEDBACK_CATEGORY_LABELS.get(prev.get("category"), prev.get("category"))
        parts = ["Good news — the issue you reported on Sidelines has been fixed.", "", f"Your report: {label}"]
        if prev.get("message"):
            parts.append(f'"{prev["message"]}"')
        if note:
            parts += ["", "From the Sidelines team:", note]
        parts += ["", "Thanks for helping make the site better!"]
        notified = await _send_email(
            prev["email"], "Your Sidelines report has been fixed", "\n".join(parts)
        )
    return JSONResponse({"ok": True, "notified": notified})


# ── Visitor counter ───────────────────────────────────────────────────────────
# The frontend claims a unique number once per browser (stored in localStorage)
# and displays it forever after; total_visits bumps on every page load,
# including repeat visits, so the widget can show both "you're visitor #X"
# and "Y visits so far".

async def record_visit(request: Request) -> JSONResponse:
    body = await request.json() if await request.body() else {}
    claim = bool(body.get("claim"))

    commands = [["INCR", "total_visits"]]
    if claim:
        commands.append(["INCR", "unique_count"])
    try:
        results = await _redis_pipeline(commands)
    except httpx.HTTPError:
        return JSONResponse({"error": "Visitor counter unreachable"}, status_code=502)

    total_visits = results[0]["result"]
    # Frontend only reads `number` when claim=True, so no unique_count fetch otherwise.
    unique_count = results[1]["result"] if claim else 0
    return JSONResponse({"number": unique_count, "totalVisits": total_visits})


# ── News routes ───────────────────────────────────────────────────────────────

# Successful NewsAPI responses are cached in Redis: served as-is while fresh
# (no quota spent), and served stale — any age — when the upstream fails, so a
# rate-limited key degrades to older headlines instead of an error. Cache
# entries are stored without a Redis TTL and freshness is checked in-app
# (fetched_at), so a stale response is never simply evicted — it stays
# available as a fallback indefinitely.
# 3h keeps worst-case daily requests (8 cache keys x 24/3 refreshes = 64) well
# under the free-tier 100/day quota even under continuous traffic, leaving
# headroom for team_news below.
NEWS_CACHE_TTL = timedelta(hours=3)

# Per-team/player queries (see team_news below) are cached much longer than the
# shared sport-wide queries: each distinct followed team is its own cache key,
# lazily created the first time someone follows it, so a 24h TTL (1 refresh/day
# per team) is what keeps a popular app's worth of distinct followed teams from
# eating the same 100/day quota the shared queries already spend ~64/day of.
TEAM_NEWS_CACHE_TTL = timedelta(hours=24)


async def _news_cache_get(cache_key: str) -> tuple[dict, datetime] | None:
    try:
        raw = await _redis("GET", f"newscache:{cache_key}")
    except httpx.HTTPError:
        return None
    if not raw:
        return None
    entry = json.loads(raw)
    return entry["payload"], datetime.fromisoformat(entry["fetched_at"])


async def _news_cache_put(cache_key: str, data: dict) -> None:
    entry = json.dumps({
        "payload": data,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    })
    try:
        await _redis("SET", f"newscache:{cache_key}", entry)
    except httpx.HTTPError:
        pass


async def _fetch_news(
    q: str,
    page_size: int,
    *,
    domains: str | None = None,
    exclude_domains: str | None = None,
    ttl: timedelta = NEWS_CACHE_TTL,
    days: int = 3,
) -> JSONResponse:
    if not NEWS_API_KEY:
        return JSONResponse({"error": "NEWS_API_KEY not configured on server"}, status_code=500)

    cache_key = hashlib.sha256(
        json.dumps([q, page_size, domains, exclude_domains]).encode()
    ).hexdigest()
    cached = await _news_cache_get(cache_key)
    if cached and datetime.now(timezone.utc) - cached[1] < ttl:
        return JSONResponse(cached[0])

    # `days` is capped at a week — anything older counts as stale news for this
    # app, regardless of caller.
    from_date = (datetime.now(timezone.utc) - timedelta(days=min(days, 7))).strftime("%Y-%m-%d")
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
        await _news_cache_put(cache_key, data)
        return JSONResponse(data)

    # Upstream error (e.g. rate limit) — stale headlines beat an error card.
    if cached:
        return JSONResponse(cached[0])
    return JSONResponse(data, status_code=resp.status_code)


async def top_stories(request: Request) -> JSONResponse:
    return await _fetch_news(
        "tennis OR basketball OR soccer OR NFL",
        6,
        exclude_domains=_TOP_STORIES_EXCLUDE,
    )


async def sport_news(request: Request) -> JSONResponse:
    sport_id = request.path_params["sport_id"]
    if sport_id not in SPORT_QUERIES:
        return JSONResponse({"error": f"Unknown sport: {sport_id}"}, status_code=404)
    page_size = int(request.query_params.get("pageSize", "8"))

    # The sport-wide query, shared across all users regardless of who follows
    # what — cache usage here stays fixed at one entry per sport. Dedicated
    # per-team results come from team_news below instead of scoping this query,
    # so this stays the fixed, cheap baseline even as followed teams vary.
    return await _fetch_news(
        SPORT_QUERIES[sport_id],
        page_size,
        domains=SPORT_DOMAINS.get(sport_id),
    )


async def team_news(request: Request) -> JSONResponse:
    sport_id = request.path_params["sport_id"]
    if sport_id not in SPORT_DOMAINS:
        return JSONResponse({"error": f"Unknown sport: {sport_id}"}, status_code=404)

    team = request.query_params.get("team", "").strip().replace('"', "")
    if not team or len(team) > 80:
        return JSONResponse({"error": "Missing or invalid 'team' query param"}, status_code=400)
    team_id = request.query_params.get("teamId", "")

    page_size = int(request.query_params.get("pageSize", "6"))

    # One cache entry per (sport, team) pair, populated lazily the first time
    # anyone follows that team — NOT per user or per team-combination, which is
    # what caused the 2026-07-29 quota-exhaustion outage. Cached for
    # TEAM_NEWS_CACHE_TTL (24h, much longer than the shared sport query) so this
    # stays within the free-tier quota's remaining headroom even as more
    # distinct teams get followed across the user base.
    #
    # Prefer the team's own dedicated blogs (TEAM_BLOG_DOMAINS) over the broad
    # sport-wide allowlist — those blogs write almost exclusively about this
    # one team, so results are far more relevant than filtering the general
    # feed. Falls back to SPORT_DOMAINS for teams/sports the blog list doesn't
    # cover. Window is widened to 7 days (vs. the 3-day default) since a single
    # team blog posts less often than a wire service; 7 days is also this app's
    # hard ceiling for "not stale," so this is as wide as it's allowed to go.
    return await _fetch_news(
        f'"{team}"',
        page_size,
        domains=TEAM_BLOG_DOMAINS.get(team_id) or SPORT_DOMAINS.get(sport_id),
        ttl=TEAM_NEWS_CACHE_TTL,
        days=7,
    )


# ── Upcoming games (TheSportsDB) ──────────────────────────────────────────────
# Free, keyless API used only for the "Up Next" widget. Team/player name →
# team id resolution rarely changes (cached 7 days); next fixtures change
# after games are played (cached 2 hours). Reuses the same Redis cache
# helpers as the news cache, under a "tsdb:" key prefix.

TSDB_BASE = "https://www.thesportsdb.com/api/v1/json/123"
TSDB_RESOLVE_TTL = timedelta(days=7)
TSDB_EVENT_TTL = timedelta(hours=2)


async def _tsdb_get(url: str, ttl: timedelta) -> dict | None:
    cache_key = "tsdb:" + hashlib.sha256(url.encode()).hexdigest()
    cached = await _news_cache_get(cache_key)
    if cached and datetime.now(timezone.utc) - cached[1] < ttl:
        return cached[0]
    try:
        resp = await http_client.get(url)
        if resp.status_code == 200:
            data = resp.json()
            await _news_cache_put(cache_key, data)
            return data
    except (httpx.HTTPError, ValueError):
        pass
    return cached[0] if cached else None


# TheSportsDB sport names per Sidelines sport id — search results are filtered
# on this so e.g. "LA Rams" can't fuzzy-match a college basketball team.
TSDB_SPORT_NAMES = {
    "tennis": "Tennis",
    "basketball": "Basketball",
    "soccer": "Soccer",
    "nfl": "American Football",
    "ncaa-football": "American Football",
    "formula1": "Motorsport",
    "ufc": "Fighting",
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
    if not (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN):
        raise RuntimeError(
            "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required — "
            "Redis is the only datastore now. Set them in .env for local dev "
            "(a free Upstash database works fine for this)."
        )
    global http_client
    http_client = httpx.AsyncClient(timeout=10.0)
    yield
    await http_client.aclose()


routes = [
    Route("/api/auth/google", google_auth, methods=["POST"]),
    Route("/api/prefs", prefs, methods=["GET", "PUT"]),
    Route("/api/visitor", record_visit, methods=["POST"]),
    Route("/api/feedback", feedback, methods=["GET", "POST"]),
    Route("/api/feedback/access", feedback_access),
    Route("/api/feedback/resolve", resolve_feedback, methods=["POST"]),
    Route("/api/news/top", top_stories),
    Route("/api/news/sport/{sport_id}", sport_news),
    Route("/api/news/team/{sport_id}", team_news),
    Route("/api/scores/next", next_games),
]

# In production the built frontend (npm run build -> dist/) is served by this
# same process, so the browser only ever talks to one origin. Locally the
# frontend instead runs via `npm run dev` on its own port, and dist/ won't
# exist — skip the mount rather than fail startup.
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "dist")
if os.path.isdir(FRONTEND_DIST):
    routes.append(Mount("/", app=StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend"))

app = Starlette(
    lifespan=lifespan,
    routes=routes,
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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
