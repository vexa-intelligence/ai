from http.server import BaseHTTPRequestHandler
import json, time
import requests as req

POLLINATIONS_MODELS_URL = "https://text.pollinations.ai/models"
HORDE_API = "https://stablehorde.net/api/v2"
CACHE_TTL = 300
UA        = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

BASE_MODELS = {
    "openai":             {"label": "GPT-4o",              "provider": "OpenAI"},
    "openai-large":       {"label": "GPT-4o Large",        "provider": "OpenAI"},
    "openai-reasoning":   {"label": "o1 Reasoning",        "provider": "OpenAI"},
    "openai-fast":        {"label": "GPT-OSS Fast",        "provider": "OpenAI"},
    "mistral":            {"label": "Mistral",             "provider": "Mistral AI"},
    "mistral-roblox":     {"label": "Mistral (Roblox)",    "provider": "Mistral AI"},
    "llama":              {"label": "Llama 3 (fastest)",   "provider": "Meta"},
    "llama-scaleway":     {"label": "Llama 3 (Scaleway)",  "provider": "Meta"},
    "deepseek":           {"label": "DeepSeek V3",         "provider": "DeepSeek"},
    "deepseek-r1":        {"label": "DeepSeek R1",         "provider": "DeepSeek"},
    "claude-hybridspace": {"label": "Claude Hybrid",       "provider": "Anthropic"},
    "searchgpt":          {"label": "SearchGPT",           "provider": "OpenAI"},
    "qwen-coder":         {"label": "Qwen Coder",          "provider": "Alibaba"},
    "phi":                {"label": "Phi-4",               "provider": "Microsoft"},
    "gemini":             {"label": "Gemini 2.0 Flash",    "provider": "Google"},
}
DEFAULT_MODEL = "openai"

_cache: dict = {"models": {}, "default": DEFAULT_MODEL, "image_models": [], "ts": 0}


def _get_text_models() -> tuple[dict, str]:
    merged = dict(BASE_MODELS)
    try:
        r = req.get(POLLINATIONS_MODELS_URL, headers={"User-Agent": UA}, timeout=10)
        r.raise_for_status()
        data = r.json()
        if isinstance(data, list) and len(data) > 1:
            for m in data:
                mid = m.get("name") or m.get("id", "")
                if not mid or mid in merged:
                    continue
                merged[mid] = {
                    "label":    m.get("description") or m.get("name") or mid,
                    "provider": m.get("provider", ""),
                }
    except Exception:
        pass
    return merged, DEFAULT_MODEL


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
    text_models, default = _get_text_models()
    image_models = _get_image_models()
    _cache.update({"models": text_models, "default": default, "image_models": image_models, "ts": now})
    return text_models, default, image_models


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
        body = json.dumps({
            "success":      True,
            "default":      default,
            "models":       models,
            "image_models": image_models,
        }, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)