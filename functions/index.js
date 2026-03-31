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
                }
            }
        );
    }

    // Serve the endpoints documentation directly
    const endpointsData = {
        "api_info": {
            "name": "Vexa AI API",
            "version": "1.0",
            "description": "Multi-service AI API providing text generation, image generation, model listings, and health checks",
            "base_url": "https://your-domain.workers.dev",
            "cors_enabled": true,
            "rate_limited": true
        },
        "endpoints": {
            "/chat": {
                "methods": ["POST", "OPTIONS"],
                "description": "Chat completion endpoint for conversational AI",
                "parameters": {
                    "model": {
                        "type": "string",
                        "required": false,
                        "default": "toolbaz-v4.5-fast",
                        "description": "AI model to use for generation"
                    },
                    "messages": {
                        "type": "array",
                        "required": true,
                        "description": "Array of message objects with role and content",
                        "items": {
                            "role": {
                                "type": "string",
                                "enum": ["system", "user", "assistant"],
                                "required": true
                            },
                            "content": {
                                "type": "string",
                                "required": true
                            }
                        }
                    }
                },
                "example_requests": {
                    "post": {
                        "url": "/chat",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": {
                            "model": "toolbaz-v4.5-fast",
                            "messages": [
                                {
                                    "role": "system",
                                    "content": "You are a helpful assistant."
                                },
                                {
                                    "role": "user",
                                    "content": "What is the capital of France?"
                                }
                            ]
                        }
                    }
                },
                "example_responses": {
                    "success": {
                        "success": true,
                        "message": {
                            "role": "assistant",
                            "content": "The capital of France is Paris."
                        },
                        "model": "toolbaz-v4.5-fast",
                        "elapsed_ms": 1234,
                        "prompt_chars": 85
                    },
                    "error": {
                        "success": false,
                        "error": "Missing or empty 'messages' array"
                    }
                },
                "limits": {
                    "max_prompt_length": 16000,
                    "max_requests_per_minute": 20
                }
            },
            "/image": {
                "methods": ["GET", "POST", "OPTIONS"],
                "description": "Image generation endpoint using AI Horde",
                "parameters": {
                    "prompt": {
                        "type": "string",
                        "required": true,
                        "description": "Text prompt for image generation",
                        "aliases": ["q"]
                    },
                    "negative_prompt": {
                        "type": "string",
                        "required": false,
                        "description": "Negative prompt for things to avoid",
                        "aliases": ["negative"]
                    },
                    "resolution": {
                        "type": "string",
                        "required": false,
                        "default": "512x512",
                        "enum": ["512x512", "512x768", "768x512", "768x768", "640x960", "960x640", "1024x576", "576x1024", "832x1216", "1216x832", "1024x1024"]
                    },
                    "model": {
                        "type": "string",
                        "required": false,
                        "default": "Deliberate",
                        "description": "AI model for image generation"
                    },
                    "sampler": {
                        "type": "string",
                        "required": false,
                        "default": "k_euler_a",
                        "enum": ["k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a", "k_dpmpp_2m", "k_dpmpp_sde", "DDIM", "k_heun"]
                    },
                    "num_images": {
                        "type": "integer",
                        "required": false,
                        "default": 1,
                        "minimum": 1,
                        "maximum": 4,
                        "aliases": ["num", "numImages"]
                    },
                    "steps": {
                        "type": "integer",
                        "required": false,
                        "default": 25,
                        "minimum": 10,
                        "maximum": 50
                    },
                    "cfg_scale": {
                        "type": "number",
                        "required": false,
                        "default": 7.0,
                        "minimum": 1.0,
                        "maximum": 20.0,
                        "aliases": ["cfg"]
                    },
                    "seed": {
                        "type": "integer",
                        "required": false,
                        "description": "Random seed for reproducible generation"
                    }
                },
                "example_requests": {
                    "get": {
                        "url": "/image?q=a%20beautiful%20sunset%20over%20the%20ocean&resolution=1024x1024&num_images=2",
                        "method": "GET"
                    },
                    "post": {
                        "url": "/image",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": {
                            "prompt": "a beautiful sunset over the ocean",
                            "negative_prompt": "blurry, low quality",
                            "resolution": "1024x1024",
                            "model": "Deliberate",
                            "num_images": 2,
                            "steps": 30,
                            "cfg_scale": 7.5
                        }
                    }
                },
                "example_responses": {
                    "success": {
                        "success": true,
                        "prompt": "a beautiful sunset over the ocean",
                        "negative_prompt": null,
                        "model": "Deliberate",
                        "resolution": "1024x1024",
                        "sampler": "k_euler_a",
                        "steps": 30,
                        "cfg_scale": 7.5,
                        "num_images": 2,
                        "images": [
                            {
                                "b64": "base64-encoded-image-data",
                                "url": "https://image-url",
                                "seed": "12345",
                                "model": "Deliberate",
                                "worker": "worker-name"
                            }
                        ],
                        "elapsed_ms": 15000
                    },
                    "error": {
                        "success": false,
                        "error": "Missing required parameter: q or prompt"
                    }
                },
                "limits": {
                    "max_prompt_length": 1000,
                    "max_negative_prompt_length": 500,
                    "max_requests_per_minute": 10,
                    "max_images_per_request": 4
                }
            },
            "/query": {
                "methods": ["GET", "POST", "OPTIONS"],
                "description": "Simple text generation endpoint for single prompts",
                "parameters": {
                    "prompt": {
                        "type": "string",
                        "required": true,
                        "description": "Text prompt for generation",
                        "aliases": ["q", "query"]
                    },
                    "model": {
                        "type": "string",
                        "required": false,
                        "default": "toolbaz-v4.5-fast",
                        "description": "AI model to use"
                    }
                },
                "example_requests": {
                    "get": {
                        "url": "/query?q=What%20is%20machine%20learning?&model=toolbaz-v4.5-fast",
                        "method": "GET"
                    },
                    "post": {
                        "url": "/query",
                        "method": "POST",
                        "headers": {
                            "Content-Type": "application/json"
                        },
                        "body": {
                            "prompt": "What is machine learning?",
                            "model": "toolbaz-v4.5-fast"
                        }
                    }
                },
                "example_responses": {
                    "success": {
                        "success": true,
                        "response": "Machine learning is a subset of artificial intelligence...",
                        "model": "toolbaz-v4.5-fast",
                        "elapsed_ms": 2345
                    },
                    "error": {
                        "success": false,
                        "error": "Missing required parameter: q, query, or prompt"
                    }
                },
                "limits": {
                    "max_prompt_length": 4000,
                    "max_requests_per_minute": 20
                }
            },
            "/models": {
                "methods": ["GET", "OPTIONS"],
                "description": "Get available AI models for text and image generation",
                "parameters": {},
                "example_requests": {
                    "get": {
                        "url": "/models",
                        "method": "GET"
                    }
                },
                "example_responses": {
                    "success": {
                        "success": true,
                        "default": "toolbaz-v4.5-fast",
                        "models": {
                            "toolbaz-v4.5-fast": {
                                "label": "ToolBaz v4.5 Fast",
                                "provider": "ToolBaz",
                                "speed": 120,
                                "quality": 85
                            },
                            "gpt-4": {
                                "label": "GPT-4",
                                "provider": "OpenAI",
                                "speed": 45,
                                "quality": 95
                            }
                        },
                        "image_models": [
                            {
                                "name": "Deliberate",
                                "count": 15
                            },
                            {
                                "name": "Stable Diffusion",
                                "count": 8
                            }
                        ]
                    }
                },
                "cache_info": {
                    "cache_ttl_seconds": 300
                }
            },
            "/health": {
                "methods": ["GET", "OPTIONS"],
                "description": "Health check endpoint for all API services",
                "parameters": {},
                "example_requests": {
                    "get": {
                        "url": "/health",
                        "method": "GET"
                    }
                },
                "example_responses": {
                    "healthy": {
                        "success": true,
                        "status": "ok",
                        "timestamp": 1717123456,
                        "total_ms": 234,
                        "checks": {
                            "page": {
                                "reachable": true,
                                "status_code": 200,
                                "latency_ms": 120
                            },
                            "token": {
                                "reachable": true,
                                "token_received": true,
                                "status_code": 200,
                                "latency_ms": 45
                            },
                            "image": {
                                "reachable": true,
                                "worker_count": 25,
                                "model_count": 12,
                                "top_models": ["Deliberate", "Stable Diffusion"],
                                "job_submitted": true,
                                "job_id": "abc123",
                                "is_possible": true,
                                "queue_position": 0,
                                "estimated_wait_s": 5,
                                "latency_ms": 180
                            }
                        }
                    },
                    "degraded": {
                        "success": true,
                        "status": "degraded",
                        "timestamp": 1717123456,
                        "total_ms": 500,
                        "checks": {
                            "page": {
                                "reachable": false,
                                "error": "Connection timeout",
                                "latency_ms": 5000
                            },
                            "token": {
                                "reachable": true,
                                "token_received": true,
                                "status_code": 200,
                                "latency_ms": 45
                            },
                            "image": {
                                "reachable": true,
                                "worker_count": 25,
                                "model_count": 12,
                                "job_submitted": true,
                                "latency_ms": 180
                            }
                        }
                    }
                }
            }
        },
        "common_responses": {
            "cors_preflight": {
                "status": 204,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            },
            "rate_limit": {
                "success": false,
                "error": "Rate limit exceeded. Try again shortly."
            },
            "method_not_allowed": {
                "success": false,
                "error": "Method not allowed"
            },
            "invalid_json": {
                "success": false,
                "error": "Invalid JSON body"
            }
        },
        "usage_notes": {
            "authentication": "No API key required - uses anonymous access",
            "rate_limiting": "Based on client IP address",
            "cors": "All endpoints support CORS for cross-origin requests",
            "error_handling": "All errors return JSON with 'success: false' and descriptive error message",
            "timeouts": {
                "image_generation": "120 seconds maximum",
                "text_generation": "30 seconds typical"
            },
            "caching": {
                "models": "Cached for 5 minutes",
                "worker_status": "Cached for 5 minutes"
            }
        }
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
