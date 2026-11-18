import { get } from "@vercel/blob";
import { isAdmin } from "@/lib/admin-auth";
import { ASSET_PATH_RE } from "@/lib/schema";

/**
 * Streams a private applicant image to a signed-in admin.
 * Links like /api/admin/asset?path=… never expire; they just require the admin login.
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";
  if (!ASSET_PATH_RE.test(path)) return new Response("Not found", { status: 404 });

  const file = await get(path, { access: "private" });
  if (!file || file.statusCode !== 200) return new Response("Not found", { status: 404 });

  const download = url.searchParams.get("download") === "1";
  return new Response(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      ...(download ? { "Content-Disposition": `attachment; filename="${path.split("/").pop()}"` } : {}),
    },
  });
}
