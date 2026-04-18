# Quick Start Guide

Welcome to the Vexa AI API! This guide will help you get up and running in minutes.

## What You'll Need

- A web browser or API client (like curl, Postman, or any programming language)
- Internet connection
- No API keys required (free tier)

## Base URL

```
https://vexa-ai.pages.dev
```

## Your First API Call

### Try It Now - Simple Text Generation

Open this link in your browser:
```
https://vexa-ai.pages.dev/query?q=Hello%20world
```

Or use curl:
```bash
curl "https://vexa-ai.pages.dev/query?q=Hello world"
```

**Expected Response:**
```json
{
  "success": true,
  "response": "AI response to your query",
  "model": "current_default_model",
  "elapsed_ms": "response_time_ms",
  "source": "provider_name"
}
```

*The actual model and response time will vary based on current system configuration.*

## Quick Examples

### 1. Generate Your First Image

```bash
curl "https://vexa-ai.pages.dev/image?q=a cute cat"
```

**Response:**
```json
{
  "success": true,
  "prompt": "a cute cat",
  "model": "current_image_model",
  "proxy_url": "https://vexa-ai.pages.dev/image/proxy/image_id",
  "source": "image_provider",
  "elapsed_ms": "generation_time_ms"
}
```

Visit the `proxy_url` to see your generated image!

### 2. Have a Conversation

```bash
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```

*Note: The model parameter is optional. The system will use the current default model.*

### 3. Check Available Models

```bash
curl "https://vexa-ai.pages.dev/models"
```

This returns current available models, defaults, and system configuration.

### 4. Check System Health

```bash
curl "https://vexa-ai.pages.dev/health"
```

This returns system status, provider health, and model availability.

## Programming Language Examples

### JavaScript (Browser)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Vexa AI Test</title>
</head>
<body>
    <input type="text" id="prompt" placeholder="Enter your prompt">
    <button onclick="generateResponse()">Generate</button>
    <div id="response"></div>

    <script>
        async function generateResponse() {
            const prompt = document.getElementById('prompt').value;
            const responseDiv = document.getElementById('response');
            
            try {
                const response = await fetch(`https://vexa-ai.pages.dev/query?q=${encodeURIComponent(prompt)}`);
                const data = await response.json();
                
                if (data.success) {
                    responseDiv.innerHTML = `<strong>Response:</strong> ${data.response}`;
                } else {
                    responseDiv.innerHTML = `<strong>Error:</strong> ${data.error}`;
                }
            } catch (error) {
                responseDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        }
    </script>
</body>
</html>
```

### JavaScript (Node.js)

```javascript
// Install node-fetch if needed: npm install node-fetch
const fetch = require('node-fetch');

async function chatWithAI(message) {
    try {
        const response = await fetch('https://vexa-ai.pages.dev/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }]
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('AI Response:', data.message.content);
            console.log('Model used:', data.model);
            console.log('Response time:', data.elapsed_ms + 'ms');
        } else {
            console.error('Error:', data.error);
        }
    } catch (error) {
        console.error('Request failed:', error);
    }
}

// Get current configuration first
async function getConfiguration() {
    const response = await fetch('https://vexa-ai.pages.dev/models');
    const data = await response.json();
    
    if (data.success) {
        console.log('Default text model:', data.defaults.text);
        console.log('Default image model:', data.defaults.image);
        console.log('Available text models:', data.text_models.length);
        console.log('Available image models:', data.image_models.length);
    }
}

// Usage
getConfiguration();
chatWithAI('Explain quantum computing in simple terms');
```

### Python

```python
import requests
import json

def get_configuration():
    """Get current API configuration"""
    try:
        response = requests.get("https://vexa-ai.pages.dev/models")
        data = response.json()
        
        if data.get('success'):
            print(f"Default text model: {data.get('defaults', {}).get('text', 'unknown')}")
            print(f"Default image model: {data.get('defaults', {}).get('image', 'unknown')}")
            print(f"Available text models: {len(data.get('text_models', []))}")
            print(f"Available image models: {len(data.get('image_models', []))}")
            return data
    except Exception as e:
        print(f"Configuration check failed: {e}")
    return None

def chat_with_ai(message):
    url = "https://vexa-ai.pages.dev/chat"
    headers = {"Content-Type": "application/json"}
    data = {
        "messages": [{"role": "user", "content": message}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        result = response.json()
        
        if result.get('success'):
            print(f"AI Response: {result['message']['content']}")
            print(f"Model: {result['model']}")
            print(f"Time: {result['elapsed_ms']}ms")
        else:
            print(f"Error: {result.get('error')}")
    except Exception as e:
        print(f"Request failed: {e}")

def check_system_health():
    """Check system health status"""
    try:
        response = requests.get("https://vexa-ai.pages.dev/health")
        data = response.json()
        
        if data.get('success'):
            print(f"System Status: {data.get('status', 'unknown')}")
            print(f"Total check time: {data.get('total_ms', 'unknown')}ms")
            
            failed_models = data.get('failed_models', [])
            if failed_models:
                print(f"Failed models: {failed_models}")
        else:
            print(f"Health check failed: {data.get('error')}")
    except Exception as e:
        print(f"Health check failed: {e}")

# Usage
print("=== Configuration ===")
config = get_configuration()

print("\n=== System Health ===")
check_system_health()

print("\n=== Chat Example ===")
chat_with_ai("What is artificial intelligence?")
```

### PHP

```php
<?php
function chatWithAI($message) {
    $url = 'https://vexa-ai.pages.dev/chat';
    $data = json_encode([
        'messages' => [
            ['role' => 'user', 'content' => $message]
        ]
    ]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result['success']) {
        echo "AI Response: " . $result['message']['content'] . "\n";
        echo "Model: " . $result['model'] . "\n";
        echo "Time: " . $result['elapsed_ms'] . "ms\n";
    } else {
        echo "Error: " . $result['error'] . "\n";
    }
}

// Usage
chatWithAI("Tell me a joke");
?>
```

## Common Use Cases

### 1. Simple Chatbot

```javascript
async function createChatbot() {
    const conversation = [];
    
    // Get current configuration
    const config = await fetch('https://vexa-ai.pages.dev/models').then(r => r.json());
    
    async function sendMessage(userMessage) {
        conversation.push({ role: 'user', content: userMessage });
        
        const response = await fetch('https://vexa-ai.pages.dev/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversation })
        });
        
        const data = await response.json();
        
        if (data.success) {
            conversation.push({ role: 'assistant', content: data.message.content });
            return data.message.content;
        }
        
        return 'Sorry, I encountered an error.';
    }
    
    return { 
        sendMessage,
        defaultModel: config.defaults?.text,
        availableModels: config.text_models
    };
}
```

### 2. Image Generator

```javascript
async function generateImage(prompt) {
    // Get current image model configuration
    const config = await fetch('https://vexa-ai.pages.dev/models').then(r => r.json());
    
    const response = await fetch(`https://vexa-ai.pages.dev/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt,
            model: config.defaults?.image // Use current default
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        return {
            imageUrl: data.proxy_url,
            prompt: data.prompt,
            model: data.model,
            source: data.source
        };
    }
    
    throw new Error(data.error);
}

// Usage
generateImage('a sunset over mountains')
    .then(result => {
        console.log('Image URL:', result.imageUrl);
        console.log('Model used:', result.model);
        // Display the image or use the URL
    })
    .catch(error => console.error(error));
```

### 3. Content Summarizer

```javascript
async function summarizeText(text) {
    // Get available models to find a suitable one
    const config = await fetch('https://vexa-ai.pages.dev/models').then(r => r.json());
    
    const response = await fetch('https://vexa-ai.pages.dev/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: config.defaults?.text, // Use current default model
            messages: [
                { role: 'system', content: 'You are a helpful assistant that summarizes text concisely.' },
                { role: 'user', content: `Please summarize this text: ${text}` }
            ]
        })
    });
    
    const data = await response.json();
    return data.success ? data.message.content : 'Summarization failed';
}
```

## Streaming Responses

For real-time responses, use streaming:

```javascript
async function streamChat(message) {
    const response = await fetch('https://vexa-ai.pages.dev/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
            stream: true
        })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                        fullResponse += content;
                        console.log('Streaming:', content); // Real-time output
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }
    }
    
    return fullResponse;
}
```

## Error Handling

Always handle responses properly:

```javascript
async function safeAPICall(endpoint, data) {
    try {
        const response = await fetch(`https://vexa-ai.pages.dev${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Unknown API error');
        }
        
        return result;
    } catch (error) {
        console.error('API call failed:', error.message);
        throw error;
    }
}
```

## Best Practices

### 1. Choose the Right Model

```bash
# Get current available models first
curl "https://vexa-ai.pages.dev/models?type=text"

# Use the default model for general use
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'

# Or specify a model from the available list
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}], "model": "chosen_model"}'
```

### 2. Check System Health First

```javascript
async function makeAPIRequest(endpoint, data) {
    // Check health before making request
    const health = await fetch('https://vexa-ai.pages.dev/health').then(r => r.json());
    
    if (!health.success || health.status !== 'ok') {
        console.warn('System health degraded:', health.status);
        // Implement fallback logic
    }
    
    // Proceed with request
    return fetch(`https://vexa-ai.pages.dev${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}
```

### 3. Cache Configuration and Responses

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedConfiguration() {
    const cacheKey = 'config';
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    const response = await fetch('https://vexa-ai.pages.dev/models');
    const data = await response.json();
    
    cache.set(cacheKey, {
        data,
        timestamp: Date.now()
    });
    
    return data;
}

async function cachedQuery(prompt) {
    const cacheKey = `query:${prompt}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    const response = await fetch(`https://vexa-ai.pages.dev/query?q=${encodeURIComponent(prompt)}`);
    const data = await response.json();
    
    cache.set(cacheKey, {
        data,
        timestamp: Date.now()
    });
    
    // Clear cache periodically
    if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    
    return data;
}
```

## Next Steps

Now that you're familiar with the basics:

1. **Explore Models**: Check `/models` to see all available options
2. **Try Different Endpoints**: Experiment with `/chat`, `/query`, and `/image`
3. **Build Something**: Create a chatbot, image generator, or content tool
4. **Read the Full Documentation**: Dive into detailed API documentation
5. **Monitor Performance**: Use `/health` to check system status

## Need Help?

- **API Documentation**: Check the [DOCUMENTATION](../DOCUMENTATION/) folder
- **GitHub Repository**: [https://github.com/vexa-intelligence/ai](https://github.com/vexa-intelligence/ai)
- **Health Check**: Monitor system status at `/health`
- **Model Status**: Check available models at `/models`

## Troubleshooting

### Common Issues

1. **"Method not allowed"**
   - Use POST for `/chat` endpoint
   - Use GET for `/query` and `/health`

2. **"Invalid JSON body"**
   - Ensure proper JSON formatting
   - Check for missing quotes or commas

3. **"Missing required parameter"**
   - Include all required fields in your request
   - Check parameter names carefully

4. **Slow responses**
   - Check `/models` for available models and their performance
   - Check system health at `/health`
   - Try models with lower latency from the health check results

### Debug Tips

```javascript
// Enable logging
console.log('Request data:', JSON.stringify(data, null, 2));

// Check response status
console.log('Response status:', response.status);

// Log full response for debugging
console.log('Full response:', JSON.stringify(result, null, 2));
```

You're now ready to build amazing AI applications with Vexa AI! Happy coding!
