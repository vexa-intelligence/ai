import {
    UA, MODEL_SETS,
    IMAGE_MODELS, IMAGE_PREFERENCES, POLLINATIONS_TEXT_MODELS_LIST,
    CACHE_SETTINGS, PROVIDER_SETTINGS, API_URLS,
} from "../config.js";

const providers = new Map();

const { POLLINATIONS_MODELS, DOLPHIN_MODELS, DEEPAI_MODELS } = MODEL_SETS;
const { MODELS_CACHE_TTL } = CACHE_SETTINGS;

const _modelsCache = { textModels: {}, ts: 0 };
const _talkaiModelIds = new Set();
const _chatgptorgModelIds = new Set();

export function getTalkaiModelIds() {
    return _talkaiModelIds;
}

export function getChatgptorgModelIds() {
    return _chatgptorgModelIds;
}

export function isModelEnabled(model) {
    if (!model) return PROVIDER_SETTINGS.deepai;
    if (_talkaiModelIds.has(model)) return PROVIDER_SETTINGS.talkai;
    if (DOLPHIN_MODELS.has(model)) return PROVIDER_SETTINGS.dolphin;
    if (POLLINATIONS_MODELS.has(model)) return PROVIDER_SETTINGS.pollinations;
    if (DEEPAI_MODELS.has(model) || model === "vexa") return PROVIDER_SETTINGS.deepai;
    if (_modelsCache.textModels[model]?.provider === "DeepAI") return PROVIDER_SETTINGS.deepai;
    if (model === "gpt-5") return PROVIDER_SETTINGS.aifree;
    if (_chatgptorgModelIds.has(model)) return PROVIDER_SETTINGS.chatgptorg;
    return PROVIDER_SETTINGS.toolbaz;
}

export function resolveSource(model) {
    if (!model) return "deepai.org";
    if (_talkaiModelIds.has(model)) return "talkai.info";
    if (DOLPHIN_MODELS.has(model)) return "dphn.ai";
    if (POLLINATIONS_MODELS.has(model)) return "pollinations.ai";
    if (DEEPAI_MODELS.has(model) || model === "vexa") return "deepai.org";
    if (_modelsCache.textModels[model]?.provider === "DeepAI") return "deepai.org";
    if (model === "gpt-5") return "aifreeforever.com";
    if (_chatgptorgModelIds.has(model)) return "chatgpt.org";
    return "toolbaz.com";
}

export function resolveModelRoute(model) {
    if (!model && PROVIDER_SETTINGS.deepai) return "deepai";
    if (_talkaiModelIds.has(model) && PROVIDER_SETTINGS.talkai) return "talkai";
    if (DOLPHIN_MODELS.has(model) && PROVIDER_SETTINGS.dolphin) return "dolphin";
    if (POLLINATIONS_MODELS.has(model) && PROVIDER_SETTINGS.pollinations) return "pollinations";
    if ((DEEPAI_MODELS.has(model) || model === "vexa") && PROVIDER_SETTINGS.deepai) return "deepai";
    if (_modelsCache.textModels[model]?.provider === "DeepAI" && PROVIDER_SETTINGS.deepai) return "deepai";
    if (model === "gpt-5" && PROVIDER_SETTINGS.aifree) return "aifree";
    if (_chatgptorgModelIds.has(model) && PROVIDER_SETTINGS.chatgptorg) return "chatgptorg";
    if (PROVIDER_SETTINGS.toolbaz) return "toolbaz";
    return "toolbaz";
}

export function resolveImageSource(model) {
    return MODEL_SETS.POLLINATIONS_IMAGE_MODELS.has(model) ? "pollinations.ai" : "deepai.org";
}

export function resolveImageRoute(model) {
    if (MODEL_SETS.POLLINATIONS_IMAGE_MODELS.has(model)) return "pollinations";
    if (MODEL_SETS.DEEPAI_IMAGE_MODELS.has(model)) return "deepai";
    return null;
}

export function resolveImagePrefKey(preference) {
    return IMAGE_PREFERENCES[preference] || null;
}

export function validImageModels() {
    return [...MODEL_SETS.DEEPAI_IMAGE_MODELS, ...MODEL_SETS.POLLINATIONS_IMAGE_MODELS].join(", ");
}

async function getDeepAIDefaultModel() {
    try {
        const r = await fetch(API_URLS.DEEPAI_CHAT_URL, {
            headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" }
        });
        if (!r.ok) return "standard";
        const html = await r.text();

        const match = html.match(/const additionalModels=(\[[\s\S]*?\]);/);
        if (!match) return "standard";

        const models = new Set();
        for (const m of match[1].matchAll(/\{value:"([^"]+)"[^}]*locked:false/g)) {
            models.add(m[1]);
        }
        return models.size > 0 ? Array.from(models)[0] : "standard";
    } catch (e) {
        return "standard";
    }
}

export async function resolveDeepAIModel(model) {
    if (!model || model === "vexa") {
        return await getDeepAIDefaultModel();
    }
    return model;
}

export async function refreshModelsCache() {
    const now = Date.now();
    if (_modelsCache.textModels && Object.keys(_modelsCache.textModels).length > 0 && now - _modelsCache.ts < MODELS_CACHE_TTL) {
        return _modelsCache;
    }

    const providers = getAllProviders();
    const textModels = {};

    for (const provider of providers) {
        if (provider.scrapeModels) {
            try {
                const providerModels = await provider.scrapeModels();
                if (provider.id === "deepai") {
                    for (const key of providerModels) {
                        textModels[key] = { label: key, provider: "DeepAI", speed: 0, quality: 0 };
                    }
                } else if (provider.id === "talkai") {
                    for (const [key, val] of Object.entries(providerModels)) {
                        _talkaiModelIds.add(key);
                        textModels[key] = { ...val, provider: "TalkAI" };
                    }
                } else if (provider.id === "chatgptorg") {
                    for (const [key, val] of Object.entries(providerModels)) {
                        _chatgptorgModelIds.add(key);
                        textModels[key] = { ...val, provider: "ChatGPTOrg" };
                    }
                } else {
                    for (const [key, val] of Object.entries(providerModels)) {
                        if (!(key in textModels)) {
                            textModels[key] = { ...val, provider: val.provider || provider.id };
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to scrape models for provider ${provider.id}:`, error.message);
            }
        }
    }

    for (const pm of POLLINATIONS_TEXT_MODELS_LIST) {
        textModels[pm.key] = { label: pm.label, provider: pm.provider, speed: pm.speed, quality: pm.quality };
    }

    _modelsCache.textModels = textModels;
    _modelsCache.ts = now;
    return _modelsCache;
}

export function isImageModelEnabled(model) {
    if (MODEL_SETS.DEEPAI_IMAGE_MODELS.has(model)) return PROVIDER_SETTINGS.deepai;
    if (MODEL_SETS.POLLINATIONS_IMAGE_MODELS.has(model)) return PROVIDER_SETTINGS.pollinations;
    return false;
}

export async function getAllEnabledModels() {
    const c = await refreshModelsCache();
    const filteredTextModels = {};
    for (const [key, model] of Object.entries(c.textModels)) {
        if (isModelEnabled(key)) filteredTextModels[key] = model;
    }
    return {
        textModels: filteredTextModels,
        imageModels: IMAGE_MODELS.filter(m => isImageModelEnabled(m.name)),
    };
}

export function registerProvider(provider) {
    providers.set(provider.id, provider);
}

export function getProvider(id) {
    return providers.get(id);
}

export function getAllProviders() {
    return Array.from(providers.values());
}