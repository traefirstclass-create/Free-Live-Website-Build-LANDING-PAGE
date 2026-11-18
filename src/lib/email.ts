import "server-only";
import { Resend } from "resend";
import {
  BUILD_FORMAT_LABELS,
  PRIMARY_ACTION_LABELS,
  REVENUE_LABELS,
  TIME_OPERATING_LABELS,
  WEBSITE_LABELS,
  type Submission,
} from "./schema";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendApplicationEmail(
  data: Submission,
  meta: { id: string; status: string; reasons: string[]; score: number },
) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.warn("[email] Resend env vars missing — skipping notification");
    return;
  }

  const rows: [string, string][] = [
    ["Status", `${meta.status.toUpperCase()} · Priority ${meta.score}/100`],
    ...(meta.reasons.length ? [["Reasons", meta.reasons.join("; ")] as [string, string]] : []),
    ["Build format", BUILD_FORMAT_LABELS[data.build_format]],
    ["Name", data.full_name],
    ["Business", data.business_name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Handle", data.social_handle],
    ["What they do", data.business_description],
    ["Operating", TIME_OPERATING_LABELS[data.time_operating]],
    ["Generating income", data.generating_income === "yes" ? "Yes" : "No"],
    ["Monthly revenue", REVENUE_LABELS[data.monthly_revenue]],
    ["Current website", WEBSITE_LABELS[data.current_website]],
    ["Brand colours", data.pick_colors_for_me ? "Pick for me" : data.brand_colors],
    ["Primary action", PRIMARY_ACTION_LABELS[data.primary_action]],
    ["Inspiration", data.inspiration_url || "—"],
    ["Services", data.services],
    ["Ready to invest $300", data.ready_to_invest ? "Yes" : "No"],
    ["Stream consent", data.build_format === "private" ? "n/a (private)" : data.consent_stream ? "Yes" : "No"],
  ];

  const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:640px">
      <h2 style="margin:0 0 12px">New application: ${esc(data.business_name)}</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <p><a href="${esc(adminUrl)}">Open admin →</a></p>
    </div>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: to.split(",").map((s) => s.trim()),
    replyTo: data.email,
    subject: `[${meta.status === "qualified" ? "✓" : "✗"} ${meta.score}] ${data.business_name} — ${BUILD_FORMAT_LABELS[data.build_format]}`,
    html,
  });
  if (error) console.error("[email] Resend error", error);
}
