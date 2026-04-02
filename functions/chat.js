const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TOOLBAZ_PAGE_URL = "https://toolbaz.com/writer/chat-gpt-alternative";
const TOKEN_URL = "https://data.toolbaz.com/token.php";
const WRITE_URL = "https://data.toolbaz.com/writing.php";
const DEEPAI_API = "https://api.deepai.org";
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
const DEFAULT_MODEL = "vexa";

const rateLimitStore = new Map();
const modelsCache = { models: new Set(), ts: 0 };

const AIFREE_NONCE_URL = "https://aifreeforever.com/api/chat-nonce";
const AIFREE_ANSWER_URL = "https://aifreeforever.com/api/generate-ai-answer";

async function getAiFreeNonce() {
    const r = await fetch(AIFREE_NONCE_URL, {
        method: "GET",
        headers: { "Referer": "https://aifreeforever.com/", "Origin": "https://aifreeforever.com", "User-Agent": UA },
    });
    if (!r.ok) throw new Error(`Nonce fetch failed: ${r.status}`);
    const j = await r.json();
    return j.nonce || j.data?.nonce || Object.values(j)[0];
}

async function aiFreeComplete(prompt, messages, model) {
    const nonce = await getAiFreeNonce();
    const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const body = {
        question: prompt,
        tone: "friendly",
        format: "paragraph",
        file: null,
        conversationHistory: history,
        aiName: "",
        aiRole: "assistant",
        interactionProof: {
            nonce,
            keystrokeCount: Math.floor(prompt.length * 0.8 + Math.random() * 5),
            typingDuration: Math.floor(prompt.length * 120 + Math.random() * 1000),
            mouseMovements: Math.floor(Math.random() * 20 + 5),
        },
        model,
    };
    const r = await fetch(AIFREE_ANSWER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Referer": "https://aifreeforever.com/",
            "Origin": "https://aifreeforever.com",
            "User-Agent": UA,
        },
        body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`AIFree error ${r.status}`);
    const j = await r.json();
    return j.answer || j.response || j.data?.answer || j.data?.response || JSON.stringify(j);
}

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

function generateTryitKey() {
    const r = String(Math.round(Math.random() * 100_000_000_000));
    const s = "hackers_become_a_little_stinkier_every_time_they_hack";
    function md5(str) {
        function safeAdd(x, y) { const lsw = (x & 0xffff) + (y & 0xffff); return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (lsw & 0xffff); }
        function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
        function md5cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
        function md5ff(a, b, c, d, x, s, t) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
        function md5gg(a, b, c, d, x, s, t) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
        function md5hh(a, b, c, d, x, s, t) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
        function md5ii(a, b, c, d, x, s, t) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }
        const bytes = new TextEncoder().encode(str);
        const len8 = bytes.length;
        const len32 = len8 >> 2;
        const tail = len8 & 3;
        let words = new Int32Array(((len8 + 72) >> 6 << 4) + 16);
        for (let i = 0; i < len32; i++) words[i] = bytes[i * 4] | (bytes[i * 4 + 1] << 8) | (bytes[i * 4 + 2] << 16) | (bytes[i * 4 + 3] << 24);
        let remaining = 0;
        for (let i = 0; i < tail; i++) remaining |= bytes[len32 * 4 + i] << (i * 8);
        words[len32] = remaining | (0x80 << (tail * 8));
        words[words.length - 2] = len8 * 8;
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (let i = 0; i < words.length; i += 16) {
            const [oa, ob, oc, od] = [a, b, c, d];
            a = md5ff(a, b, c, d, words[i], 7, -680876936); d = md5ff(d, a, b, c, words[i + 1], 12, -389564586); c = md5ff(c, d, a, b, words[i + 2], 17, 606105819); b = md5ff(b, c, d, a, words[i + 3], 22, -1044525330);
            a = md5ff(a, b, c, d, words[i + 4], 7, -176418897); d = md5ff(d, a, b, c, words[i + 5], 12, 1200080426); c = md5ff(c, d, a, b, words[i + 6], 17, -1473231341); b = md5ff(b, c, d, a, words[i + 7], 22, -45705983);
            a = md5ff(a, b, c, d, words[i + 8], 7, 1770035416); d = md5ff(d, a, b, c, words[i + 9], 12, -1958414417); c = md5ff(c, d, a, b, words[i + 10], 17, -42063); b = md5ff(b, c, d, a, words[i + 11], 22, -1990404162);
            a = md5ff(a, b, c, d, words[i + 12], 7, 1804603682); d = md5ff(d, a, b, c, words[i + 13], 12, -40341101); c = md5ff(c, d, a, b, words[i + 14], 17, -1502002290); b = md5ff(b, c, d, a, words[i + 15], 22, 1236535329);
            a = md5gg(a, b, c, d, words[i + 1], 5, -165796510); d = md5gg(d, a, b, c, words[i + 6], 9, -1069501632); c = md5gg(c, d, a, b, words[i + 11], 14, 643717713); b = md5gg(b, c, d, a, words[i], 20, -373897302);
            a = md5gg(a, b, c, d, words[i + 5], 5, -701558691); d = md5gg(d, a, b, c, words[i + 10], 9, 38016083); c = md5gg(c, d, a, b, words[i + 15], 14, -660478335); b = md5gg(b, c, d, a, words[i + 4], 20, -405537848);
            a = md5gg(a, b, c, d, words[i + 9], 5, 568446438); d = md5gg(d, a, b, c, words[i + 14], 9, -1019803690); c = md5gg(c, d, a, b, words[i + 3], 14, -187363961); b = md5gg(b, c, d, a, words[i + 8], 20, 1163531501);
            a = md5gg(a, b, c, d, words[i + 13], 5, -1444681467); d = md5gg(d, a, b, c, words[i + 2], 9, -51403784); c = md5gg(c, d, a, b, words[i + 7], 14, 1735328473); b = md5gg(b, c, d, a, words[i + 12], 20, -1926607734);
            a = md5hh(a, b, c, d, words[i + 5], 4, -378558); d = md5hh(d, a, b, c, words[i + 8], 11, -2022574463); c = md5hh(c, d, a, b, words[i + 11], 16, 1839030562); b = md5hh(b, c, d, a, words[i + 14], 23, -35309556);
            a = md5hh(a, b, c, d, words[i + 1], 4, -1530992060); d = md5hh(d, a, b, c, words[i + 4], 11, 1272893353); c = md5hh(c, d, a, b, words[i + 7], 16, -155497632); b = md5hh(b, c, d, a, words[i + 10], 23, -1094730640);
            a = md5hh(a, b, c, d, words[i + 13], 4, 681279174); d = md5hh(d, a, b, c, words[i], 11, -358537222); c = md5hh(c, d, a, b, words[i + 3], 16, -722521979); b = md5hh(b, c, d, a, words[i + 6], 23, 76029189);
            a = md5hh(a, b, c, d, words[i + 9], 4, -640364487); d = md5hh(d, a, b, c, words[i + 12], 11, -421815835); c = md5hh(c, d, a, b, words[i + 15], 16, 530742520); b = md5hh(b, c, d, a, words[i + 2], 23, -995338651);
            a = md5ii(a, b, c, d, words[i], 6, -198630844); d = md5ii(d, a, b, c, words[i + 7], 10, 1126891415); c = md5ii(c, d, a, b, words[i + 14], 15, -1416354905); b = md5ii(b, c, d, a, words[i + 5], 21, -57434055);
            a = md5ii(a, b, c, d, words[i + 12], 6, 1700485571); d = md5ii(d, a, b, c, words[i + 3], 10, -1894986606); c = md5ii(c, d, a, b, words[i + 10], 15, -1051523); b = md5ii(b, c, d, a, words[i + 1], 21, -2054922799);
            a = md5ii(a, b, c, d, words[i + 8], 6, 1873313359); d = md5ii(d, a, b, c, words[i + 15], 10, -30611744); c = md5ii(c, d, a, b, words[i + 6], 15, -1560198380); b = md5ii(b, c, d, a, words[i + 13], 21, 1309151649);
            a = md5ii(a, b, c, d, words[i + 4], 6, -145523070); d = md5ii(d, a, b, c, words[i + 11], 10, -1120210379); c = md5ii(c, d, a, b, words[i + 2], 15, 718787259); b = md5ii(b, c, d, a, words[i + 9], 21, -343485551);
            a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
        }
        return [a, b, c, d].map(n => (n < 0 ? n + 4294967296 : n).toString(16).padStart(8, '0').match(/../g).reverse().join('')).join('');
    }
    const h1 = md5(UA + r + s);
    const h2 = md5(UA + h1);
    const h3 = md5(UA + h2);
    return `tryit-${r}-${h3}`;
}

async function getValidModels() {
    const now = Date.now();
    if (modelsCache.models.size > 0 && now - modelsCache.ts < MODELS_CACHE_TTL) return modelsCache.models;
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } });
        if (!r.ok) return modelsCache.models.size ? modelsCache.models : new Set(["vexa", "toolbaz-v4.5-fast"]);
        const html = await r.text();
        const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
        if (!selectMatch) return modelsCache.models.size ? modelsCache.models : new Set(["vexa", "toolbaz-v4.5-fast"]);
        const models = new Set();
        models.add("vexa");
        models.add("gemini-2.5-flash-lite");
        models.add("gpt-4.1-nano");
        models.add("deepseek-v3.2");
        const seen = new Set(["vexa"]);
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
    return modelsCache.models.size ? modelsCache.models : new Set(["vexa", "toolbaz-v4.5-fast"]);
}

async function vexaComplete(prompt, messages, model = "standard") {
    const apiKey = generateTryitKey();
    const sessionUuid = crypto.randomUUID ? crypto.randomUUID() : randomString(36);
    const chatHistory = JSON.stringify(
        messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
    );
    const formData = new URLSearchParams({
        chat_style: "chat",
        chatHistory,
        model,
        session_uuid: sessionUuid,
        hacker_is_stinky: "very_stinky",
        enabled_tools: JSON.stringify(["image_generator", "image_editor"]),
    });
    const resp = await fetch(`${DEEPAI_API}/hacking_is_a_serious_crime`, {
        method: "POST",
        headers: {
            "api-key": apiKey,
            "User-Agent": UA,
            "Referer": "https://deepai.org/",
            "Origin": "https://deepai.org",
            "Accept": "text/plain, */*",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
    });
    if (!resp.ok) throw new Error(`DeepAI error ${resp.status}`);
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.includes("\u001c")) { full += chunk.split("\u001c")[0]; break; }
        full += chunk;
    }
    return full.trim();
}

async function toolbazComplete(prompt, model) {
    const clientToken = makeClientToken();
    const tokenBody = new URLSearchParams({ session_id: SESSION_ID, token: clientToken });
    const [tr, _models] = await Promise.all([
        fetch(TOKEN_URL, { method: "POST", headers: HDRS, body: tokenBody.toString() }),
        getValidModels(),
    ]);
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
                    model: "vexa",
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
    const totalChars = messages.reduce((sum, m) => sum + (m.content || "").length, 0);
    if (totalChars > MAX_PROMPT_LENGTH) {
        return Response.json({ success: false, error: `Conversation exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }, { status: 400, headers: corsHeaders() });
    }
    const prompt = messagesToPrompt(messages);
    const validModels = await getValidModels();
    if (!validModels.has(model)) model = DEFAULT_MODEL;
    const t0 = Date.now();
    try {
        const DEEPAI_MODELS = new Set(["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"]);
        const deepaiModel = model === "vexa" ? "standard" : model;
        const text = DEEPAI_MODELS.has(model)
            ? await vexaComplete(prompt, messages, deepaiModel)
            : model === "gpt-5"
                ? await aiFreeComplete(lastUserMsg, messages, model)
                : await toolbazComplete(prompt, model);
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