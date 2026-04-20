import { DEFAULT_MODEL } from "../config.js";
import { corsHeaders } from "../lib/utils.js";
import { resolveSource } from "../lib/models.js";
import { completeWithAI } from "../lib/ai.js";

async function run(prompt, model) {
    if (!prompt || !prompt.trim()) {
        return Response.json({ success: false, error: "Missing required parameter: q, query, or prompt" }, { status: 400, headers: corsHeaders() });
    }
    prompt = prompt.trim();
    if (!model) model = DEFAULT_MODEL;
    const t0 = Date.now();
    try {
        const result = await completeWithAI(prompt, null, model);
        const actualModel = result.model || model || "DeepAI";
        return Response.json({ success: true, response: result.text, model: actualModel, elapsed_ms: Date.now() - t0, source: resolveSource(model) }, { status: 200, headers: corsHeaders() });
    } catch (e) {
        return Response.json({ success: false, error: "Upstream request failed", detail: e.message }, { status: 502, headers: corsHeaders() });
    }
}

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method === "GET") {
        const url = new URL(request.url);
        return run(url.searchParams.get("q") || url.searchParams.get("query") || "", url.searchParams.get("model") || "");
    }
    if (request.method === "POST") {
        let body;
        try { body = await request.json(); }
        catch (_) { return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders() }); }
        return run(body.q || body.query || body.prompt || "", body.model || "");
    }
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders() });
}