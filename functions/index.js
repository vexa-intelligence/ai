export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Content-Type": "application/json",
            },
        });
    }

    if (request.method !== "GET") {
        return Response.json(
            { success: false, error: "Method not allowed" },
            {
                status: 405,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                },
            }
        );
    }

    const endpointsData = {
        api_info: {
            name: "Vexa AI API",
            version: "1.0",
            description: "Multi-service AI API providing text generation, image generation, model listings, and health checks",
            base_url: "",
            cors_enabled: true,
            rate_limited: true,
        },
        endpoints: {
            "/chat": {
                methods: ["POST", "OPTIONS"],
                description: "Chat completion endpoint for conversational AI",
                parameters: {
                    model: {
                        type: "string",
                        required: false,
                        default: "toolbaz-v4.5-fast",
                        description: "AI model to use for generation",
                    },
                    messages: {
                        type: "array",
                        required: true,
                        description: "Array of message objects with role and content",
                        items: {
                            role: { type: "string", enum: ["system", "user", "assistant"], required: true },
                            content: { type: "string", required: true },
                        },
                    },
                },
                example_requests: {
                    post: {
                        url: "/chat",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: {
                            model: "toolbaz-v4.5-fast",
                            messages: [
                                { role: "system", content: "You are a helpful assistant." },
                                { role: "user", content: "What is the capital of France?" },
                            ],
                        },
                    },
                },
                example_responses: {
                    success: {
                        success: true,
                        message: { role: "assistant", content: "The capital of France is Paris." },
                        model: "toolbaz-v4.5-fast",
                        elapsed_ms: 1234,
                        prompt_chars: 85,
                    },
                    error: { success: false, error: "Missing or empty 'messages' array" },
                },
                limits: { max_prompt_length: 16000, max_requests_per_minute: 20 },
            },
            "/image": {
                methods: ["GET", "POST", "OPTIONS"],
                description: "Image generation via DeepAI. All images are served through a proxy — the upstream URL is never exposed.",
                parameters: {
                    prompt: {
                        type: "string",
                        required: true,
                        description: "Text description of the image to generate",
                        aliases: ["q"],
                        max_length: 1000,
                    },
                    model: {
                        type: "string",
                        required: false,
                        default: "hd",
                        enum: ["hd"],
                        description: "hd = standard HD generation",
                    },
                    preference: {
                        type: "string",
                        required: false,
                        default: "speed",
                        enum: ["speed", "quality"],
                        description: "speed = faster generation, quality = better output",
                    },
                },
                example_requests: {
                    get: {
                        url: "/image?q=a+red+fox+in+a+neon+city",
                        method: "GET",
                    },
                    get_custom: {
                        url: "/image?q=a+castle+at+sunset&preference=quality",
                        method: "GET",
                    },
                    post: {
                        url: "/image",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: {
                            prompt: "a highly detailed fantasy castle on a cliff at sunset",
                            preference: "quality",
                        },
                    },
                },
                example_responses: {
                    success: {
                        success: true,
                        prompt: "a red fox in a neon city",
                        model: "hd",
                        preference: "speed",
                        proxy_url: "/image/proxy/abc123def456789012",
                        elapsed_ms: 4200,
                    },
                    error: { success: false, error: "Missing required parameter: q or prompt" },
                },
                limits: { max_prompt_length: 1000, max_requests_per_minute: 10 },
            },
            "/image/proxy/:id": {
                methods: ["GET"],
                description: "Streams a previously generated image by proxy ID. The upstream DeepAI URL is never revealed.",
                parameters: {
                    id: { type: "string", required: true, description: "Proxy ID returned by /image" },
                },
                example_requests: {
                    get: { url: "/image/proxy/abc123def456789012", method: "GET" },
                },
                example_responses: {
                    success: "Binary image data with Content-Type: image/jpeg",
                    error: { success: false, error: "Image not found or expired" },
                },
            },
            "/query": {
                methods: ["GET", "POST", "OPTIONS"],
                description: "Simple text generation endpoint for single prompts",
                parameters: {
                    prompt: {
                        type: "string",
                        required: true,
                        description: "Text prompt for generation",
                        aliases: ["q", "query"],
                    },
                    model: {
                        type: "string",
                        required: false,
                        default: "toolbaz-v4.5-fast",
                        description: "AI model to use",
                    },
                },
                example_requests: {
                    get: { url: "/query?q=What%20is%20machine%20learning%3F&model=toolbaz-v4.5-fast", method: "GET" },
                    post: {
                        url: "/query",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: { prompt: "What is machine learning?", model: "toolbaz-v4.5-fast" },
                    },
                },
                example_responses: {
                    success: {
                        success: true,
                        response: "Machine learning is a subset of artificial intelligence...",
                        model: "toolbaz-v4.5-fast",
                        elapsed_ms: 2345,
                    },
                    error: { success: false, error: "Missing required parameter: q, query, or prompt" },
                },
                limits: { max_prompt_length: 4000, max_requests_per_minute: 20 },
            },
            "/models": {
                methods: ["GET", "OPTIONS"],
                description: "Get available AI models. Text models are scraped live from Toolbaz. Image models are the fixed DeepAI model list.",
                parameters: {},
                example_requests: { get: { url: "/models", method: "GET" } },
                example_responses: {
                    success: {
                        success: true,
                        default: "toolbaz-v4.5-fast",
                        models: {
                            "toolbaz-v4.5-fast": { label: "ToolBaz v4.5 Fast", provider: "ToolBaz", speed: 120, quality: 85 },
                        },
                        image_models: [
                            { name: "hd", label: "HD", description: "Standard HD generation" },
                        ],
                    },
                },
                cache_info: { cache_ttl_seconds: 300 },
            },
            "/health": {
                methods: ["GET", "OPTIONS"],
                description: "Health check endpoint. Checks Toolbaz page, Toolbaz token endpoint, and DeepAI image endpoint.",
                parameters: {},
                example_requests: { get: { url: "/health", method: "GET" } },
                example_responses: {
                    healthy: {
                        success: true,
                        status: "ok",
                        timestamp: 1717123456,
                        total_ms: 234,
                        checks: {
                            page: { reachable: true, status_code: 200, latency_ms: 120 },
                            token: { reachable: true, token_received: true, status_code: 200, latency_ms: 45 },
                            image: { reachable: true, status_code: 200, latency_ms: 69 },
                        },
                    },
                    degraded: {
                        success: true,
                        status: "degraded",
                        timestamp: 1717123456,
                        total_ms: 5500,
                        checks: {
                            page: { reachable: false, error: "Connection timeout", latency_ms: 5000 },
                            token: { reachable: true, token_received: true, status_code: 200, latency_ms: 45 },
                            image: { reachable: false, error: "Connection refused", latency_ms: 500 },
                        },
                    },
                },
            },
        },
        common_responses: {
            cors_preflight: {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            },
            rate_limit: { success: false, error: "Rate limit exceeded. Try again shortly." },
            method_not_allowed: { success: false, error: "Method not allowed" },
            invalid_json: { success: false, error: "Invalid JSON body" },
        },
        usage_notes: {
            authentication: "No API key required",
            rate_limiting: "Based on client IP address, resets on serverless cold starts",
            cors: "All endpoints support CORS for cross-origin requests",
            error_handling: "All errors return JSON with success: false and a descriptive error message",
            image_proxy: "Generated images are always served via /image/proxy/:id — upstream URLs are never exposed",
            timeouts: { text_generation: "30 seconds typical" },
            caching: { text_models: "Cached for 5 minutes per serverless instance" },
        },
    };

    return Response.json(endpointsData, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json",
        },
    });
}