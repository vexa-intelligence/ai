import { corsHeaders } from "../lib/utils.js";
import { getAllEnabledModels, validImageModels, isModelEnabled, isImageModelEnabled } from "../lib/models.js";
import { DEFAULT_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_IMAGE_PREFERENCE, TEXT_MODELS } from "../config.js";

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

    try {
        const url = new URL(request.url);
        const includeDetails = url.searchParams.get("details") === "true";
        const type = url.searchParams.get("type");

        const allModels = await getAllEnabledModels();

        const response = {
            success: true,
            defaults: {
                text: DEFAULT_MODEL,
                image: DEFAULT_IMAGE_MODEL,
                image_preference: DEFAULT_IMAGE_PREFERENCE
            },
            counts: {
                text: Object.keys(allModels.textModels).length,
                image: allModels.imageModels.length
            }
        };

        if (type === "text" || !type) {
            response.text_models = includeDetails ? allModels.textModels : Object.keys(allModels.textModels);

            const dynamicTextModelsByProvider = { ...TEXT_MODELS };

            const talkaiModels = Object.entries(allModels.textModels)
                .filter(([key, model]) => {
                    return model.provider === "TalkAI" ||
                        (typeof model.provider === 'string' && model.provider.toLowerCase().includes('talkai'));
                })
                .map(([key, model]) => ({
                    name: key,
                    label: model.label || key,
                    provider: "TalkAI",
                    description: model.description || `TalkAI - ${model.label || key}`
                }));

            dynamicTextModelsByProvider.TalkAI = talkaiModels;

            const deepaiModels = Object.entries(allModels.textModels)
                .filter(([key, model]) => model.provider === "DeepAI")
                .map(([key, model]) => ({
                    name: key,
                    label: model.label || key,
                    provider: "DeepAI",
                    description: model.description || `DeepAI - ${model.label || key}`
                }));

            dynamicTextModelsByProvider.DeepAI = deepaiModels;

            const toolbazModels = Object.entries(allModels.textModels)
                .filter(([key, model]) => {
                    const p = model.provider || "";
                    return p !== "DeepAI" && p !== "Dolphin AI" && p !== "Pollinations.ai" &&
                        p !== "AIFree" && p !== "TalkAI" &&
                        !(typeof p === 'string' && p.toLowerCase().includes('talkai'));
                })
                .map(([key, model]) => ({
                    name: key,
                    label: model.label || key,
                    provider: model.provider || "Toolbaz",
                    description: model.description || `${model.provider || "Toolbaz"} - ${model.label || key}`
                }));

            dynamicTextModelsByProvider.Toolbaz = toolbazModels;

            response.text_models_by_provider = dynamicTextModelsByProvider;
        }

        if (type === "image" || !type) {
            response.image_models = includeDetails ? allModels.imageModels : allModels.imageModels.map(m => m.name);
            response.valid_image_models = validImageModels();
        }

        if (includeDetails) {
            response.model_status = {};

            for (const model of Object.keys(allModels.textModels)) {
                response.model_status[model] = {
                    enabled: isModelEnabled(model)
                };
            }

            for (const imageModel of allModels.imageModels) {
                response.model_status[imageModel.name] = {
                    enabled: isImageModelEnabled(imageModel.name),
                    type: "image"
                };
            }
        }

        return Response.json(response, {
            status: 200,
            headers: corsHeaders("GET, OPTIONS")
        });

    } catch (error) {
        return Response.json({
            success: false,
            error: "Failed to fetch models",
            detail: error.message
        }, { status: 500, headers: corsHeaders("GET, OPTIONS") });
    }
}