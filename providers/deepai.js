import { UA, API_URLS, FORM_TEMPLATES } from "../config.js";
import { generateImageKey, buildDeepAIImageBody } from "../lib/crypto.js";
import { registerProvider } from "../lib/models.js";

const { DEEPAI_API, DEEPAI_IMAGE_URL, DEEPAI_CHAT_URL } = API_URLS;

export async function vexaComplete(prompt, messages, model = null) {
    const apiKey = await generateImageKey();
    const sessionUuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
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

    let actualModel = model;
    try {
        const modelMatch = full.match(/model[:\s]+([\w-]+)/i);
        if (modelMatch) {
            actualModel = modelMatch[1];
        }
    } catch (e) {
    }

    return { text: full.trim(), model: actualModel || model };
}

export async function vexaCompleteStream(prompt, messages, model, onChunk) {
    const result = await vexaComplete(prompt, messages, model);
    const chunks = result.text.match(/.{1,4}/g) || [];
    for (const chunk of chunks) {
        onChunk(chunk, result.model);
        await new Promise(r => setTimeout(r, 10));
    }
    return result;
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

async function scrapeModels() {
    const r = await fetch(DEEPAI_CHAT_URL, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }
    });
    if (!r.ok) return new Set();
    const html = await r.text();

    const match = html.match(/const additionalModels=(\[[\s\S]*?\]);/);
    if (!match) return new Set();

    const models = new Set();
    for (const m of match[1].matchAll(/\{value:"([^"]+)"[^}]*locked:false/g)) {
        models.add(m[1]);
    }
    return models;
}

export async function getDeepAIDefaultModel() {
    const models = await scrapeModels();
    return models.size > 0 ? Array.from(models)[0] : null;
}

const deepaiProvider = {
    id: "deepai",
    source: "deepai.org",
    scrapeModels,
    complete: vexaComplete,
    completeStream: vexaCompleteStream,
};

registerProvider(deepaiProvider);