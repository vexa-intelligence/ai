const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const PAGE_URL = "https://toolbaz.com/writer/chat-gpt-alternative";
const TOKEN_URL = "https://data.toolbaz.com/token.php";
const WRITE_URL = "https://data.toolbaz.com/writing.php";
const POST_HDRS = {
  "User-Agent": UA,
  "Referer": PAGE_URL,
  "Origin": "https://toolbaz.com",
  "X-Requested-With": "XMLHttpRequest",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  "Accept-Language": "en-US,en;q=0.9",
};

const MAX_PROMPT_LENGTH = 4000;
const MAX_REQUESTS = 20;
const RATE_WINDOW = 60000;
const MAX_RETRIES = 3;
const BACKOFF_BASE = 1.5;
const MODELS_CACHE_TTL = 300000;
const DEFAULT_MODEL = "toolbaz-v4.5-fast";

const rateLimitStore = new Map();
const modelsCache = { keys: new Set(), default: DEFAULT_MODEL, ts: 0 };

function randomString(n) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function buildFingerprint() {
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

async function refreshModels() {
  const now = Date.now();
  if (modelsCache.keys.size > 0 && now - modelsCache.ts < MODELS_CACHE_TTL) return;
  try {
    const r = await fetch(PAGE_URL, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
    if (!r.ok) return;
    const html = await r.text();
    const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
    if (!selectMatch) return;
    const keys = [];
    const seen = new Set();
    for (const m of selectMatch[1].matchAll(/<option[^>]*\bvalue=["']?([^"'>\s]+)["']?/gi)) {
      const k = m[1].trim();
      if (k && !seen.has(k)) { keys.push(k); seen.add(k); }
    }
    if (keys.length) {
      modelsCache.keys = new Set(keys);
      modelsCache.default = modelsCache.keys.has(DEFAULT_MODEL) ? DEFAULT_MODEL : keys[0];
      modelsCache.ts = now;
    }
  } catch (_) {}
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

function parseChunk(chunk) {
  chunk = chunk.trim();
  if (!chunk || chunk === "[DONE]") return "";
  try { return JSON.parse(chunk).choices[0].delta?.content || ""; }
  catch (_) { return chunk; }
}

function parseFull(raw) {
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
  } catch (_) {}
  return raw.replace(/<[^>]+>/g, "").trim();
}

async function fetchUpstream(prompt, model) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const sid = randomString(32);
    const tokenBody = new URLSearchParams({ session_id: sid, token: buildFingerprint() });
    const tr = await fetch(TOKEN_URL, { method: "POST", headers: POST_HDRS, body: tokenBody.toString() });
    if (!tr.ok) throw new Error(`Token request failed: ${tr.status}`);
    const tj = await tr.json();
    const token = tj.token || "";
    if (!token) throw new Error("Token endpoint returned no token");
    const writeBody = new URLSearchParams({ text: prompt, capcha: token, model, session_id: sid });
    const wr = await fetch(WRITE_URL, {
      method: "POST",
      headers: { ...POST_HDRS, Accept: "text/event-stream, application/json, */*" },
      body: writeBody.toString(),
    });
    if (wr.ok) return await wr.text();
    if (wr.status < 500) throw new Error(`Upstream error ${wr.status}`);
    if (attempt === MAX_RETRIES - 1) throw new Error(`Upstream server error ${wr.status}`);
    await new Promise(res => setTimeout(res, Math.pow(BACKOFF_BASE, attempt) * 1000));
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

async function run(prompt, model, ip) {
  if (isRateLimited(ip)) {
    return Response.json({ success: false, error: "Rate limit exceeded. Try again shortly." }, { status: 429, headers: corsHeaders() });
  }
  if (!prompt || !prompt.trim()) {
    return Response.json({ success: false, error: "Missing required parameter: q, query, or prompt" }, { status: 400, headers: corsHeaders() });
  }
  prompt = prompt.trim();
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json({ success: false, error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }, { status: 400, headers: corsHeaders() });
  }
  await refreshModels();
  if (!model) model = modelsCache.default;
  if (modelsCache.keys.size > 0 && !modelsCache.keys.has(model)) {
    return Response.json({ success: false, error: `Unknown model '${model}'`, valid_models: [...modelsCache.keys].sort() }, { status: 400, headers: corsHeaders() });
  }
  const t0 = Date.now();
  try {
    const raw = await fetchUpstream(prompt, model);
    const text = parseFull(raw);
    return Response.json({ success: true, response: text, model, elapsed_ms: Date.now() - t0 }, { status: 200, headers: corsHeaders() });
  } catch (_) {
    return Response.json({ success: false, error: "Upstream request failed" }, { status: 502, headers: corsHeaders() });
  }
}

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (request.method === "GET") {
    const url = new URL(request.url);
    const prompt = url.searchParams.get("q") || url.searchParams.get("query") || "";
    const model = url.searchParams.get("model") || "";
    return run(prompt, model, ip);
  }
  if (request.method === "POST") {
    let body;
    try { body = await request.json(); }
    catch (_) { return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders() }); }
    const prompt = body.q || body.query || body.prompt || "";
    const model = body.model || "";
    return run(prompt, model, ip);
  }
  return Response.json({ success: false, error: "Method not allowed" }, { status: 405, headers: corsHeaders() });
}