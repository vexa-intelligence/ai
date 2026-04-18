![Banner](/public/assets/banner.png)

# Vexa AI API

[![License](https://img.shields.io/badge/license-CC_BY_NC_4.0-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-vexa--intelligence%2Fai-informational.svg)](https://github.com/vexa-intelligence/ai)
[![Live API](https://img.shields.io/badge/api-live-brightgreen.svg)](https://vexa-ai.pages.dev)

A multi-provider AI service offering text generation, image generation, and model management through a unified API. Vexa AI aggregates multiple AI providers to give you access to cutting-edge models without managing multiple API keys.

## **Features**

- **Multi-Provider Support**: Access models from DeepAI, Pollinations, TalkAI, Dolphin AI, and more
- **Text Generation**: Chat completion and simple prompt generation with conversation history
- **Image Generation**: Create images from text prompts using various models
- **Streaming Support**: Real-time streaming responses for chat completions
- **Health Monitoring**: Built-in health checks and model availability monitoring
- **No API Keys Required**: Free tier available with rate limiting
- **CORS Enabled**: Ready for web application integration

## **Quick Start**

### **Base URL**
```
https://vexa-ai.pages.dev
```

### **Simple Chat Example**
```bash
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vexa",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

### **Image Generation Example**
```bash
curl "https://vexa-ai.pages.dev/image?q=a cat sitting on a table"
```

## **Available Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation and information |
| `/chat` | POST | Chat completion with conversation history |
| `/query` | GET/POST | Simple single-prompt text generation |
| `/image` | GET/POST | Generate images from text prompts |
| `/image/proxy/:id` | GET | Proxy for serving generated images |
| `/models` | GET | List available AI models and their status |
| `/health` | GET | System health check and service status |

*For real-time endpoint information, visit: `https://vexa-ai.pages.dev/`*

## **Documentation**

For detailed API documentation, examples, and configuration options, visit our [DOCUMENTATION](./DOCUMENTATION/) folder:

- [API Endpoints](./DOCUMENTATION/endpoints.md) - Detailed endpoint documentation
- [Models](./DOCUMENTATION/models.md) - Available AI models and their capabilities
- [Providers](./DOCUMENTATION/providers.md) - Supported AI providers
- [Configuration](./DOCUMENTATION/configuration.md) - Configuration options and settings
- [Quick Start](./DOCUMENTATION/quick-start.md) - Getting started guide

## **Usage Examples**

### **Streaming Chat**
```javascript
const response = await fetch('https://vexa-ai.pages.dev/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'vexa',
    messages: [
      { role: 'user', content: 'Tell me a story' }
    ],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk);
}
```

### **Image Generation with POST**
```javascript
const response = await fetch('https://vexa-ai.pages.dev/image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A beautiful sunset over mountains',
    model: 'flux',
    preference: 'quality'
  })
});

const result = await response.json();
console.log('Image URL:', result.proxy_url);
```

## **Default Models**

*Current defaults are available via the `/models` endpoint:*
```bash
curl "https://vexa-ai.pages.dev/models"
```

This returns the current default text model, image model, and preferences configured in the system.

## **Rate Limits**

- Requests are limited per IP address
- No authentication required for basic usage
- Consider implementing caching for better performance

## **Error Handling**

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "detail": "Detailed error information"
}
```

## **Health Monitoring

Check the system status:

```bash
curl https://vexa-ai.pages.dev/health
```

## **GitHub Repository**

Find the source code and contribute at:
[https://github.com/vexa-intelligence/ai](https://github.com/vexa-intelligence/ai)

## **License**

This project is licensed under the CC BY-NC 4.0 License - see the [LICENSE](LICENSE) file for details.

## **Support**

For issues, feature requests, or questions:
- Open an issue on [GitHub](https://github.com/vexa-intelligence/ai/issues)
- Check the [API documentation](./DOCUMENTATION/) for detailed information
