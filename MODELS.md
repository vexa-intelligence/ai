# Models

```
GET https://vexa-ai.vercel.app/models
```

Returns all available text models and the top 20 image models from Stable Horde. Cached for 5 minutes per serverless instance.

---

## Response

```json
{
  "success": true,
  "default": "openai",
  "models": {
    "openai": {
      "label": "GPT-4o",
      "provider": "OpenAI"
    },
    "openai-large": {
      "label": "GPT-4o Large",
      "provider": "OpenAI"
    },
    "llama": {
      "label": "Llama 3 (fastest)",
      "provider": "Meta"
    }
  },
  "image_models": [
    { "name": "Deliberate",       "count": 4, "queued": 0 },
    { "name": "Dreamshaper",      "count": 3, "queued": 0 },
    { "name": "stable_diffusion", "count": 6, "queued": 0 }
  ]
}
```

### Text model fields

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Human-readable display name |
| `provider` | string | Company or team behind the model |

### Image model fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Exact model name — pass this to `/image?model=` or the POST body |
| `count` | number | Number of active workers serving this model right now |
| `queued` | number | Pixel-based queue value from Stable Horde (not job count — see note below) |

---

## Text Models

The API always returns a curated base list of 15 models. If the live Pollinations.AI `/models` endpoint returns more than one model, any new models not already in the base list are merged in automatically.

| Model ID | Provider | Notes |
|----------|----------|-------|
| `openai` | OpenAI | GPT-4o — **default** |
| `openai-large` | OpenAI | GPT-4o Large |
| `openai-reasoning` | OpenAI | o1 reasoning model |
| `openai-fast` | OpenAI | GPT-OSS fast variant |
| `mistral` | Mistral AI | Mistral latest |
| `mistral-roblox` | Mistral AI | Mistral (Roblox-hosted) |
| `llama` | Meta | Fastest option |
| `llama-scaleway` | Meta | Llama (Scaleway-hosted) |
| `deepseek` | DeepSeek | DeepSeek V3 |
| `deepseek-r1` | DeepSeek | Reasoning variant |
| `claude-hybridspace` | Anthropic | Claude hybrid |
| `searchgpt` | OpenAI | Web-search enabled |
| `gemini` | Google | Gemini 2.0 Flash |
| `phi` | Microsoft | Phi-4 |
| `qwen-coder` | Alibaba | Qwen Coder |

> This table reflects the curated base list. Additional models may appear if Pollinations.AI adds new ones — always use `/models` for the live list.

---

## Image Models

Fetched live from Stable Horde, sorted by active worker count (highest first). Top 20 are returned. `Deliberate` is used as the default.

Pass the exact `name` string to `/image?model=` or the `model` field in a POST body.

> If you pass a model with no active workers (`count: 0`), the request fails immediately with a `502` rather than sitting in queue. Always check `count > 0` before choosing a model.

> **Note on `queued` values:** Stable Horde reports `queued` in pixels (width × height × jobs), not job count. Large numbers like `719659008` are normal and do not indicate a problem. Divide by `262144` (512×512) to get an approximate job count.

---

## Caching

Both text and image model lists are cached for **5 minutes** per serverless instance. Vercel may spin up multiple instances so different requests may occasionally see slightly different cached states.

---

## Errors

The `/models` endpoint never returns an error response — if the live Pollinations.AI endpoint is unreachable, the curated base list is returned instead. Image models fall back to an empty array if Stable Horde is unreachable.

```json
{ "success": true, "default": "openai", "models": { ... }, "image_models": [] }
```