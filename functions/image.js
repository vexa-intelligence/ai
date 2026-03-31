const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CLIENT_AGENT = "vexa-api:1.0:github.com/vexa-ai";
const HORDE_API = "https://aihorde.net/api/v2";
const ANON_KEY = "0000000000";
const MAX_REQUESTS = 10;
const RATE_WINDOW = 60000;
const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 120000;
const MODEL_CACHE_TTL = 300000;
const DEFAULT_MODEL = "Deliberate";
const DEFAULT_RESOLUTION = "512x512";
const DEFAULT_SAMPLER = "k_euler_a";
const SAMPLERS = ["k_euler", "k_euler_a", "k_dpm_2", "k_dpm_2_a", "k_dpmpp_2m", "k_dpmpp_sde", "DDIM", "k_heun"];
const RESOLUTIONS = {
    "512x512": [512, 512], "512x768": [512, 768], "768x512": [768, 512], "768x768": [768, 768],
    "640x960": [640, 960], "960x640": [960, 640], "1024x576": [1024, 576], "576x1024": [576, 1024],
    "832x1216": [832, 1216], "1216x832": [1216, 832], "1024x1024": [1024, 1024],
};

const rateLimitStore = new Map();
const modelCache = { names: new Set(), ts: 0 };

async function getLiveModels() {
    const now = Date.now();
    if (modelCache.names.size > 0 && now - modelCache.ts < MODEL_CACHE_TTL) return modelCache.names;
    try {
        const r = await fetch(`${HORDE_API}/workers?type=image`, { headers: { "User-Agent": UA, "Client-Agent": CLIENT_AGENT, "apikey": ANON_KEY } });
        if (!r.ok) throw new Error("bad status");
        const workers = await r.json();
        const names = new Set();
        for (const w of workers) if (w.online) for (const m of (w.models || [])) names.add(m);
        if (names.size) { modelCache.names = names; modelCache.ts = now; }
    } catch (_) { }
    return modelCache.names;
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function cancelJob(jobId) {
    try { await fetch(`${HORDE_API}/generate/status/${jobId}`, { method: "DELETE", headers: { "apikey": ANON_KEY, "User-Agent": UA } }); } catch (_) { }
}

async function generate(prompt, negativePrompt, w, h, num, model, sampler, steps, cfg, seed) {
    const fullPrompt = negativePrompt ? `${prompt} ### ${negativePrompt}` : prompt;
    const payload = {
        prompt: fullPrompt,
        params: { width: w, height: h, n: num, steps, sampler_name: sampler, cfg_scale: cfg, seed: String(seed) },
        models: [model], r2: true, shared: false, slow_workers: true,
    };
    const r = await fetch(`${HORDE_API}/generate/async`, {
        method: "POST", headers: { "apikey": ANON_KEY, "User-Agent": UA, "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Submit failed: ${r.status}`);
    const rj = await r.json();
    const jobId = rj.id;
    if (!jobId) throw new Error(`No job ID returned: ${JSON.stringify(rj).slice(0, 200)}`);
    let queuePos = null;
    const deadline = Date.now() + POLL_TIMEOUT;
    while (Date.now() < deadline) {
        await sleep(POLL_INTERVAL);
        const check = await (await fetch(`${HORDE_API}/generate/check/${jobId}`, { headers: { "apikey": ANON_KEY, "User-Agent": UA } })).json();
        queuePos = check.queue_position;
        if (check.is_possible === false) {
            await cancelJob(jobId);
            throw new Error(`No workers available for model '${model}'. Check /models for models with active workers.`);
        }
        if (check.faulted) throw new Error(`Job faulted: ${JSON.stringify(check)}`);
        if (check.done) break;
    }
    if (Date.now() >= deadline) {
        await cancelJob(jobId);
        throw new Error(`Timed out after ${POLL_TIMEOUT / 1000}s (last queue position: ${queuePos})`);
    }
    const statusR = await (await fetch(`${HORDE_API}/generate/status/${jobId}`, { headers: { "apikey": ANON_KEY, "User-Agent": UA } })).json();
    const images = [];
    for (const gen of (statusR.generations || [])) {
        const imgUrl = gen.img || "";
        let b64 = null;
        if (imgUrl) {
            try {
                const ir = await fetch(imgUrl);
                if (ir.ok) {
                    const buf = await ir.arrayBuffer();
                    b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
                }
            } catch (_) { }
        }
        images.push({ b64, url: imgUrl, seed: gen.seed || String(seed), model: gen.model || model, worker: gen.worker_name || "" });
    }
    return images;
}

function parseQsParams(url) {
    const sp = url.searchParams;
    const g = (...keys) => { for (const k of keys) { const v = sp.get(k); if (v) return v; } return ""; };
    const prompt = g("q", "prompt") || null;
    const negativePrompt = g("negative_prompt", "negative");
    const resolution = g("resolution") || DEFAULT_RESOLUTION;
    const model = g("model") || DEFAULT_MODEL;
    const sampler = g("sampler") || DEFAULT_SAMPLER;
    const num = Math.max(1, Math.min(parseInt(g("num", "numImages") || "1") || 1, 4));
    const steps = Math.max(10, Math.min(parseInt(g("steps") || "25") || 25, 50));
    const cfg = Math.max(1.0, Math.min(parseFloat(g("cfg", "cfg_scale") || "7.0") || 7.0, 20.0));
    const seed = parseInt(g("seed")) || Math.floor(Math.random() * 2 ** 31);
    return { prompt, negativePrompt, resolution, model: model || DEFAULT_MODEL, sampler: SAMPLERS.includes(sampler) ? sampler : DEFAULT_SAMPLER, num, steps, cfg, seed };
}

function parseBody(body) {
    const m = body.model || DEFAULT_MODEL;
    const s = body.sampler || DEFAULT_SAMPLER;
    const steps = Math.max(10, Math.min(parseInt(body.steps ?? 25) || 25, 50));
    const cfg = Math.max(1.0, Math.min(parseFloat(body.cfg_scale ?? body.cfg ?? 7.0) || 7.0, 20.0));
    const seed = parseInt(body.seed) || Math.floor(Math.random() * 2 ** 31);
    return {
        prompt: body.prompt || body.q || null,
        negativePrompt: body.negative_prompt || body.negative || "",
        resolution: body.resolution || DEFAULT_RESOLUTION,
        model: m || DEFAULT_MODEL,
        sampler: SAMPLERS.includes(s) ? s : DEFAULT_SAMPLER,
        num: Math.max(1, Math.min(parseInt(body.num ?? body.numImages ?? 1) || 1, 4)),
        steps, cfg, seed,
    };
}

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    };
}

async function run(args) {
    let { prompt, negativePrompt, resolution, model, sampler, num, steps, cfg, seed } = args;
    if (!prompt || !String(prompt).trim()) {
        return Response.json({ success: false, error: "Missing required parameter: q or prompt" }, { status: 400, headers: corsHeaders() });
    }
    prompt = String(prompt).trim().slice(0, 1000);
    negativePrompt = String(negativePrompt || "").trim().slice(0, 500);
    const [w, hPx] = RESOLUTIONS[resolution] || [512, 512];
    const liveModels = await getLiveModels();
    let modelWarning = null;
    if (liveModels.size > 0 && !liveModels.has(model)) {
        modelWarning = `Model '${model}' has no active workers right now. Request may queue or fail.`;
    }
    const t0 = Date.now();
    try {
        const images = await generate(prompt, negativePrompt, w, hPx, num, model, sampler, steps, cfg, seed);
        return Response.json({
            success: true, prompt, negative_prompt: negativePrompt || null, model, resolution, sampler, steps, cfg_scale: cfg,
            num_images: images.length, images, elapsed_ms: Date.now() - t0,
            ...(modelWarning ? { warning: modelWarning } : {}),
        }, { status: 200, headers: corsHeaders() });
    } catch (e) {
        return Response.json({ success: false, error: e.message }, { status: 502, headers: corsHeaders() });
    }
}

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (isRateLimited(ip)) {
        return Response.json({ success: false, error: "Rate limit exceeded" }, { status: 429, headers: corsHeaders() });
    }
    if (request.method === "GET") {
        return run(parseQsParams(new URL(request.url)));
    }
    if (request.method === "POST") {
        let body;
        try { body = await request.json(); }
        catch (_) { return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders() }); }
        return run(parseBody(body));
    }
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders() });
}