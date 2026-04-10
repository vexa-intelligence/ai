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
        chat_model: "vexa",
        image_model: "hd",
        query_model: "vexa"
    },
    endpoints: {
        "/chat": {
            POST: {
                body: {
                    model: "vexa",
                    messages: [{ role: "user", content: "Hello" }]
                },
                example: 'POST /chat {"model":"vexa","messages":[{"role":"user","content":"Hello"}]}'
            }
        },
        "/image": {
            GET: "/image?q=a+cat",
            GET_2: "/image?q=a+castle&preference=quality",
            GET_3: "/image?q=a+castle&model=flux",
            POST: {
                body: { prompt: "a cat", model: "hd", preference: "speed" },
                example: 'POST /image {"prompt":"a cat","model":"hd"}'
            },
            models: ["hd", "flux", "turbo-img", "kontext", "seedream", "nanobanana"]
        },
        "/image/proxy/:id": {
            GET: "/image/proxy/abc123"
        },
        "/query": {
            GET: "/query?q=What+is+AI?",
            GET_2: "/query?q=What+is+AI?&model=pol-openai-fast",
            POST: {
                body: { prompt: "What is AI?", model: "vexa" },
                example: 'POST /query {"prompt":"What is AI?","model":"vexa"}'
            }
        },
        "/models": {
            GET: "/models"
        },
        "/health": {
            GET: "/health"
        }
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
        } else if (pathname === '/debug-scrape') {
            try {
                const r = await fetch("https://toolbaz.com/writer/chat-gpt-alternative", {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" }
                });
                const html = await r.text();
                const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
                return Response.json({
                    status: r.status,
                    found_select: !!selectMatch,
                    select_snippet: selectMatch ? selectMatch[1].slice(0, 500) : null,
                    html_length: html.length,
                }, { headers: { "Access-Control-Allow-Origin": "*" } });
            } catch (e) {
                return Response.json({ error: e.message }, { headers: { "Access-Control-Allow-Origin": "*" } });
            }
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