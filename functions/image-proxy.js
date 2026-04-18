import { proxyCache } from "./image.js";

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }
    if (request.method !== "GET") {
        return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const id = parts[parts.length - 1];
    if (!id) {
        return new Response(JSON.stringify({ success: false, error: "Missing proxy ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
    const upstreamUrl = proxyCache.get(id);
    if (!upstreamUrl) {
        return new Response(JSON.stringify({ success: false, error: "Proxy ID not found or expired" }), {
            status: 404,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
    try {
        const upstream = await fetch(upstreamUrl);
        if (!upstream.ok) {
            return new Response(JSON.stringify({ success: false, error: `Upstream error: ${upstream.status}` }), {
                status: 502,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
        const contentType = upstream.headers.get("Content-Type") || "image/jpeg";
        return new Response(upstream.body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: `Proxy fetch failed: ${e.message}` }), {
            status: 502,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
}