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

export function unescapeHtml(str) {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
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

export function cleanText(text) {
    let cleaned = text.replace(/\\n\\n/g, ' ').replace(/\\n/g, ' ').replace(/\n\n/g, ' ').replace(/\n/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/^(Claude \d+(\.\d+)?\s+(Sonnet|Haiku|Opus)|GPT-\d+(\.\d+)?|Gemini \w+)\s+/i, '');
    cleaned = cleaned.replace(/\s*-\d+$/, '');
    return cleaned;
}