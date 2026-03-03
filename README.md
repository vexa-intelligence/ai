# Vexa AI API
Text generation via [toolbaz.com](https://toolbaz.com/writer/chat-gpt-alternative) (19 AI models) and image generation via [Stable Horde](https://stablehorde.net). No API key required.

---

## Deploy
```bash
npm i -g vercel
vercel
```

---

## Project Structure
```
api/
├── index.py        # GET /
├── query.py        # GET/POST /query
├── models.py       # GET /models
├── health.py       # GET /health
└── image.py        # GET /image, /image/options
requirements.txt
vercel.json
```

---

## Endpoints

### `GET /query`
```
/query?q=Hello
/query?q=Hello&model=deepseek-v3.1
```

### `POST /query`
```bash
curl -X POST https://your-app.vercel.app/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "model": "deepseek-v3.1"}'
```
**Response**
```json
{ "success": true, "response": "...", "model": "deepseek-v3.1", "elapsed_ms": 1243 }
```

---

### `GET /models`
Returns all available text models (scraped live from Toolbaz) plus top image models from Stable Horde.
```json
{
  "success": true,
  "default": "toolbaz-v4.5-fast",
  "models": { "toolbaz-v4.5-fast": { "provider": "ToolBaz", "speed": 250, "quality": 90 } },
  "image_models": [{ "name": "Deliberate", "count": 42, "queued": 5 }]
}
```

---

### `GET /image`
Generates images via Stable Horde. Returns base64-encoded webp.

| Param | Required | Default | Notes |
|-------|----------|---------|-------|
| `q` / `prompt` | yes | — | Image description |
| `model` | no | `Deliberate` | Use `/image/options` for valid names |
| `resolution` | no | `512x512` | `512x512`, `512x768`, `768x512`, `768x768` |
| `num` / `numImages` | no | `1` | 1–4 |
```
GET /image?q=a+sunset+over+mountains&model=Deliberate&resolution=512x512&num=1
```
**Response**
```json
{
  "success": true,
  "prompt": "a sunset over mountains",
  "model": "Deliberate",
  "resolution": "512x512",
  "num_images": 1,
  "images": [{ "url": "https://...webp", "b64": "<base64>", "seed": "149576367", "worker": "WorkerName" }]
}
```
Display with: `<img src="data:image/webp;base64,{b64}">`

> Image generation takes 10–60s depending on Stable Horde queue.

### `GET /image/options`
```json
{
  "success": true,
  "models": ["Deliberate", "AlbedoBase XL 3.1", "Dreamshaper", "Flux.1-Schnell fp8 (Compact)"],
  "resolutions": ["512x512", "512x768", "768x512", "768x768"],
  "default_model": "Deliberate",
  "default_resolution": "512x512"
}
```

---

### `GET /health`
Checks all upstream services.
```json
{
  "success": true,
  "status": "ok",
  "checks": {
    "page":   { "reachable": true, "latency_ms": 111 },
    "token":  { "reachable": true, "token_received": true, "latency_ms": 47 },
    "models": { "reachable": true, "model_count": 19, "latency_ms": 87 },
    "image":  { "reachable": true, "model_count": 84, "top_models": ["Deliberate", "..."], "latency_ms": 210 }
  }
}
```

---

## Error Responses

| Status | Error |
|--------|-------|
| `400` | `"Missing required parameter"` |
| `400` | `"Prompt exceeds maximum length of 4000 characters"` |
| `400` | `"Unknown model 'xyz'"` |
| `429` | `"Rate limit exceeded"` |
| `502` | `"Upstream request failed"` |

---

## Rate Limiting
- Text (`/query`): 20 requests per IP per 60s
- Image (`/image`): 10 requests per IP per 60s

> In-memory per serverless instance, resets on cold starts.

## Run Locally
```bash
pip install requests
vercel dev
```