import { UA, API_URLS, MODEL_MAPPINGS, TEMPERATURE_SETTINGS } from "../config.js";
import { cleanText } from "../lib/utils.js";

const { TALKAI_URL } = API_URLS;
const { TALKAI_MODEL_IDS } = MODEL_MAPPINGS;

export async function talkaiComplete(prompt, model) {
    let fullText = "";
    await talkaiCompleteStream(prompt, model, (chunk) => {
        fullText += chunk;
    });
    return cleanText(fullText.replace(/An internal server error occurred\.?/gi, "").trim());
}

export async function talkaiCompleteStream(prompt, model, onChunk) {
    const modelId = TALKAI_MODEL_IDS[model] || model;
    const messages = [{ id: "0", from: "you", content: prompt, model: "" }];
    const payload = { type: "chat", messagesHistory: messages, settings: { model: modelId, temperature: TEMPERATURE_SETTINGS.DEFAULT } };
    const r = await fetch(TALKAI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA, "Referer": "https://talkai.info/", "Origin": "https://talkai.info" },
        body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`TalkAI error ${r.status}`);
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let skipNext = false;
    let accumulated = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const line of lines) {
            if (line.startsWith("event:")) { skipNext = true; continue; }
            if (!line.startsWith("data:")) continue;
            if (skipNext) { skipNext = false; continue; }
            const data = line.slice(5);
            if (!data.trim() || data.trim() === "[DONE]") continue;
            accumulated += data;
            const chars = data.split("");
            for (const char of chars) {
                onChunk(char);
                await new Promise(r => setTimeout(r, 5));
            }
        }
    }
    if (buf.startsWith("data:") && !skipNext) {
        const data = buf.slice(5);
        if (data.trim() && data.trim() !== "[DONE]") {
            const chars = data.split("");
            for (const char of chars) {
                onChunk(char);
                await new Promise(r => setTimeout(r, 5));
            }
        }
    }
}