import { DEFAULT_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_IMAGE_PREFERENCE, IMAGE_MODELS, PROVIDER_SETTINGS } from "../config.js";
import { getAllEnabledModels } from "../lib/models.js";

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204 });
    }

    const url = new URL(request.url);
    const includeExamples = url.searchParams.get("examples") !== "false";

    const baseUrl = "https://vexa-ai.pages.dev";
    const timestamp = new Date().toISOString();

    const allModels = await getAllEnabledModels();
    const enabledTextModels = Object.keys(allModels.textModels);
    const enabledImageModels = allModels.imageModels.map(m => m.name);

    const apiDocs = {
        info: {
            title: "Vexa AI API",
            description: "Multi-provider AI service offering text generation, image generation, and model management",
            version: "1.0.0",
            base_url: baseUrl,
            timestamp,
            status: "operational"
        },
        defaults: {
            chat_model: DEFAULT_MODEL,
            image_model: DEFAULT_IMAGE_MODEL,
            query_model: DEFAULT_MODEL,
            image_preference: DEFAULT_IMAGE_PREFERENCE
        },
        statistics: {
            available_text_models: enabledTextModels.length,
            available_image_models: enabledImageModels.length,
            enabled_providers: Object.entries(PROVIDER_SETTINGS).filter(([, enabled]) => enabled).length
        },
        endpoints: {
            "/": {
                description: "API documentation and information",
                methods: ["GET"],
                parameters: {
                    format: { type: "string", enum: ["json", "html"], default: "json", description: "Response format" },
                    examples: { type: "boolean", default: "true", description: "Include usage examples" }
                }
            },
            "/chat": {
                description: "Chat completion with conversation history",
                methods: ["POST", "OPTIONS"],
                parameters: {
                    model: { type: "string", default: DEFAULT_MODEL, description: "AI model to use" },
                    messages: { type: "array", required: true, description: "Array of message objects" },
                    stream: { type: "boolean", default: "false", description: "Enable streaming response" }
                },
                message_format: {
                    role: { type: "string", enum: ["system", "user", "assistant"], required: true },
                    content: { type: "string", required: true, description: "Message content" }
                },
                examples: includeExamples ? {
                    basic_chat: {
                        description: "Simple chat request",
                        request: `POST /chat {"model":"${DEFAULT_MODEL}","messages":[{"role":"user","content":"Hello, how are you?"}]}`,
                        curl: `curl -X POST ${baseUrl}/chat -H "Content-Type: application/json" -d '{"model":"${DEFAULT_MODEL}","messages":[{"role":"user","content":"Hello"}]}'`
                    },
                    streaming: {
                        description: "Streaming chat response",
                        request: `POST /chat {"model":"${DEFAULT_MODEL}","messages":[{"role":"user","content":"Tell me a story"}],"stream":true}`,
                        note: "Returns server-sent events (SSE) for real-time streaming"
                    }
                } : undefined
            },
            "/image": {
                description: "Generate images from text prompts",
                methods: ["GET", "POST", "OPTIONS"],
                parameters: {
                    prompt: { type: "string", required: true, description: "Text description of the image to generate" },
                    model: { type: "string", default: DEFAULT_IMAGE_MODEL, enum: enabledImageModels, description: "Image generation model" },
                    preference: { type: "string", enum: ["speed", "quality"], default: DEFAULT_IMAGE_PREFERENCE, description: "Generation preference" }
                },
                available_models: IMAGE_MODELS.filter(m => enabledImageModels.includes(m.name)).map(m => ({
                    name: m.name,
                    label: m.label,
                    description: m.description
                })),
                examples: includeExamples ? {
                    get_request: {
                        description: "Generate image via GET",
                        request: "GET /image?q=a+cat",
                        curl: `curl "${baseUrl}/image?q=a+cat"`
                    },
                    post_request: {
                        description: "Generate image via POST",
                        request: `POST /image {"prompt":"a cat","model":"${DEFAULT_IMAGE_MODEL}","preference":"${DEFAULT_IMAGE_PREFERENCE}"}`,
                        curl: `curl -X POST ${baseUrl}/image -H "Content-Type: application/json" -d '{"prompt":"a cat","model":"${DEFAULT_IMAGE_MODEL}"}'`
                    }
                } : undefined
            },
            "/image/proxy/:id": {
                description: "Proxy for serving generated images",
                methods: ["GET"],
                parameters: {
                    id: { type: "string", required: true, description: "Image identifier from generation response" }
                },
                examples: includeExamples ? {
                    proxy_image: {
                        description: "Access generated image",
                        request: "GET /image/proxy/abc123",
                        curl: `curl "${baseUrl}/image/proxy/abc123" --output image.png`
                    }
                } : undefined
            },
            "/query": {
                description: "Simple single-prompt text generation",
                methods: ["GET", "POST", "OPTIONS"],
                parameters: {
                    prompt: { type: "string", required: true, description: "Text prompt for generation" },
                    model: { type: "string", default: DEFAULT_MODEL, description: "AI model to use" }
                },
                examples: includeExamples ? {
                    get_request: {
                        description: "Query via GET parameters",
                        request: "GET /query?q=What+is+AI?",
                        curl: `curl "${baseUrl}/query?q=What+is+AI?"`
                    },
                    post_request: {
                        description: "Query via POST body",
                        request: `POST /query {"prompt":"What is AI?","model":"${DEFAULT_MODEL}"}`,
                        curl: `curl -X POST ${baseUrl}/query -H "Content-Type: application/json" -d '{"prompt":"What is AI?","model":"${DEFAULT_MODEL}"}'`
                    }
                } : undefined
            },
            "/models": {
                description: "List available AI models and their status",
                methods: ["GET", "OPTIONS"],
                parameters: {
                    details: { type: "boolean", default: "false", description: "Include detailed model information" },
                    type: { type: "string", enum: ["text", "image"], description: "Filter by model type" }
                },
                examples: includeExamples ? {
                    list_models: {
                        description: "Get all available models",
                        request: "GET /models",
                        curl: `curl "${baseUrl}/models"`
                    },
                    detailed_info: {
                        description: "Get detailed model information",
                        request: "GET /models?details=true",
                        curl: `curl "${baseUrl}/models?details=true"`
                    }
                } : undefined
            },
            "/health": {
                description: "System health check and service status",
                methods: ["GET", "OPTIONS"],
                parameters: {
                    skip_models: { type: "boolean", default: "false", description: "Skip individual model health checks" }
                },
                examples: includeExamples ? {
                    health_check: {
                        description: "Full system health check",
                        request: "GET /health",
                        curl: `curl "${baseUrl}/health"`
                    },
                    quick_check: {
                        description: "Quick health check without model testing",
                        request: "GET /health?skip_models=true",
                        curl: `curl "${baseUrl}/health?skip_models=true"`
                    }
                } : undefined
            }
        },
        response_formats: {
            success: {
                description: "Successful API response",
                structure: {
                    success: true,
                    data: "response_data",
                    model: "model_used",
                    elapsed_ms: "response_time_ms"
                }
            },
            error: {
                description: "Error response",
                structure: {
                    success: false,
                    error: "error_message",
                    detail: "detailed_error_info"
                }
            },
            streaming: {
                description: "Server-sent events format for streaming",
                format: "data: {JSON_OBJECT}\\n\\n",
                note: "Ends with 'data: [DONE]\\n\\n'"
            }
        },
        usage_notes: {
            authentication: "No API key required - rate limits apply",
            rate_limits: "Requests are limited per IP address",
            model_availability: "Models may become unavailable based on provider status",
            image_generation: "Images are cached and served via proxy endpoint",
            streaming: "Use stream=true for real-time responses in chat endpoint"
        },
        providers: {
            enabled: Object.entries(PROVIDER_SETTINGS).filter(([, enabled]) => enabled).map(([name]) => name),
            disabled: Object.entries(PROVIDER_SETTINGS).filter(([, enabled]) => !enabled).map(([name]) => name)
        }
    };

    if (!includeExamples) {
        Object.values(apiDocs.endpoints).forEach(endpoint => {
            if (endpoint.examples) delete endpoint.examples;
        });
    }

    return Response.json(apiDocs, {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}
