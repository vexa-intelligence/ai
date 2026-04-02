const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const PAGE_URL = "https://toolbaz.com/writer/chat-gpt-alternative";
const TOKEN_URL = "https://data.toolbaz.com/token.php";
const WRITE_URL = "https://data.toolbaz.com/writing.php";
const DEEPAI_API = "https://api.deepai.org";
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
const DEFAULT_MODEL = "vexa";

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
      modelsCache.keys = new Set(["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"]);
      modelsCache.keys.add("vexa");
      modelsCache.keys.add("gemini-2.5-flash-lite");
      modelsCache.keys.add("gpt-4.1-nano");
      modelsCache.keys.add("deepseek-v3.2");
      modelsCache.default = DEFAULT_MODEL;
      modelsCache.ts = now;
    }
  } catch (_) { }
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
  } catch (_) { }
  return raw.replace(/<[^>]+>/g, "").trim();
}

async function fetchVexa(prompt, model = "standard") {
  const apiKey = generateTryitKey();
  const sessionUuid = crypto.randomUUID ? crypto.randomUUID() : randomString(36);
  const chatHistory = JSON.stringify([{ role: "user", content: prompt }]);
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

async function fetchUpstream(prompt, model) {
  if (model === "vexa") return fetchVexa(prompt);
  const sid = randomString(32);
  const tokenBody = new URLSearchParams({ session_id: sid, token: buildFingerprint() });
  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
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
      lastErr = new Error(`Upstream server error ${wr.status}`);
    } catch (e) {
      lastErr = e;
      if (e.message.startsWith("Upstream error")) throw e;
    }
    await new Promise(res => setTimeout(res, Math.pow(BACKOFF_BASE, attempt) * 1000));
  }
  throw lastErr;
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
  if (!model) model = DEFAULT_MODEL;
  if (model !== "vexa" && modelsCache.keys.size > 0 && !modelsCache.keys.has(model)) {
    return Response.json({ success: false, error: `Unknown model '${model}'`, valid_models: [...modelsCache.keys].sort() }, { status: 400, headers: corsHeaders() });
  }
  const t0 = Date.now();
  try {
    const DEEPAI_MODELS = new Set(["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2"]);
    const deepaiModel = model === "vexa" ? "standard" : model;
    const raw = DEEPAI_MODELS.has(model)
      ? await fetchVexa(prompt, deepaiModel)
      : model === "gpt-5"
        ? await aiFreeComplete(prompt, [{ role: "user", content: prompt }], model)
        : await fetchUpstream(prompt, model);
    const text = DEEPAI_MODELS.has(model) || model === "gpt-5" ? raw : parseFull(raw);
    const source = DEEPAI_MODELS.has(model) ? "deepai.org" : model === "gpt-5" ? "aifreeforever.com" : "toolbaz.com";
    return Response.json({ success: true, response: text, model, elapsed_ms: Date.now() - t0, source }, { status: 200, headers: corsHeaders() });
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