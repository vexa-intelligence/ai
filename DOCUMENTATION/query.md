# /query

Single-turn text generation. Sends a prompt, returns the full response as JSON. No streaming.

**Methods:** `GET`, `POST`

---

## Parameters

| Name | Required | Description |
|------|----------|-------------|
| `q` / `query` / `prompt` | Yes | The prompt text |
| `model` | No | Model name (default: `vexa`). See [`/models`](./models.md) |

For `GET`, parameters are query string values. For `POST`, send a JSON body.

---

## Response

```json
{
  "success": true,
  "response": "A closure is a function that...",
  "model": "vexa",
  "elapsed_ms": 843,
  "source": "deepai.org"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` on success |
| `response` | string | The model's response text |
| `model` | string | Model used |
| `elapsed_ms` | number | Round-trip time in milliseconds |
| `source` | string | Upstream provider domain |

---

## Examples

### GET

```bash
curl "https://vexa-ai.pages.dev/query?q=What+is+a+closure+in+JavaScript"
```

### POST

```bash
curl -X POST https://vexa-ai.pages.dev/query \
  -H "Content-Type: application/json" \
  -d '{ "prompt": "What is a closure in JavaScript", "model": "vexa" }'
```

### JavaScript

```js
const res = await fetch(
  "https://vexa-ai.pages.dev/query?q=" + encodeURIComponent("What is a closure?")
);
const { success, response, error } = await res.json();
if (!success) throw new Error(error);
console.log(response);
```

### Python

```python
import requests

res = requests.get(
    "https://vexa-ai.pages.dev/query",
    params={"q": "What is a closure in JavaScript?"}
)
data = res.json()
if not data["success"]:
    raise RuntimeError(data["error"])
print(data["response"])
```

---

## Notes

- `/query` does not support conversation history. For multi-turn chat, use [`/chat`](./chat.md).
- The prompt is passed as a single `user` message internally; no system prompt is applied.
- If `model` is unrecognised or disabled, routing falls back to Toolbaz. If Toolbaz is also disabled, returns `502`.