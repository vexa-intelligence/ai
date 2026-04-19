import { UA, PROVIDER_SETTINGS } from "../config.js";
import { registerProvider } from "../lib/models.js";

const BASE = "https://chatgpt.org";
const CHAT_URL = `${BASE}/api/chat`;
const PAGE_URL = `${BASE}/chat`;

const BASE_HEADERS = {
    "User-Agent": UA,
    "Accept-Language": "en-US,en;q=0.9",
};

const EXCLUDED_IDS = new Set(["application/json", "text/plain", "text/html", "application/x-www-form-urlencoded"]);

async function scrapeModels() {
    try {
        const pageR = await fetch(PAGE_URL, { headers: BASE_HEADERS });
        if (!pageR.ok) return {};
        const html = await pageR.text();

        const m = html.match(/\/js\/chat-app\.js\?v=([\d.]+)/);
        if (!m) return {};

        const jsUrl = `${BASE}/js/chat-app.js?v=${m[1]}`;
        const jsR = await fetch(jsUrl, { headers: { ...BASE_HEADERS, "Referer": PAGE_URL } });
        if (!jsR.ok) return {};
        const js = await jsR.text();

        const found = [...js.matchAll(/"([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.:-]+)"/g)]
            .map(x => x[1])
            .filter(id => !EXCLUDED_IDS.has(id) && !id.includes("text/") && !id.includes("application/"));
        const unique = [...new Set(found)];

        const result = {};
        for (const id of unique) {
            const parts = id.split("/");
            const label = parts.slice(1).join("/");
            const providerName = parts[0];
            const key = `${id.replace(/\//g, "-")}`;
            result[key] = {
                label,
                provider: "ChatGPTOrg",
                description: `${providerName} - ${label}`,
                _originalId: id,
                speed: 0,
                quality: 0,
            };
        }
        return result;
    } catch (_) {
        return {};
    }
}

const _modelIdMap = new Map();

export async function chatgptorgCompleteStream(prompt, messages, model, onChunk) {
    let originalId = _modelIdMap.get(model);
    if (!originalId) {
        const scraped = await scrapeModels();
        for (const [key, val] of Object.entries(scraped)) {
            _modelIdMap.set(key, val._originalId);
        }
        originalId = _modelIdMap.get(model);
    }
    if (!originalId) {
        originalId = model.replace(/^cgptorg-/, "");
        const firstDash = originalId.indexOf("-");
        if (firstDash !== -1) {
            originalId = originalId.slice(0, firstDash) + "/" + originalId.slice(firstDash + 1);
        }
    }

    const msgs = (messages || [{ role: "user", content: prompt }]).map(m => ({
        role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
        content: m.content,
    }));

    const r = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
            ...BASE_HEADERS,
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "Origin": BASE,
            "Referer": PAGE_URL,
        },
        body: JSON.stringify({ model: originalId, messages: msgs }),
    });

    if (!r.ok) throw new Error(`ChatGPTOrg error ${r.status}`);

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

export async function chatgptorgComplete(prompt, messages, model) {
    let fullText = "";
    await chatgptorgCompleteStream(prompt, messages, model, (chunk) => { fullText += chunk; });
    return fullText.trim();
}

const chatgptorgProvider = {
    id: "chatgptorg",
    source: "chatgpt.org",
    enabled: () => PROVIDER_SETTINGS.chatgptorg,
    scrapeModels: async () => {
        const models = await scrapeModels();
        for (const [key, val] of Object.entries(models)) {
            _modelIdMap.set(key, val._originalId);
        }
        return models;
    },
    complete: chatgptorgComplete,
    completeStream: chatgptorgCompleteStream,
};

registerProvider(chatgptorgProvider);

export default chatgptorgProvider;