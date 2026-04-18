import { UA, API_URLS, REQUEST_HEADERS, PROVIDER_SETTINGS } from "../config.js";
import { makeClientToken, randomString } from "../lib/crypto.js";
import { parseFull, unescapeHtml } from "../lib/utils.js";
import { registerProvider } from "../lib/models.js";

const { TOKEN_URL, WRITE_URL, TOOLBAZ_PAGE_URL } = API_URLS;
const POST_HDRS = REQUEST_HEADERS.POST_HDRS;

async function getToken() {
    const token = makeClientToken();
    const body = new URLSearchParams({ session_id: randomString(32), token });
    const r = await fetch(TOKEN_URL, { method: "POST", headers: POST_HDRS, body: body.toString() });
    if (!r.ok) throw new Error(`Token fetch failed: ${r.status}`);
    const j = await r.json();
    if (!j.token) throw new Error("No token returned");
    return j.token;
}

export async function toolbazComplete(prompt, model) {
    let fullText = "";
    await toolbazCompleteStream(prompt, model, (chunk) => { fullText += chunk; });
    return parseFull(fullText);
}

export async function toolbazCompleteStream(prompt, model, onChunk) {
    const token = await getToken();
    const body = new URLSearchParams({ prompt, model, token });
    const r = await fetch(WRITE_URL, { method: "POST", headers: POST_HDRS, body: body.toString() });
    if (!r.ok) throw new Error(`Toolbaz error ${r.status}`);
    const text = await r.text();
    const parsed = parseFull(text);
    for (const char of parsed) {
        onChunk(char);
        await new Promise(r => setTimeout(r, 5));
    }
}

async function scrapeModels() {
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
        if (!r.ok) return {};
        const html = await r.text();
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
            if (by) { currentProvider = by[1].replace(/[^\w\s()]/g, "").trim(); }
            else {
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
            const win = html.slice(start, end);
            const spd = win.match(/(\d+)\s*W\/s/);
            const qlt = win.match(/quality-indicator[^>]*>(?:\s*<[^>]+>)*\s*(\d+)/);
            if (spd) speedMap[val] = parseInt(spd[1]);
            if (qlt) qualityMap[val] = parseInt(qlt[1]);
        });
        const result = {};
        for (const val of keys) {
            result[val] = { label: valueToLabel[val] || val, provider: providerMap[val] || "", speed: speedMap[val] || 0, quality: qualityMap[val] || 0 };
        }
        return result;
    } catch (_) { return {}; }
}

const toolbazProvider = {
    id: "toolbaz",
    source: "toolbaz.com",
    enabled: () => PROVIDER_SETTINGS.toolbaz,
    scrapeModels,
    hasModel: (() => {
        let _cached = null;
        return (model) => {
            if (!_cached) return true;
            return _cached.has(model);
        };
    })(),
    complete: toolbazComplete,
    completeStream: toolbazCompleteStream,
};

registerProvider(toolbazProvider);

export default toolbazProvider;