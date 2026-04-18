import { onRequest as handleIndex } from "./functions/index.js";
import { onRequest as handleChat } from "./functions/chat.js";
import { onRequest as handleHealth } from "./functions/health.js";
import { onRequest as handleImageProxy } from "./functions/image-proxy.js";
import { onRequest as handleImage } from "./functions/image.js";
import { onRequest as handleModels } from "./functions/models.js";
import { onRequest as handleQuery } from "./functions/query.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route to appropriate function
    if (path === "/" || path === "") {
      return handleIndex({ request, env, ctx });
    } else if (path === "/chat") {
      return handleChat({ request, env, ctx });
    } else if (path === "/health") {
      return handleHealth({ request, env, ctx });
    } else if (path.startsWith("/image/proxy/")) {
      return handleImageProxy({ request, env, ctx });
    } else if (path === "/image") {
      return handleImage({ request, env, ctx });
    } else if (path === "/models") {
      return handleModels({ request, env, ctx });
    } else if (path === "/query") {
      return handleQuery({ request, env, ctx });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ success: false, error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
};
