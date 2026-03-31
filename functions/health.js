const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CLIENT_AGENT = "vexa-api:1.0:github.com/vexa-ai";
const TOOLBAZ_PAGE_URL = "https://toolbaz.com/writer/chat-gpt-alternative";
const TOKEN_URL = "https://data.toolbaz.com/token.php";
const HORDE_API = "https://aihorde.net/api/v2";
const ANON_KEY = "0000000000";
const POST_HDRS = {
    "User-Agent": UA,
    "Referer": TOOLBAZ_PAGE_URL,
    "Origin": "https://toolbaz.com",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept-Language": "en-US,en;q=0.9",
};

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

async function checkToolbazPage() {
    const t0 = Date.now();
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } });
        return { reachable: r.ok, status_code: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

async function checkToolbazToken() {
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
    const debug = {};
    const hdrs = { "User-Agent": UA, "Client-Agent": CLIENT_AGENT, "apikey": ANON_KEY };
    try {
        const r = await fetch(`${HORDE_API}/workers?type=image`, { headers: hdrs });
        if (!r.ok) throw new Error(`status ${r.status}`);
        const allWorkers = await r.json();
        const online = allWorkers.filter(w => w.online);
        const counts = {};
        for (const w of online) for (const m of (w.models || [])) counts[m] = (counts[m] || 0) + 1;
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n]) => n);
        debug.worker_count = online.length;
        debug.model_count = Object.keys(counts).length;
        debug.top_models = top;
        debug.horde_workers_latency_ms = Date.now() - t0;
    } catch (e) {
        return { reachable: false, error: `Workers fetch failed: ${e.message}`, latency_ms: Date.now() - t0, debug };
    }
    const t1 = Date.now();
    let jobId = null;
    try {
        const payload = {
            prompt: "a red circle",
            params: { width: 64, height: 64, n: 1, steps: 1, sampler_name: "k_euler", cfg_scale: 1, seed: "1" },
            models: ["Deliberate"], r2: true, shared: false, slow_workers: true,
        };
        const r2 = await fetch(`${HORDE_API}/generate/async`, { method: "POST", headers: { ...hdrs, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!r2.ok) throw new Error(`status ${r2.status}`);
        const rj = await r2.json();
        jobId = rj.id;
        debug.job_submit_status = r2.status;
        debug.job_id = jobId;
        debug.job_submit_latency_ms = Date.now() - t1;
    } catch (e) {
        debug.job_submit_error = e.message;
        return { reachable: true, ...debug, job_submitted: false, error: `Job submit failed: ${e.message}`, latency_ms: Date.now() - t0, debug };
    }
    if (!jobId) {
        return { reachable: true, ...debug, job_submitted: false, error: "No job ID returned", latency_ms: Date.now() - t0, debug };
    }
    const t2 = Date.now();
    try {
        const check = await (await fetch(`${HORDE_API}/generate/check/${jobId}`, { headers: hdrs })).json();
        debug.job_check_latency_ms = Date.now() - t2;
        debug.is_possible = check.is_possible;
        debug.queue_position = check.queue_position;
        debug.wait_time_s = check.wait_time;
    } catch (e) { debug.job_check_error = e.message; }
    try { await fetch(`${HORDE_API}/generate/status/${jobId}`, { method: "DELETE", headers: hdrs }); } catch (_) { }
    return {
        reachable: true,
        worker_count: debug.worker_count || 0,
        model_count: debug.model_count || 0,
        top_models: debug.top_models || [],
        job_submitted: true,
        job_id: jobId,
        is_possible: debug.is_possible,
        queue_position: debug.queue_position,
        estimated_wait_s: debug.wait_time_s,
        latency_ms: Date.now() - t0,
        debug,
    };
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
    const [page, token, image] = await Promise.all([checkToolbazPage(), checkToolbazToken(), checkImage()]);
    const overall = page.reachable && token.reachable && token.token_received && image.reachable;
    return Response.json({
        success: true,
        status: overall ? "ok" : "degraded",
        timestamp: Math.floor(Date.now() / 1000),
        total_ms: Date.now() - tStart,
        checks: { page, token, image },
    }, { status: 200, headers: corsHeaders() });
}