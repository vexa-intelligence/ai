# /health

Checks system and upstream provider reachability. Optionally probes each enabled text model.

**Method:** `GET`

---

## Parameters

| Name | Default | Description |
|------|---------|-------------|
| `skip_models` | `false` | Skip per-model health probes. Significantly faster |

---

## Response

```json
{
  "success": true,
  "status": "ok",
  "timestamp": 1718000000,
  "total_ms": 1240,
  "checks": {
    "page":  { "reachable": true, "status_code": 200, "latency_ms": 95 },
    "token": { "reachable": true, "token_received": true, "status_code": 200, "latency_ms": 80 },
    "image": { "reachable": true, "status_code": 200, "latency_ms": 110 },
    "models": {
      "vexa": { "ok": true, "latency_ms": 430 },
      "gpt-4.1-nano": { "ok": false, "latency_ms": 12, "error": "Provider disabled" }
    }
  }
}
```

If any models fail, a top-level `failed_models` array is included:

```json
{
  "failed_models": ["gpt-4.1-nano", "some-other-model"]
}
```

If the total model count exceeds `MAX_MODELS_TO_CHECK` (configured in `config.js`), the remaining models are skipped and a `_skipped` entry appears in `checks.models`:

```json
{
  "checks": {
    "models": {
      "_skipped": {
        "count": 12,
        "note": "Only first 100 models checked to prevent timeout"
      }
    }
  }
}
```

### Status Values

| Value | Meaning |
|-------|---------|
| `ok` | All upstream checks passed, no model failures |
| `degraded` | One or more checks failed |

`status` is `"degraded"` if any of `page`, `token`, or `image` are unreachable, or if any model probe fails. The HTTP status code is always `200` — check `status` in the body.

---

## What Each Check Tests

| Check | Tests |
|-------|-------|
| `page` | HEAD request to Toolbaz page — confirms provider reachability |
| `token` | POST to token endpoint — confirms auth token generation works |
| `image` | HEAD request to DeepAI image endpoint — confirms image generation is reachable |
| `models` | Sends a short probe message to each enabled text model and checks for a non-empty string response |

---

## Examples

```bash
# Full check including all model probes
curl "https://vexa-ai.pages.dev/health"

# Skip model probes (faster, just checks upstream reachability)
curl "https://vexa-ai.pages.dev/health?skip_models=true"
```

```js
const { status, failed_models } = await fetch(
  "https://vexa-ai.pages.dev/health?skip_models=true"
).then(r => r.json());

if (status !== "ok") {
  console.warn("Degraded:", failed_models);
}
```