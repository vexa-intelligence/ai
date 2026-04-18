# Models

Model availability is dynamic. Always query `/models` for the current list — don't hardcode model names.

```bash
curl "https://vexa-ai.pages.dev/models"
```

---

## Response structure

`/models` returns text and image models, grouped and flat, along with system defaults:

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
      { "name": "vexa", "label": "Vexa", "provider": "vexa-ai", "description": "Vexa AI - default" },
      { "name": "gpt-4.1-nano", "label": "GPT-4.1 Nano", "provider": "OpenAI", "description": "..." }
    ],
    "Pollinations": [ { "name": "pol-openai-fast", ... } ],
    "AIFree": [ { "name": "gpt-5", ... } ],
    "Toolbaz": [ ... ]
  },
  "image_models": ["hd", "flux", "kontext", "seedream", "nanobanana"],
  "valid_image_models": "hd, flux, turbo-img, kontext, seedream, nanobanana"
}
```

Use `text_models_by_provider` when you need to show models grouped by provider in a UI. Use `text_models` for a flat list.

---

## Filtering

```bash
# Text models only
curl "https://vexa-ai.pages.dev/models?type=text"

# Image models only
curl "https://vexa-ai.pages.dev/models?type=image"

# Full detail — provider, speed, quality, enabled status
curl "https://vexa-ai.pages.dev/models?details=true"
```

With `details=true`, the response also includes a `model_status` object:

```json
{
  "model_status": {
    "vexa": { "enabled": true },
    "hd":   { "enabled": true, "type": "image" }
  }
}
```

---

## How models are discovered

Text models are discovered dynamically at runtime by scraping upstream providers. The list is cached for 5 minutes. On each refresh:

1. Available models are fetched from each enabled provider
2. Results are merged with static metadata (labels, provider names, speed/quality scores)
3. Models belonging to disabled providers are excluded from the response

This means `/models` always reflects what's actually available right now — not a static snapshot.

---

## Providers

Providers are enabled or disabled server-side. The `/models` response only includes models from currently enabled providers. To see which providers are active, call `/models?details=true` and inspect `model_status`, or check `/health`.

---

## Conversation history support

Not all providers forward the full message array. This matters when you use `/chat` with a system prompt or multi-turn history:

| Provider | System prompt | Conversation history |
|----------|:---:|:---:|
| DeepAI | ✅ | ✅ |
| Pollinations | ✅ | ✅ |
| TalkAI | ❌ | ❌ |
| Dolphin AI | ❌ | ❌ |
| AIFree | ❌ | ✅ (partial) |
| Toolbaz | ❌ | ❌ |

If you're building a multi-turn chatbot, prefer models routed through DeepAI or Pollinations. Check `text_models_by_provider` in the `/models` response to see which provider handles which model.

---

## Image models

Image models are static and don't change between deploys. Use `/models?type=image` for the current list.

The `preference` parameter (`speed` / `quality`) is only respected by the `hd` model (DeepAI). All Pollinations image models ignore it.

---

## Using a specific model

Pass `model` in your request body (or query string for GET endpoints):

```javascript
// /query
fetch('/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello', model: 'pol-openai-fast' })
});

// /chat
fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'pol-openai-fast',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});

// /image
fetch('/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a red fox', model: 'flux' })
});
```

If the model you pass is disabled or unrecognised, routing falls back to the Toolbaz provider. If Toolbaz is also disabled, the request will fail with a `502`.

---

## Dynamic model selection example

```javascript
async function getBestModel(preferredProvider = null) {
  const { text_models_by_provider, defaults } = await fetch(
    'https://vexa-ai.pages.dev/models'
  ).then(r => r.json());

  if (preferredProvider && text_models_by_provider[preferredProvider]?.length) {
    return text_models_by_provider[preferredProvider][0].name;
  }

  return defaults.text;
}
```
