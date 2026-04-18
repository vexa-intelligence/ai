import { UA, API_URLS, MODEL_MAPPINGS } from "../config.js";

const { DOLPHIN_URL } = API_URLS;
const { DOLPHIN_TEMPLATE_MAP } = MODEL_MAPPINGS;

export async function dolphinComplete(prompt, model) {
    let fullText = "";
    await dolphinCompleteStream(prompt, model, (chunk) => {
        fullText += chunk;
    });
    return fullText.trim();
}

export async function dolphinCompleteStream(prompt, model, onChunk) {
    const template = DOLPHIN_TEMPLATE_MAP[model] || "logical";
    const r = await fetch(DOLPHIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA, "Referer": "https://chat.dphn.ai/", "Origin": "https://chat.dphn.ai" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "dolphinserver:24B", template }),
    });
    if (!r.ok) throw new Error(`Dolphin error ${r.status}`);
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