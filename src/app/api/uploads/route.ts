import { NextResponse } from "next/server";
import { uploadRequestSchema } from "@/lib/schema";
import { ASSET_BUCKET, supabaseAdmin } from "@/lib/supabase/server";

/**
 * Step 1 of submit: the browser sends file metadata (not the files), we validate it
 * and return one signed upload URL per file. The browser then uploads straight to
 * Supabase Storage, bypassing Vercel's 4.5MB function body limit.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid files" },
      { status: 400 },
    );
  }

  const submissionId = crypto.randomUUID();
  const supabase = supabaseAdmin();
  let photoIndex = 0;

  try {
    const uploads = await Promise.all(
      parsed.data.files.map(async (file) => {
        const ext = (file.name.split(".").pop() ?? "img").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "img";
        const base = file.kind === "logo" ? "logo" : `photo-${++photoIndex}`;
        const path = `${submissionId}/${base}.${ext}`;
        const { data, error } = await supabase.storage.from(ASSET_BUCKET).createSignedUploadUrl(path);
        if (error || !data) throw error ?? new Error("No signed URL");
        return { kind: file.kind, name: file.name, path: data.path, token: data.token };
      }),
    );
    return NextResponse.json({ submissionId, uploads });
  } catch (err) {
    console.error("[uploads]", err);
    return NextResponse.json({ error: "Could not prepare uploads. Please try again." }, { status: 500 });
  }
}
