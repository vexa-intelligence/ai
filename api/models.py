from http.server import BaseHTTPRequestHandler
import json, re, time, html as html_lib
import requests as req

PAGE_URL  = "https://toolbaz.com/writer/chat-gpt-alternative"
HORDE_API = "https://stablehorde.net/api/v2"
CACHE_TTL = 300
UA        = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

_cache: dict = {"models": {}, "default": "", "image_models": [], "ts": 0}


def _scrape(raw_html: str) -> tuple[list[str], dict]:
    select_block = re.search(r'<select[^>]*\bname=["\']?model["\']?[^>]*>(.*?)(?:</select>|$)', raw_html, re.DOTALL | re.IGNORECASE)
    if not select_block:
        return [], {}
    value_to_label: dict[str, str] = {}
    keys: list[str] = []
    seen: set[str] = set()
    for m in re.finditer(r'<option[^>]*\bvalue=["\']?([^"\'>\s]+)["\']?[^>]*>\s*([^\n<]+)', select_block.group(1), re.IGNORECASE):
        val   = html_lib.unescape(m.group(1)).strip()
        label = html_lib.unescape(m.group(2)).strip()
        if val and val not in seen:
            keys.append(val)
            seen.add(val)
            value_to_label[val] = label
    provider_map: dict[str, str] = {}
    segments = re.split(r'(By\s+[^<\n]{2,60})', raw_html)
    current_provider = ""
    for seg in segments:
        by = re.match(r'By\s+(.+)', seg.strip())
        if by:
            current_provider = re.sub(r'[^\w\s\(\)]', '', by.group(1)).strip()
        else:
            for m in re.finditer(r'data-value=(?:["\']?)([^"\'>\s]+)', seg, re.IGNORECASE):
                provider_map.setdefault(m.group(1).strip(), current_provider)
    dv_positions = [(m.start(), m.group(1)) for m in re.finditer(r'data-value=(?:["\']?)([^"\'>\s]+)', raw_html, re.IGNORECASE)]
    speed_map:   dict[str, int] = {}
    quality_map: dict[str, int] = {}
    for i, (start, val) in enumerate(dv_positions):
        end    = dv_positions[i + 1][0] if i + 1 < len(dv_positions) else start + 2000
        window = raw_html[start:end]
        spd    = re.search(r'(\d+)\s*W/s', window)
        qlt    = re.search(r'quality-indicator[^>]*>(?:\s*<[^>]+>)*\s*(\d+)', window)
        if spd:
            speed_map[val]   = int(spd.group(1))
        if qlt:
            quality_map[val] = int(qlt.group(1))
    details: dict = {}
    for val in keys:
        details[val] = {"label": value_to_label.get(val, val), "provider": provider_map.get(val, ""), "speed": speed_map.get(val, 0), "quality": quality_map.get(val, 0)}
    return keys, details


def _get_image_models() -> list:
    try:
        r = req.get(f"{HORDE_API}/status/models?type=image", headers={"User-Agent": UA}, timeout=10)
        models = sorted(r.json(), key=lambda m: m.get("count", 0), reverse=True)
        return [{"name": m["name"], "count": m.get("count", 0), "queued": m.get("queued", 0)} for m in models[:20]]
    except Exception:
        return []


def _get_models() -> tuple[dict, str, list]:
    now = time.time()
    if _cache["models"] and now - _cache["ts"] < CACHE_TTL:
        return _cache["models"], _cache["default"], _cache["image_models"]
    try:
        r = req.get(PAGE_URL, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}, timeout=15)
        r.raise_for_status()
        keys, details = _scrape(r.text)
        image_models = _get_image_models()
        if details:
            _cache.update({"models": details, "default": keys[0] if keys else "", "image_models": image_models, "ts": now})
            return details, _cache["default"], image_models
    except Exception:
        pass
    return _cache["models"], _cache["default"], _cache["image_models"]


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        models, default, image_models = _get_models()
        if not models:
            body = json.dumps({"success": False, "error": "Failed to fetch models"}, ensure_ascii=False).encode()
            self.send_response(502)
        else:
            body = json.dumps({"success": True, "default": default, "models": models, "image_models": image_models}, ensure_ascii=False).encode()
            self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)