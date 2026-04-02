const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TOOLBAZ_PAGE_URL = "https://toolbaz.com/writer/chat-gpt-alternative";
const CACHE_TTL = 300000;
const DEFAULT_TEXT_MODEL = "vexa";

const IMAGE_MODELS = [
    { name: "hd", label: "HD", description: "Standard HD generation" },
];

const cache = { textModels: {}, default: DEFAULT_TEXT_MODEL, ts: 0 };

function unescapeHtml(str) {
    return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

function scrapeTextModels(html) {
    const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
    if (!selectMatch) return [{ vexa: { label: "Vexa", provider: "Vexa-AI", speed: 0, quality: 0 } }, DEFAULT_TEXT_MODEL];
    const block = selectMatch[1];

    const valueToLabel = {};
    const keys = [];
    const seen = new Set();
    for (const m of block.matchAll(/<option[^>]*\bvalue=["']?([^"'>\s]+)["']?[^>]*>\s*([^\n<]+)/gi)) {
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

    const BLACKLIST = new Set(["gpt-5", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"]);

    const models = {};
    models["vexa"] = { label: "Vexa", provider: "Vexa-AI", speed: 0, quality: 0 };
    models["gemini-2.5-flash-lite"] = { label: "Gemini-2.5-Flash-Lite", provider: "Google", speed: 180, quality: 72 };
    models["gpt-4.1-nano"] = { label: "GPT-4.1-Nano", provider: "OpenAI", speed: 320, quality: 70 };
    models["deepseek-v3.2"] = { label: "DeepSeek-V3.2", provider: "DeepSeek", speed: 280, quality: 81 };
    for (const val of keys) {
        if (BLACKLIST.has(val)) continue;
        models[val] = { label: valueToLabel[val] || val, provider: providerMap[val] || "", speed: speedMap[val] || 0, quality: qualityMap[val] || 0 };
    }
    return [models, DEFAULT_TEXT_MODEL];
}

async function fetchTextModels() {
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } });
        if (!r.ok) return [{ vexa: { label: "Vexa", provider: "Vexa-AI", speed: 0, quality: 0 } }, DEFAULT_TEXT_MODEL];
        const html = await r.text();
        return scrapeTextModels(html);
    } catch (_) { return [{ vexa: { label: "Vexa", provider: "Vexa-AI", speed: 0, quality: 0 } }, DEFAULT_TEXT_MODEL]; }
}

async function refresh() {
    const now = Date.now();
    if (cache.textModels && Object.keys(cache.textModels).length > 0 && now - cache.ts < CACHE_TTL) return cache;
    const [textModels, def] = await fetchTextModels();
    cache.textModels = textModels;
    cache.default = def;
    cache.ts = now;
    return cache;
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
    const c = await refresh();
    return Response.json({
        success: true,
        default: c.default,
        models: c.textModels,
        image_models: IMAGE_MODELS,
    }, { status: 200, headers: corsHeaders() });
}