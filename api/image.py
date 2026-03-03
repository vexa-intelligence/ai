from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json, time, random, collections, base64
import requests as req

UA = "Mozilla/5.0"
HORDE_API = "https://stablehorde.net/api/v2"
ANON_KEY = "0000000000"
MAX_REQUESTS = 10
RATE_WINDOW = 60
POLL_INTERVAL = 3
POLL_TIMEOUT = 120
_rate_store: dict = {}

RESOLUTIONS = {
    "768x768": (768, 768),
    "512x768": (512, 768),
    "768x512": (768, 512),
    "512x512": (512, 512),
}


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


def _get_ip(h) -> str:
    fwd = h.headers.get("x-forwarded-for", "")
    if fwd: return fwd.split(",")[0].strip()
    return h.client_address[0] if h.client_address else "unknown"


def _respond(h, status: int, data: dict):
    body = json.dumps({"success": status < 400, **data}, ensure_ascii=False).encode()
    h.send_response(status)
    h.send_header("Content-Type", "application/json")
    h.send_header("Content-Length", str(len(body)))
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    h.send_header("Access-Control-Allow-Headers", "Content-Type")
    h.end_headers()
    h.wfile.write(body)


def _cancel_job(job_id: str):
    try:
        req.delete(f"{HORDE_API}/generate/status/{job_id}", headers={"apikey": ANON_KEY, "User-Agent": UA}, timeout=5)
    except Exception:
        pass


def _generate(prompt: str, w: int, h: int, num: int, model: str) -> list:
    payload = {
        "prompt": prompt,
        "params": {"width": w, "height": h, "n": num, "steps": 20, "sampler_name": "k_euler", "cfg_scale": 7, "seed": str(random.randint(0, 2**31))},
        "models": [model],
        "r2": True,
        "shared": False,
    }
    r = req.post(f"{HORDE_API}/generate/async", json=payload, headers={"apikey": ANON_KEY, "User-Agent": UA, "Content-Type": "application/json"}, timeout=15)
    r.raise_for_status()
    resp_json = r.json()
    job_id = resp_json.get("id")
    if not job_id:
        raise RuntimeError(f"No job ID: {resp_json}")

    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        time.sleep(POLL_INTERVAL)
        check = req.get(f"{HORDE_API}/generate/check/{job_id}", headers={"apikey": ANON_KEY, "User-Agent": UA}, timeout=10).json()
        if not check.get("is_possible", True):
            _cancel_job(job_id)
            raise RuntimeError(f"No workers available for model '{model}'. See /models for valid image_models.")
        if check.get("done") or check.get("faulted"):
            break

    status_r = req.get(f"{HORDE_API}/generate/status/{job_id}", headers={"apikey": ANON_KEY, "User-Agent": UA}, timeout=15).json()

    images = []
    for gen in status_r.get("generations", []):
        img_url = gen.get("img", "")
        b64 = None
        try:
            img_r = req.get(img_url, timeout=15)
            b64 = base64.b64encode(img_r.content).decode()
        except Exception:
            pass
        images.append({"url": img_url, "b64": b64, "seed": gen.get("seed", ""), "worker": gen.get("worker_name", "")})
    return images


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)

        prompt = (params.get("q") or params.get("prompt") or [None])[0]
        if not prompt:
            _respond(self, 400, {"error": "Missing required parameter: q or prompt"})
            return

        if _is_rate_limited(_get_ip(self)):
            _respond(self, 429, {"error": "Rate limit exceeded"})
            return

        prompt = prompt.replace("+", " ").strip()[:500]
        resolution = (params.get("resolution") or ["512x512"])[0]
        w, h = RESOLUTIONS.get(resolution, (512, 512))
        model = (params.get("model") or ["Deliberate"])[0]
        try:
            num = int((params.get("num") or params.get("numImages") or ["1"])[0])
            num = max(1, min(num, 4))
        except ValueError:
            num = 1

        try:
            images = _generate(prompt, w, h, num, model)
            _respond(self, 200, {"prompt": prompt, "model": model, "resolution": resolution, "num_images": num, "images": images})
        except Exception as e:
            _respond(self, 502, {"error": str(e)})