const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TOOLBAZ_PAGE_URL = "https://toolbaz.com/writer/chat-gpt-alternative";
const TOKEN_URL = "https://data.toolbaz.com/token.php";
const WRITE_URL = "https://data.toolbaz.com/writing.php";
const SESSION_ID = "yz3SJSGvR1ih8w5vfOmk9Fpd87iSGfUos54s";
const HDRS = {
    "Referer": TOOLBAZ_PAGE_URL,
    "Origin": "https://toolbaz.com",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent": UA,
};

const MAX_PROMPT_LENGTH = 16000;
const MAX_REQUESTS = 20;
const RATE_WINDOW = 60000;
const MODELS_CACHE_TTL = 300000;
const DEFAULT_MODEL = "toolbaz-v4.5-fast";

const rateLimitStore = new Map();
const modelsCache = { models: new Set(), ts: 0 };

function randomString(n) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}

function makeClientToken() {
    const obj = {
        bR6wF: { nV5kP: UA, lQ9jX: "en-US", sD2zR: "1920x1080", tY4hL: "America/New_York", pL8mC: "Win32", cQ3vD: 24, hK7jN: 8 },
        uT4bX: { mM9wZ: [], kP8jY: [] },
        tuTcS: Math.floor(Date.now() / 1000),
        tDfxy: null,
        RtyJt: randomString(36),
    };
    const b64 = btoa(JSON.stringify(obj));
    return randomString(6) + b64;
}

async function getValidModels() {
    const now = Date.now();
    if (modelsCache.models.size > 0 && now - modelsCache.ts < MODELS_CACHE_TTL) return modelsCache.models;
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } });
        if (!r.ok) return modelsCache.models.size ? modelsCache.models : new Set([DEFAULT_MODEL]);
        const html = await r.text();
        const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
        if (!selectMatch) return modelsCache.models.size ? modelsCache.models : new Set([DEFAULT_MODEL]);
        const models = new Set();
        const seen = new Set();
        for (const m of selectMatch[1].matchAll(/<option[^>]*\bvalue=["']?([^"'>\s]+)["']?/gi)) {
            const val = m[1].trim();
            if (val && !seen.has(val)) { seen.add(val); models.add(val); }
        }
        if (models.size) {
            modelsCache.models = models;
            modelsCache.ts = now;
            return models;
        }
    } catch (_) { }
    return modelsCache.models.size ? modelsCache.models : new Set([DEFAULT_MODEL]);
}

async function toolbazComplete(prompt, model) {
    const clientToken = makeClientToken();
    const tokenBody = new URLSearchParams({ session_id: SESSION_ID, token: clientToken });
    const tr = await fetch(TOKEN_URL, { method: "POST", headers: HDRS, body: tokenBody.toString() });
    tr.raise_for_status?.();
    const tj = await tr.json();
    const capcha = tj.token || "";
    if (!capcha) throw new Error("Failed to obtain capcha token");
    const writeBody = new URLSearchParams({ text: prompt, capcha, model, session_id: SESSION_ID });
    const wr = await fetch(WRITE_URL, {
        method: "POST",
        headers: { ...HDRS, Accept: "text/event-stream,*/*" },
        body: writeBody.toString(),
    });
    if (!wr.ok) throw new Error(`Upstream error ${wr.status}`);
    const text = await wr.text();
    if (text.toLowerCase().includes("capcha") || text.toLowerCase().includes("expired")) {
        throw new Error(`Toolbaz rejected request: ${text.slice(0, 200)}`);
    }
    return text.trim();
}

function messagesToPrompt(messages) {
    const parts = messages.map(m => {
        const role = m.role || "user";
        const content = (m.content || "").trim();
        if (role === "system") return `[System]: ${content}`;
        if (role === "assistant") return `Assistant: ${content}`;
        return `User: ${content}`;
    });
    parts.push("Assistant:");
    return parts.join("\n\n");
}

function isRateLimited(ip) {
    const now = Date.now();
    if (!rateLimitStore.has(ip)) rateLimitStore.set(ip, []);
    const times = rateLimitStore.get(ip).filter(t => now - t < RATE_WINDOW);
    rateLimitStore.set(ip, times);
    if (times.length >= MAX_REQUESTS) return true;
    times.push(now);
    return false;
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    };
}

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method === "GET") {
        return Response.json({
            success: false,
            error: "GET not supported on /chat",
            reason: "This endpoint requires a POST request with a JSON body containing a 'messages' array.",
            frontend_only: true,
            how_to_use: {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: {
                    model: "toolbaz-v4.5-fast",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: "Your message here" },
                    ],
                },
            },
        }, { status: 405, headers: corsHeaders() });
    }
    if (request.method !== "POST") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders() });
    }
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (isRateLimited(ip)) {
        return Response.json({ success: false, error: "Rate limit exceeded. Try again shortly." }, { status: 429, headers: corsHeaders() });
    }
    let body;
    try { body = await request.json(); }
    catch (_) { return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders() }); }
    const messages = body.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return Response.json({ success: false, error: "Missing or empty 'messages' array" }, { status: 400, headers: corsHeaders() });
    }
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (typeof msg !== "object" || msg === null) {
            return Response.json({ success: false, error: `messages[${i}] must be an object` }, { status: 400, headers: corsHeaders() });
        }
        if (!["system", "user", "assistant"].includes(msg.role)) {
            return Response.json({ success: false, error: `messages[${i}].role must be 'system', 'user', or 'assistant'` }, { status: 400, headers: corsHeaders() });
        }
        if (typeof (msg.content ?? "") !== "string") {
            return Response.json({ success: false, error: `messages[${i}].content must be a string` }, { status: 400, headers: corsHeaders() });
        }
    }
    let model = body.model || DEFAULT_MODEL;
    const validModels = await getValidModels();
    if (!validModels.has(model)) model = DEFAULT_MODEL;
    const totalChars = messages.reduce((sum, m) => sum + (m.content || "").length, 0);
    if (totalChars > MAX_PROMPT_LENGTH) {
        return Response.json({ success: false, error: `Conversation exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }, { status: 400, headers: corsHeaders() });
    }
    const prompt = messagesToPrompt(messages);
    const t0 = Date.now();
    try {
        const text = await toolbazComplete(prompt, model);
        return Response.json({
            success: true,
            message: { role: "assistant", content: text },
            model,
            elapsed_ms: Date.now() - t0,
            prompt_chars: totalChars,
        }, { status: 200, headers: corsHeaders() });
    } catch (e) {
        return Response.json({ success: false, error: `Upstream request failed: ${e.message}` }, { status: 502, headers: corsHeaders() });
    }
}