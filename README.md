![Banner](/public/assets/banner.png)

# Vexa AI API

Multi-provider AI API for text and image generation. No API keys. No accounts.

**Base URL** — `https://vexa-ai.pages.dev`

All endpoints return `Access-Control-Allow-Origin: *`. Requests are rate-limited per IP.

---

## Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `GET /query` | GET, POST | Single-turn text generation, returns JSON |
| `POST /chat` | POST | Multi-turn chat, always streams via SSE |
| `GET /image` | GET, POST | Text-to-image generation |
| `GET /image/proxy/:id` | GET | Serve a generated image by proxy ID |
| `GET /models` | GET | List available models and defaults |
| `GET /health` | GET | System and upstream provider status |

---

## Error Format

Every error across all endpoints follows this shape:

```json
{
  "success": false,
  "error": "Human-readable message",
  "detail": "Optional extra context"
}
```

| Status | Condition |
|--------|-----------|
| `400` | Missing or invalid parameters, malformed JSON |
| `404` | Resource not found (e.g. expired proxy ID) |
| `405` | Wrong HTTP method |
| `502` | Upstream provider failed |
| `500` | Internal server error |

---

## Providers

Text models are sourced from multiple upstream providers. Not all providers support conversation history or system prompts — see [models.md](./models.md) for the full breakdown.

| Provider | Source | History | System Prompt |
|----------|--------|:-------:|:-------------:|
| DeepAI | deepai.org | ✅ | ⚠️ sent as user role |
| Pollinations | pollinations.ai | ✅ | ✅ |
| AIFree | aifreeforever.com | ✅ partial | ✅ partial |
| TalkAI | talkai.info | ❌ | ❌ |
| Dolphin | dphn.ai | ❌ | ❌ |
| Toolbaz | toolbaz.com | ❌ | ❌ |

---

## Docs

- [chat.md](./DOCUMENTATION/chat.md) — `/chat` streaming endpoint
- [query.md](./DOCUMENTATION/query.md) — `/query` single-turn endpoint
- [image.md](./DOCUMENTATION/image.md) — `/image` and `/image/proxy/:id`
- [models.md](./DOCUMENTATION/models.md) — model listing, filtering, provider breakdown
- [health.md](./DOCUMENTATION/health.md) — health check endpoint
- [configuration.md](./DOCUMENTATION/configuration.md) — server-side config reference
- [quick-start.md](./DOCUMENTATION/quick-start.md) — code examples for JS, Python, and Node.js