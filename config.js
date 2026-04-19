export const API_URLS = {
    TOOLBAZ_PAGE_URL: "https://toolbaz.com/writer/chat-gpt-alternative",
    TOKEN_URL: "https://data.toolbaz.com/token.php",
    WRITE_URL: "https://data.toolbaz.com/writing.php",
    DEEPAI_API: "https://api.deepai.org",
    DEEPAI_CHAT_URL: "https://deepai.org/chat",
    DEEPAI_IMAGE_URL: "https://api.deepai.org/api/text2img",
    POLLINATIONS_URL: "https://text.pollinations.ai/openai",
    POLLINATIONS_IMAGE_URL: "https://image.pollinations.ai/prompt/",
    DOLPHIN_URL: "https://chat.dphn.ai/api/chat",
    TALKAI_URL: "https://talkai.info/chat/send/",
    TALKAI_PAGE_URL: "https://talkai.info/chat/",
    AIFREE_NONCE_URL: "https://aifreeforever.com/api/chat-nonce",
    AIFREE_ANSWER_URL: "https://aifreeforever.com/api/generate-ai-answer",
};

export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const MODEL_SETS = {
    POLLINATIONS_MODELS: new Set(["pol-openai-fast"]),
    DOLPHIN_MODELS: new Set(["dolphin-logical", "dolphin-creative", "dolphin-summarize", "dolphin-code-beginner", "dolphin-code-advanced"]),
    DEEPAI_MODELS: new Set([]),
    DEEPAI_IMAGE_MODELS: new Set(["hd"]),
    POLLINATIONS_IMAGE_MODELS: new Set(["flux", "turbo-img", "kontext", "seedream", "nanobanana"])
};

export const MODEL_MAPPINGS = {
    DOLPHIN_TEMPLATE_MAP: {
        "dolphin-logical": "logical",
        "dolphin-creative": "creative",
        "dolphin-summarize": "summarize",
        "dolphin-code-beginner": "code_beginner",
        "dolphin-code-advanced": "code_advanced"
    },
    DEEPAI_MODEL_MAP: {
        "qwen3-30b": "qwen3-30b-a3b"
    },
    TALKAI_MODEL_IDS: {}
};

export const IMAGE_MODELS = [
    { name: "hd", label: "HD", description: "Standard HD generation - DeepAI" },
    { name: "flux", label: "Flux", description: "Fast, high quality - default" },
    { name: "turbo", label: "Flux Turbo", description: "Fastest generation" },
    { name: "kontext", label: "Flux Kontext", description: "Instruction-following edits" },
    { name: "seedream", label: "Seedream 3", description: "ByteDance - photorealistic" },
    { name: "nanobanana", label: "Nano Banana", description: "Gemini-powered - high detail" },
];

export const TEXT_MODELS = {
    DeepAI: [],
    DolphinAI: [
        { name: "dolphin-logical", label: "Dolphin 24B (Logical)", provider: "Dolphin AI", description: "Logical reasoning specialist" },
        { name: "dolphin-creative", label: "Dolphin 24B (Creative)", provider: "Dolphin AI", description: "Creative writing specialist" },
        { name: "dolphin-summarize", label: "Dolphin 24B (Summarize)", provider: "Dolphin AI", description: "Summarization specialist" },
        { name: "dolphin-code-beginner", label: "Dolphin 24B (Code Beginner)", provider: "Dolphin AI", description: "Beginner code assistance" },
        { name: "dolphin-code-advanced", label: "Dolphin 24B (Code Advanced)", provider: "Dolphin AI", description: "Advanced code assistance" },
    ],
    Pollinations: [
        { name: "pol-openai-fast", label: "Pollinations GPT-OSS", provider: "Pollinations.ai", description: "Open-source GPT alternative" },
    ],
    TalkAI: [],
    AIFree: [
        { name: "gpt-5", label: "GPT-5", provider: "AIFree", description: "GPT-5 via AIFree" },
    ],
    Toolbaz: [],
};

export const IMAGE_PREFERENCES = { speed: "turbo", quality: "quality" };
export const DEFAULT_IMAGE_MODEL = "hd";
export const DEFAULT_IMAGE_PREFERENCE = "speed";

export const POLLINATIONS_TEXT_MODELS_LIST = [
    { key: "pol-openai-fast", label: "Pollinations GPT-OSS", provider: "Pollinations.ai", speed: 280, quality: 72 },
];

export const DEFAULT_MODEL = "";

export const CACHE_SETTINGS = {
    MODELS_CACHE_TTL: 300000
};

export const HEALTH_SETTINGS = {
    HEALTH_PROBE: "Hi",
    MAX_MODELS_TO_CHECK: 100
};

export const PROVIDER_SETTINGS = {
    toolbaz: true,
    deepai: true,
    pollinations: true,
    dolphin: false,
    talkai: true,
    aifree: true,
};

export const REQUEST_HEADERS = {
    POST_HDRS: {
        "User-Agent": UA,
        "Referer": API_URLS.TOOLBAZ_PAGE_URL,
        "Origin": "https://toolbaz.com",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept-Language": "en-US,en;q=0.9",
    }
};

export const SECURITY_CONSTANTS = {
    RANDOM_STRING_CHARS: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    HACKER_SECRET: "hackers_become_a_little_stinkier_every_time_they_hack"
};

export const API_KEYS = {
    DEEPAI_IMAGE_BOUNDARY: "----DeepAIBound7MA4YWxkTrZu0gW"
};

export const FORM_TEMPLATES = {
    VEXA_CHAT_STYLE: "chat",
    VEXA_ENABLED_TOOLS: JSON.stringify(["image_generator", "image_editor"]),
    AIFREE_TONE: "friendly",
    AIFREE_FORMAT: "paragraph"
};

export const TEMPERATURE_SETTINGS = {
    DEFAULT: 0.7
};

export const IMAGE_GENERATION = {
    DEFAULT_WIDTH: 1024,
    DEFAULT_HEIGHT: 1024,
    SEED_RANGE: 999999
};