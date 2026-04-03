# Query

Send a single prompt to any available Vexa AI model and get a text response.

```
GET  /query
POST /query
```

---

## GET

```bash
curl "/query?q=What+is+a+black+hole"
curl "/query?q=Hello&model=vexa"
```

### Parameters

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `q` / `query` | yes | — | Your prompt |
| `model` | no | `vexa` | Model ID. See [`/models`](./MODELS.md). |

---

## POST

```bash
curl -X POST /query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing", "model": "vexa"}'
```

### Body fields

| Field | Required | Description |
|-------|----------|-------------|
| `q` / `query` / `prompt` | yes | Your prompt |
| `model` | no | Model ID |

---

## Response

```json
{
  "success": true,
  "response": "A black hole is a region of spacetime...",
  "model": "vexa",
  "elapsed_ms": 1243
}
```

---

## Examples

### JavaScript

```js
const res = await fetch('/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello!', model: 'vexa' })
});
const data = await res.json();
console.log(data.response);
```

### Python

```python
import requests
r = requests.post('/query', json={
    'prompt': 'What is a neural network?',
    'model': 'vexa',
})
print(r.json()['response'])
```

---

## Limits

| Limit | Value |
|-------|-------|
| Max prompt length | 4,000 characters |
| Rate limit | 20 requests / IP / 60s |

---

## Errors

| Status | Error |
|--------|-------|
| `400` | `Missing required parameter: q, query, or prompt` |
| `400` | `Prompt exceeds maximum length of 4000 characters` |
| `429` | `Rate limit exceeded. Try again shortly.` |
| `502` | `Upstream request failed` |
| `500` | `Internal server error` |