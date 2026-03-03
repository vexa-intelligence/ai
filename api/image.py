from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json, time, random, collections, base64
import requests as req

UA            = "Mozilla/5.0"
HORDE_API     = "https://stablehorde.net/api/v2"
ANON_KEY      = "0000000000"
MAX_REQUESTS  = 10
RATE_WINDOW   = 60
POLL_INTERVAL = 3
POLL_TIMEOUT  = 120
_rate_store: dict = {}

RESOLUTIONS = {
    "768x768": (768, 768),
    "512x768": (512, 768),
    "768x512": (768, 512),
    "512x512": (512, 512),
}

CFG_MIN, CFG_MAX     = 1, 20
STEPS_MIN, STEPS_MAX = 1, 50


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
    if fwd:
        return fwd.split(",")[0].strip()
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


def _cancel_job(job_id: str):
    try:
        req.delete(
            f"{HORDE_API}/generate/status/{job_id}",
            headers={"apikey": ANON_KEY, "User-Agent": UA},
            timeout=5,
        )
    except Exception:
        pass


def _submit_job(prompt: str, negative_prompt: str, w: int, h: int,
                num: int, model: str, cfg_scale: float, steps: int) -> str:
    payload = {
        "prompt": prompt + (f" ### {negative_prompt}" if negative_prompt else ""),
        "params": {
            "width":        w,
            "height":       h,
            "n":            num,
            "steps":        steps,
            "sampler_name": "k_euler",
            "cfg_scale":    cfg_scale,
            "seed":         str(random.randint(0, 2**31)),
        },
        "models": [model],
        "r2":     True,
        "shared": False,
    }
    r = req.post(
        f"{HORDE_API}/generate/async",
        json=payload,
        headers={"apikey": ANON_KEY, "User-Agent": UA, "Content-Type": "application/json"},
        timeout=15,
    )
    r.raise_for_status()
    resp_json = r.json()
    job_id = resp_json.get("id")
    if not job_id:
        raise RuntimeError(f"No job ID returned: {resp_json}")
    return job_id


def _poll_and_fetch(job_id: str) -> list:
    deadline = time.time() + POLL_TIMEOUT
    while time.time() < deadline:
        time.sleep(POLL_INTERVAL)
        check = req.get(
            f"{HORDE_API}/generate/check/{job_id}",
            headers={"apikey": ANON_KEY, "User-Agent": UA},
            timeout=10,
        ).json()
        if not check.get("is_possible", True):
            _cancel_job(job_id)
            raise RuntimeError("No workers available for this model. Check /models for valid image_models.")
        if check.get("done") or check.get("faulted"):
            break

    status_r = req.get(
        f"{HORDE_API}/generate/status/{job_id}",
        headers={"apikey": ANON_KEY, "User-Agent": UA},
        timeout=15,
    ).json()

    images = []
    for gen in status_r.get("generations", []):
        img_url = gen.get("img", "")
        b64 = None
        try:
            img_r = req.get(img_url, timeout=15)
            b64 = base64.b64encode(img_r.content).decode()
        except Exception:
            pass
        images.append({
            "url":    img_url,
            "b64":    b64,
            "seed":   gen.get("seed", ""),
            "worker": gen.get("worker_name", ""),
        })
    return images


def _parse_params(params: dict) -> tuple:
    prompt          = (params.get("q") or params.get("prompt") or [None])[0]
    negative_prompt = (params.get("negative_prompt") or params.get("negative") or [""])[0]
    resolution      = (params.get("resolution") or ["512x512"])[0]
    model           = (params.get("model") or ["Deliberate"])[0]

    try:
        num = int((params.get("num") or params.get("numImages") or ["1"])[0])
        num = max(1, min(num, 4))
    except (ValueError, TypeError):
        num = 1

    try:
        cfg_scale = float((params.get("cfg_scale") or params.get("guidance_scale") or ["7"])[0])
        cfg_scale = max(CFG_MIN, min(cfg_scale, CFG_MAX))
    except (ValueError, TypeError):
        cfg_scale = 7.0

    try:
        steps = int((params.get("steps") or ["20"])[0])
        steps = max(STEPS_MIN, min(steps, STEPS_MAX))
    except (ValueError, TypeError):
        steps = 20

    return prompt, negative_prompt, resolution, model, num, cfg_scale, steps


def _parse_body(body: dict) -> tuple:
    flat = {k: [str(v)] if not isinstance(v, list) else v for k, v in body.items()}
    return _parse_params(flat)


def _run(h, prompt, negative_prompt, resolution, model, num, cfg_scale, steps):
    if not prompt or not prompt.strip():
        _respond(h, 400, {"error": "Missing required parameter: q or prompt"})
        return

    prompt          = prompt.replace("+", " ").strip()[:500]
    negative_prompt = (negative_prompt or "").replace("+", " ").strip()[:300]
    w, h_px         = RESOLUTIONS.get(resolution, (512, 512))

    t0 = time.time()
    try:
        job_id = _submit_job(prompt, negative_prompt, w, h_px, num, model, cfg_scale, steps)
        images = _poll_and_fetch(job_id)
        if not images:
            _respond(h, 502, {"error": "Generation completed but returned no images. Try again."})
            return
        _respond(h, 200, {
            "prompt":          prompt,
            "negative_prompt": negative_prompt or None,
            "model":           model,
            "resolution":      resolution,
            "cfg_scale":       cfg_scale,
            "steps":           steps,
            "num_images":      num,
            "images":          images,
            "elapsed_ms":      round((time.time() - t0) * 1000),
        })
    except RuntimeError as e:
        _respond(h, 502, {"error": str(e)})
    except Exception as e:
        _respond(h, 500, {"error": f"Internal error: {e}"})


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if _is_rate_limited(_get_ip(self)):
            _respond(self, 429, {"error": "Rate limit exceeded"})
            return
        params = parse_qs(urlparse(self.path).query)
        args = _parse_params(params)
        _run(self, *args)

    def do_POST(self):
        if _is_rate_limited(_get_ip(self)):
            _respond(self, 429, {"error": "Rate limit exceeded"})
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            _respond(self, 400, {"error": "Invalid JSON body"})
            return
        args = _parse_body(body)
        _run(self, *args)