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
            response.text_models_by_provider = TEXT_MODELS;
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