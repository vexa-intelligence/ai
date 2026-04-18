import { UA, API_URLS, FORM_TEMPLATES, PROVIDER_SETTINGS } from "../config.js";
import { registerProvider } from "../lib/models.js";

const { AIFREE_NONCE_URL, AIFREE_ANSWER_URL, AIFREE_MODELS_URL } = API_URLS;

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
    let fullText = "";
    await aiFreeCompleteStream(prompt, messages, model, (chunk) => { fullText += chunk; });
    return fullText;
}

export async function aiFreeCompleteStream(prompt, messages, model, onChunk) {
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
    const text = j.answer || j.response || j.data?.answer || j.data?.response || JSON.stringify(j);
    for (const char of text.split("")) {
        onChunk(char);
        await new Promise(r => setTimeout(r, 5));
    }
}

async function scrapeModels() {
    try {
        const url = AIFREE_MODELS_URL || "https://aifreeforever.com/wp-json/custom/v1/models";
        const r = await fetch(url, { headers: { "User-Agent": UA, "Referer": "https://aifreeforever.com/", "Origin": "https://aifreeforever.com" } });
        if (!r.ok) return {};
        const data = await r.json();
        const result = {};
        const models = Array.isArray(data) ? data : data.models || data.data || [];
        for (const m of models) {
            const id = typeof m === "string" ? m : m.id || m.name || m.slug;
            if (!id) continue;
            result[id] = { label: (typeof m === "object" && m.label) || id, provider: "AIFree", speed: 0, quality: 0 };
        }
        return result;
    } catch (_) { return {}; }
}

let _scrapedKeys = null;

const aifreeProvider = {
    id: "aifree",
    source: "aifreeforever.com",
    enabled: () => PROVIDER_SETTINGS.aifree,
    scrapeModels: async () => {
        const models = await scrapeModels();
        _scrapedKeys = new Set(Object.keys(models));
        return models;
    },
    hasModel: (model) => {
        if (!_scrapedKeys) return false;
        return _scrapedKeys.has(model);
    },
    complete: aiFreeComplete,
    completeStream: aiFreeCompleteStream,
};

registerProvider(aifreeProvider);

export default aifreeProvider;