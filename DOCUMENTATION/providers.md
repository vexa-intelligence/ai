# AI Providers Documentation

This document details the AI providers integrated into the Vexa AI API, their capabilities, and technical specifications.

## Overview

Vexa AI aggregates multiple AI providers to offer a unified API experience. Each provider contributes different models and capabilities, allowing users to access cutting-edge AI without managing multiple API keys or integrations.

## Supported Providers

### Current Provider Status
*Check the `/models` endpoint with `details=true` for current provider status:*
```bash
curl "https://vexa-ai.pages.dev/models?details=true"
```

The response shows which providers are currently enabled and their associated models.

### Provider Categories
Providers are dynamically categorized based on their capabilities:
- **Primary Providers**: Main sources for text and image generation
- **Specialized Providers**: Task-specific models and features
- **Alternative Providers**: Backup and additional options

## Getting Provider Information

### Real-time Provider Status
```bash
# Get detailed provider and model information
curl "https://vexa-ai.pages.dev/models?details=true"

# Check system health including provider status
curl "https://vexa-ai.pages.dev/health"
```

### Provider Information Available
The API provides dynamic information about:
- **Enabled/Disabled Status**: Which providers are currently active
- **Model Availability**: Models available from each provider
- **Performance Metrics**: Response times and success rates
- **Capabilities**: Provider-specific features and limitations

## Provider Capabilities

### Dynamic Provider Features
Provider capabilities are determined by:
- **Available Models**: Check `/models` for current offerings
- **Performance Metrics**: Monitor `/health` for response times
- **Feature Support**: Streaming, image generation, etc.
- **Authentication Requirements**: API key vs open access

### Provider Categories

#### Text Generation Providers
- Support conversational AI and content creation
- May offer streaming capabilities
- Vary in response speed and quality
- Different model architectures and specializations

#### Image Generation Providers  
- Specialize in text-to-image synthesis
- Offer different styles and quality levels
- Support various preferences (speed vs quality)
- May include advanced features like seeding

#### Hybrid Providers
- Support both text and image generation
- Offer integrated multi-modal capabilities
- Provide unified API experiences
- May include advanced tool integration

## Provider Monitoring

### Health Monitoring
```bash
# Comprehensive provider health check
curl "https://vexa-ai.pages.dev/health"
```

This returns:
- Provider reachability status
- Response latency metrics
- Model availability per provider
- System-wide performance indicators

### Performance Tracking
Monitor:
- **Response Times**: Latency per provider
- **Success Rates**: Reliability metrics
- **Model Availability**: Current accessible models
- **Error Rates**: Failure frequency and types

## Provider Integration

### Automatic Provider Selection
The API automatically routes requests to appropriate providers based on:
- Model selection
- Provider availability
- Performance optimization
- Load balancing

### Fallback Mechanisms
When providers are unavailable:
- Automatic routing to alternative providers
- Graceful degradation of service
- Error notification and recovery
- Health monitoring and recovery

## Provider-Specific Features

### Streaming Support
Check provider streaming capabilities:
```bash
# Test streaming with different providers
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Test"}],
    "stream": true
  }'
```

### Authentication Methods
Providers may use:
- **Internal API Keys**: Managed by the system
- **No Authentication**: Open access providers
- **Nonce-based**: Security through nonces
- **Token-based**: Temporary access tokens

### Special Features
Different providers offer unique capabilities:
- **Tool Integration**: Built-in tool usage
- **Privacy Options**: Private generation modes
- **Deterministic Output**: Seed-based generation
- **Multi-modal Support**: Text and image integration

## Provider Configuration

### Dynamic Configuration
Provider settings are managed dynamically:
- **Enable/Disable**: Providers can be activated/deactivated
- **Model Updates**: New models added automatically
- **Performance Tuning**: Optimization based on usage
- **Health Monitoring**: Continuous status checking

### Configuration Access
```bash
# Get current provider configuration
curl "https://vexa-ai.pages.dev/models?details=true"

# Check which providers are enabled
# Look for "enabled": true in model_status responses
```

## Best Practices

### Provider Selection
1. **Use Defaults**: Start with system-selected providers
2. **Check Health**: Verify provider status before use
3. **Monitor Performance**: Track response times and reliability
4. **Implement Fallbacks**: Handle provider failures gracefully
5. **Cache Appropriately**: Cache provider lists but refresh periodically

### Error Handling
- Always check response success status
- Implement retry logic for provider failures
- Monitor `/health` for provider status
- Use alternative providers when needed

## Integration Examples

### Dynamic Provider Selection
```javascript
async function selectProvider(model) {
    const models = await fetch('https://vexa-ai.pages.dev/models?details=true')
        .then(r => r.json());
    
    if (models.success && models.model_status?.[model]) {
        const modelInfo = models.model_status[model];
        return {
            model,
            enabled: modelInfo.enabled,
            provider: modelInfo.provider || 'unknown'
        };
    }
    
    return null;
}

async function chatWithProvider(message, model) {
    const providerInfo = await selectProvider(model);
    
    if (!providerInfo || !providerInfo.enabled) {
        throw new Error(`Model ${model} not available`);
    }
    
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

### Provider Health Monitoring
```python
import requests
import time

def monitor_providers():
    while True:
        try:
            health = requests.get('https://vexa-ai.pages.dev/health').json()
            models = requests.get('https://vexa-ai.pages.dev/models?details=true').json()
            
            if health.get('success') and models.get('success'):
                print(f"System Status: {health.get('status', 'unknown')}")
                
                # Check provider health
                checks = health.get('checks', {})
                for provider, status in checks.items():
                    if provider != 'models':
                        print(f"{provider}: {'OK' if status.get('reachable') else 'DOWN'}")
                
                # Show enabled providers
                enabled_providers = set()
                for model, info in models.get('model_status', {}).items():
                    if info.get('enabled'):
                        enabled_providers.add(info.get('provider', 'unknown'))
                
                print(f"Enabled providers: {list(enabled_providers)}")
            
            time.sleep(60)  # Check every minute
            
        except Exception as e:
            print(f"Monitoring error: {e}")
            time.sleep(30)

# Start monitoring
monitor_providers()
```

## Future Provider Information

New providers may be added dynamically. The documentation remains current by pulling data from live API endpoints.

For the most accurate provider information, always reference the live API endpoints rather than static documentation.

## Provider Configuration

### Dynamic Provider Settings
Provider configuration is managed dynamically. Check current settings:
```bash
# Get current provider status and configuration
curl "https://vexa-ai.pages.dev/models?details=true"

# Monitor provider health and performance
curl "https://vexa-ai.pages.dev/health"
```

### Model Routing Logic

The API automatically routes requests to appropriate providers based on:
- Model selection and availability
- Provider enablement status
- Performance optimization
- Load balancing and failover

### Provider Performance Monitoring

Performance metrics are available through the health endpoint:
- **Response Times**: Latency measurements per provider
- **Success Rates**: Reliability and availability metrics
- **Model Availability**: Current accessible models
- **Error Rates**: Failure frequency and types

### Health Monitoring

Regular health checks ensure provider reliability:
```bash
# Comprehensive health check
curl "https://vexa-ai.pages.dev/health"

# Quick status check
curl "https://vexa-ai.pages.dev/health?skip_models=true"
```

### Integration Architecture

The system uses a unified architecture:
- **Request Routing**: Automatic provider selection
- **Response Standardization**: Consistent format across providers
- **Error Handling**: Unified error responses
- **Failover Logic**: Automatic provider switching

### Response Format
All provider responses follow a standardized structure:
```json
{
  "success": true,
  "data": "response_content",
  "model": "model_used",
  "elapsed_ms": response_time,
  "source": "provider_name"
}
```

## Security and Privacy

### Authentication Methods
Providers use various authentication approaches:
- **Internal API Keys**: Managed by the system
- **No Authentication**: Open access providers
- **Nonce-based**: Security through nonces
- **Token-based**: Temporary access tokens

### Data Protection
- No user data storage
- Private generation options (when available)
- Secure communication channels
- Privacy-focused provider selection

## Troubleshooting

### Common Issues
1. **Provider Unavailable**: Check `/health` endpoint
2. **Model Not Found**: Verify model availability via `/models`
3. **Slow Responses**: Monitor performance metrics
4. **Authentication Errors**: System-managed, usually automatic

### Debugging Tools
```bash
# System status
curl "https://vexa-ai.pages.dev/health"

# Available models and providers
curl "https://vexa-ai.pages.dev/models?details=true"

# Test specific model
curl -X POST https://vexa-ai.pages.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

### Best Practices
1. **Monitor Health**: Regularly check `/health` endpoint
2. **Use Defaults**: Start with system-selected providers
3. **Handle Failures**: Implement retry and fallback logic
4. **Cache Appropriately**: Cache provider lists but refresh periodically
5. **Check Availability**: Verify model status before critical operations

## Future Provider Information

New providers may be added dynamically. The documentation remains current by pulling data from live API endpoints.

For the most accurate provider information, always reference the live API endpoints rather than static documentation.
