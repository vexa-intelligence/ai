import { DEFAULT_MODEL } from "../config.js";
import { corsHeaders, corsHeadersStream } from "../lib/utils.js";
import { completeWithAIStream } from "../lib/ai.js";
import { resolveSource } from "../lib/models.js";

const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 32000;
const MAX_TOTAL_CHARS = 200000;

function validateMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0)
        return "Missing or empty 'messages' array";
    if (messages.length > MAX_MESSAGES)
        return `Too many messages: max is ${MAX_MESSAGES}`;
    let totalChars = 0;
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (typeof msg !== "object" || msg === null)
            return `messages[${i}] must be an object`;
        if (!["system", "user", "assistant"].includes(msg.role))
            return `messages[${i}].role must be 'system', 'user', or 'assistant'`;
        if (typeof msg.content !== "string" || msg.content.trim() === "")
            return `messages[${i}].content must be a non-empty string`;
        if (msg.content.length > MAX_CONTENT_LENGTH)
            return `messages[${i}].content exceeds max length of ${MAX_CONTENT_LENGTH}`;
        totalChars += msg.content.length;
    }
    if (totalChars > MAX_TOTAL_CHARS)
        return `Total message content exceeds max of ${MAX_TOTAL_CHARS} characters`;
    if (!messages.some(m => m.role === "user"))
        return "At least one message with role 'user' is required";
    return null;
}

function sseError(message) {
    return `data: ${JSON.stringify({ error: { message }, finish_reason: "error" })}\n\n`;
}

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders("POST, OPTIONS") });
    }
    if (request.method === "GET") {
        return Response.json({
            success: false,
            error: "GET not supported on /chat",
            reason: "This endpoint requires a POST request with a JSON body containing a 'messages' array.",
            how_to_use: {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: {
                    model: DEFAULT_MODEL,
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: "Your message here" },
                    ],
                },
            },
        }, { status: 405, headers: corsHeaders("POST, OPTIONS") });
    }
    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders("POST, OPTIONS") });
    }
    let body;
    try { body = await request.json(); }
    catch (_) { return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders("POST, OPTIONS") }); }
    const validationError = validateMessages(body.messages);
    if (validationError) {
        return Response.json({ success: false, error: validationError }, { status: 400, headers: corsHeaders("POST, OPTIONS") });
    }
    const messages = body.messages;
    const model = body.model || DEFAULT_MODEL;
    const lastUserMsg = messages.filter(m => m.role === "user").at(-1).content;
    const t0 = Date.now();
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);

    try {
        const encoder = new TextEncoder();
        let actualModel = model;
        let fullResponse = "";

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    await completeWithAIStream(lastUserMsg, messages, model, (chunk, chunkModel) => {
                        fullResponse += chunk;
                        if (chunkModel) actualModel = chunkModel;
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk }, finish_reason: null }] })}\n\n`));
                    });

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        choices: [{ delta: {}, finish_reason: "stop" }],
                        metadata: { model: actualModel, source: resolveSource(actualModel) }
                    })}\n\n`));
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                } catch (error) {
                    controller.enqueue(encoder.encode(sseError(error.message)));
                } finally {
                    controller.close();
                }
            }
        });
        return new Response(readable, { status: 200, headers: corsHeadersStream() });
    } catch (e) {
        return Response.json({ success: false, error: `Upstream request failed: ${e.message}` }, { status: 502, headers: corsHeaders("POST, OPTIONS") });
    }
}