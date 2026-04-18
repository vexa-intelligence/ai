import { UA, API_URLS, FORM_TEMPLATES } from "../config.js";
import { generateImageKey, buildDeepAIImageBody } from "../lib/crypto.js";

const { DEEPAI_API, DEEPAI_IMAGE_URL } = API_URLS;

export async function vexaComplete(prompt, messages, model = "standard") {
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
    return full.trim();
}

export async function vexaCompleteStream(prompt, messages, model, onChunk) {
    const fullText = await vexaComplete(prompt, messages, model);
    const chunks = fullText.match(/.{1,4}/g) || [];
    for (const chunk of chunks) {
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 10));
    }
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