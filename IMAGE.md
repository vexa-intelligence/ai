# Image

Generate images via [DeepAI](https://deepai.org) — free, no API key required.

All generated images are served through a proxy. The upstream DeepAI URL is never exposed to the client.

```
GET  /image
POST /image
```

---

## Parameters

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `q` / `prompt` | yes | — | Image description |
| `preference` | no | `speed` | Generation preference — see [Preferences](#preferences) below |

---

## Preferences

| Value | Description |
|-------|-------------|
| `speed` | Optimized for fast generation — **default** |
| `quality` | Optimized for higher quality output |

---

## GET

```bash
# Basic
curl "/image?q=a+sunset+over+mountains"

# With quality preference
curl "/image?q=a+portrait+of+a+knight&preference=quality"
```

---

## POST

```bash
curl -X POST /image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a highly detailed fantasy castle on a cliff at sunset",
    "preference": "quality"
  }'
```

---

## Response

```json
{
  "success": true,
  "prompt": "a sunset over mountains",
  "model": "hd",
  "preference": "speed",
  "proxy_url": "/image/proxy/abc123def456",
  "elapsed_ms": 4200
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | `true` on success |
| `prompt` | string | Prompt used |
| `model` | string | Always `hd` |
| `preference` | string | Preference used |
| `proxy_url` | string | Proxied image URL — the upstream origin URL is never exposed |
| `elapsed_ms` | number | Time to generate |

---

## Displaying Images

```html
<img src="/image/proxy/abc123def456">
```

```js
const res = await fetch('/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a mountain lake at sunrise'})
});
const data = await res.json();
const img = document.createElement('img');
img.src = data.proxy_url;
document.body.appendChild(img);
```

---

## Proxy Endpoint

```
GET /image/proxy/:id
```

Fetches and streams the image from the upstream source without revealing the origin URL. Returns the image bytes with the appropriate `Content-Type` header.

---

## Errors

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `Missing required parameter: q or prompt` | No prompt |
| `400` | `Invalid JSON body` | Malformed POST |
| `400` | `Invalid preference` | Unknown preference value |
| `429` | `Rate limit exceeded` | >10 requests/60s per IP |
| `502` | `Generation failed: ...` | DeepAI upstream error |
| `404` | `Image not found` | Proxy ID expired or invalid |