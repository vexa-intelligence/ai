from http.server import BaseHTTPRequestHandler
import json, time

ENDPOINTS = [
    {
        "method":      "GET / POST",
        "path":        "/query",
        "description": "Send a prompt to a Toolbaz AI model and get a response",
        "params": {
            "q":     "Your prompt (GET) — also accepted as 'query'",
            "model": "(optional) Model ID. Defaults to 'toolbaz-v4.5-fast'. See /models.",
        },
        "body_fields": {
            "q / query / prompt": "string (required)",
            "model":              "string (optional)",
        },
        "example_response": {
            "success":    True,
            "response":   "Hello! How can I help you today?",
            "model":      "toolbaz-v4.5-fast",
            "elapsed_ms": 1243,
        },
    },
    {
        "method":      "POST",
        "path":        "/chat",
        "description": "Multi-turn conversation using an OpenAI-style messages array.",
        "body_fields": {
            "messages": "array (required) — [{role: 'system'|'user'|'assistant', content: string}]",
            "model":    "string (optional)",
        },
        "example_request": {
            "model": "gemini-2.5-pro",
            "messages": [
                {"role": "system",    "content": "You are a helpful assistant."},
                {"role": "user",      "content": "What is the speed of light?"},
                {"role": "assistant", "content": "Approximately 299,792,458 m/s."},
                {"role": "user",      "content": "How long does it take to reach the Moon?"},
            ],
        },
        "example_response": {
            "success": True,
            "message": {"role": "assistant", "content": "At the speed of light, it takes about 1.28 seconds."},
            "model":        "gemini-2.5-pro",
            "elapsed_ms":   980,
            "prompt_chars": 312,
        },
        "note": "GET /chat returns 405 with usage instructions instead of a server error.",
    },
    {
        "method":      "GET",
        "path":        "/models",
        "description": "All available text models scraped live from Toolbaz, and image models from Stable Horde. Cached 5 min.",
        "note":        "Text models are scraped dynamically — no hardcoded list. Includes label, provider, speed (W/s), and quality score.",
        "example_response": {
            "success": True,
            "default": "toolbaz-v4.5-fast",
            "models": {
                "toolbaz-v4.5-fast": {"label": "ToolBaz-v4.5-Fast", "provider": "ToolBaz",  "speed": 250, "quality": 90},
                "gemini-2.5-pro":    {"label": "Gemini-2.5-Pro",    "provider": "Google",   "speed": 50,  "quality": 84},
                "deepseek-v3.1":     {"label": "Deepseek-V3.1",     "provider": "DeepSeek", "speed": 295, "quality": 80},
            },
            "image_models": [
                {"name": "Deliberate",  "count": 4},
                {"name": "Dreamshaper", "count": 3},
            ],
        },
    },
    {
        "method":      "GET / POST",
        "path":        "/image",
        "description": "Generate images via Stable Horde. Returns base64-encoded output. Takes 10–120s.",
        "params": {
            "q / prompt":      "Image description (required)",
            "negative_prompt": "(optional) Things to exclude from the image",
            "model":           "(optional) Stable Horde model name. Default: Deliberate. See /models → image_models.",
            "resolution":      "(optional) e.g. 512x512, 768x768, 1024x1024. Default: 512x512",
            "num":             "(optional) Number of images 1–4. Default: 1",
            "cfg_scale":       "(optional) Guidance scale 1–20. Default: 7",
            "steps":           "(optional) Inference steps 10–50. Default: 25",
            "sampler":         "(optional) Sampler name. Default: k_euler_a",
        },
        "example_response": {
            "success": True, "prompt": "a red fox in a neon city",
            "model": "Deliberate", "resolution": "512x512",
            "num_images": 1, "elapsed_ms": 34200,
            "images": [{"url": "https://...webp", "b64": "<base64>", "seed": "149576367", "worker": "WorkerName"}],
        },
    },
    {
        "method":      "GET",
        "path":        "/health",
        "description": "Live check of Toolbaz page, token endpoint, model list, and Stable Horde image pipeline.",
        "example_response": {
            "success": True, "status": "ok", "timestamp": 1740888000, "total_ms": 270,
            "checks": {
                "page":   {"reachable": True, "status_code": 200, "latency_ms": 107},
                "token":  {"reachable": True, "token_received": True, "status_code": 200, "latency_ms": 57},
                "models": {"reachable": True, "model_count": 19, "latency_ms": 103},
            },
            "models": {
                "toolbaz-v4.5-fast": {"label": "ToolBaz-v4.5-Fast", "provider": "ToolBaz",  "speed": 250, "quality": 90},
                "gemini-3-flash":    {"label": "Gemini-3-Flash",    "provider": "Google",   "speed": 60,  "quality": 94},
            },
        },
    },
]

ERROR_RESPONSES = [
    {"status": 400, "body": {"success": False, "error": "Missing required parameter: q, query, or prompt"}},
    {"status": 400, "body": {"success": False, "error": "Prompt exceeds maximum length of 4000 characters"}},
    {"status": 400, "body": {"success": False, "error": "Unknown model 'xyz'", "valid_models": ["toolbaz-v4.5-fast", "..."]}},
    {"status": 400, "body": {"success": False, "error": "Missing or empty 'messages' array"}},
    {"status": 400, "body": {"success": False, "error": "messages[0].role must be 'system', 'user', or 'assistant'"}},
    {"status": 400, "body": {"success": False, "error": "Conversation exceeds maximum length of 16000 characters"}},
    {"status": 405, "body": {"success": False, "error": "GET not supported on /chat", "frontend_only": True}},
    {"status": 429, "body": {"success": False, "error": "Rate limit exceeded. Try again shortly."}},
    {"status": 502, "body": {"success": False, "error": "Upstream request failed"}},
    {"status": 502, "body": {"success": False, "error": "No workers available for this model. Check /models for valid image_models."}},
    {"status": 500, "body": {"success": False, "error": "Internal server error"}},
]


class handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        body = json.dumps({
            "name":           "Vexa AI",
            "description":    "Free text and image generation API. No key required.",
            "base_url":       "https://vexa-ai.vercel.app",
            "timestamp":      int(time.time()),
            "text_provider":  "Toolbaz (https://toolbaz.com)",
            "image_provider": "Stable Horde (https://aihorde.net)",
            "rate_limits": {
                "/query": "20 requests / IP / 60s",
                "/chat":  "20 requests / IP / 60s",
                "/image": "10 requests / IP / 60s",
            },
            "endpoints": ENDPOINTS,
            "errors":     ERROR_RESPONSES,
        }, ensure_ascii=False, indent=2).encode()
        self.send_response(200)
        self.send_header("Content-Type",   "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)