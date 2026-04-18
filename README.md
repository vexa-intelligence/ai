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

## Docs

- [chat.md](./chat.md) — `/chat` streaming endpoint
- [query.md](./query.md) — `/query` single-turn endpoint
- [image.md](./image.md) — `/image` and `/image/proxy/:id`
- [models.md](./models.md) — model listing, filtering, provider breakdown
- [health.md](./health.md) — health check endpoint
- [configuration.md](./configuration.md) — server-side config reference