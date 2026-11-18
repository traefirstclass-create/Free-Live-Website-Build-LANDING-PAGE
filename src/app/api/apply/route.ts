import { after, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { submissionSchema } from "@/lib/schema";
import { priorityScore, qualify } from "@/lib/qualification";
import { db } from "@/lib/db";
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

  // Files must belong to this submission and actually exist in Blob.
  const paths = [data.logo_path, ...data.photo_paths];
  if (!paths.every((p) => p.split("/")[1] === data.submission_id)) {
    return NextResponse.json({ error: "Invalid file references" }, { status: 400 });
  }
  try {
    await Promise.all(paths.map((p) => head(p)));
  } catch {
    return NextResponse.json({ error: "Some images didn't finish uploading. Please try again." }, { status: 400 });
  }

  const { status, reasons } = qualify(data);
  // Hidden field filled = possible bot (or aggressive autofill). Save it, but flag it for review.
  if (data.hp_note?.trim()) reasons.push("Review: hidden anti-spam field was filled (possible bot)");
  const score = priorityScore(data);
  const inspiration =
    data.inspiration_url && !/^https?:\/\//i.test(data.inspiration_url)
      ? `https://${data.inspiration_url}`
      : data.inspiration_url || null;

  try {
    await db()`
      insert into applications (
        id, full_name, business_name, email, phone, social_handle, build_format,
        business_description, time_operating, generating_income, monthly_revenue, current_website,
        logo_path, photo_paths, brand_colors, pick_colors_for_me, primary_action, inspiration_url, services,
        agree_preview, ready_to_invest, consent_stream, available_dm,
        status, disqualify_reasons, priority_score
      ) values (
        ${data.submission_id}, ${data.full_name}, ${data.business_name}, ${data.email.toLowerCase()},
        ${data.phone}, ${data.social_handle}, ${data.build_format},
        ${data.business_description}, ${data.time_operating}, ${data.generating_income === "yes"},
        ${data.monthly_revenue}, ${data.current_website},
        ${data.logo_path}, ${data.photo_paths}, ${data.pick_colors_for_me ? null : data.brand_colors},
        ${data.pick_colors_for_me}, ${data.primary_action}, ${inspiration}, ${data.services},
        ${data.agree_preview}, ${data.ready_to_invest},
        ${data.build_format === "private" ? false : data.consent_stream}, ${data.available_dm},
        ${status}, ${reasons}, ${score}
      )`;
  } catch (err) {
    if (typeof err === "object" && err && "code" in err && err.code === "23505") {
      return NextResponse.json({ error: "This application was already submitted." }, { status: 409 });
    }
    console.error("[apply] insert failed", err);
    return NextResponse.json({ error: "Something went wrong saving your application. Please try again." }, { status: 500 });
  }

  // Send the notification after responding so the applicant isn't kept waiting.
  after(() => sendApplicationEmail(data, { id: data.submission_id, status, reasons, score }));

  return NextResponse.json({ status, buildFormat: data.build_format });
}
