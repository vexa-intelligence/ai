# API Endpoints Documentation

This document provides detailed information about all available endpoints in the Vexa AI API.

## Base URL
```
https://vexa-ai.pages.dev
```

## Response Format

All endpoints return JSON responses with the following structure:

### Success Response
```json
{
  "success": true,
  "data": "response_data",
  "model": "model_used",
  "elapsed_ms": 1234
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error information"
}
```

## Endpoints

### 1. Root Endpoint - API Information

**Endpoint**: `/`  
**Methods**: `GET`

Returns comprehensive API documentation, available models, and usage examples.

#### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| format | string | "json" | Response format: "json" or "html" |
| examples | boolean | "true" | Include usage examples in response |

#### Example Request
```bash
curl "https://vexa-ai.pages.dev/"
```

#### Example Response
```json
{
  "info": {
    "title": "Vexa AI API",
    "description": "Multi-provider AI service offering text generation, image generation, and model management",
    "version": "1.0.0",
    "base_url": "https://vexa-ai.pages.dev",
    "status": "operational"
  },
  "statistics": {
    "available_text_models": 25,
    "available_image_models": 6,
    "enabled_providers": 4
  }
}
```

---

### 2. Chat Completion

**Endpoint**: `/chat`  
**Methods**: `POST`, `OPTIONS`

Advanced chat completion with conversation history support and streaming capabilities.

#### Request Body
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| model | string | No | "vexa" | AI model to use for completion |
| messages | array | Yes | - | Array of message objects with role and content |
| stream | boolean | No | false | Enable streaming response (SSE) |

#### Message Object Format
```json
{
  "role": "system|user|assistant",
  "content": "message content"
}
```

#### Validation Rules
- Maximum 100 messages per request
- Maximum 32,000 characters per message
- Maximum 200,000 total characters
- At least one user message required

#### Example Request (Non-Streaming)
```bash
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Explain quantum computing in simple terms."}
    ]
  }'
```

*Note: The model parameter is optional. Check `/models` for the current default model.*

#### Example Response (Non-Streaming)
```json
{
  "success": true,
  "message": {
    "role": "assistant",
    "content": "Quantum computing is like..."
  },
  "model": "vexa",
  "elapsed_ms": 2456,
  "prompt_chars": 89
}
```

#### Example Request (Streaming)
```bash
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Tell me a story"}
    ],
    "stream": true
  }'
```

#### Streaming Response Format
```
data: {"choices": [{"delta": {"content": "Once"}, "finish_reason": null}]}

data: {"choices": [{"delta": {"content": " upon"}, "finish_reason": null}]}

data: {"choices": [{"delta": {}, "finish_reason": "stop"}]}

data: [DONE]
```

---

### 3. Simple Query

**Endpoint**: `/query`  
**Methods**: `GET`, `POST`, `OPTIONS`

Simple single-prompt text generation without conversation history.

#### Parameters (GET)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q/query/prompt | string | Yes | - | Text prompt for generation |
| model | string | No | "vexa" | AI model to use |

#### Request Body (POST)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q/query/prompt | string | Yes | - | Text prompt for generation |
| model | string | No | "vexa" | AI model to use |

#### Example Request (GET)
```bash
curl "https://vexa-ai.pages.dev/query?q=What+is+artificial+intelligence?"
```

#### Example Request (POST)
```bash
curl -X POST https://vexa-ai.pages.dev/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is artificial intelligence?"
  }'
```

*Note: The model parameter is optional. Check `/models` for the current default model.*

#### Example Response
```json
{
  "success": true,
  "response": "Artificial intelligence is...",
  "model": "vexa",
  "elapsed_ms": 1234,
  "source": "deepai.org"
}
```

---

### 4. Image Generation

**Endpoint**: `/image`  
**Methods**: `GET`, `POST`, `OPTIONS`

Generate images from text prompts using various AI models.

#### Parameters (GET)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q/prompt | string | Yes | - | Text description of the image to generate |
| model | string | No | "hd" | Image generation model |
| preference | string | No | "speed" | Generation preference: "speed" or "quality" |

#### Request Body (POST)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| prompt | string | Yes | - | Text description of the image to generate |
| model | string | No | "hd" | Image generation model |
| preference | string | No | "speed" | Generation preference: "speed" or "quality" |

#### Available Image Models
*Check `/models?type=image` for current available image models and their descriptions.*

#### Validation Rules
- Maximum 1,000 characters for prompt
- Model must be from available image models
- Preference must be "speed" or "quality"

#### Example Request (GET)
```bash
curl "https://vexa-ai.pages.dev/image?q=a cat sitting on a table"
```

#### Example Request (POST)
```bash
curl -X POST https://vexa-ai.pages.dev/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "preference": "quality"
  }'
```

*Note: The model parameter is optional. Check `/models` for the current default image model.*

#### Example Response
```json
{
  "success": true,
  "prompt": "A beautiful sunset over mountains",
  "model": "flux",
  "proxy_url": "https://vexa-ai.pages.dev/image/proxy/abc123",
  "source": "pollinations.ai",
  "elapsed_ms": 3456
}
```

---

### 5. Image Proxy

**Endpoint**: `/image/proxy/:id`  
**Methods**: `GET`, `OPTIONS`

Proxy endpoint for serving generated images. Images are cached and served efficiently.

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Image identifier from generation response |

#### Example Request
```bash
curl "https://vexa-ai.pages.dev/image/proxy/abc123" --output image.png
```

#### Response
- Returns the actual image file with appropriate content type
- Includes caching headers for performance
- HTTP 404 if ID not found or expired

---

### 6. Models List

**Endpoint**: `/models`  
**Methods**: `GET`, `OPTIONS`

List all available AI models, their capabilities, and current status.

#### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| details | boolean | "false" | Include detailed model information |
| type | string | - | Filter by model type: "text" or "image" |

#### Example Request (Basic)
```bash
curl "https://vexa-ai.pages.dev/models"
```

#### Example Request (Detailed)
```bash
curl "https://vexa-ai.pages.dev/models?details=true"
```

#### Example Request (Text Models Only)
```bash
curl "https://vexa-ai.pages.dev/models?type=text"
```

#### Example Response
```json
{
  "success": true,
  "defaults": {
    "text": "current_default_text_model",
    "image": "current_default_image_model", 
    "image_preference": "current_default_preference"
  },
  "counts": {
    "text": "number_of_available_text_models",
    "image": "number_of_available_image_models"
  },
  "text_models": ["list", "of", "available", "text", "models"],
  "image_models": ["list", "of", "available", "image", "models"],
  "valid_image_models": "comma_separated_list_of_valid_image_models"
}
```

*Response data is dynamic. Check the actual endpoint for current values.*

---

### 7. Health Check

**Endpoint**: `/health`  
**Methods**: `GET`, `OPTIONS`

System health monitoring and service status checking.

#### Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip_models | boolean | "false" | Skip individual model health checks |

#### Example Request (Full Check)
```bash
curl "https://vexa-ai.pages.dev/health"
```

#### Example Request (Quick Check)
```bash
curl "https://vexa-ai.pages.dev/health?skip_models=true"
```

#### Example Response
```json
{
  "success": true,
  "status": "ok|degraded|error",
  "timestamp": "unix_timestamp",
  "total_ms": "total_check_time",
  "checks": {
    "page": {
      "reachable": true,
      "status_code": 200,
      "latency_ms": "page_check_latency"
    },
    "token": {
      "reachable": true,
      "token_received": true,
      "status_code": 200,
      "latency_ms": "token_check_latency"
    },
    "image": {
      "reachable": true,
      "status_code": 200,
      "latency_ms": "image_check_latency"
    },
    "models": {
      "model_name": {
        "ok": true,
        "latency_ms": "model_response_time"
      }
    }
  }
}
```

*Response data is dynamic. Model checks will show current available models and their status.*

#### Status Values
- `ok` - All systems operational
- `degraded` - Some services unavailable
- `error` - Critical system failure

---

## CORS Support

All endpoints support Cross-Origin Resource Sharing (CORS) with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Rate Limiting

- Requests are limited per IP address
- No authentication required for basic usage
- Consider implementing client-side caching
- Image URLs expire after 24 hours

## Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters or JSON |
| 404 | Not Found - Endpoint or resource not found |
| 405 | Method Not Allowed - Unsupported HTTP method |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected server error |
| 502 | Bad Gateway - Upstream service failure |
| 503 | Service Unavailable - Temporary outage |

## Streaming Implementation

For streaming responses, the API uses Server-Sent Events (SSE):

1. Client sends request with `stream: true`
2. Server responds with `Content-Type: text/event-stream`
3. Data is sent in chunks with `data: {JSON}\n\n` format
4. Stream ends with `data: [DONE]\n\n`

### JavaScript Streaming Example
```javascript
const response = await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'vexa',
    messages: [{ role: 'user', content: 'Hello' }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.choices?.[0]?.delta?.content) {
        console.log(data.choices[0].delta.content);
      }
    }
  }
}
```
