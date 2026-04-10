![Vexa Banner](/images/banner.png)

# Vexa AI

Free REST API for text and image generation. No account, no API key, no setup.

- **Text** — 25+ AI models via Toolbaz, DeepAI, AIFreeForever, and Pollinations
- **Images** — HD (DeepAI) + Pollinations models (Flux, Turbo, Kontext, Seedream, Nano Banana), proxied (no direct image URLs exposed)

```
BASE_URL = https://vexa-ai.pages.dev
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API documentation as JSON |
| `GET` | `/models` | All text + image models |
| `GET POST` | `/query` | Single prompt → response |
| `POST` | `/chat` | Multi-turn conversation (OpenAI-style messages array) |
| `GET POST` | `/image` | Generate images |
| `GET` | `/image/proxy/:id` | Proxied image delivery — never exposes origin URL |
| `GET` | `/health` | Live status of all models and upstreams |

---

## Quick Start

```bash
# Ask a question
curl "/query?q=What+is+a+black+hole"

# With a specific model
curl "/query?q=Hello&model=toolbaz-v4.5-fast"

# With Pollinations
curl "/query?q=Hello&model=pol-openai-fast"

# Multi-turn chat
curl -X POST /chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# Generate an image (default: HD model, speed preference)
curl "/image?q=a+red+fox+in+a+neon+city"

# Generate with Pollinations Flux
curl "/image?q=a+castle&model=flux"

# Generate with quality preference (HD only)
curl "/image?q=a+castle&preference=quality"

# List all models
curl "/models"

# Check system health
curl "/health"
```

---

## Docs

- [Models →](./MODELS.md)
- [Query →](./QUERY.md)
- [Chat →](./CHAT.md)
- [Image →](./IMAGE.md)
- [Health →](./HEALTH.md)

---

In-memory per serverless instance, resets on cold starts.

---

## Errors

```json
{ "success": false, "error": "description" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request — missing or invalid parameters |
| `429` | Rate limit exceeded |
| `502` | Upstream service failed |
| `500` | Internal server error |

---

## Project Structure

```
functions/
├── index.js          # GET / - API documentation
├── query.js          # GET POST /query
├── chat.js           # POST /chat
├── models.js         # GET /models
├── health.js         # GET /health
├── image.js          # GET POST /image
├── image/
│   └── proxy/
│       └── [[id]].js # GET /image/proxy/:id — proxied image delivery
└── 404.js            # Fallback 404 handler
wrangler.toml         # Cloudflare Pages config
```

## Deploy

```bash
git clone https://github.com/your-username/vexa-ai
npm i -g wrangler
wrangler pages deploy .
```

## Run Locally

```bash
npm i -g wrangler
wrangler pages dev .
# → http://127.0.0.1:8788
```

No dependencies required — pure JavaScript with Cloudflare Pages Functions.