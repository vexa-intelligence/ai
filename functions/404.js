export async function onRequest(ctx) {
    const { request } = ctx;
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }
    const url = new URL(request.url);
    return Response.json(
        { success: false, error: "Not found", path: url.pathname },
        {
            status: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
        }
    );
}