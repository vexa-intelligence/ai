from http.server import BaseHTTPRequestHandler
import json, re, time, html as html_lib, random, base64
import requests as req

PAGE_URL  = "https://toolbaz.com/writer/chat-gpt-alternative"
TOKEN_URL = "https://data.toolbaz.com/token.php"
HORDE_API = "https://stablehorde.net/api/v2"
ANON_KEY  = "0000000000"
UA        = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


def _check_page() -> dict:
    t0 = time.time()
    try:
        r = req.get(PAGE_URL, headers={"User-Agent": UA}, timeout=10)
        return {"reachable": r.status_code == 200, "status_code": r.status_code, "latency_ms": round((time.time() - t0) * 1000)}
    except Exception as e:
        return {"reachable": False, "error": str(e), "latency_ms": round((time.time() - t0) * 1000)}


def _check_token() -> dict:
    t0 = time.time()
    try:
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        sid   = "".join(random.choice(chars) for _ in range(32))
        fp_obj = {
            "bR6wF": {"nV5kP": UA, "lQ9jX": "en-US", "sD2zR": "1920x1080", "tY4hL": "America/New_York", "pL8mC": "Win32", "cQ3vD": 24, "hK7jN": 8},
            "uT4bX": {"mM9wZ": [], "kP8jY": []},
            "tuTcS": int(time.time()),
            "tDfxy": None,
            "RtyJt": "".join(random.choice(chars) for _ in range(36)),
        }
        b64      = base64.b64encode(json.dumps(fp_obj, separators=(",", ":")).encode()).decode()
        token_fp = "".join(random.choice(chars) for _ in range(6)) + b64
        r = req.post(TOKEN_URL, data={"session_id": sid, "token": token_fp}, headers={"User-Agent": UA, "Referer": PAGE_URL, "Origin": "https://toolbaz.com", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}, timeout=10)
        token = r.json().get("token", "") if r.status_code == 200 else ""
        return {"reachable": r.status_code == 200, "token_received": bool(token), "status_code": r.status_code, "latency_ms": round((time.time() - t0) * 1000)}
    except Exception as e:
        return {"reachable": False, "token_received": False, "error": str(e), "latency_ms": round((time.time() - t0) * 1000)}


def _scrape_models(raw_html: str) -> tuple[list[str], dict, dict]:
    select_block = re.search(r'<select[^>]*\bname=["\']?model["\']?[^>]*>(.*?)(?:</select>|$)', raw_html, re.DOTALL | re.IGNORECASE)
    if not select_block:
        return [], {}, {"error": "no select block found"}
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
        if spd: speed_map[val] = int(spd.group(1))
        if qlt: quality_map[val] = int(qlt.group(1))
    details: dict = {}
    for val in keys:
        details[val] = {"label": value_to_label.get(val, val), "provider": provider_map.get(val, ""), "speed": speed_map.get(val, 0), "quality": quality_map.get(val, 0)}
    dbg = {"provider_segments_found": [s.strip() for s in segments if re.match(r'By\s+', s.strip())][:8], "provider_map": dict(list(provider_map.items())[:6]), "speed_map": dict(list(speed_map.items())[:6]), "quality_map": dict(list(quality_map.items())[:6]), "total_dv_positions": len(dv_positions)}
    return keys, details, dbg


def _check_models() -> dict:
    t0 = time.time()
    try:
        r = req.get(PAGE_URL, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}, timeout=10)
        r.raise_for_status()
        keys, details, dbg = _scrape_models(r.text)
        count = len(keys)
        return {"reachable": count > 0, "model_count": count, "latency_ms": round((time.time() - t0) * 1000), "models": details, "debug": dbg}
    except Exception as e:
        return {"reachable": False, "model_count": 0, "error": str(e), "latency_ms": round((time.time() - t0) * 1000), "models": {}, "debug": {}}


def _check_image() -> dict:
    t0 = time.time()
    debug: dict = {}
    try:
        r = req.get(f"{HORDE_API}/status/models?type=image", headers={"User-Agent": UA}, timeout=10)
        r.raise_for_status()
        all_models = sorted(r.json(), key=lambda m: m.get("count", 0), reverse=True)
        top_models = [m["name"] for m in all_models[:5]]
        debug["horde_models_reachable"] = True
        debug["model_count"] = len(all_models)
        debug["top_models"] = top_models
        debug["horde_models_latency_ms"] = round((time.time() - t0) * 1000)
    except Exception as e:
        return {"reachable": False, "model_count": 0, "error": f"Failed to reach Horde models: {e}", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    t1 = time.time()
    try:
        payload = {
            "prompt": "a red circle",
            "params": {"width": 64, "height": 64, "n": 1, "steps": 1, "sampler_name": "k_euler", "cfg_scale": 1, "seed": "1"},
            "models": ["Deliberate"],
            "r2": True,
            "shared": False,
        }
        r2 = req.post(f"{HORDE_API}/generate/async", json=payload, headers={"apikey": ANON_KEY, "User-Agent": UA, "Content-Type": "application/json"}, timeout=15)
        r2.raise_for_status()
        submit_json = r2.json()
        job_id = submit_json.get("id")
        debug["job_submit_status"] = r2.status_code
        debug["job_submit_response"] = submit_json
        debug["job_id"] = job_id
        debug["job_submit_latency_ms"] = round((time.time() - t1) * 1000)
    except Exception as e:
        debug["job_submit_error"] = str(e)
        return {"reachable": True, "model_count": debug.get("model_count", 0), "job_submitted": False, "error": f"Job submit failed: {e}", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    if not job_id:
        debug["job_submit_error"] = "No job ID in response"
        return {"reachable": True, "model_count": debug.get("model_count", 0), "job_submitted": False, "error": "No job ID returned", "latency_ms": round((time.time() - t0) * 1000), "debug": debug}

    t2 = time.time()
    try:
        check = req.get(f"{HORDE_API}/generate/check/{job_id}", headers={"apikey": ANON_KEY, "User-Agent": UA}, timeout=10).json()
        debug["job_check_response"] = check
        debug["job_check_latency_ms"] = round((time.time() - t2) * 1000)
        debug["is_possible"] = check.get("is_possible")
        debug["queue_position"] = check.get("queue_position")
        debug["wait_time_s"] = check.get("wait_time")
    except Exception as e:
        debug["job_check_error"] = str(e)

    try:
        req.delete(f"{HORDE_API}/generate/status/{job_id}", headers={"apikey": ANON_KEY, "User-Agent": UA}, timeout=5)
        debug["job_cancelled"] = True
    except Exception:
        debug["job_cancelled"] = False

    is_possible = debug.get("is_possible", None)
    return {
        "reachable": True,
        "model_count": debug.get("model_count", 0),
        "top_models": debug.get("top_models", []),
        "job_submitted": True,
        "job_id": job_id,
        "is_possible": is_possible,
        "queue_position": debug.get("queue_position"),
        "estimated_wait_s": debug.get("wait_time_s"),
        "latency_ms": round((time.time() - t0) * 1000),
        "debug": debug,
    }


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        t_start = time.time()
        page    = _check_page()
        token   = _check_token()
        models  = _check_models()
        image   = _check_image()
        overall = page["reachable"] and token["reachable"] and token.get("token_received", False) and models["reachable"]

        body = json.dumps({
            "success": True,
            "status": "ok" if overall else "degraded",
            "timestamp": int(time.time()),
            "total_ms": round((time.time() - t_start) * 1000),
            "checks": {
                "page": page,
                "token": token,
                "models": {"reachable": models["reachable"], "model_count": models["model_count"], "latency_ms": models["latency_ms"], **({"error": models["error"]} if "error" in models else {})},
                "image": image,
            },
            "models": models["models"],
            "debug": models.get("debug", {}),
        }, ensure_ascii=False).encode()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)