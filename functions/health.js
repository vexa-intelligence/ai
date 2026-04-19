import { corsHeaders } from "../lib/utils.js";
import { getAllEnabledModels } from "../lib/models.js";
import { checkModel } from "../lib/ai.js";
import { API_URLS, HEALTH_SETTINGS, MODEL_SETS, PROVIDER_SETTINGS } from "../config.js";

const { TOOLBAZ_PAGE_URL, TOKEN_URL, DEEPAI_IMAGE_URL } = API_URLS;
const { MAX_MODELS_TO_CHECK } = HEALTH_SETTINGS;

const SKIP_HEALTH_PROVIDERS = new Set(["ChatGPTOrg"]);

async function checkPageReachability() {
    const t0 = Date.now();
    try {
        const response = await fetch(TOOLBAZ_PAGE_URL, {
            method: "HEAD",
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        return {
            reachable: response.ok,
            status_code: response.status,
            latency_ms: Date.now() - t0
        };
    } catch (error) {
        return {
            reachable: false,
            error: error.message,
            latency_ms: Date.now() - t0
        };
    }
}

async function checkTokenEndpoint() {
    const t0 = Date.now();
    try {
        const response = await fetch(TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            body: "action=get_token"
        });
        const text = await response.text();
        return {
            reachable: response.ok,
            token_received: response.ok && text.length > 0,
            status_code: response.status,
            latency_ms: Date.now() - t0
        };
    } catch (error) {
        return {
            reachable: false,
            error: error.message,
            latency_ms: Date.now() - t0
        };
    }
}

async function checkImageEndpoint() {
    const t0 = Date.now();
    try {
        const response = await fetch(DEEPAI_IMAGE_URL, {
            method: "HEAD",
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        return {
            reachable: true,
            status_code: response.status,
            latency_ms: Date.now() - t0
        };
    } catch (error) {
        return {
            reachable: false,
            error: error.message,
            latency_ms: Date.now() - t0
        };
    }
}

export async function onRequest({ request }) {
    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders("GET, OPTIONS") });
    }

    if (request.method !== "GET") {
        return Response.json({
            success: false,
            error: "Method not allowed"
        }, { status: 405, headers: corsHeaders("GET, OPTIONS") });
    }

    const startTime = Date.now();
    const url = new URL(request.url);
    const skipModels = url.searchParams.get("skip_models") === "true";

    try {
        const [pageCheck, tokenCheck, imageCheck] = await Promise.all([
            checkPageReachability(),
            checkTokenEndpoint(),
            checkImageEndpoint()
        ]);

        const checks = {
            page: pageCheck,
            token: tokenCheck,
            image: imageCheck
        };

        let modelChecks = {};
        let failedModels = [];

        if (!skipModels) {
            const allModels = await getAllEnabledModels();
            const textModelKeys = Object.keys(allModels.textModels);

            const modelsToCheck = textModelKeys
                .filter(key => {
                    const provider = allModels.textModels[key]?.provider;
                    return !SKIP_HEALTH_PROVIDERS.has(provider);
                })
                .slice(0, MAX_MODELS_TO_CHECK);

            const skippedProviderModels = textModelKeys.filter(key => {
                const provider = allModels.textModels[key]?.provider;
                return SKIP_HEALTH_PROVIDERS.has(provider);
            });

            const modelPromises = modelsToCheck.map(async (model) => {
                const result = await checkModel(model);
                return { model, result };
            });

            const modelResults = await Promise.all(modelPromises);

            for (const { model, result } of modelResults) {
                modelChecks[model] = {
                    ok: result.ok,
                    latency_ms: result.latency_ms
                };
                if (!result.ok) {
                    modelChecks[model].error = result.error;
                    failedModels.push(model);
                }
            }

            for (const model of skippedProviderModels) {
                const provider = allModels.textModels[model]?.provider;
                modelChecks[model] = {
                    ok: null,
                    skipped: true,
                    reason: `${provider} not checked to avoid rate limiting`
                };
            }

            if (modelsToCheck.length < textModelKeys.length - skippedProviderModels.length) {
                const skippedCount = textModelKeys.length - skippedProviderModels.length - modelsToCheck.length;
                modelChecks._skipped = {
                    count: skippedCount,
                    note: `Only first ${MAX_MODELS_TO_CHECK} models checked to prevent timeout`
                };
            }
        }

        checks.models = modelChecks;

        const allChecksPassed = pageCheck.reachable &&
            tokenCheck.reachable &&
            imageCheck.reachable &&
            failedModels.length === 0;

        const response = {
            success: true,
            status: allChecksPassed ? "ok" : "degraded",
            timestamp: Math.floor(Date.now() / 1000),
            total_ms: Date.now() - startTime,
            checks
        };

        if (failedModels.length > 0) {
            response.failed_models = failedModels;
        }

        return Response.json(response, {
            status: 200,
            headers: corsHeaders("GET, OPTIONS")
        });

    } catch (error) {
        return Response.json({
            success: false,
            error: "Health check failed",
            detail: error.message,
            total_ms: Date.now() - startTime
        }, { status: 500, headers: corsHeaders("GET, OPTIONS") });
    }
}