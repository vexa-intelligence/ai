const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TOOLBAZ_PAGE_URL = "https://toolbaz.com/writer/chat-gpt-alternative";
const TOKEN_URL = "https://data.toolbaz.com/token.php";
const DEEPAI_URL = "https://api.deepai.org/api/text2img";
const DEEPAI_API = "https://api.deepai.org";
const AIFREE_NONCE_URL = "https://aifreeforever.com/api/chat-nonce";
const AIFREE_ANSWER_URL = "https://aifreeforever.com/api/generate-ai-answer";
const WRITE_URL = "https://data.toolbaz.com/writing.php";
const SESSION_ID = "yz3SJSGvR1ih8w5vfOmk9Fpd87iSGfUos54s";
const HDRS = {
    "Referer": TOOLBAZ_PAGE_URL,
    "Origin": "https://toolbaz.com",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "User-Agent": UA,
};
const POST_HDRS = {
    "User-Agent": UA,
    "Referer": TOOLBAZ_PAGE_URL,
    "Origin": "https://toolbaz.com",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept-Language": "en-US,en;q=0.9",
};
const HEALTH_PROBE = "Hi";
const DEEPAI_MODELS = new Set(["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"]);
const AIFREE_MODELS = new Set(["gpt-5"]);

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
    return randomString(6) + btoa(JSON.stringify(obj));
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

async function fetchAvailableModels() {
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } });
        if (!r.ok) return ["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"];
        const html = await r.text();
        const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
        if (!selectMatch) return ["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"];
        const models = ["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"];
        const seen = new Set(models);
        for (const m of selectMatch[1].matchAll(/<option[^>]*\bvalue=["']?([^"'>\s]+)["']?/gi)) {
            const val = m[1].trim();
            if (val && !seen.has(val)) { seen.add(val); models.push(val); }
        }
        return models;
    } catch (_) {
        return ["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"];
    }
}

async function probeVexa(model) {
    const apiKey = generateTryitKey();
    const sessionUuid = crypto.randomUUID ? crypto.randomUUID() : randomString(36);
    const deepaiModel = model === "vexa" ? "standard" : model;
    const chatHistory = JSON.stringify([{ role: "user", content: HEALTH_PROBE }]);
    const formData = new URLSearchParams({
        chat_style: "chat",
        chatHistory,
        model: deepaiModel,
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
        if (full.trim().length > 0) break;
    }
    if (!full.trim()) throw new Error("Empty response");
}

async function probeAiFree(model) {
    const r = await fetch(AIFREE_NONCE_URL, {
        method: "GET",
        headers: { "Referer": "https://aifreeforever.com/", "Origin": "https://aifreeforever.com", "User-Agent": UA },
    });
    if (!r.ok) throw new Error(`Nonce fetch failed: ${r.status}`);
    const j = await r.json();
    const nonce = j.nonce || j.data?.nonce || Object.values(j)[0];
    const body = {
        question: HEALTH_PROBE,
        tone: "friendly",
        format: "paragraph",
        file: null,
        conversationHistory: [],
        aiName: "",
        aiRole: "assistant",
        interactionProof: {
            nonce,
            keystrokeCount: 2,
            typingDuration: 240,
            mouseMovements: 5,
        },
        model,
    };
    const res = await fetch(AIFREE_ANSWER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Referer": "https://aifreeforever.com/",
            "Origin": "https://aifreeforever.com",
            "User-Agent": UA,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`AIFree error ${res.status}`);
    const jj = await res.json();
    const text = jj.answer || jj.response || jj.data?.answer || jj.data?.response || "";
    if (!text.trim()) throw new Error("Empty response");
}

async function probeToolbaz(model) {
    const clientToken = makeClientToken();
    const tokenBody = new URLSearchParams({ session_id: SESSION_ID, token: clientToken });
    const tr = await fetch(TOKEN_URL, { method: "POST", headers: POST_HDRS, body: tokenBody.toString() });
    const tj = await tr.json();
    const capcha = tj.token || "";
    if (!capcha) throw new Error("Failed to obtain capcha token");
    const writeBody = new URLSearchParams({ text: HEALTH_PROBE, capcha, model, session_id: SESSION_ID });
    const wr = await fetch(WRITE_URL, {
        method: "POST",
        headers: { ...HDRS, Accept: "text/event-stream,*/*" },
        body: writeBody.toString(),
    });
    if (!wr.ok) throw new Error(`Upstream error ${wr.status}`);
    const text = await wr.text();
    if (text.toLowerCase().includes("capcha") || text.toLowerCase().includes("expired")) {
        throw new Error(`Rejected: ${text.slice(0, 100)}`);
    }
    if (!text.trim()) throw new Error("Empty response");
}

async function checkModel(model) {
    const t0 = Date.now();
    try {
        if (DEEPAI_MODELS.has(model)) {
            await probeVexa(model);
        } else if (AIFREE_MODELS.has(model)) {
            await probeAiFree(model);
        } else {
            await probeToolbaz(model);
        }
        return { ok: true, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { ok: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

async function checkPage() {
    const t0 = Date.now();
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } });
        return { reachable: r.ok, status_code: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

async function checkToken() {
    const t0 = Date.now();
    const sid = randomString(32);
    try {
        const body = new URLSearchParams({ session_id: sid, token: makeClientToken() });
        const r = await fetch(TOKEN_URL, { method: "POST", headers: POST_HDRS, body: body.toString() });
        const ok = r.ok;
        let token = "";
        if (ok) {
            try { token = (await r.json()).token || ""; } catch (_) { }
        }
        return { reachable: ok, token_received: Boolean(token), status_code: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, token_received: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

async function checkImage() {
    const t0 = Date.now();
    try {
        const r = await fetch(DEEPAI_URL, {
            method: "HEAD",
            headers: { "User-Agent": UA, "Origin": "https://deepai.org" },
        });
        return { reachable: r.status < 500, status_code: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    };
}

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "GET") {
        return Response.json({ success: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders() });
    }

    const tStart = Date.now();
    const allModels = await fetchAvailableModels();

    const [page, token, image, ...modelResults] = await Promise.all([
        checkPage(),
        checkToken(),
        checkImage(),
        ...allModels.map(m => checkModel(m)),
    ]);

    const models = {};
    for (let i = 0; i < allModels.length; i++) {
        models[allModels[i]] = modelResults[i];
    }

    const failedModels = allModels.filter((m, i) => !modelResults[i].ok);
    const allModelsOk = failedModels.length === 0;
    const overall = page.reachable && token.reachable && token.token_received && image.reachable && allModelsOk;

    return Response.json({
        success: true,
        status: overall ? "ok" : "degraded",
        timestamp: Math.floor(Date.now() / 1000),
        total_ms: Date.now() - tStart,
        checks: {
            page,
            token,
            image,
            models,
        },
        ...(failedModels.length > 0 && { failed_models: failedModels }),
    }, { status: 200, headers: corsHeaders() });
}