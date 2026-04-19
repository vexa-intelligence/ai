import { PROVIDER_SETTINGS, HEALTH_SETTINGS, API_URLS } from "../config.js";
import { resolveModelRoute, resolveDeepAIModel, resolveImageRoute, resolveImagePrefKey, validImageModels, refreshModelsCache } from "./models.js";
import { vexaCompleteStream, callDeepAIImage } from "../providers/deepai.js";
import { pollinationsCompleteStream, callPollinationsImage } from "../providers/pollinations.js";
import { talkaiCompleteStream } from "../providers/talkai.js";
import { dolphinCompleteStream } from "../providers/dolphin.js";
import { aiFreeCompleteStream } from "../providers/aifree.js";
import { chatgptorgCompleteStream } from "../providers/chatgptorg.js";
import { toolbazCompleteStream } from "../providers/toolbaz.js";

const { HEALTH_PROBE } = HEALTH_SETTINGS;

export async function completeWithAI(prompt, messages, model) {
    let fullText = "";
    let actualModel = model;
    await completeWithAIStream(prompt, messages, model, (chunk, chunkModel) => {
        fullText += chunk;
        if (chunkModel) actualModel = chunkModel;
    });
    return { text: fullText, model: actualModel };
}

export async function completeWithAIStream(prompt, messages, model, onChunk) {
    await refreshModelsCache();
    const msgs = messages || [{ role: "user", content: prompt }];
    const route = resolveModelRoute(model);
    if (route === "talkai") return await talkaiCompleteStream(prompt, model, onChunk);
    if (route === "dolphin") return await dolphinCompleteStream(prompt, model, onChunk);
    if (route === "pollinations") return await pollinationsCompleteStream(msgs, model, onChunk);
    if (route === "deepai") return await vexaCompleteStream(prompt, msgs, await resolveDeepAIModel(model), onChunk);
    if (route === "aifree") return await aiFreeCompleteStream(prompt, msgs, model, onChunk);
    if (route === "chatgptorg") return await chatgptorgCompleteStream(prompt, msgs, model, onChunk);
    return await toolbazCompleteStream(prompt, model, onChunk);
}

export async function generateImage(prompt, model, preference) {
    const route = resolveImageRoute(model);
    if (!route) throw new Error(`Invalid model. Valid values: ${validImageModels()}`);
    if (route === "pollinations" && !PROVIDER_SETTINGS.pollinations) throw new Error("Pollinations provider is disabled");
    if (route === "deepai" && !PROVIDER_SETTINGS.deepai) throw new Error("DeepAI provider is disabled");
    if (route === "pollinations") return await callPollinationsImage(String(prompt).trim().slice(0, 1000), model);
    const prefKey = resolveImagePrefKey(preference);
    if (!prefKey) throw new Error("Invalid preference. Valid values: speed, quality");
    return await callDeepAIImage(String(prompt).trim().slice(0, 1000), "hd", prefKey);
}

export async function checkImage() {
    const t0 = Date.now();
    try {
        const r = await fetch(API_URLS.DEEPAI_IMAGE_URL, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
        return { reachable: r.status < 500, status: r.status, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { reachable: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}

export async function checkModel(model) {
    const t0 = Date.now();
    try {
        let text = "";
        await completeWithAIStream(HEALTH_PROBE, null, model, (chunk) => { text += chunk; });
        return { ok: typeof text === "string" && text.length > 0, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { ok: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}