# Chat

Multi-turn conversation endpoint. Accepts an OpenAI-style `messages` array and handles all context concatenation server-side.

```
POST /chat
```

GET requests to `/chat` return a `405` with usage instructions rather than an error.

---

## Request

```bash
curl -X POST /chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vexa",
    "messages": [
      { "role": "system",    "content": "You are a helpful assistant. Be concise." },
      { "role": "user",      "content": "What is the speed of light?" },
      { "role": "assistant", "content": "Approximately 299,792,458 metres per second." },
      { "role": "user",      "content": "How long does it take to reach the Moon?" }
    ]
  }'
```

### Body fields

| Field | Required | Description |
|-------|----------|-------------|
| `messages` | yes | Array of message objects (at least one) |
| `model` | no | Model ID. Defaults to `vexa`. Falls back to `vexa` if the given model is not valid. See [/models](./MODELS.md). |

### Message object

| Field | Required | Values |
|-------|----------|--------|
| `role` | yes | `system` or `user` or `assistant` |
| `content` | yes | string |

---

## Response

```json
{
  "success": true,
  "message": { "role": "assistant", "content": "It takes about 1.28 seconds." },
  "model": "vexa",
  "elapsed_ms": 980,
  "prompt_chars": 312
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | bool | `true` on success |
| `message` | object | Assistant reply with `role` and `content` |
| `model` | string | Model used |
| `elapsed_ms` | number | Time to generate |
| `prompt_chars` | number | Total character count of all messages sent |

---

## How Context Works

For Toolbaz-routed models, messages are concatenated into a single prompt:

```
[System]: {system content}

User: {first user message}Assistant: {first assistant message}
User: {second user message}
Assistant:
```

For DeepAI and Pollinations models the full messages array is sent natively. You are responsible for passing the full history each turn.

---

## Examples

### JavaScript (multi-turn loop)

```js
const history = [{ role: 'system', content: 'You are a concise assistant.' }];

async function chat(msg, model = 'vexa') {
  history.push({ role: 'user', content: msg });
  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: history })
  });
  const data = await res.json();
  history.push({ role: 'assistant', content: data.message.content });
  return data.message.content;
}
```

### Python

```python
import requests

history = [{'role': 'system', 'content': 'You are a concise assistant.'}]

def chat(msg, model='vexa'):
    history.append({'role': 'user', 'content': msg})
    r = requests.post('/chat', json={'model': model, 'messages': history})
    reply = r.json()['message']['content']
    history.append({'role': 'assistant', 'content': reply})
    return reply
```

---

## Errors

| Status | Error |
|--------|-------|
| `400` | `Missing or empty 'messages' array` |
| `400` | `messages[N].role must be 'system', 'user', or 'assistant'` |
| `400` | `messages[N].content must be a string` |
| `400` | `Conversation exceeds maximum length of 16000 characters` |
| `429` | `Rate limit exceeded. Try again shortly.` |
| `502` | `Upstream request failed: <detail>` |