import { after, NextResponse } from "next/server";
import { submissionSchema } from "@/lib/schema";
import { priorityScore, qualify } from "@/lib/qualification";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendApplicationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid application" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Files must live inside this submission's folder (issued by /api/uploads).
  const prefix = `${data.submission_id}/`;
  const paths = [data.logo_path, ...data.photo_paths];
  if (!paths.every((p) => p.startsWith(prefix) && !p.includes(".."))) {
    return NextResponse.json({ error: "Invalid file references" }, { status: 400 });
  }

  const { status, reasons } = qualify(data);
  const score = priorityScore(data);
  const inspiration =
    data.inspiration_url && !/^https?:\/\//i.test(data.inspiration_url)
      ? `https://${data.inspiration_url}`
      : data.inspiration_url || null;

  const { error } = await supabaseAdmin()
    .from("applications")
    .insert({
      id: data.submission_id,
      full_name: data.full_name,
      business_name: data.business_name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      social_handle: data.social_handle,
      build_format: data.build_format,
      business_description: data.business_description,
      time_operating: data.time_operating,
      generating_income: data.generating_income === "yes",
      monthly_revenue: data.monthly_revenue,
      current_website: data.current_website,
      logo_path: data.logo_path,
      photo_paths: data.photo_paths,
      brand_colors: data.pick_colors_for_me ? null : data.brand_colors,
      pick_colors_for_me: data.pick_colors_for_me,
      primary_action: data.primary_action,
      inspiration_url: inspiration,
      services: data.services,
      agree_preview: data.agree_preview,
      ready_to_invest: data.ready_to_invest,
      consent_stream: data.build_format === "private" ? false : data.consent_stream,
      available_dm: data.available_dm,
      status,
      disqualify_reasons: reasons,
      priority_score: score,
    });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This application was already submitted." }, { status: 409 });
    }
    console.error("[apply] insert failed", error);
    return NextResponse.json({ error: "Something went wrong saving your application. Please try again." }, { status: 500 });
  }

  // Send the notification after responding so the applicant isn't kept waiting.
  after(() => sendApplicationEmail(data, { id: data.submission_id, status, reasons, score }));

  return NextResponse.json({ status, buildFormat: data.build_format });
}
