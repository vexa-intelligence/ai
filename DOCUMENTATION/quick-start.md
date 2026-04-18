# Quick Start

No setup. No API key. Start with a single `curl`.

**Base URL** — `https://vexa-ai.pages.dev`

---

## Your first call

```bash
curl "https://vexa-ai.pages.dev/query?q=Hello"
```

```json
{
  "success": true,
  "response": "Hello! How can I help you today?",
  "model": "vexa",
  "elapsed_ms": 721,
  "source": "deepai.org"
}
```

---

## Pick the right endpoint

**Just need a text response?** Use `/query` — GET or POST, returns plain JSON.

**Building a chatbot?** Use `/chat` — POST only, always streams via SSE.

**Generating an image?** Use `/image` — GET or POST, returns a `proxy_url` you can drop straight into an `<img>` tag.

---

## JavaScript

### One-off query

```javascript
const res = await fetch(
  'https://vexa-ai.pages.dev/query?q=' + encodeURIComponent('Explain async/await in one paragraph')
);
const { response } = await res.json();
console.log(response);
```

### Streaming chat

`/chat` always streams — never try to `.json()` it.

```javascript
async function chat(messages, model = 'vexa') {
  const res = await fetch('https://vexa-ai.pages.dev/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
      try {
        const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
        if (content) output += content;
      } catch (_) {}
    }
  }

  return output;
}

// Single turn
const reply = await chat([
  { role: 'user', content: 'What is a JWT?' }
]);

// With system prompt
const reply2 = await chat([
  { role: 'system', content: 'You are a terse coding assistant.' },
  { role: 'user', content: 'What is a closure?' }
]);
```

### Stateful chatbot

Pass the full message history on every request — the API is stateless.

```javascript
const history = [];

async function send(userMessage) {
  history.push({ role: 'user', content: userMessage });

  const res = await fetch('https://vexa-ai.pages.dev/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let reply = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
      try {
        const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
        if (content) reply += content;
      } catch (_) {}
    }
  }

  history.push({ role: 'assistant', content: reply });
  return reply;
}

await send('My name is Alex.');
await send('What did I just tell you?'); // → "Your name is Alex."
```

### Image generation

```javascript
const res = await fetch('https://vexa-ai.pages.dev/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'a fox in a snowy forest, oil painting' })
});
const { proxy_url } = await res.json();
// Use proxy_url directly in <img src="...">
```

---

## Python

### One-off query

```python
import requests

res = requests.get('https://vexa-ai.pages.dev/query', params={'q': 'What is a REST API?'})
print(res.json()['response'])
```

### Streaming chat

```python
import requests, json

def chat(messages, model='vexa'):
    res = requests.post(
        'https://vexa-ai.pages.dev/chat',
        json={'messages': messages, 'model': model},
        stream=True
    )
    output = ''
    for line in res.iter_lines():
        if not line:
            continue
        line = line.decode()
        if not line.startswith('data: ') or '[DONE]' in line:
            continue
        try:
            content = json.loads(line[6:])['choices'][0]['delta'].get('content', '')
            if content:
                print(content, end='', flush=True)
                output += content
        except Exception:
            pass
    print()
    return output

chat([{'role': 'user', 'content': 'Write a Python one-liner to flatten a nested list'}])
```

### Image generation

```python
import requests

res = requests.post(
    'https://vexa-ai.pages.dev/image',
    json={'prompt': 'a fox in a snowy forest, oil painting'}
)
data = res.json()
print(data['proxy_url'])  # direct image URL
```

---

## Node.js

```javascript
import fetch from 'node-fetch'; // npm install node-fetch

async function chat(messages) {
  const res = await fetch('https://vexa-ai.pages.dev/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  const decoder = new TextDecoder();
  let output = '';

  for await (const chunk of res.body) {
    for (const line of decoder.decode(chunk).split('\n')) {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
      try {
        const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
        if (content) { process.stdout.write(content); output += content; }
      } catch (_) {}
    }
  }

  return output;
}

chat([{ role: 'user', content: 'Explain closures in JavaScript' }]);
```

---

## Choosing a model

```javascript
// Always fetch the live list — models update dynamically
const { text_models, text_models_by_provider, defaults } = await fetch(
  'https://vexa-ai.pages.dev/models'
).then(r => r.json());

console.log('Default model:', defaults.text);
console.log('All text models:', text_models);
console.log('By provider:', Object.keys(text_models_by_provider));
```

Pass any model name in your request:

```javascript
// /query
fetch('https://vexa-ai.pages.dev/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello', model: 'pol-openai-fast' })
});

// /chat
fetch('https://vexa-ai.pages.dev/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'pol-openai-fast',
    messages: [{ role: 'user', content: 'Hello' }]
  })
});
```

> Not all models support conversation history and system prompts. Models routed through DeepAI and Pollinations forward the full message array. Others may only see the last user message. Check `/models?details=true` to see which provider handles each model.

---

## Error handling

```javascript
// /query and /image — standard JSON errors
const data = await fetch('https://vexa-ai.pages.dev/query?q=hello').then(r => r.json());
if (!data.success) throw new Error(data.error);

// /chat — errors arrive inside the stream
for (const line of lines) {
  if (!line.startsWith('data: ')) continue;
  const parsed = JSON.parse(line.slice(6));
  if (parsed.error) throw new Error(parsed.error.message);
}
```

---

## Common mistakes

**Calling `.json()` on a `/chat` response** — `/chat` is SSE, not JSON. You'll get a parse error or empty object. Always use a stream reader.

**No `user` message in the array** — `/chat` requires at least one message with `role: "user"`. Missing it returns a `400`.

**Using an expired proxy ID** — image proxy IDs live in memory. They don't survive server restarts and return `404` once gone.

**Hardcoding model names** — models are scraped and updated dynamically. Fetch `/models` at startup and use the live list.
