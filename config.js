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
    AIFREE_NONCE_URL: "https://aifreeforever.com/api/chat-nonce",
    AIFREE_ANSWER_URL: "https://aifreeforever.com/api/generate-ai-answer"
};

export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const MODEL_SETS = {
    POLLINATIONS_MODELS: new Set(["pol-openai-fast"]),
    DOLPHIN_MODELS: new Set(["dolphin-logical", "dolphin-creative", "dolphin-summarize", "dolphin-code-beginner", "dolphin-code-advanced"]),
    DEEPAI_MODELS: new Set(["vexa", "gemini-2.5-flash-lite", "gpt-4.1-nano", "deepseek-v3.2", "llama-3.3-70b", "llama-3.1-8b", "llama-4-scout", "qwen3-30b", "gpt-5-nano", "gpt-oss-120b", "dolphin-logical", "dolphin-creative", "dolphin-summarize", "dolphin-code-beginner", "dolphin-code-advanced", "claude-3-haiku", "gemini-2.0-flash-lite", "deepseek-chat"]),
    TALKAI_MODELS: new Set(["claude-3-haiku", "gemini-2.0-flash-lite", "deepseek-chat", "gpt-4.1-nano"]),
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
    TALKAI_MODEL_IDS: {
        "claude-3-haiku": "claude-3-haiku-20240307",
        "gemini-2.0-flash-lite": "gemini-2.0-flash-lite",
        "deepseek-chat": "deepseek-chat",
        "gpt-4.1-nano": "gpt-4.1-nano"
    }
};

export const DEEPAI_MODEL_OVERRIDES = {
    "vexa": { label: "Vexa", provider: "vexa-ai", speed: 0, quality: 0 },
    "dolphin-logical": { label: "Dolphin 24B (Logical)", provider: "Dolphin AI", speed: 300, quality: 78 },
    "dolphin-creative": { label: "Dolphin 24B (Creative)", provider: "Dolphin AI", speed: 300, quality: 76 },
    "dolphin-summarize": { label: "Dolphin 24B (Summarize)", provider: "Dolphin AI", speed: 300, quality: 75 },
    "dolphin-code-beginner": { label: "Dolphin 24B (Code Beginner)", provider: "Dolphin AI", speed: 300, quality: 74 },
    "dolphin-code-advanced": { label: "Dolphin 24B (Code Advanced)", provider: "Dolphin AI", speed: 280, quality: 79 },
    "gemini-2.5-flash-lite": { label: "Gemini 2.5 Flash Lite", provider: "Google", speed: 180, quality: 72 },
    "gpt-4.1-nano": { label: "GPT-4.1 Nano", provider: "OpenAI", speed: 320, quality: 70 },
    "deepseek-v3.2": { label: "DeepSeek V3.2", provider: "DeepSeek", speed: 280, quality: 81 },
    "llama-3.3-70b": { label: "Llama 3.3 70B Instruct", provider: "Facebook (Meta)", speed: 250, quality: 78 },
    "llama-3.1-8b": { label: "Llama 3.1 8B Instant", provider: "Facebook (Meta)", speed: 400, quality: 65 },
    "llama-4-scout": { label: "Llama 4 Scout", provider: "Facebook (Meta)", speed: 300, quality: 76 },
    "qwen3-30b": { label: "Qwen3 30B", provider: "Alibaba", speed: 260, quality: 77 },
    "gpt-5-nano": { label: "GPT-5 Nano", provider: "OpenAI", speed: 350, quality: 74 },
    "gpt-oss-120b": { label: "GPT OSS 120B", provider: "OpenAI", speed: 200, quality: 80 },
    "claude-3-haiku": { label: "Claude 3 Haiku", provider: "Anthropic", speed: 310, quality: 74 },
    "gemini-2.0-flash-lite": { label: "Gemini 2.0 Flash-Lite", provider: "Google", speed: 340, quality: 71 },
    "deepseek-chat": { label: "DeepSeek V3", provider: "DeepSeek", speed: 280, quality: 80 },
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
    DeepAI: [
        { name: "vexa", label: "Vexa", provider: "vexa-ai", description: "Vexa AI - default" },
        { name: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "Google", description: "Google's fast lightweight model" },
        { name: "gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "OpenAI", description: "OpenAI's compact GPT-4.1" },
        { name: "deepseek-v3.2", label: "DeepSeek V3.2", provider: "DeepSeek", description: "DeepSeek's advanced reasoning" },
        { name: "llama-3.3-70b", label: "Llama 3.3 70B Instruct", provider: "Facebook (Meta)", description: "Meta's large instruction model" },
        { name: "llama-3.1-8b", label: "Llama 3.1 8B Instant", provider: "Facebook (Meta)", description: "Meta's fast lightweight model" },
        { name: "llama-4-scout", label: "Llama 4 Scout", provider: "Facebook (Meta)", description: "Meta's next-gen model" },
        { name: "qwen3-30b", label: "Qwen3 30B", provider: "Alibaba", description: "Alibaba's balanced model" },
        { name: "gpt-5-nano", label: "GPT-5 Nano", provider: "OpenAI", description: "OpenAI's next-gen compact" },
        { name: "gpt-oss-120b", label: "GPT OSS 120B", provider: "OpenAI", description: "OpenAI's large open-source" },
        { name: "claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic", description: "Anthropic's fast compact model" },
        { name: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite", provider: "Google", description: "Google's ultra-fast model" },
        { name: "deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek", description: "DeepSeek's chat-optimized" },
        { name: "dolphin-logical", label: "Dolphin 24B (Logical)", provider: "Dolphin AI", description: "Logical reasoning specialist" },
        { name: "dolphin-creative", label: "Dolphin 24B (Creative)", provider: "Dolphin AI", description: "Creative writing specialist" },
        { name: "dolphin-summarize", label: "Dolphin 24B (Summarize)", provider: "Dolphin AI", description: "Summarization specialist" },
        { name: "dolphin-code-beginner", label: "Dolphin 24B (Code Beginner)", provider: "Dolphin AI", description: "Beginner code assistance" },
        { name: "dolphin-code-advanced", label: "Dolphin 24B (Code Advanced)", provider: "Dolphin AI", description: "Advanced code assistance" },
    ],
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
    AIFree: [
        { name: "gpt-5", label: "GPT-5", provider: "AIFree", description: "GPT-5 via AIFree" },
    ],
    Toolbaz: [
        { name: "toolbaz-v4.5-fast", label: "Toolbaz V4.5 Fast", provider: "Toolbaz", description: "Toolbaz fast model v4.5" },
        { name: "deepseek-v3.1", label: "DeepSeek V3.1", provider: "DeepSeek", description: "DeepSeek V3.1 via Toolbaz" },
        { name: "gemini-3-flash", label: "Gemini 3 Flash", provider: "Google", description: "Gemini 3 Flash via Toolbaz" },
        { name: "L3-70B-Euryale-v2.1", label: "L3 70B Euryale v2.1", provider: "Meta", description: "Llama 3 70B Euryale via Toolbaz" },
        { name: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", provider: "Google", description: "Gemini 3.1 Flash Lite via Toolbaz" },
        { name: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", description: "Gemini 2.5 Pro via Toolbaz" },
        { name: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", description: "Gemini 2.5 Flash via Toolbaz" },
        { name: "deepseek-v3", label: "DeepSeek V3", provider: "DeepSeek", description: "DeepSeek V3 via Toolbaz" },
        { name: "deepseek-r1", label: "DeepSeek R1", provider: "DeepSeek", description: "DeepSeek R1 reasoning via Toolbaz" },
        { name: "gpt-5.2", label: "GPT-5.2", provider: "OpenAI", description: "GPT-5.2 via Toolbaz" },
        { name: "o3-mini", label: "O3 Mini", provider: "OpenAI", description: "OpenAI O3 Mini via Toolbaz" },
        { name: "gpt-4o-latest", label: "GPT-4O Latest", provider: "OpenAI", description: "GPT-4O Latest via Toolbaz" },
        { name: "claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic", description: "Claude Sonnet 4 via Toolbaz" },
        { name: "grok-4-fast", label: "Grok 4 Fast", provider: "xAI", description: "Grok 4 Fast via Toolbaz" },
        { name: "toolbaz_v4", label: "Toolbaz V4", provider: "Toolbaz", description: "Toolbaz model v4" },
        { name: "Llama-4-Maverick", label: "Llama 4 Maverick", provider: "Meta", description: "Llama 4 Maverick via Toolbaz" },
        { name: "midnight-rose", label: "Midnight Rose", provider: "Toolbaz", description: "Midnight Rose via Toolbaz" },
        { name: "unfiltered_x", label: "Unfiltered X", provider: "Toolbaz", description: "Unfiltered X via Toolbaz" },
    ],
};

export const IMAGE_PREFERENCES = { speed: "turbo", quality: "quality" };
export const DEFAULT_IMAGE_MODEL = "hd";
export const DEFAULT_IMAGE_PREFERENCE = "speed";

export const POLLINATIONS_TEXT_MODELS_LIST = [
    { key: "pol-openai-fast", label: "Pollinations GPT-OSS", provider: "Pollinations.ai", speed: 280, quality: 72 },
];

export const DEFAULT_MODEL = "vexa";

export const CACHE_SETTINGS = {
    MODELS_CACHE_TTL: 300000
};

export const HEALTH_SETTINGS = {
    HEALTH_PROBE: "Hi",
    MAX_MODELS_TO_CHECK: 100
};

export const PROVIDER_SETTINGS = {
    toolbaz: false,
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