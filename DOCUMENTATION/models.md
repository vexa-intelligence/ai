# /models

Returns available text and image models, grouped by provider, along with system defaults.

**Method:** `GET`

---

## Parameters

| Name | Default | Description |
|------|---------|-------------|
| `type` | — | Filter by `text` or `image`. Omit for both |
| `details` | `false` | Include per-model provider, speed, quality, and enabled status |

---

## Response

```json
{
  "success": true,
  "defaults": {
    "text": "vexa",
    "image": "hd",
    "image_preference": "speed"
  },
  "counts": {
    "text": 15,
    "image": 5
  },
  "text_models": ["vexa", "gpt-4.1-nano", "..."],
  "text_models_by_provider": {
    "DeepAI": [
      { "name": "vexa", "label": "Vexa", "provider": "vexa-ai", "description": "..." }
    ],
    "Pollinations": [
      { "name": "pol-openai-fast", "label": "...", "provider": "...", "description": "..." }
    ]
  },
  "image_models": ["hd", "flux", "kontext", "seedream", "nanobanana"],
  "valid_image_models": "hd, flux, turbo-img, kontext, seedream, nanobanana"
}
```

When `details=true`, a `model_status` object is also included:

```json
{
  "model_status": {
    "vexa":   { "enabled": true },
    "hd":     { "enabled": true, "type": "image" },
    "flux":   { "enabled": true, "type": "image" }
  }
}
```

---

## Filtering

```bash
# Text models only
curl "https://vexa-ai.pages.dev/models?type=text"

# Image models only
curl "https://vexa-ai.pages.dev/models?type=image"

# Full detail per model
curl "https://vexa-ai.pages.dev/models?details=true"
```

---

## How Models Are Discovered

Text models are scraped from upstream providers at runtime and cached in memory for 5 minutes. On each refresh:

1. Available models are fetched from each enabled provider (Toolbaz, DeepAI)
2. Results are merged with static metadata (labels, provider names, speed/quality scores)
3. Models from disabled providers are excluded from the response

Image models are static — defined in `config.js` and fixed per deploy.

Always query `/models` for the live list. Do not hardcode model names.

---

## Conversation History Support

Not all providers forward the full `messages` array. This affects `/chat` behaviour with system prompts and multi-turn history.

| Provider | System prompt | Full history |
|----------|:---:|:---:|
| DeepAI | ✅ | ✅ |
| Pollinations | ✅ | ✅ |
| AIFree | ❌ | ✅ partial |
| TalkAI | ❌ | ❌ |
| Dolphin | ❌ | ❌ |
| Toolbaz | ❌ | ❌ |

Use `text_models_by_provider` to determine which provider handles a given model before building a stateful chat.

---

## Dynamic Model Selection

```js
async function getDefaultModel() {
  const { defaults } = await fetch("https://vexa-ai.pages.dev/models").then(r => r.json());
  return defaults.text;
}

async function getFirstModelFromProvider(providerName) {
  const { text_models_by_provider } = await fetch("https://vexa-ai.pages.dev/models").then(r => r.json());
  return text_models_by_provider[providerName]?.[0]?.name ?? null;
}
```