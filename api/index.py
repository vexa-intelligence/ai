from http.server import BaseHTTPRequestHandler
import json, time

ENDPOINTS = [
    {
        "method": "GET",
        "path": "/query",
        "description": "Send a prompt to an AI model and get a response",
        "params": {
            "q": "Your prompt (also accepted as 'query' or 'prompt' in POST body)",
            "model": "(optional) Model ID. Defaults to first available model",
        },
        "example_request": "GET /query?q=Hello&model=deepseek-v3.1",
        "example_response": {"success": True, "response": "Hello! How can I help you today?", "model": "deepseek-v3.1", "elapsed_ms": 1243},
    },
    {
        "method": "POST",
        "path": "/query",
        "description": "Send a prompt via JSON body",
        "body_fields": {"q / query / prompt": "string (required)", "model": "string (optional)"},
        "example_request": {"prompt": "Explain black holes in one sentence", "model": "gemini-3-flash"},
        "example_response": {"success": True, "response": "A black hole is a region of spacetime...", "model": "gemini-3-flash", "elapsed_ms": 980},
    },
    {
        "method": "GET",
        "path": "/models",
        "description": "List all available text models with provider, speed, and quality metadata",
        "example_response": {"success": True, "default": "toolbaz-v4.5-fast", "models": {"toolbaz-v4.5-fast": {"provider": "ToolBaz", "speed": 250, "quality": 90}}},
    },
    {
        "method": "GET",
        "path": "/health",
        "description": "Check upstream reachability, token generation, live text model list, and image service status",
        "example_response": {
            "success": True, "status": "ok", "timestamp": 1740888000, "total_ms": 310,
            "checks": {
                "page": {"reachable": True, "status_code": 200, "latency_ms": 111},
                "token": {"reachable": True, "token_received": True, "latency_ms": 47},
                "models": {"reachable": True, "model_count": 19, "latency_ms": 87},
                "image": {"reachable": True, "model_count": 20, "latency_ms": 210},
            },
        },
    },
    {
        "method": "GET",
        "path": "/image",
        "description": "Generate images via Stable Horde. Returns base64-encoded webp images.",
        "params": {
            "q / prompt": "Image description (required)",
            "model": "(optional) Stable Horde model name. Defaults to 'Deliberate'. Use /image/options for valid names.",
            "resolution": "(optional) One of: 512x512, 512x768, 768x512, 768x768. Defaults to 512x512.",
            "num / numImages": "(optional) Number of images 1-4. Defaults to 1.",
        },
        "example_request": "GET /image?q=a+sunset+over+mountains&model=Deliberate&resolution=512x512&num=1",
        "example_response": {
            "success": True,
            "prompt": "a sunset over mountains",
            "model": "Deliberate",
            "resolution": "512x512",
            "num_images": 1,
            "images": [{"url": "https://...r2.cloudflarestorage.com/...webp", "b64": "<base64 webp>", "seed": "149576367", "worker": "WorkerName"}],
        },
    },
    {
        "method": "GET",
        "path": "/image/options",
        "description": "List available image models and resolutions scraped live from Stable Horde",
        "example_response": {
            "success": True,
            "models": ["Deliberate", "AlbedoBase XL 3.1", "Dreamshaper", "Flux.1-Schnell fp8 (Compact)"],
            "resolutions": ["512x512", "512x768", "768x512", "768x768"],
            "default_model": "Deliberate",
            "default_resolution": "512x512",
        },
    },
]

ERROR_RESPONSES = [
    {"status": 400, "body": {"success": False, "error": "Missing required parameter: q, query, or prompt"}},
    {"status": 400, "body": {"success": False, "error": "Prompt exceeds maximum length of 4000 characters"}},
    {"status": 400, "body": {"success": False, "error": "Unknown model 'xyz'", "valid_models": ["toolbaz-v4.5-fast", "..."]}},
    {"status": 429, "body": {"success": False, "error": "Rate limit exceeded. Try again shortly."}},
    {"status": 502, "body": {"success": False, "error": "Upstream request failed"}},
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
            "name": "Toolbaz + Stable Horde API",
            "description": "Text generation via toolbaz.com (19 AI models) and image generation via Stable Horde. No API key required.",
            "timestamp": int(time.time()),
            "rate_limit": "20 requests per IP per 60 seconds (text); 10 per 60 seconds (image)",
            "endpoints": ENDPOINTS,
            "errors": ERROR_RESPONSES,
        }, ensure_ascii=False, indent=2).encode()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)