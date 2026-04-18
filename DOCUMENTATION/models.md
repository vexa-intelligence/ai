# AI Models Documentation

This document provides information about AI models available in the Vexa AI API. All model data is retrieved dynamically from the API endpoints.

## Getting Current Model Information

### Real-time Model Data
```bash
# Get all available models
curl "https://vexa-ai.pages.dev/models"

# Get text models only
curl "https://vexa-ai.pages.dev/models?type=text"

# Get image models only
curl "https://vexa-ai.pages.dev/models?type=image"

# Get detailed model information
curl "https://vexa-ai.pages.dev/models?details=true"
```

### Current Defaults
The current default models and preferences are available via the `/models` endpoint. The response includes:
- Default text model
- Default image model  
- Default image preference

## Model Categories

### Text Generation Models
Models designed for conversational AI, content creation, and text completion tasks.

### Image Generation Models
Models specialized in generating images from text descriptions.

## Dynamic Model Information

### How to Access Model Details

1. **Basic Model List**: 
   ```bash
   curl "https://vexa-ai.pages.dev/models"
   ```

2. **Detailed Information**:
   ```bash
   curl "https://vexa-ai.pages.dev/models?details=true"
   ```

3. **Model Status**:
   The detailed response includes:
   - Model availability status
   - Provider information
   - Performance metrics (when available)

### Model Selection Guidelines

#### For Chat Applications
```bash
# Check available text models first
curl "https://vexa-ai.pages.dev/models?type=text"

# Then use the model in your request
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "model": "your_chosen_model"
  }'
```

#### For Image Generation
```bash
# Check available image models
curl "https://vexa-ai.pages.dev/models?type=image"

# Use the model in image generation
curl -X POST https://vexa-ai.pages.dev/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful landscape",
    "model": "your_chosen_image_model"
  }'
```

## Model Performance Monitoring

### Health Check
```bash
# Check model availability and performance
curl "https://vexa-ai.pages.dev/health"
```

This returns:
- Model availability status
- Response latency for each model
- System-wide health information

### Model Selection Best Practices

1. **Check Availability First**: Always verify model availability before use
2. **Monitor Performance**: Use health endpoint to check response times
3. **Fallback Strategy**: Have alternative models ready
4. **Use Defaults**: When unsure, use the system defaults from `/models`

## Model Types and Use Cases

### Text Models
- **General Chat**: Use default text model
- **Specialized Tasks**: Check detailed model info for capabilities
- **Fast Responses**: Look for models with lower latency
- **High Quality**: Check model quality metrics when available

### Image Models
- **General Images**: Use default image model
- **Speed vs Quality**: Choose based on preference setting
- **Specific Styles**: Check model descriptions for style information

## Dynamic Model Updates

Models may be added, removed, or updated based on:
- Provider availability
- System performance
- New model releases

Always check the `/models` endpoint for the most current information.

## Troubleshooting Model Issues

### Model Not Available
```bash
# Check current status
curl "https://vexa-ai.pages.dev/health"

# Get available models
curl "https://vexa-ai.pages.dev/models"
```

### Performance Issues
- Check health endpoint for latency information
- Try alternative models
- Monitor system status

### Model Selection Errors
- Verify model name from `/models` endpoint
- Check if model is enabled in detailed response
- Use default models as fallback

## Integration Examples

### JavaScript - Dynamic Model Selection
```javascript
async function getAvailableModels() {
    const response = await fetch('https://vexa-ai.pages.dev/models');
    const data = await response.json();
    
    if (data.success) {
        return {
            textModels: data.text_models,
            imageModels: data.image_models,
            defaults: data.defaults
        };
    }
}

async function chatWithBestModel(message) {
    const models = await getAvailableModels();
    const model = models.defaults.text; // Use default
    
    const response = await fetch('https://vexa-ai.pages.dev/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
            model
        })
    });
    
    return response.json();
}
```

### Python - Model Health Monitoring
```python
import requests

def get_model_health():
    response = requests.get('https://vexa-ai.pages.dev/health')
    return response.json()

def get_available_models():
    response = requests.get('https://vexa-ai.pages.dev/models')
    return response.json()

def choose_best_model():
    health = get_model_health()
    models = get_available_models()
    
    if health.get('success') and models.get('success'):
        # Find models that are healthy
        healthy_models = []
        for model in models.get('text_models', []):
            if health.get('checks', {}).get('models', {}).get(model, {}).get('ok'):
                healthy_models.append(model)
        
        return healthy_models[0] if healthy_models else models.get('defaults', {}).get('text')
    
    return None

# Usage
best_model = choose_best_model()
print(f"Best available model: {best_model}")
```

## Model Data Structure

### Response Format
The `/models` endpoint returns:
```json
{
  "success": true,
  "defaults": {
    "text": "default_text_model",
    "image": "default_image_model",
    "image_preference": "default_preference"
  },
  "counts": {
    "text": "number_of_text_models",
    "image": "number_of_image_models"
  },
  "text_models": ["array", "of", "text", "models"],
  "image_models": ["array", "of", "image", "models"],
  "valid_image_models": "comma_separated_list"
}
```

### Detailed Response
With `?details=true`, additional information includes:
- Model enablement status
- Provider information
- Performance metrics

## Best Practices

1. **Always Check Availability**: Use `/models` before making requests
2. **Monitor Health**: Use `/health` for system status
3. **Handle Failures**: Implement fallback logic
4. **Cache Responsibly**: Cache model lists but refresh periodically
5. **Use Defaults**: Start with system defaults for reliability

## Future Model Information

New models and providers may be added over time. The documentation will remain current as it pulls data directly from the live API endpoints.

For the most accurate and up-to-date model information, always reference the live API endpoints rather than static documentation.

## Getting Detailed Model Information

### Model Capabilities
To understand specific model capabilities and performance characteristics:

```bash
# Get detailed model information including provider and performance data
curl "https://vexa-ai.pages.dev/models?details=true"
```

### Model Categories
The API dynamically categorizes models based on their capabilities:

- **Text Generation Models**: Conversational AI, content creation, text completion
- **Image Generation Models**: Image synthesis from text descriptions

### Model Selection Strategies

#### Task-Based Selection
1. **Check Available Models**: Use `/models?type=text` or `/models?type=image`
2. **Review Performance**: Check `/health` for current performance metrics
3. **Select Appropriate Model**: Choose based on task requirements
4. **Test and Monitor**: Verify performance and fallback if needed

#### Performance-Based Selection
```bash
# Check current model performance
curl "https://vexa-ai.pages.dev/health"

# Look for models with:
# - Lower latency for speed-critical tasks
# - Higher success rates for reliability
# - Appropriate capabilities for your use case
```

## Dynamic Model Features

### Streaming Support
Most text models support streaming. Check model availability first:
```bash
curl "https://vexa-ai.pages.dev/models?type=text&details=true"
```

### Image Preferences
Image models support speed vs quality preferences:
- `speed`: Faster generation
- `quality`: Higher quality output

### Provider-Specific Features
Different providers offer unique capabilities. Check detailed model information for:
- Provider-specific features
- Performance characteristics
- Specialized capabilities

## Model Monitoring

### Health Monitoring
Regular health checks ensure model availability:
```bash
# Comprehensive health check
curl "https://vexa-ai.pages.dev/health"

# Quick check without model testing
curl "https://vexa-ai.pages.dev/health?skip_models=true"
```

### Performance Tracking
Monitor:
- Response latency
- Success rates
- Provider status
- System-wide health

## Best Practices

### Model Selection
1. **Use Defaults**: Start with system defaults for reliability
2. **Check Availability**: Verify model status before use
3. **Monitor Performance**: Track response times and success rates
4. **Implement Fallbacks**: Have alternative models ready
5. **Cache Responsibly**: Cache model lists but refresh periodically

### Error Handling
- Always check response `success` field
- Implement retry logic for failures
- Use `/health` to check system status
- Monitor `/models` for availability changes

## Integration Patterns

### Dynamic Model Selection
```javascript
async function selectBestModel(taskType) {
    // Get current models and health
    const [models, health] = await Promise.all([
        fetch('https://vexa-ai.pages.dev/models').then(r => r.json()),
        fetch('https://vexa-ai.pages.dev/health').then(r => r.json())
    ]);
    
    if (!models.success || !health.success) {
        return models.defaults?.[taskType] || null;
    }
    
    // Find healthy models for the task
    const availableModels = taskType === 'text' 
        ? models.text_models 
        : models.image_models;
    
    const healthyModels = availableModels.filter(model => 
        health.checks.models?.[model]?.ok
    );
    
    return healthyModels[0] || models.defaults?.[taskType];
}
```

### Model Health Monitoring
```python
import requests
import time

def monitor_model_health():
    while True:
        try:
            health = requests.get('https://vexa-ai.pages.dev/health').json()
            models = requests.get('https://vexa-ai.pages.dev/models').json()
            
            if health.get('success') and models.get('success'):
                print(f"System Status: {health.get('status', 'unknown')}")
                
                # Check failed models
                failed_models = health.get('failed_models', [])
                if failed_models:
                    print(f"Failed models: {failed_models}")
                
                # Show available models
                print(f"Available text models: {len(models.get('text_models', []))}")
                print(f"Available image models: {len(models.get('image_models', []))}")
            
            time.sleep(60)  # Check every minute
            
        except Exception as e:
            print(f"Monitoring error: {e}")
            time.sleep(30)

# Start monitoring
monitor_model_health()
```

## Future Model Information

New models and capabilities are added dynamically. The documentation remains current by pulling data from live endpoints.

For the most accurate model information, always reference the live API endpoints rather than static documentation.
