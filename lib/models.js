import {
    UA, MODEL_SETS, DEEPAI_MODEL_OVERRIDES,
    IMAGE_MODELS, IMAGE_PREFERENCES, POLLINATIONS_TEXT_MODELS_LIST,
    CACHE_SETTINGS, PROVIDER_SETTINGS, API_URLS,
} from "../config.js";
import { unescapeHtml, labelToKey } from "./utils.js";

const { POLLINATIONS_MODELS, DOLPHIN_MODELS, DEEPAI_MODELS, TALKAI_MODELS, DEEPAI_IMAGE_MODELS, POLLINATIONS_IMAGE_MODELS } = MODEL_SETS;
const { MODELS_CACHE_TTL } = CACHE_SETTINGS;
const { TOOLBAZ_PAGE_URL, DEEPAI_CHAT_URL } = API_URLS;

const _modelsCache = { textModels: {}, deepaiModels: new Set(), toolbazModels: new Set(), ts: 0 };

export function isModelEnabled(model) {
    if (TALKAI_MODELS.has(model)) return PROVIDER_SETTINGS.talkai;
    if (DOLPHIN_MODELS.has(model)) return PROVIDER_SETTINGS.dolphin;
    if (POLLINATIONS_MODELS.has(model)) return PROVIDER_SETTINGS.pollinations;
    if (DEEPAI_MODELS.has(model) || model === "vexa") return PROVIDER_SETTINGS.deepai;
    if (model === "gpt-5") return PROVIDER_SETTINGS.aifree;
    return PROVIDER_SETTINGS.toolbaz;
}

export function isImageModelEnabled(model) {
    if (DEEPAI_IMAGE_MODELS.has(model)) return PROVIDER_SETTINGS.deepai;
    if (POLLINATIONS_IMAGE_MODELS.has(model)) return PROVIDER_SETTINGS.pollinations;
    return false;
}

export function resolveSource(model) {
    if (TALKAI_MODELS.has(model)) return "talkai.info";
    if (DOLPHIN_MODELS.has(model)) return "dphn.ai";
    if (POLLINATIONS_MODELS.has(model)) return "pollinations.ai";
    if (DEEPAI_MODELS.has(model) || model === "vexa") return "deepai.org";
    if (model === "gpt-5") return "aifreeforever.com";
    return "toolbaz.com";
}

export function resolveImageSource(model) {
    return POLLINATIONS_IMAGE_MODELS.has(model) ? "pollinations.ai" : "deepai.org";
}

export function resolveImageRoute(model) {
    if (POLLINATIONS_IMAGE_MODELS.has(model)) return "pollinations";
    if (DEEPAI_IMAGE_MODELS.has(model)) return "deepai";
    return null;
}

export function resolveImagePrefKey(preference) {
    return IMAGE_PREFERENCES[preference] || null;
}

export function validImageModels() {
    return [...DEEPAI_IMAGE_MODELS, ...POLLINATIONS_IMAGE_MODELS].join(", ");
}

export function resolveModelRoute(model, toolbazModels, deepaiModels) {
    if (TALKAI_MODELS.has(model) && PROVIDER_SETTINGS.talkai) return "talkai";
    if (DOLPHIN_MODELS.has(model) && PROVIDER_SETTINGS.dolphin) return "dolphin";
    if (POLLINATIONS_MODELS.has(model) && PROVIDER_SETTINGS.pollinations) return "pollinations";
    if ((DEEPAI_MODELS.has(model) || (deepaiModels && deepaiModels.has(model)) || model === "vexa") && PROVIDER_SETTINGS.deepai) return "deepai";
    if (model === "gpt-5" && PROVIDER_SETTINGS.aifree) return "aifree";
    if (toolbazModels && toolbazModels.has(model) && PROVIDER_SETTINGS.toolbaz) return "toolbaz";
    return "toolbaz";
}

export function resolveDeepAIModel(model) {
    return model === "vexa" ? "standard" : model;
}

export function scrapeToolbazModels(html) {
    const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
    if (!selectMatch) return {};
    const block = selectMatch[1];
    const valueToLabel = {};
    const keys = [];
    const seen = new Set();
    for (const m of block.matchAll(/<option[^>]*\bvalue=["']?([^"'\s>]+)[^>]*>\s*([^\n<]+)/gi)) {
        const val = unescapeHtml(m[1].trim());
        const label = unescapeHtml(m[2].trim());
        if (val && !seen.has(val)) { keys.push(val); seen.add(val); valueToLabel[val] = label; }
    }
    const providerMap = {};
    const segments = html.split(/(By\s+[^\n<]{2,60})/);
    let currentProvider = "";
    for (const seg of segments) {
        const by = seg.match(/^By\s+(.+)/);
        if (by) {
            currentProvider = by[1].replace(/[^\w\s()]/g, "").trim();
        } else {
            for (const m of seg.matchAll(/data-value=(?:["']?)([^"'>\s]+)/gi)) {
                if (!providerMap[m[1].trim()]) providerMap[m[1].trim()] = currentProvider;
            }
        }
    }
    const dvPositions = [...html.matchAll(/data-value=(?:["']?)([^"'>\s]+)/gi)].map(m => ({ start: m.index, val: m[1] }));
    const speedMap = {};
    const qualityMap = {};
    dvPositions.forEach(({ start, val }, i) => {
        const end = i + 1 < dvPositions.length ? dvPositions[i + 1].start : start + 2000;
        const window = html.slice(start, end);
        const spd = window.match(/(\d+)\s*W\/s/);
        const qlt = window.match(/quality-indicator[^>]*>(?:\s*<[^>]+>)*\s*(\d+)/);
        if (spd) speedMap[val] = parseInt(spd[1]);
        if (qlt) qualityMap[val] = parseInt(qlt[1]);
    });
    const result = {};
    for (const val of keys) {
        if (val in DEEPAI_MODEL_OVERRIDES) continue;
        result[val] = { label: valueToLabel[val] || val, provider: providerMap[val] || "", speed: speedMap[val] || 0, quality: qualityMap[val] || 0 };
    }
    return result;
}

export async function scrapeDeepAIFreeModels() {
    try {
        const r = await fetch(DEEPAI_CHAT_URL, { headers: { "User-Agent": UA } });
        if (!r.ok) return new Set(Object.keys(DEEPAI_MODEL_OVERRIDES));
        const html = await r.text();
        const freeKeys = new Set(["vexa"]);
        const lockPattern = /lock-icon/;
        const spanPattern = /<span[^>]*>([^<]+)<\/span>/;
        const blocks = html.split(/<div[^>]*class="[^"]*chat-mode-menu-item/i).slice(1);
        for (const block of blocks) {
            if (/chat-mode-locked/.test(block) || lockPattern.test(block)) continue;
            const spanMatch = block.match(spanPattern);
            if (!spanMatch) continue;
            const label = unescapeHtml(spanMatch[1].trim());
            if (!label || label.length < 2) continue;
            const known = Object.entries(DEEPAI_MODEL_OVERRIDES).find(([, v]) => v.label.toLowerCase() === label.toLowerCase());
            freeKeys.add(known ? known[0] : labelToKey(label));
        }
        for (const key of Object.keys(DEEPAI_MODEL_OVERRIDES)) freeKeys.add(key);
        return freeKeys;
    } catch (_) {
        return new Set(Object.keys(DEEPAI_MODEL_OVERRIDES));
    }
}

export async function fetchAvailableModels() {
    try {
        const r = await fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
        if (!r.ok) return [];
        const html = await r.text();
        const selectMatch = html.match(/<select[^>]*\bname=["']?model["']?[^>]*>([\s\S]*?)(?:<\/select>|$)/i);
        if (!selectMatch) return [];
        const seen = new Set();
        const keys = [];
        for (const m of selectMatch[1].matchAll(/<option[^>]*\bvalue=["']?([^"'\s>]+)/gi)) {
            const k = m[1].trim();
            if (k && !seen.has(k)) { keys.push(k); seen.add(k); }
        }
        return keys;
    } catch (_) { return []; }
}

export async function refreshModelsCache() {
    const now = Date.now();
    if (_modelsCache.textModels && Object.keys(_modelsCache.textModels).length > 0 && now - _modelsCache.ts < MODELS_CACHE_TTL) {
        return _modelsCache;
    }
    const [tbRes, deepaiKeys] = await Promise.all([
        fetch(TOOLBAZ_PAGE_URL, { headers: { "User-Agent": UA } }).catch(() => null),
        scrapeDeepAIFreeModels(),
    ]);
    const toolbazRaw = tbRes?.ok ? scrapeToolbazModels(await tbRes.text()) : {};
    const toolbazSet = new Set(["vexa", ...Object.keys(toolbazRaw)]);
    const textModels = {};
    for (const key of deepaiKeys) {
        textModels[key] = key in DEEPAI_MODEL_OVERRIDES
            ? DEEPAI_MODEL_OVERRIDES[key]
            : { label: key, provider: "DeepAI", speed: 0, quality: 0 };
    }
    for (const [key, val] of Object.entries(toolbazRaw)) {
        if (!(key in textModels)) textModels[key] = val;
    }
    for (const pm of POLLINATIONS_TEXT_MODELS_LIST) {
        textModels[pm.key] = { label: pm.label, provider: pm.provider, speed: pm.speed, quality: pm.quality };
    }
    _modelsCache.textModels = textModels;
    _modelsCache.deepaiModels = deepaiKeys;
    _modelsCache.toolbazModels = toolbazSet;
    _modelsCache.ts = now;
    return _modelsCache;
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

export async function getValidModels() {
    const c = await refreshModelsCache();
    return { toolbaz: c.toolbazModels, deepai: c.deepaiModels };
}

const providers = new Map();

export function registerProvider(provider) {
    providers.set(provider.id, provider);
}

export function getProvider(id) {
    return providers.get(id);
}

export function getAllProviders() {
    return Array.from(providers.values());
}