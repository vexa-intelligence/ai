![Banner](/public/assets/banner.png)

# Vexa AI API

A free, multi-provider AI API for text and image generation. No API keys. No accounts. Just fetch.

**Base URL** — `https://vexa-ai.pages.dev`

---

## Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/query` | GET, POST | Single-turn text generation |
| `/chat` | POST | Multi-turn chat with streaming |
| `/image` | GET, POST | Text-to-image generation |
| `/image/proxy/:id` | GET | Serve a generated image |
| `/models` | GET | List available models and defaults |
| `/health` | GET | System and model status |

---

## `/query`

The simplest way to get a text response. Send a prompt, get text back as JSON.

**GET**
```bash
curl "https://vexa-ai.pages.dev/query?q=What+is+a+closure+in+JavaScript"
```

**POST**
```bash
curl -X POST https://vexa-ai.pages.dev/query \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "What is a closure in JavaScript" }'
```

**Parameters**

| Name | Required | Description |
|------|----------|-------------|
| `q` / `query` / `prompt` | Yes | Your prompt |
| `model` | No | Model name (default: `vexa`) |

**Response**
```json
{
  "success": true,
  "response": "A closure is...",
  "model": "vexa",
  "elapsed_ms": 843,
  "source": "deepai.org"
}
```

---

## `/chat`

Multi-turn chat with full message history. **Always streams** via Server-Sent Events — there is no JSON mode.

```bash
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "system", "content": "You are a concise assistant." },
      { "role": "user", "content": "What is a webhook?" }
    ]
  }'
```

**Parameters**

| Name | Required | Description |
|------|----------|-------------|
| `messages` | Yes | Array of `{ role, content }` objects |
| `model` | No | Model name (default: `vexa`) |

**Message roles:** `system` · `user` · `assistant`

**Limits:** 100 messages max · 32,000 chars per message · 200,000 total chars · at least one `user` message required

**Stream format (SSE)**
```
data: {"choices":[{"delta":{"content":"A webhook"},"finish_reason":null}]}
data: {"choices":[{"delta":{"content":" is a..."},"finish_reason":null}]}
data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
data: [DONE]
```

**Error during stream**
```
data: {"error":{"message":"..."},"finish_reason":"error"}
```

> **Note on history support** — not all models forward the full message array. Check `/models` to see which providers are active; providers like TalkAI only receive the last user message. Models via DeepAI and Pollinations support full history and system prompts.

---

## `/image`

Generate an image from a text prompt.

**GET**
```bash
curl "https://vexa-ai.pages.dev/image?q=a+neon+lit+Tokyo+alley+at+2am"
```

**POST**
```bash
curl -X POST https://vexa-ai.pages.dev/image \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "a neon lit Tokyo alley at 2am", "model": "flux" }'
```

**Parameters**

| Name | Required | Description |
|------|----------|-------------|
| `q` / `prompt` | Yes | Image description (max 1,000 chars) |
| `model` | No | Image model (default: `hd`) |
| `preference` | No | `speed` or `quality` — only applies to the `hd` model |

For available image models, check [`/models?type=image`](https://vexa-ai.pages.dev/models?type=image).

**Response**
```json
{
  "success": true,
  "prompt": "a neon lit Tokyo alley at 2am",
  "model": "flux",
  "proxy_url": "https://vexa-ai.pages.dev/image/proxy/abc123",
  "source": "pollinations.ai",
  "elapsed_ms": 2840
}
```

Use `proxy_url` directly as an image source in your app.

---

## `/image/proxy/:id`

Serves the generated image. Use the `proxy_url` from the `/image` response.

```bash
curl "https://vexa-ai.pages.dev/image/proxy/abc123" --output image.png
```

Returns the image binary with appropriate `Content-Type` and a 24-hour cache header. Returns `404` if the ID is not found. Proxy IDs are stored in memory — they do not survive server restarts.

---

## `/models`

Returns the current list of available models, grouped by provider, along with system defaults.

```bash
curl "https://vexa-ai.pages.dev/models"
curl "https://vexa-ai.pages.dev/models?type=text"
curl "https://vexa-ai.pages.dev/models?type=image"
curl "https://vexa-ai.pages.dev/models?details=true"
```

**Parameters**

| Name | Default | Description |
|------|---------|-------------|
| `type` | — | Filter by `text` or `image` |
| `details` | `false` | Include provider, speed, quality, and enabled status per model |

**Response shape**
```json
{
  "success": true,
  "defaults": {
    "text": "vexa",
    "image": "hd",
    "image_preference": "speed"
  },
  "counts": { "text": 15, "image": 5 },
  "text_models": ["vexa", "..."],
  "text_models_by_provider": {
    "DeepAI": [ { "name": "vexa", "label": "Vexa", "provider": "vexa-ai", "description": "..." } ],
    "Pollinations": [ { "name": "pol-openai-fast", ... } ],
    "AIFree": [ ... ],
    "Toolbaz": [ ... ]
  },
  "image_models": ["hd", "flux", "..."],
  "valid_image_models": "hd, flux, ..."
}
```

Always use this endpoint as the source of truth for model names — the list updates dynamically.

---

## `/health`

Checks system and upstream provider reachability, and optionally probes each model.

```bash
curl "https://vexa-ai.pages.dev/health"
curl "https://vexa-ai.pages.dev/health?skip_models=true"
```

**Parameters**

| Name | Default | Description |
|------|---------|-------------|
| `skip_models` | `false` | Skip per-model health probes (much faster) |

**Response**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": 1718000000,
  "total_ms": 1240,
  "checks": {
    "page": { "reachable": true, "status_code": 200, "latency_ms": 95 },
    "token": { "reachable": true, "token_received": true, "status_code": 200, "latency_ms": 80 },
    "image": { "reachable": true, "status_code": 200, "latency_ms": 110 },
    "models": {
      "vexa": { "ok": true, "latency_ms": 430 }
    }
  }
}
```

**Status values:** `ok` · `degraded` · `error`

If any models fail, a `failed_models` array is included in the response.

---

## CORS & Auth

All endpoints return `Access-Control-Allow-Origin: *`. No authentication is required. Requests are rate-limited per IP.

---

## Error Format

Every error — across all endpoints — follows this shape:

```json
{
  "success": false,
  "error": "Human-readable message",
  "detail": "Optional extra context"
}
```

| Status | When |
|--------|------|
| `400` | Missing or invalid parameters / malformed JSON |
| `404` | Resource not found (e.g. expired proxy ID) |
| `405` | Wrong HTTP method |
| `502` | Upstream provider failed |
| `500` | Internal server error |
