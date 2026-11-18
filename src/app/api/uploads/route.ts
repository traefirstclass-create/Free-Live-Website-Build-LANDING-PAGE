import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { ALLOWED_IMAGE_TYPES, ASSET_PATH_RE, MAX_FILE_BYTES } from "@/lib/schema";

/**
 * Issues short-lived client tokens so the browser can upload each image straight
 * to Vercel Blob (bypassing the 4.5MB function body limit). The stored files are
 * permanent; only this one-time upload permission expires.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!ASSET_PATH_RE.test(pathname)) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[uploads]", err);
    const message = err instanceof Error && err.message === "Invalid upload path" ? err.message : "Could not prepare upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
