from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json, base64, random, time, re, collections, html as html_lib
import requests as req

UA        = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
PAGE_URL  = "https://toolbaz.com/writer/chat-gpt-alternative"
TOKEN_URL = "https://data.toolbaz.com/token.php"
WRITE_URL = "https://data.toolbaz.com/writing.php"
POST_HDRS = {
    "User-Agent":       UA,
    "Referer":          PAGE_URL,
    "Origin":           "https://toolbaz.com",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type":     "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept-Language":  "en-US,en;q=0.9",
}

MAX_PROMPT_LENGTH = 4000
MAX_REQUESTS      = 20
RATE_WINDOW       = 60
MAX_RETRIES       = 3
BACKOFF_BASE      = 1.5
MODELS_CACHE_TTL  = 300

_rate_store:   dict = {}
_models_cache: dict = {"keys": set(), "default": "", "ts": 0}


def _refresh_models():
    now = time.time()
    if _models_cache["keys"] and now - _models_cache["ts"] < MODELS_CACHE_TTL:
        return
    try:
        r = req.get(PAGE_URL, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}, timeout=15)
        r.raise_for_status()
        select_block = re.search(r'<select[^>]*\bname=["\']?model["\']?[^>]*>(.*?)(?:</select>|$)', r.text, re.DOTALL | re.IGNORECASE)
        if not select_block:
            return
        keys: list[str] = []
        seen: set[str]  = set()
        for m in re.finditer(r'<option[^>]*\bvalue=["\']?([^"\'>\s]+)["\']?', select_block.group(1), re.IGNORECASE):
            k = html_lib.unescape(m.group(1)).strip()
            if k and k not in seen:
                keys.append(k)
                seen.add(k)
        if keys:
            _models_cache["keys"]    = set(keys)
            _models_cache["default"] = keys[0]
            _models_cache["ts"]      = now
    except Exception:
        pass


def _valid_model(model: str) -> bool:
    _refresh_models()
    return model in _models_cache["keys"] if _models_cache["keys"] else True


def _default_model() -> str:
    _refresh_models()
    return _models_cache["default"]


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    if ip not in _rate_store:
        _rate_store[ip] = collections.deque()
    dq = _rate_store[ip]
    while dq and now - dq[0] > RATE_WINDOW:
        dq.popleft()
    if len(dq) >= MAX_REQUESTS:
        return True
    dq.append(now)
    return False


def _random_string(n: int) -> str:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(random.choice(chars) for _ in range(n))


def _build_fingerprint() -> str:
    obj = {
        "bR6wF": {"nV5kP": UA, "lQ9jX": "en-US", "sD2zR": "1920x1080", "tY4hL": "America/New_York", "pL8mC": "Win32", "cQ3vD": 24, "hK7jN": 8},
        "uT4bX": {"mM9wZ": [], "kP8jY": []},
        "tuTcS": int(time.time()),
        "tDfxy": None,
        "RtyJt": _random_string(36),
    }
    b64 = base64.b64encode(json.dumps(obj, separators=(",", ":"), ensure_ascii=False).encode()).decode()
    return _random_string(6) + b64


def _parse_chunk(chunk: str) -> str:
    chunk = chunk.strip()
    if not chunk or chunk == "[DONE]":
        return ""
    try:
        return json.loads(chunk)["choices"][0]["delta"].get("content", "")
    except (json.JSONDecodeError, KeyError, TypeError):
        return chunk


def _parse_full(raw: str) -> str:
    raw = re.sub(r'\[model:[^\]]*\]', '', raw).strip()
    if raw.lstrip().startswith("data:"):
        parts = []
        for line in raw.splitlines():
            if not line.startswith("data:"):
                continue
            parts.append(_parse_chunk(line[5:]))
        text = "".join(parts).strip()
        if text:
            return text
    try:
        obj = json.loads(raw)
        if isinstance(obj, dict):
            for k in ("result", "text", "content", "output", "message", "response", "data"):
                if obj.get(k):
                    return str(obj[k]).strip()
    except json.JSONDecodeError:
        pass
    return re.sub(r"<[^>]+>", "", raw).strip()


def _fetch_upstream(prompt: str, model: str):
    for attempt in range(MAX_RETRIES):
        try:
            sid = _random_string(32)
            r = req.post(TOKEN_URL, data={"session_id": sid, "token": _build_fingerprint()}, headers=POST_HDRS, timeout=10)
            r.raise_for_status()
            token = r.json().get("token", "")
            if not token:
                raise RuntimeError("Token endpoint returned no token")
            r2 = req.post(
                WRITE_URL,
                data={"text": prompt, "capcha": token, "model": model, "session_id": sid},
                headers={**POST_HDRS, "Accept": "text/event-stream, application/json, */*"},
                timeout=55,
                stream=True,
            )
            if r2.status_code == 200:
                return r2
            if r2.status_code < 500:
                raise RuntimeError(f"Upstream error {r2.status_code}")
            raise RuntimeError(f"Upstream server error {r2.status_code}")
        except RuntimeError:
            raise
        except Exception as exc:
            if attempt == MAX_RETRIES - 1:
                raise RuntimeError(f"Failed after {MAX_RETRIES} attempts: {exc}") from exc
            time.sleep(BACKOFF_BASE ** attempt)


def _get_ip(h) -> str:
    forwarded = h.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real = h.headers.get("x-real-ip", "")
    if real:
        return real
    return h.client_address[0] if h.client_address else "unknown"


def _respond(h, status: int, data: dict):
    body = json.dumps({"success": status < 400, **data}, ensure_ascii=False).encode()
    h.send_response(status)
    h.send_header("Content-Type", "application/json")
    h.send_header("Content-Length", str(len(body)))
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")
    h.end_headers()
    h.wfile.write(body)


def _run(h, prompt, model):
    ip = _get_ip(h)
    if _is_rate_limited(ip):
        _respond(h, 429, {"error": "Rate limit exceeded. Try again shortly."})
        return
    if not prompt or not prompt.strip():
        _respond(h, 400, {"error": "Missing required parameter: q, query, or prompt"})
        return
    prompt = prompt.strip()
    if len(prompt) > MAX_PROMPT_LENGTH:
        _respond(h, 400, {"error": f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} characters"})
        return
    if not model:
        model = _default_model()
    if not _valid_model(model):
        _respond(h, 400, {"error": f"Unknown model '{model}'", "valid_models": sorted(_models_cache["keys"])})
        return
    try:
        t0       = time.time()
        upstream = _fetch_upstream(prompt, model)
        raw      = "".join(c for c in upstream.iter_content(chunk_size=None, decode_unicode=True) if c).strip()
        text     = _parse_full(raw)
        _respond(h, 200, {"response": text, "model": model, "elapsed_ms": round((time.time() - t0) * 1000)})
    except RuntimeError:
        _respond(h, 502, {"error": "Upstream request failed"})
    except Exception:
        _respond(h, 500, {"error": "Internal server error"})


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        prompt = (params.get("q") or params.get("query") or [None])[0]
        model  = (params.get("model") or [None])[0] or _default_model()
        _run(self, prompt, model)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            _respond(self, 400, {"error": "Invalid JSON body"})
            return
        prompt = body.get("q") or body.get("query") or body.get("prompt")
        model  = body.get("model") or _default_model()
        _run(self, prompt, model)