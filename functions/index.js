import { onRequest as chatHandler } from './chat.js';
import { onRequest as healthHandler } from './health.js';
import { onRequest as imageHandler } from './image.js';
import { onRequest as imageProxyHandler } from './image/proxy/[[id]].js';
import { onRequest as modelsHandler } from './models.js';
import { onRequest as queryHandler } from './query.js';
import { onRequest as notFoundHandler } from './404.js';

const endpointsData = {
    base: "",
    defaults: {
        chat_model: "Vexa",
        image_model: "hd"
    },
    endpoints: {
        "/chat": {
            POST: {
                body: {
                    model: "Vexa",
                    messages: [{ role: "user", content: "Hello" }]
                },
                example: 'POST /chat {"messages":[{"role":"user","content":"Hello"}]}'
            }
        },
        "/image": {
            GET: "/image?q=a+cat",
            GET_2: "/image?q=a+castle&preference=quality",
            POST: {
                body: { prompt: "a cat", preference: "speed" },
                example: 'POST /image {"prompt":"a cat"}'
            }
        },
        "/image/proxy/:id": {
            GET: "/image/proxy/abc123"
        },
        "/query": {
            GET: "/query?q=What+is+AI?",
            POST: {
                body: { prompt: "What is AI?" },
                example: 'POST /query {"prompt":"What is AI?"}'
            }
        },
        "/models": {
            GET: "/models"
        },
        "/health": {
            GET: "/health"
        }
    },
    limits: {
        chat: "20 rpm / 16k",
        image: "10 rpm",
        query: "20 rpm / 4k"
    },
    responses: {
        ok: { success: true },
        error: { success: false, error: "message" }
    }
};

export async function onRequest(ctx) {
    const { request } = ctx;
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
        if (pathname === '/') {
            endpointsData.base = url.origin;
            return Response.json(endpointsData, {
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            });
        } else if (pathname === '/chat') {
            return await chatHandler(ctx);
        } else if (pathname === '/health') {
            return await healthHandler(ctx);
        } else if (pathname === '/image') {
            return await imageHandler(ctx);
        } else if (pathname.startsWith('/image/proxy/')) {
            return await imageProxyHandler(ctx);
        } else if (pathname === '/models') {
            return await modelsHandler(ctx);
        } else if (pathname === '/query') {
            return await queryHandler(ctx);
        } else {
            return await notFoundHandler(ctx);
        }
    } catch {
        return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}