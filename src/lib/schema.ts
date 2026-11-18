import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Option sets (value = stored in DB, label = shown to people)         */
/* ------------------------------------------------------------------ */

export const BUILD_FORMATS = ["live", "private", "either"] as const;
export const BUILD_FORMAT_LABELS: Record<BuildFormat, string> = {
  live: "Live on stream",
  private: "Off-live (private build)",
  either: "Either works",
};

export const TIME_OPERATING = ["lt_3m", "3_12m", "1_3y", "3y_plus"] as const;
export const TIME_OPERATING_LABELS: Record<TimeOperating, string> = {
  lt_3m: "Less than 3 months",
  "3_12m": "3–12 months",
  "1_3y": "1–3 years",
  "3y_plus": "3+ years",
};

export const REVENUE_BANDS = ["under_1k", "1k_5k", "5k_20k", "20k_plus"] as const;
export const REVENUE_LABELS: Record<RevenueBand, string> = {
  under_1k: "Under $1K",
  "1k_5k": "$1K–$5K",
  "5k_20k": "$5K–$20K",
  "20k_plus": "$20K+",
};

export const WEBSITE_STATUS = ["yes", "no", "hate_it"] as const;
export const WEBSITE_LABELS: Record<WebsiteStatus, string> = {
  yes: "Yes",
  no: "No",
  hate_it: "Yes, but I hate it",
};

export const PRIMARY_ACTIONS = ["book", "call", "buy", "dm"] as const;
export const PRIMARY_ACTION_LABELS: Record<PrimaryAction, string> = {
  book: "Book",
  call: "Call",
  buy: "Buy",
  dm: "DM",
};

export type BuildFormat = (typeof BUILD_FORMATS)[number];
export type TimeOperating = (typeof TIME_OPERATING)[number];
export type RevenueBand = (typeof REVENUE_BANDS)[number];
export type WebsiteStatus = (typeof WEBSITE_STATUS)[number];
export type PrimaryAction = (typeof PRIMARY_ACTIONS)[number];

/* ------------------------------------------------------------------ */
/* File rules (shared by client validation and the upload API)         */
/* ------------------------------------------------------------------ */

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 6;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/svg+xml",
] as const;

/* ------------------------------------------------------------------ */
/* Field schema (text answers only, files handled separately)          */
/* ------------------------------------------------------------------ */

const pick = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.enum(values, { error: message });

const looseUrl = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export const applicationShape = {
  // Step 1 — Basics
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  business_name: z.string().trim().min(2, "Please enter your business name").max(160),
  email: z.email("Please enter a valid email address").trim().max(200),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a valid phone number")
    .max(30)
    .regex(/^[+()\d\s.-]+$/, "Use digits, spaces and + ( ) - only"),
  social_handle: z.string().trim().min(2, "Please enter your Instagram or TikTok handle").max(80),
  build_format: pick(BUILD_FORMATS, "Choose how you'd like your build"),

  // Step 2 — Qualification
  business_description: z
    .string()
    .trim()
    .min(10, "Tell me a little more (at least 10 characters)")
    .max(1500),
  time_operating: pick(TIME_OPERATING, "Choose how long you've been operating"),
  generating_income: pick(["yes", "no"] as const, "Choose yes or no"),
  monthly_revenue: pick(REVENUE_BANDS, "Choose a revenue range"),
  current_website: pick(WEBSITE_STATUS, "Choose an option"),

  // Step 3 — Build assets (text parts)
  brand_colors: z.string().trim().max(200),
  pick_colors_for_me: z.boolean(),
  primary_action: pick(PRIMARY_ACTIONS, "Choose the main action visitors should take"),
  inspiration_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || looseUrl.test(v), "Enter a valid website (e.g. example.com)"),
  services: z.string().trim().min(5, "List at least one service or product with its price").max(3000),

  // Step 4 — Agreement
  agree_preview: z.literal(true, { error: "Please confirm you understand the pricing" }),
  // Not hard-required: leaving it unchecked is allowed, but auto-disqualifies.
  ready_to_invest: z.boolean(),
  // Required only for live / either (enforced in refineApplication).
  consent_stream: z.boolean(),
  available_dm: z.literal(true, { error: "Please confirm you'll be reachable by DM" }),

  // Honeypot — real people never see or fill this.
  company_website: z.string().max(0).optional(),
};

/* Cross-field rules, shared by client (per step) and server (all at once). */

/** Stream/replay consent is required only for "live" and "either". */
export function refineConsent(
  data: { build_format?: BuildFormat; consent_stream?: boolean },
  ctx: z.RefinementCtx,
) {
  if (data.build_format !== "private" && data.consent_stream !== true) {
    ctx.addIssue({
      code: "custom",
      path: ["consent_stream"],
      message: "Required for live builds — or choose “Off-live (private build)” in Step 1",
    });
  }
}

export function refineColors(
  data: { brand_colors?: string; pick_colors_for_me?: boolean },
  ctx: z.RefinementCtx,
) {
  if (!data.pick_colors_for_me && !data.brand_colors?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["brand_colors"],
      message: "Add your brand colours, or tick “Pick for me”",
    });
  }
}

export function refineApplication(
  data: Parameters<typeof refineConsent>[0] & Parameters<typeof refineColors>[0],
  ctx: z.RefinementCtx,
) {
  refineConsent(data, ctx);
  refineColors(data, ctx);
}

export const applicationFieldsSchema = z.object(applicationShape).superRefine(refineApplication);
export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;

/* ------------------------------------------------------------------ */
/* Blob paths: applications/<submission uuid>/logo.png, photo-1.jpg…   */
/* ------------------------------------------------------------------ */

export const ASSET_PREFIX = "applications";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const ASSET_PATH_RE = new RegExp(`^${ASSET_PREFIX}/(${UUID})/(logo|photo-[1-${MAX_PHOTOS}])\\.[a-z0-9]{1,5}$`);

export function assetPath(submissionId: string, base: string, fileName: string) {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "img";
  return `${ASSET_PREFIX}/${submissionId}/${base}.${ext}`;
}

/** What the browser POSTs to /api/apply after files are uploaded. */
export const submissionSchema = z
  .object({
    ...applicationShape,
    submission_id: z.uuid(),
    logo_path: z.string().regex(ASSET_PATH_RE),
    photo_paths: z.array(z.string().regex(ASSET_PATH_RE)).min(MIN_PHOTOS).max(MAX_PHOTOS),
  })
  .superRefine(refineApplication);
export type Submission = z.infer<typeof submissionSchema>;
