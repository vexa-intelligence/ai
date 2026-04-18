import { DEFAULT_IMAGE_MODEL, DEFAULT_IMAGE_PREFERENCE } from "../config.js";
import { corsHeaders } from "../lib/utils.js";
import { resolveImageSource } from "../lib/models.js";
import { generateImage } from "../lib/ai.js";
import { proxyCache, makeProxyId } from "../lib/crypto.js";

export { proxyCache };

function parseGet(url) {
    const sp = url.searchParams;
    return {
        prompt: sp.get("q") || sp.get("prompt") || null,
        model: sp.get("model") || DEFAULT_IMAGE_MODEL,
        preference: sp.get("preference") || DEFAULT_IMAGE_PREFERENCE,
    };
}

async function parsePost(request) {
    let body;
    try { body = await request.json(); }
    catch (_) { return null; }
    return {
        prompt: body.prompt || body.q || null,
        model: body.model || DEFAULT_IMAGE_MODEL,
        preference: body.preference || DEFAULT_IMAGE_PREFERENCE,
    };
}

async function run(args, baseUrl) {
    const { prompt, model, preference } = args;
    if (!prompt || !String(prompt).trim()) {
        return Response.json({ success: false, error: "Missing required parameter: q or prompt" }, { status: 400, headers: corsHeaders() });
    }
    const t0 = Date.now();
    let upstreamUrl;
    try {
        upstreamUrl = await generateImage(String(prompt).trim().slice(0, 1000), model, preference);
    } catch (e) {
        return Response.json({ success: false, error: `Generation failed: ${e.message}` }, { status: 502, headers: corsHeaders() });
    }
    const proxyId = await makeProxyId(upstreamUrl);
    const proxyUrl = `${baseUrl}/image/proxy/${proxyId}`;
    return Response.json({
        success: true,
        prompt: String(prompt).trim().slice(0, 1000),
        model,
        ...(model !== "flux" && model !== "turbo" && model !== "kontext" && model !== "seedream" && model !== "nanobanana" && { preference }),
        proxy_url: proxyUrl,
        source: resolveImageSource(model),
        elapsed_ms: Date.now() - t0,
    }, { status: 200, headers: corsHeaders() });
}

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    if (request.method === "GET") return run(parseGet(url), baseUrl);
    if (request.method === "POST") {
        const args = await parsePost(request);
        if (!args) return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders() });
        return run(args, baseUrl);
    }
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders() });
}