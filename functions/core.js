export {
    UA, API_URLS, MODEL_SETS, MODEL_MAPPINGS, PRIORITY_MODELS, DEEPAI_MODEL_OVERRIDES,
    IMAGE_MODELS, IMAGE_PREFERENCES, DEFAULT_IMAGE_MODEL, DEFAULT_IMAGE_PREFERENCE,
    POLLINATIONS_TEXT_MODELS_LIST, DEFAULT_MODEL, CACHE_SETTINGS, HEALTH_SETTINGS,
    PROVIDER_SETTINGS, REQUEST_HEADERS, SECURITY_CONSTANTS, API_KEYS, FORM_TEMPLATES,
    TEMPERATURE_SETTINGS, IMAGE_GENERATION,
} from "./config.js";

import {
    UA, API_URLS, MODEL_SETS, MODEL_MAPPINGS, PRIORITY_MODELS, DEEPAI_MODEL_OVERRIDES,
    IMAGE_MODELS, IMAGE_PREFERENCES, DEFAULT_IMAGE_MODEL, DEFAULT_IMAGE_PREFERENCE,
    POLLINATIONS_TEXT_MODELS_LIST, DEFAULT_MODEL, CACHE_SETTINGS, HEALTH_SETTINGS,
    PROVIDER_SETTINGS, REQUEST_HEADERS, SECURITY_CONSTANTS, API_KEYS, FORM_TEMPLATES,
    TEMPERATURE_SETTINGS, IMAGE_GENERATION,
} from "./config.js";

const { POLLINATIONS_MODELS, DOLPHIN_MODELS, DEEPAI_MODELS, TALKAI_MODELS, DEEPAI_IMAGE_MODELS, POLLINATIONS_IMAGE_MODELS } = MODEL_SETS;
const { DOLPHIN_TEMPLATE_MAP, TALKAI_MODEL_IDS } = MODEL_MAPPINGS;
const { TOOLBAZ_PAGE_URL, TOKEN_URL, DEEPAI_API, DEEPAI_CHAT_URL, DEEPAI_IMAGE_URL, POLLINATIONS_URL, POLLINATIONS_IMAGE_URL, DOLPHIN_URL, TALKAI_URL, AIFREE_NONCE_URL, AIFREE_ANSWER_URL } = API_URLS;
const { MODELS_CACHE_TTL } = CACHE_SETTINGS;
const { HEALTH_PROBE } = HEALTH_SETTINGS;
const POST_HDRS = REQUEST_HEADERS.POST_HDRS;

export { POLLINATIONS_MODELS, DOLPHIN_MODELS, DEEPAI_MODELS, TALKAI_MODELS, DEEPAI_IMAGE_MODELS, POLLINATIONS_IMAGE_MODELS };
export { DOLPHIN_TEMPLATE_MAP, TALKAI_MODEL_IDS };
export { POST_HDRS, HEALTH_PROBE };

export const proxyCache = new Map();

export function isModelEnabled(model) {
    if (TALKAI_MODELS.has(model)) return PROVIDER_SETTINGS.talkai;
    if (DOLPHIN_MODELS.has(model)) return PROVIDER_SETTINGS.dolphin;
    if (POLLINATIONS_MODELS.has(model)) return PROVIDER_SETTINGS.pollinations;
    if (DEEPAI_MODELS.has(model) || model === "vexa") return PROVIDER_SETTINGS.deepai;
    if (model === "gpt-5") return PROVIDER_SETTINGS.aifree;
    return PROVIDER_SETTINGS.toolbaz;
}

export function isImageModelEnabled(model) {
    if (DEEPAI_IMAGE_MODELS.has(model)) return PROVIDER_SETTINGS.deepai;
    if (POLLINATIONS_IMAGE_MODELS.has(model)) return PROVIDER_SETTINGS.pollinations;
    return false;
}

export function getEnabledPriorityModels() {
    return PRIORITY_MODELS.filter(model => isModelEnabled(model));
}

const _modelsCache = { textModels: {}, deepaiModels: new Set(), toolbazModels: new Set(), ts: 0 };

export async function refreshModelsCache() {
    const now = Date.now();
    if (_modelsCache.textModels && Object.keys(_modelsCache.textModels).length > 0 && now - _modelsCache.ts < MODELS_CACHE_TTL) {
        return _modelsCache;
    }
    const [tbRes, deepaiKeys] = await Promise.all([
        fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } }).catch(() => null),
        scrapeDeepAIFreeModels(),
    ]);
    const toolbazRaw = tbRes?.ok ? scrapeToolbazModels(await tbRes.text()) : {};
    const toolbazSet = new Set(["vexa", ...Object.keys(toolbazRaw)]);
    const textModels = {};
    for (const key of deepaiKeys) {
        textModels[key] = key in DEEPAI_MODEL_OVERRIDES
            ? DEEPAI_MODEL_OVERRIDES[key]
            : { label: key, provider: "DeepAI", speed: 0, quality: 0 };
    }
    for (const [key, val] of Object.entries(toolbazRaw)) {
        if (!(key in textModels)) textModels[key] = val;
    }
    for (const pm of POLLINATIONS_TEXT_MODELS_LIST) {
        textModels[pm.key] = { label: pm.label, provider: pm.provider, speed: pm.speed, quality: pm.quality };
    }
    _modelsCache.textModels = textModels;
    _modelsCache.deepaiModels = deepaiKeys;
    _modelsCache.toolbazModels = toolbazSet;
    _modelsCache.ts = now;
    return _modelsCache;
}

export async function getAllEnabledModels() {
    const c = await refreshModelsCache();
    const filteredTextModels = {};
    for (const [key, model] of Object.entries(c.textModels)) {
        if (isModelEnabled(key)) filteredTextModels[key] = model;
    }
    return {
        textModels: filteredTextModels,
        imageModels: IMAGE_MODELS.filter(m => isImageModelEnabled(m.name)),
    };
}

export async function getValidModels() {
    const c = await refreshModelsCache();
    return { toolbaz: c.toolbazModels, deepai: c.deepaiModels };
}

export function randomString(n) {
    const chars = SECURITY_CONSTANTS.RANDOM_STRING_CHARS;
    let s = "";
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}

export async function reversedMd5(str) {
    const encoded = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("MD5", encoded);

    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .split("")
        .reverse()
        .join("");
}

export function makeClientToken() {
    const obj = {
        bR6wF: { nV5kP: UA, lQ9jX: "en-US", sD2zR: "1920x1080", tY4hL: "America/New_York", pL8mC: "Win32", cQ3vD: 24, hK7jN: 8 },
        uT4bX: { mM9wZ: [], kP8jY: [] },
        tuTcS: Math.floor(Date.now() / 1000),
        tDfxy: null,
        RtyJt: randomString(36),
    };
    return randomString(6) + btoa(JSON.stringify(obj));
}

export async function generateImageKey() {
    const rnd = String(Math.round(Math.random() * 100000000000));
    const h1 = await reversedMd5(UA + rnd + SECURITY_CONSTANTS.HACKER_SECRET);
    const h2 = await reversedMd5(UA + h1);
    const h3 = await reversedMd5(UA + h2);
    return `tryit-${rnd}-${h3}`;
}

export function buildDeepAIImageBody(prompt, modelVer, prefKey) {
    const boundary = API_KEYS.DEEPAI_IMAGE_BOUNDARY;
    const fields = { text: prompt, image_generator_version: modelVer, generation_source: "img" };
    if (prefKey === "turbo") fields.turbo = "true";
    else fields.quality = "true";
    let body = "";
    for (const [name, val] of Object.entries(fields)) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`;
    }
    body += `--${boundary}--\r\n`;
    return { boundary, body: new TextEncoder().encode(body) };
}

export async function callDeepAIImage(prompt, modelVer, prefKey) {
    const { boundary, body } = buildDeepAIImageBody(prompt, modelVer, prefKey);
    const key = await generateImageKey();
    const res = await fetch(DEEPAI_IMAGE_URL, {
        method: "POST",
        headers: {
            "api-key": key,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "User-Agent": UA,
            "Origin": "https://deepai.org",
            "Referer": "https://deepai.org/machine-learning-model/text2img",
        },
        body,
    });
    const data = await res.json();
    if (!data.output_url) throw new Error(data.err || data.status || data.error || JSON.stringify(data));
    return data.output_url;
}

export async function callPollinationsImage(prompt, model) {
    const polModel = model === "turbo-img" ? "turbo" : model;
    const seed = Math.floor(Math.random() * IMAGE_GENERATION.SEED_RANGE);
    const url = `${POLLINATIONS_IMAGE_URL}${encodeURIComponent(prompt)}?model=${polModel}&width=${IMAGE_GENERATION.DEFAULT_WIDTH}&height=${IMAGE_GENERATION.DEFAULT_HEIGHT}&nologo=true&private=true&seed=${seed}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`Pollinations error ${res.status}`);
    return url;
}

export function unescapeHtml(str) {
    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

export function labelToKey(label) {
    return label
        .toLowerCase()
        .replace(/\binstruct\b/gi, "")
        .replace(/\binstant\b/gi, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/[^a-z0-9.-]/g, "")
        .replace(/-$/g, "");
}

export function parseChunk(chunk) {
    chunk = chunk.trim();
    if (!chunk || chunk === "[DONE]") return "";
    try { return JSON.parse(chunk).choices[0].delta?.content || ""; }
    catch (_) { return chunk; }
}

export function parseFull(raw) {
    raw = raw.replace(/\[model:[^\]]*\]/g, "").trim();
    if (raw.trimStart().startsWith("data:")) {
        const parts = raw.split("\n").filter(l => l.startsWith("data:")).map(l => parseChunk(l.slice(5)));
        const text = parts.join("").trim();
        if (text) return text;
    }
    try {
        const obj = JSON.parse(raw);
        if (typeof obj === "object" && obj) {
            for (const k of ["result", "text", "content", "output", "message", "response", "data"]) {
                if (obj[k]) return String(obj[k]).trim();
            }
        }
    } catch (_) { }
    return raw.replace(/<[^>]+>/g, "").trim();
}

export function messagesToPrompt(messages) {
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    const rest = messages.filter(m => m.role !== "system");
    const parts = rest.map((m, i) => {
        const role = m.role || "user";
        const content = (m.content || "").trim();
        const prefix = i === 0 && systemMsg ? `${systemMsg}\n\n` : "";
        if (role === "assistant") return `Assistant: ${content}`;
        return `User: ${prefix}${content}`;
    });
    parts.push("Assistant:");
    return parts.join("\n\n");
}

export function corsHeaders(methods = "GET, POST, OPTIONS") {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": methods,
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    };
}

export function corsHeadersStream() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    };
}

export async function getAiFreeNonce() {
    const r = await fetch(AIFREE_NONCE_URL, {
        method: "GET",
        headers: { "Referer": "https://aifreeforever.com/", "Origin": "https://aifreeforever.com", "User-Agent": UA },
    });
    if (!r.ok) throw new Error(`Nonce fetch failed: ${r.status}`);
    const j = await r.json();
    return j.nonce || j.data?.nonce || Object.values(j)[0];
}

export async function aiFreeComplete(prompt, messages, model) {
    const nonce = await getAiFreeNonce();
    const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
    const body = {
        question: prompt,
        tone: FORM_TEMPLATES.AIFREE_TONE,
        format: FORM_TEMPLATES.AIFREE_FORMAT,
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
        headers: { "Content-Type": "application/json", "Referer": "https://aifreeforever.com/", "Origin": "https://aifreeforever.com", "User-Agent": UA },
        body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`AIFree error ${r.status}`);
    const j = await r.json();
    return j.answer || j.response || j.data?.answer || j.data?.response || JSON.stringify(j);
}

export async function vexaComplete(prompt, messages, model = "standard") {
    const apiKey = await generateImageKey();
    const sessionUuid = crypto.randomUUID ? crypto.randomUUID() : randomString(36);
    const chatHistory = JSON.stringify(
        messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }))
    );
    const formData = new URLSearchParams({
        chat_style: FORM_TEMPLATES.VEXA_CHAT_STYLE,
        chatHistory,
        model,
        session_uuid: sessionUuid,
        hacker_is_stinky: "very_stinky",
        enabled_tools: FORM_TEMPLATES.VEXA_ENABLED_TOOLS,
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

export async function pollinationsComplete(messages, model) {
    const polModel = model.replace(/^pol-/, "");
    const r = await fetch(POLLINATIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({ model: polModel, messages, temperature: TEMPERATURE_SETTINGS.DEFAULT, stream: false, private: true }),
    });
    if (!r.ok) throw new Error(`Pollinations error ${r.status}`);
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || "").trim();
}

export async function dolphinComplete(prompt, model) {
    const template = DOLPHIN_TEMPLATE_MAP[model] || "logical";
    const r = await fetch(DOLPHIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA, "Referer": "https://chat.dphn.ai/", "Origin": "https://chat.dphn.ai" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "dolphinserver:24B", template }),
    });
    if (!r.ok) throw new Error(`Dolphin error ${r.status}`);
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buf = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
            const t = line.trim();
            if (!t || t === "data: [DONE]") continue;
            if (t.startsWith("data: ")) {
                try { const obj = JSON.parse(t.slice(6)); const c = obj.choices?.[0]?.delta?.content; if (c) full += c; } catch (_) { }
            }
        }
    }
    if (buf.trim().startsWith("data: ")) {
        try { const obj = JSON.parse(buf.trim().slice(6)); const c = obj.choices?.[0]?.delta?.content; if (c) full += c; } catch (_) { }
    }
    return full.trim();
}



export function resolveSource(model) {
    if (TALKAI_MODELS.has(model)) return "talkai.info";
    if (DOLPHIN_MODELS.has(model)) return "dphn.ai";
    if (POLLINATIONS_MODELS.has(model)) return "pollinations.ai";
    if (DEEPAI_MODELS.has(model) || model === "vexa") return "deepai.org";
    if (model === "gpt-5") return "aifreeforever.com";
    return "toolbaz.com";
}

export function resolveModelRoute(model, toolbazModels, deepaiModels) {
    if (TALKAI_MODELS.has(model) && PROVIDER_SETTINGS.talkai) return "talkai";
    if (DOLPHIN_MODELS.has(model) && PROVIDER_SETTINGS.dolphin) return "dolphin";
    if (POLLINATIONS_MODELS.has(model) && PROVIDER_SETTINGS.pollinations) return "pollinations";
    if ((DEEPAI_MODELS.has(model) || (deepaiModels && deepaiModels.has(model)) || model === "vexa") && PROVIDER_SETTINGS.deepai) return "deepai";
    if (model === "gpt-5" && PROVIDER_SETTINGS.aifree) return "aifree";
    if (toolbazModels && toolbazModels.has(model) && PROVIDER_SETTINGS.toolbaz) return "toolbaz";
    return "toolbaz";
}

export function resolveDeepAIModel(model) {
    return model === "vexa" ? "standard" : model;
}

export function resolveImageRoute(model) {
    if (POLLINATIONS_IMAGE_MODELS.has(model)) return "pollinations";
    if (DEEPAI_IMAGE_MODELS.has(model)) return "deepai";
    return null;
}

export function resolveImageSource(model) {
    return POLLINATIONS_IMAGE_MODELS.has(model) ? "pollinations.ai" : "deepai.org";
}

export function resolveImagePrefKey(preference) {
    return IMAGE_PREFERENCES[preference] || null;
}

export function validImageModels() {
    return [...DEEPAI_IMAGE_MODELS, ...POLLINATIONS_IMAGE_MODELS].join(", ");
}

export function scrapeToolbazModels(html) {
    const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
    if (!selectMatch) return {};
    const block = selectMatch[1];
    const valueToLabel = {};
    const keys = [];
    const seen = new Set();
    for (const m of block.matchAll(/<option[^>]*\bvalue=["']?([^"'\s>]+)[^>]*>\s*([^\n<]+)/gi)) {
        const val = unescapeHtml(m[1].trim());
        const label = unescapeHtml(m[2].trim());
        if (val && !seen.has(val)) { keys.push(val); seen.add(val); valueToLabel[val] = label; }
    }
    const providerMap = {};
    const segments = html.split(/(By\s+[^\n<]{2,60})/);
    let currentProvider = "";
    for (const seg of segments) {
        const by = seg.match(/^By\s+(.+)/);
        if (by) {
            currentProvider = by[1].replace(/[^\w\s()]/g, "").trim();
        } else {
            for (const m of seg.matchAll(/data-value=(?:["']?)([^"'>\s]+)/gi)) {
                if (!providerMap[m[1].trim()]) providerMap[m[1].trim()] = currentProvider;
            }
        }
    }
    const dvPositions = [...html.matchAll(/data-value=(?:["']?)([^"'>\s]+)/gi)].map(m => ({ start: m.index, val: m[1] }));
    const speedMap = {};
    const qualityMap = {};
    dvPositions.forEach(({ start, val }, i) => {
        const end = i + 1 < dvPositions.length ? dvPositions[i + 1].start : start + 2000;
        const window = html.slice(start, end);
        const spd = window.match(/(\d+)\s*W\/s/);
        const qlt = window.match(/quality-indicator[^>]*>(?:\s*<[^>]+>)*\s*(\d+)/);
        if (spd) speedMap[val] = parseInt(spd[1]);
        if (qlt) qualityMap[val] = parseInt(qlt[1]);
    });
    const result = {};
    for (const val of keys) {
        if (val in DEEPAI_MODEL_OVERRIDES) continue;
        result[val] = { label: valueToLabel[val] || val, provider: providerMap[val] || "", speed: speedMap[val] || 0, quality: qualityMap[val] || 0 };
    }
    return result;
}

export async function scrapeDeepAIFreeModels() {
    try {
        const r = await fetch(DEEPAI_CHAT_URL, { headers: { "User-Agent": UA } });
        if (!r.ok) return new Set(Object.keys(DEEPAI_MODEL_OVERRIDES));
        const html = await r.text();
        const freeKeys = new Set(["vexa"]);
        const lockPattern = /lock-icon/;
        const spanPattern = /<span[^>]*>([^<]+)<\/span>/;
        const blocks = html.split(/<div[^>]*class="[^"]*chat-mode-menu-item/i).slice(1);
        for (const block of blocks) {
            if (/chat-mode-locked/.test(block) || lockPattern.test(block)) continue;
            const spanMatch = block.match(spanPattern);
            if (!spanMatch) continue;
            const label = unescapeHtml(spanMatch[1].trim());
            if (!label || label.length < 2) continue;
            const known = Object.entries(DEEPAI_MODEL_OVERRIDES).find(([, v]) => v.label.toLowerCase() === label.toLowerCase());
            freeKeys.add(known ? known[0] : labelToKey(label));
        }
        for (const key of Object.keys(DEEPAI_MODEL_OVERRIDES)) freeKeys.add(key);
        return freeKeys;
    } catch (_) {
        return new Set(Object.keys(DEEPAI_MODEL_OVERRIDES));
    }
}

export async function fetchAvailableModels() {
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
        if (!r.ok) return [];
        const html = await r.text();
        const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
        if (!selectMatch) return [];
        const seen = new Set();
        const keys = [];
        for (const m of selectMatch[1].matchAll(/<option[^>]*\bvalue=["']?([^"'\s>]+)/gi)) {
            const k = m[1].trim();
            if (k && !seen.has(k)) { keys.push(k); seen.add(k); }
        }
        return keys;
    } catch (_) { return []; }
}

export async function checkPage() {
    const t0 = Date.now();
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } });
        return { reachable: r.ok, status: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

export async function checkToken() {
    const t0 = Date.now();
    try {
        const token = makeClientToken();
        const body = new URLSearchParams({ session_id: randomString(32), token });
        const r = await fetch(TOKEN_URL, { method: "POST", headers: POST_HDRS, body: body.toString() });
        if (!r.ok) return { reachable: false, token_received: false, status: r.status, latency_ms: Date.now() - t0 };
        const j = await r.json();
        return { reachable: true, token_received: !!j.token, status: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, token_received: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

export async function checkImage() {
    const t0 = Date.now();
    try {
        const r = await fetch(DEEPAI_IMAGE_URL, { method: "HEAD", headers: { "User-Agent": UA } });
        return { reachable: r.status < 500, status: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

export async function checkModel(model) {
    const t0 = Date.now();
    try {
        if (TALKAI_MODELS.has(model) && !PROVIDER_SETTINGS.talkai) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        if (DOLPHIN_MODELS.has(model) && !PROVIDER_SETTINGS.dolphin) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        if (POLLINATIONS_MODELS.has(model) && !PROVIDER_SETTINGS.pollinations) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        if ((DEEPAI_MODELS.has(model) || model === "vexa") && !PROVIDER_SETTINGS.deepai) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };

        const msgs = [{ role: "user", content: HEALTH_PROBE }];
        let text;
        if (TALKAI_MODELS.has(model)) text = await talkaiComplete(HEALTH_PROBE, model);
        else if (DOLPHIN_MODELS.has(model)) text = await dolphinComplete(HEALTH_PROBE, model);
        else if (POLLINATIONS_MODELS.has(model)) text = await pollinationsComplete(msgs, model);
        else if (DEEPAI_MODELS.has(model) || model === "vexa") text = await vexaComplete(HEALTH_PROBE, msgs, model === "vexa" ? "standard" : model);
        else if (PROVIDER_SETTINGS.toolbaz) text = await toolbazComplete(HEALTH_PROBE, model);
        else return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };

        return { ok: typeof text === "string" && text.length > 0, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { ok: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

export async function completeWithAI(prompt, messages, model) {
    const msgs = messages || [{ role: "user", content: prompt }];
    const { toolbaz: toolbazModels, deepai: deepaiModels } = await getValidModels();
    const route = resolveModelRoute(model, toolbazModels, deepaiModels);

    if (route === "talkai") return await talkaiComplete(prompt, model);
    if (route === "dolphin") return await dolphinComplete(prompt, model);
    if (route === "pollinations") return await pollinationsComplete(msgs, model);
    if (route === "deepai") return await vexaComplete(prompt, msgs, resolveDeepAIModel(model));
    if (route === "aifree") return await aiFreeComplete(prompt, msgs, model);
    return parseFull(await toolbazComplete(prompt, model));
}

export async function generateImage(prompt, model, preference) {
    const route = resolveImageRoute(model);
    if (!route) throw new Error(`Invalid model. Valid values: ${validImageModels()}`);
    if (route === "pollinations" && !PROVIDER_SETTINGS.pollinations) throw new Error("Pollinations provider is disabled");
    if (route === "deepai" && !PROVIDER_SETTINGS.deepai) throw new Error("DeepAI provider is disabled");
    if (route === "pollinations") return await callPollinationsImage(String(prompt).trim().slice(0, 1000), model);
    const prefKey = resolveImagePrefKey(preference);
    if (!prefKey) throw new Error("Invalid preference. Valid values: speed, quality");
    return await callDeepAIImage(String(prompt).trim().slice(0, 1000), "hd", prefKey);
}

export async function completeWithAIStream(prompt, messages, model, onChunk) {
    const msgs = messages || [{ role: "user", content: prompt }];
    const { toolbaz: toolbazModels, deepai: deepaiModels } = await getValidModels();
    const route = resolveModelRoute(model, toolbazModels, deepaiModels);

    if (route === "talkai") return await talkaiCompleteStream(prompt, model, onChunk);
    if (route === "dolphin") return await dolphinCompleteStream(prompt, model, onChunk);
    if (route === "pollinations") return await pollinationsCompleteStream(msgs, model, onChunk);
    if (route === "deepai") return await vexaCompleteStream(prompt, msgs, resolveDeepAIModel(model), onChunk);
    if (route === "aifree") return await aiFreeCompleteStream(prompt, msgs, model, onChunk);
    return await toolbazCompleteStream(prompt, model, onChunk);
}

export async function pollinationsCompleteStream(messages, model, onChunk) {
    const polModel = model.replace(/^pol-/, "");
    const r = await fetch(POLLINATIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({ model: polModel, messages, temperature: TEMPERATURE_SETTINGS.DEFAULT, stream: true, private: true }),
    });
    if (!r.ok) throw new Error(`Pollinations error ${r.status}`);

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
            const t = line.trim();
            if (!t || t === "data: [DONE]") continue;
            if (t.startsWith("data: ")) {
                try {
                    const obj = JSON.parse(t.slice(6));
                    const chunk = obj.choices?.[0]?.delta?.content || "";
                    if (chunk) onChunk(chunk);
                } catch (_) { }
            }
        }
    }

    if (buf.trim().startsWith("data: ") && buf.trim() !== "data: [DONE]") {
        try {
            const obj = JSON.parse(buf.trim().slice(6));
            const chunk = obj.choices?.[0]?.delta?.content || "";
            if (chunk) onChunk(chunk);
        } catch (_) { }
    }
}

export async function dolphinCompleteStream(prompt, model, onChunk) {
    const template = DOLPHIN_TEMPLATE_MAP[model] || "logical";
    const r = await fetch(DOLPHIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA, "Referer": "https://chat.dphn.ai/", "Origin": "https://chat.dphn.ai" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "dolphinserver:24B", template }),
    });
    if (!r.ok) throw new Error(`Dolphin error ${r.status}`);

    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();

        for (const line of lines) {
            const t = line.trim();
            if (!t || t === "data: [DONE]") continue;
            if (t.startsWith("data: ")) {
                try {
                    const obj = JSON.parse(t.slice(6));
                    const chunk = obj.choices?.[0]?.delta?.content || "";
                    if (chunk) onChunk(chunk);
                } catch (_) { }
            }
        }
    }

    if (buf.trim().startsWith("data: ") && buf.trim() !== "data: [DONE]") {
        try {
            const obj = JSON.parse(buf.trim().slice(6));
            const chunk = obj.choices?.[0]?.delta?.content || "";
            if (chunk) onChunk(chunk);
        } catch (_) { }
    }
}

export function cleanText(text) {
    let cleaned = text.replace(/\\n\\n/g, ' ').replace(/\\n/g, ' ').replace(/\n\n/g, ' ').replace(/\n/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^(Claude \d+(\.\d+)?\s+(Sonnet|Haiku|Opus)|GPT-\d+(\.\d+)?|Gemini \w+)\s+/i, '');
    cleaned = cleaned.replace(/\s*-\d+$/, '');

    return cleaned;
}

export async function talkaiComplete(prompt, model) {
    const modelId = TALKAI_MODEL_IDS[model] || model;
    const messages = [{ id: "0", from: "you", content: prompt, model: "" }];
    const payload = { type: "chat", messagesHistory: messages, settings: { model: modelId, temperature: TEMPERATURE_SETTINGS.DEFAULT } };
    const r = await fetch(TALKAI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA, "Referer": "https://talkai.info/", "Origin": "https://talkai.info" },
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`TalkAI error ${r.status}`);
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buf = "";
    let skipNext = false;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
            if (line.startsWith("event:")) { skipNext = true; continue; }
            if (!line.startsWith("data:")) continue;
            if (skipNext) { skipNext = false; continue; }
            const data = line.slice(5);
            if (!data.trim() || data.trim() === "[DONE]") continue;
            full += data;
        }
    }
    if (buf.startsWith("data:") && !skipNext) {
        const data = buf.slice(5);
        if (data.trim() && data.trim() !== "[DONE]") full += data;
    }
    return cleanText(full.replace(/An internal server error occurred\.?/gi, "").trim());
}

export async function talkaiCompleteStream(prompt, model, onChunk) {
    const fullText = await talkaiComplete(prompt, model);
    const chunks = fullText.match(/.{1,4}/g) || [];
    for (const chunk of chunks) {
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function vexaCompleteStream(prompt, messages, model, onChunk) {
    const fullText = await vexaComplete(prompt, messages, model);
    const chunks = fullText.match(/.{1,4}/g) || [];
    for (const chunk of chunks) {
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function aiFreeCompleteStream(prompt, messages, model, onChunk) {
    const fullText = await aiFreeComplete(prompt, messages, model);
    const chunks = fullText.match(/.{1,4}/g) || [];
    for (const chunk of chunks) {
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function toolbazCompleteStream(prompt, model, onChunk) {
    const fullText = await toolbazComplete(prompt, model);
    const chunks = fullText.match(/.{1,4}/g) || [];
    for (const chunk of chunks) {
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 10));
    }
}

export async function makeProxyId(url) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
    const id = btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "").slice(0, 32);
    proxyCache.set(id, url);
    return id;
}