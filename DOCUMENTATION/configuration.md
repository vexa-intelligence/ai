# Configuration

Server-side configuration lives in `config.js`. All settings are static — changes require a redeploy. Runtime state is always queryable via the API.

---

## Provider Settings

Providers are enabled or disabled via `PROVIDER_SETTINGS`. Disabled providers are excluded from routing and omitted from all `/models` responses.

```js
export const PROVIDER_SETTINGS = {
  toolbaz:      false,
  deepai:       true,
  pollinations: true,
  dolphin:      false,
  talkai:       true,
  aifree:       true,
};
```

To check current provider status without reading source, call `/models?details=true` and inspect `model_status`.

---

## Defaults

```js
export const DEFAULT_MODEL           = "vexa";
export const DEFAULT_IMAGE_MODEL     = "hd";
export const DEFAULT_IMAGE_PREFERENCE = "speed";
```

These are returned by `/models` under the `defaults` key and used whenever a request omits `model` or `preference`.

---

## Request Limits

Enforced by `/chat`:

| Limit | Value |
|-------|-------|
| Max messages per request | 100 |
| Max characters per message | 32,000 |
| Max total characters | 200,000 |

---

## Model Cache TTL

Text models are scraped from upstream providers and cached in memory:

```js
export const CACHE_SETTINGS = {
  MODELS_CACHE_TTL: 300000  // 5 minutes in ms
};
```

After TTL expiry, the next request to `/models`, `/chat`, or `/query` triggers a background refresh. The cache is per-instance and does not persist across restarts.

---

## Image Preference Mapping

The `preference` parameter on `/image` maps to an internal key used by the DeepAI provider:

```js
export const IMAGE_PREFERENCES = {
  speed:   "turbo",
  quality: "quality"
};
```

Only the `hd` model uses this. Pollinations image models ignore `preference` entirely.

---

## Image Generation Defaults

```js
export const IMAGE_GENERATION = {
  DEFAULT_WIDTH:  1024,
  DEFAULT_HEIGHT: 1024,
  SEED_RANGE:     999999
};
```

---

## Health Check Settings

```js
export const HEALTH_SETTINGS = {
  HEALTH_PROBE:        "Hi",
  MAX_MODELS_TO_CHECK: 100
};
```

`HEALTH_PROBE` is the message sent to each model during a `/health` probe. `MAX_MODELS_TO_CHECK` caps how many models are tested per health call to prevent request timeouts. Models beyond this cap appear under `checks.models._skipped` in the response.

---

## Image Proxy Storage

The `/image/proxy/:id` endpoint stores URL mappings keyed by a 32-character URL-safe SHA-256 hash of the upstream URL.

| Binding present | Storage | Persistence |
|----------------|---------|-------------|
| `PROXY_CACHE` KV namespace bound | Cloudflare KV | 24-hour TTL, survives restarts |
| No `PROXY_CACHE` binding | In-memory `Map` | Cleared on restart |

For any multi-instance or production deployment, bind a KV namespace to `PROXY_CACHE` in your Cloudflare Pages settings.

---

## Static vs Dynamic Settings

| Setting | Type | How to change |
|---------|------|---------------|
| Provider enabled/disabled | Static | Edit `PROVIDER_SETTINGS`, redeploy |
| Default text model | Static | Edit `DEFAULT_MODEL`, redeploy |
| Default image model | Static | Edit `DEFAULT_IMAGE_MODEL`, redeploy |
| Available text models | Dynamic | Scraped from providers, refreshed every 5 min |
| Available image models | Static | Defined in `IMAGE_MODELS` array, redeploy to change |
| Request limits | Static | Hardcoded in `chat.js`, redeploy to change |