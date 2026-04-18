import { UA, API_URLS, TEMPERATURE_SETTINGS, IMAGE_GENERATION } from "../config.js";

const { POLLINATIONS_URL, POLLINATIONS_IMAGE_URL } = API_URLS;

export async function pollinationsComplete(messages, model) {
    let fullText = "";
    await pollinationsCompleteStream(messages, model, (chunk) => { fullText += chunk; });
    return fullText.trim();
}

export async function pollinationsCompleteStream(messages, model, onChunk) {
    const polModel = model.replace(/^pol-/, "");
    const r = await fetch(POLLINATIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({ model: polModel, messages, temperature: TEMPERATURE_SETTINGS.DEFAULT, stream: true, private: true }),
    });
    if (!r.ok) throw new Error(`Pollinations error ${r.status}`);
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

export async function callPollinationsImage(prompt, model) {
    const polModel = model === "turbo-img" ? "turbo" : model;
    const seed = Math.floor(Math.random() * IMAGE_GENERATION.SEED_RANGE);
    const url = `${POLLINATIONS_IMAGE_URL}${encodeURIComponent(prompt)}?model=${polModel}&width=${IMAGE_GENERATION.DEFAULT_WIDTH}&height=${IMAGE_GENERATION.DEFAULT_HEIGHT}&nologo=true&private=true&seed=${seed}`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`Pollinations error ${res.status}`);
    return url;
}