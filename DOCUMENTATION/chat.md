# /chat

Multi-turn chat with full message history. **Always streams** via Server-Sent Events. There is no JSON response mode — do not call `.json()` on the response.

**Method:** `POST`  
**Content-Type:** `application/json`

---

## Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `messages` | array | Yes | — | Array of `{ role, content }` objects |
| `model` | string | No | `vexa` | Model name. See [`/models`](./models.md) for available values |

### Message Object

```ts
{
  role: "system" | "user" | "assistant",
  content: string  // non-empty
}
```

### Validation

| Rule | Limit |
|------|-------|
| Max messages per request | 100 |
| Max characters per message | 32,000 |
| Max total characters across all messages | 200,000 |
| At least one `user` role message | required |

Any violation returns `400` before the stream opens.

---

## Response

Response is `Content-Type: text/event-stream`. Each event is a JSON object on a `data:` line.

```
data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}
data: {"choices":[{"delta":{"content":" there"},"finish_reason":null}]}
data: {"choices":[{"delta":{},"finish_reason":"stop"}]}
data: [DONE]
```

The stream ends with `data: [DONE]`. Content is accumulated from `choices[0].delta.content` across all events until `finish_reason` is `"stop"`.

### Stream Error

If an error occurs after the stream opens, it arrives inline:

```
data: {"error":{"message":"..."},"finish_reason":"error"}
```

There is no trailing `[DONE]` after a stream error.

---

## Examples

### curl

```bash
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "system", "content": "You are a concise assistant." },
      { "role": "user", "content": "What is a closure?" }
    ]
  }'
```

### JavaScript

```js
async function chat(messages, model = "vexa") {
  const res = await fetch("https://vexa-ai.pages.dev/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model }),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    for (const line of decoder.decode(value).split("\n")) {
      if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.error) throw new Error(data.error.message);
        const chunk = data.choices?.[0]?.delta?.content;
        if (chunk) output += chunk;
      } catch (e) {
        if (e.message !== "Unexpected end of JSON input") throw e;
      }
    }
  }

  return output;
}
```

### Stateful conversation

The API is stateless. Pass the full message history on every request.

```js
const history = [];

async function send(userMessage) {
  history.push({ role: "user", content: userMessage });

  const reply = await chat(history);

  history.push({ role: "assistant", content: reply });
  return reply;
}

await send("My name is Alex.");
await send("What did I just tell you?"); // → "Your name is Alex."
```

### Python

```python
import requests, json

def chat(messages, model="vexa"):
    res = requests.post(
        "https://vexa-ai.pages.dev/chat",
        json={"messages": messages, "model": model},
        stream=True,
    )
    output = ""
    for line in res.iter_lines():
        if not line:
            continue
        line = line.decode()
        if not line.startswith("data: ") or "[DONE]" in line:
            continue
        data = json.loads(line[6:])
        if "error" in data:
            raise RuntimeError(data["error"]["message"])
        content = data["choices"][0]["delta"].get("content", "")
        output += content
    return output
```

---

## Notes

- **History support varies by provider.** Models routed through DeepAI and Pollinations receive the full `messages` array including system prompts. TalkAI, Dolphin, and Toolbaz receive only the last `user` message. Check `text_models_by_provider` from [`/models`](./models.md) to identify which provider handles a given model.
- If `model` is unrecognised or disabled, routing falls back to Toolbaz. If Toolbaz is also disabled, the request fails with a `502` inside the stream.