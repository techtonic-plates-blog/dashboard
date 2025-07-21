import type { APIEvent } from "@solidjs/start/server";
import { assetsClient } from "~/lib/client";

export async function GET({ params }: APIEvent) {
    const { asset } = params;
    
    if (!asset) {
        return new Response("Asset name is required", {
            status: 400,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }

    try {
        const { data, response, error } = await assetsClient.GET("/assets/{asset}", {
            params: {
                path: {
                    asset: decodeURIComponent(asset)
                }
            },
            parseAs: "blob"
        });

        if (!response.ok || !data) {
            return new Response(`Failed to load asset: ${error}`, {
                status: response.status,
                headers: {
                    "Content-Type": "text/plain",
                },
            });
        }

        // Get the content type from the response
        const contentType = response.headers.get("content-type") || "application/octet-stream";
        
        // Stream the blob data directly
        return new Response(data, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": "inline", // Display in browser instead of downloading
                "Cache-Control": "public, max-age=31536000", // Cache for 1 year
                "Content-Length": data.size.toString(),
            },
        });
    } catch (err) {
        console.error("Error fetching asset:", err);
        return new Response("Internal server error", {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    }
}