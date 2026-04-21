import { UA, API_URLS, FORM_TEMPLATES, PROVIDER_SETTINGS } from "../config.js";
import { registerProvider } from "../lib/models.js";

const { AIFREE_NONCE_URL, AIFREE_ANSWER_URL } = API_URLS;

export async function getAiFreeNonce() {
    const r = await fetch(AIFREE_NONCE_URL, {
        method: "GET",
        headers: { "Referer": "https://aifreeforever.com/", "Origin": "https://aifreeforever.com", "User-Agent": UA },
    });
    if (!r.ok) throw new Error(`Nonce fetch failed: ${r.status}`);
    const j = await r.json();
    return j.nonce || j.data?.nonce || Object.values(j)[0];
}

export async function aiFreeComplete(prompt, messages) {
    let fullText = "";
    await aiFreeCompleteStream(prompt, messages, (chunk) => { fullText += chunk; });
    return fullText;
}

export async function aiFreeCompleteStream(prompt, messages, onChunk) {
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

const aifreeProvider = {
    id: "aifree",
    source: "aifreeforever.com",
    enabled: () => PROVIDER_SETTINGS.aifree,
    complete: aiFreeComplete,
    completeStream: aiFreeCompleteStream,
};

registerProvider(aifreeProvider);

export default aifreeProvider;