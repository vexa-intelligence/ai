![Vexa Banner](/images/banner.png)

# Vexa AI

Free REST API for text and image generation. No account, no API key, no setup.

- **Text** — AI models via [Toolbaz](https://toolbaz.com)
- **Images** — Community GPU cluster via [Stable Horde](https://aihorde.net)

```
BASE_URL = https://your-domain.pages.dev
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API documentation as JSON |
| `GET` | `/models` | All text + image models (live-scraped, zero hardcoding) |
| `GET POST` | `/query` | Single prompt → response |
| `POST` | `/chat` | Multi-turn conversation (OpenAI-style messages array) |
| `GET POST` | `/image` | Generate images |
| `GET` | `/health` | Live status of Toolbaz and Stable Horde |

---

## Quick Start

```bash
# Ask a question
curl "https://your-domain.pages.dev/query?q=What+is+a+black+hole"

# With a specific model
curl "https://your-domain.pages.dev/query?q=Hello&model=toolbaz-v4.5-fast"

# Multi-turn chat
curl -X POST https://your-domain.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'

# Generate an image
curl "https://your-domain.pages.dev/image?q=a+red+fox+in+a+neon+city"

# List all models
curl "https://your-domain.pages.dev/models"

# Check system health
curl "https://your-domain.pages.dev/health"
```

---

## Docs

- [Models →](./MODELS.md)
- [Query →](./QUERY.md)
- [Chat →](./CHAT.md)
- [Image →](./IMAGE.md)
- [Health →](./HEALTH.md)

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/query` | 20 requests / IP / 60s |
| `/chat` | 20 requests / IP / 60s |
| `/image` | 10 requests / IP / 60s |

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
├── index.js       # GET / - API documentation
├── query.js       # GET POST /query
├── chat.js        # POST /chat
├── models.js      # GET /models
├── health.js      # GET /health
├── image.js       # GET POST /image
└── 404.js         # Fallback 404 handler
endpoints.json     # API documentation source
wrangler.toml      # Cloudflare Pages config
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

No dependencies required - pure JavaScript with Cloudflare Pages Functions.