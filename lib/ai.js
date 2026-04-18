import { MODEL_SETS, PROVIDER_SETTINGS, HEALTH_SETTINGS, API_URLS } from "../config.js";
import { resolveModelRoute, resolveDeepAIModel, resolveImageRoute, resolveImagePrefKey, validImageModels, getValidModels } from "./models.js";
import { vexaComplete, vexaCompleteStream, callDeepAIImage } from "../providers/deepai.js";
import { pollinationsComplete, pollinationsCompleteStream, callPollinationsImage } from "../providers/pollinations.js";
import { talkaiComplete, talkaiCompleteStream } from "../providers/talkai.js";
import { dolphinComplete, dolphinCompleteStream } from "../providers/dolphin.js";
import { aiFreeComplete, aiFreeCompleteStream } from "../providers/aifree.js";
import { toolbazComplete, toolbazCompleteStream } from "../providers/toolbaz.js";

const { TALKAI_MODELS, DOLPHIN_MODELS, POLLINATIONS_MODELS, DEEPAI_MODELS } = MODEL_SETS;
const { HEALTH_PROBE } = HEALTH_SETTINGS;

export async function completeWithAI(prompt, messages, model) {
    const msgs = messages || [{ role: "user", content: prompt }];
    let fullText = "";
    await completeWithAIStream(prompt, messages, model, (chunk) => {
        fullText += chunk;
    });
    return fullText;
}

export async function completeWithAIStream(prompt, messages, model, onChunk) {
    const msgs = messages || [{ role: "user", content: prompt }];
    const { toolbaz: toolbazModels, deepai: deepaiModels } = await getValidModels();
    const route = resolveModelRoute(model, toolbazModels, deepaiModels);
    if (route === "talkai") return await talkaiCompleteStream(prompt, model, onChunk);
    if (route === "dolphin") return await dolphinCompleteStream(prompt, model, onChunk);
    if (route === "pollinations") return await pollinationsCompleteStream(msgs, model, onChunk);
    if (route === "deepai") return await vexaCompleteStream(prompt, msgs, resolveDeepAIModel(model), onChunk);
    if (route === "aifree") return await aiFreeCompleteStream(prompt, msgs, model, onChunk);
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
        if (TALKAI_MODELS.has(model) && !PROVIDER_SETTINGS.talkai) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        if (DOLPHIN_MODELS.has(model) && !PROVIDER_SETTINGS.dolphin) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        if (POLLINATIONS_MODELS.has(model) && !PROVIDER_SETTINGS.pollinations) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        if ((DEEPAI_MODELS.has(model) || model === "vexa") && !PROVIDER_SETTINGS.deepai) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        if (model === "gpt-5" && !PROVIDER_SETTINGS.aifree) return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        const msgs = [{ role: "user", content: HEALTH_PROBE }];
        let text;
        if (TALKAI_MODELS.has(model)) text = await talkaiComplete(HEALTH_PROBE, model);
        else if (DOLPHIN_MODELS.has(model)) text = await dolphinComplete(HEALTH_PROBE, model);
        else if (POLLINATIONS_MODELS.has(model)) text = await pollinationsComplete(msgs, model);
        else if (DEEPAI_MODELS.has(model) || model === "vexa") text = await vexaComplete(HEALTH_PROBE, msgs, model === "vexa" ? "standard" : model);
        else if (model === "gpt-5") text = await aiFreeComplete(HEALTH_PROBE, msgs, model);
        else if (PROVIDER_SETTINGS.toolbaz) text = await toolbazComplete(HEALTH_PROBE, model);
        else return { ok: false, error: "Provider disabled", latency_ms: Date.now() - t0 };
        return { ok: typeof text === "string" && text.length > 0, latency_ms: Date.now() - t0 };
    } catch (e) {
        return { ok: false, error: e.message, latency_ms: Date.now() - t0 };
    }
}