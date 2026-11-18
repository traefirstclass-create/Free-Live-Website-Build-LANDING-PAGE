"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch, type FieldPath, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ALLOWED_IMAGE_TYPES,
  BUILD_FORMAT_LABELS,
  BUILD_FORMATS,
  MAX_FILE_BYTES,
  MAX_PHOTOS,
  MIN_PHOTOS,
  PRIMARY_ACTION_LABELS,
  PRIMARY_ACTIONS,
  REVENUE_BANDS,
  REVENUE_LABELS,
  TIME_OPERATING,
  TIME_OPERATING_LABELS,
  WEBSITE_LABELS,
  WEBSITE_STATUS,
  applicationShape as s,
  assetPath,
  refineColors,
  refineConsent,
  type BuildFormat,
} from "@/lib/schema";
import { upload } from "@vercel/blob/client";

/* ------------------------------------------------------------------ */
/* Client-side schemas (one per step, so each step validates alone)    */
/* ------------------------------------------------------------------ */

const EXT_TYPES: Record<string, string> = { heic: "image/heic", heif: "image/heif" };
const fileType = (f: File) => f.type || EXT_TYPES[f.name.split(".").pop()?.toLowerCase() ?? ""] || "";

const imageFile = z
  .instanceof(File)
  .refine((f) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(fileType(f)), "Images only (JPG, PNG, WEBP, GIF, HEIC, SVG)")
  .refine((f) => f.size <= MAX_FILE_BYTES, "Each image must be 10MB or smaller");

const fileFields = {
  logo: z.array(imageFile).length(1, "Please upload your logo"),
  photos: z
    .array(imageFile)
    .min(MIN_PHOTOS, `Upload at least ${MIN_PHOTOS} photos`)
    .max(MAX_PHOTOS, `Upload no more than ${MAX_PHOTOS} photos`),
};

const stepSchemas = [
  z.object({
    full_name: s.full_name,
    business_name: s.business_name,
    email: s.email,
    phone: s.phone,
    social_handle: s.social_handle,
    build_format: s.build_format,
    hp_note: s.hp_note,
  }),
  z.object({
    business_description: s.business_description,
    time_operating: s.time_operating,
    generating_income: s.generating_income,
    monthly_revenue: s.monthly_revenue,
    current_website: s.current_website,
  }),
  z
    .object({
      ...fileFields,
      brand_colors: s.brand_colors,
      pick_colors_for_me: s.pick_colors_for_me,
      primary_action: s.primary_action,
      inspiration_url: s.inspiration_url,
      services: s.services,
    })
    .superRefine(refineColors),
  z
    .object({
      build_format: s.build_format,
      agree_preview: s.agree_preview,
      ready_to_invest: s.ready_to_invest,
      consent_stream: s.consent_stream,
      available_dm: s.available_dm,
    })
    .superRefine(refineConsent),
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fullSchema = z.object({ ...s, ...fileFields });
type FormValues = z.input<typeof fullSchema>;

const STEPS = [
  { title: "Basics", fields: ["full_name", "business_name", "email", "phone", "social_handle", "build_format"] },
  { title: "Qualification", fields: ["business_description", "time_operating", "generating_income", "monthly_revenue", "current_website"] },
  { title: "Build assets", fields: ["logo", "photos", "brand_colors", "pick_colors_for_me", "primary_action", "inspiration_url", "services"] },
  { title: "Agreement", fields: ["agree_preview", "ready_to_invest", "consent_stream", "available_dm"] },
] as const satisfies { title: string; fields: FieldPath<FormValues>[] }[];

type Result = { status: "qualified" | "disqualified"; buildFormat: BuildFormat };

/* ------------------------------------------------------------------ */

export function ApplicationForm() {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);

  // Validate only the current step's schema.
  const resolver = useMemo<Resolver<FormValues>>(
    () => (values, ctx, opts) =>
      (zodResolver(stepSchemas[stepRef.current]) as unknown as Resolver<FormValues>)(values, ctx, opts),
    [],
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    mode: "onTouched",
    shouldFocusError: true,
    defaultValues: {
      full_name: "",
      business_name: "",
      email: "",
      phone: "",
      social_handle: "",
      business_description: "",
      brand_colors: "",
      pick_colors_for_me: false,
      inspiration_url: "",
      services: "",
      ready_to_invest: false,
      consent_stream: false,
      logo: [],
      photos: [],
      hp_note: "",
    },
  });

  const buildFormat = useWatch({ control, name: "build_format" });
  const pickForMe = useWatch({ control, name: "pick_colors_for_me" });
  const isPrivate = buildFormat === "private";

  useEffect(() => {
    if (isPrivate) setValue("consent_stream", false);
  }, [isPrivate, setValue]);

  // Move focus to the new step heading for keyboard/screen-reader users.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, result]);

  async function next() {
    const ok = await trigger(STEPS[step].fields as unknown as FieldPath<FormValues>[], { shouldFocus: true });
    if (ok) setStep((n) => Math.min(n + 1, STEPS.length - 1));
  }

  async function onSubmit() {
    setServerError(null);
    // The resolver only returns the current step's fields, so read every step's answers.
    const values = getValues();
    try {
      // 1) Upload each image straight to Vercel Blob (permanent, private storage).
      setPhase("uploading");
      const submissionId = crypto.randomUUID();
      const files = [
        ...values.logo.map((f) => ({ file: f, path: assetPath(submissionId, "logo", f.name) })),
        ...values.photos.map((f, i) => ({ file: f, path: assetPath(submissionId, `photo-${i + 1}`, f.name) })),
      ];
      await Promise.all(
        files.map(async ({ file, path }) => {
          try {
            await upload(path, file, {
              access: "private",
              handleUploadUrl: "/api/uploads",
              contentType: fileType(file),
            });
          } catch {
            throw new Error(`Upload failed for ${file.name}. Please try again.`);
          }
        }),
      );

      // 2) Save the application.
      setPhase("saving");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { logo, photos, ...fields } = values;
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          submission_id: submissionId,
          logo_path: files[0].path,
          photo_paths: files.slice(1).map((f) => f.path),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setResult(json as Result);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPhase("idle");
    }
  }

  if (result) return <ResultPanel result={result} headingRef={headingRef} topRef={topRef} />;

  const progress = ((step + 1) / STEPS.length) * 100;
  const busy = phase !== "idle";

  return (
    <div ref={topRef} className="scroll-mt-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-muted">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-gold-300">{STEPS[step].title}</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Application progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step].title}`}
        >
          <div className="h-full rounded-full bg-gold transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-3 hidden grid-cols-4 gap-2 text-xs text-muted sm:grid">
          {STEPS.map((st, i) => (
            <li key={st.title} className={i <= step ? "text-cream" : ""} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {st.title}
            </li>
          ))}
        </ol>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) void next();
          else void handleSubmit(onSubmit)(e);
        }}
      >
        <h3 ref={headingRef} tabIndex={-1} className="mb-6 font-serif text-2xl font-semibold outline-none sm:text-3xl">
          {["Tell me about you", "Tell me about your business", "Your build assets", "The fine print"][step]}
        </h3>

        {/* Honeypot (hidden from people and screen readers) */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Leave this blank
            <input type="text" tabIndex={-1} autoComplete="off" data-1p-ignore data-lpignore="true" data-form-type="other" {...register("hp_note")} />
          </label>
        </div>

        <div key={step} className="animate-fade-up space-y-6">
          {step === 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField label="Full name" autoComplete="name" error={errors.full_name?.message} {...register("full_name")} />
                <TextField label="Business name" autoComplete="organization" error={errors.business_name?.message} {...register("business_name")} />
                <TextField label="Email" type="email" inputMode="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
                <TextField label="Phone" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
              </div>
              <TextField
                label="Instagram / TikTok handle"
                placeholder="@yourbusiness"
                autoCapitalize="none"
                error={errors.social_handle?.message}
                {...register("social_handle")}
              />
              <RadioGroup
                legend="How would you like your build?"
                name="build_format"
                options={BUILD_FORMATS.map((v) => ({ value: v, label: BUILD_FORMAT_LABELS[v] }))}
                register={register("build_format")}
                error={errors.build_format?.message}
                columns={3}
              />
            </>
          )}

          {step === 1 && (
            <>
              <TextArea label="What does your business do?" rows={4} error={errors.business_description?.message} {...register("business_description")} />
              <RadioGroup
                legend="How long have you been operating?"
                name="time_operating"
                options={TIME_OPERATING.map((v) => ({ value: v, label: TIME_OPERATING_LABELS[v] }))}
                register={register("time_operating")}
                error={errors.time_operating?.message}
                columns={2}
              />
              <RadioGroup
                legend="Are you currently generating income?"
                name="generating_income"
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                register={register("generating_income")}
                error={errors.generating_income?.message}
                columns={2}
              />
              <RadioGroup
                legend="Average monthly revenue"
                name="monthly_revenue"
                options={REVENUE_BANDS.map((v) => ({ value: v, label: REVENUE_LABELS[v] }))}
                register={register("monthly_revenue")}
                error={errors.monthly_revenue?.message}
                columns={2}
              />
              <RadioGroup
                legend="Do you have a current website?"
                name="current_website"
                options={WEBSITE_STATUS.map((v) => ({ value: v, label: WEBSITE_LABELS[v] }))}
                register={register("current_website")}
                error={errors.current_website?.message}
                columns={3}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Controller
                control={control}
                name="logo"
                render={({ field }) => (
                  <FilePicker
                    label="Logo"
                    hint="One image, max 10MB."
                    files={field.value}
                    max={1}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldError(errors.logo)}
                  />
                )}
              />
              <Controller
                control={control}
                name="photos"
                render={({ field }) => (
                  <FilePicker
                    label="Photos"
                    hint={`${MIN_PHOTOS}–${MAX_PHOTOS} images of your work, products, space or team. Max 10MB each.`}
                    files={field.value}
                    max={MAX_PHOTOS}
                    multiple
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldError(errors.photos)}
                  />
                )}
              />
              <div>
                <TextField
                  label="Brand colours"
                  placeholder="e.g. black, gold, #C99A3C"
                  disabled={pickForMe}
                  error={errors.brand_colors?.message}
                  {...register("brand_colors")}
                />
                <Checkbox className="mt-3" {...register("pick_colors_for_me")}>
                  Pick for me
                </Checkbox>
              </div>
              <RadioGroup
                legend="What should visitors do first?"
                name="primary_action"
                options={PRIMARY_ACTIONS.map((v) => ({ value: v, label: PRIMARY_ACTION_LABELS[v] }))}
                register={register("primary_action")}
                error={errors.primary_action?.message}
                columns={4}
              />
              <TextField
                label="Inspiration website (optional)"
                type="url"
                inputMode="url"
                placeholder="example.com"
                autoCapitalize="none"
                error={errors.inspiration_url?.message}
                {...register("inspiration_url")}
              />
              <TextArea
                label="Services / products with prices"
                rows={5}
                placeholder={"Signature facial — $120\nLash lift — $85"}
                error={errors.services?.message}
                {...register("services")}
              />
            </>
          )}

          {step === 3 && (
            <fieldset className="space-y-4">
              <legend className="sr-only">Agreement</legend>
              <Checkbox required error={errors.agree_preview?.message} {...register("agree_preview")}>
                I understand the {isPrivate ? "private" : "live"} build is a free preview. Keeping the site and launching it on my domain costs $300.
              </Checkbox>
              <Checkbox required error={errors.ready_to_invest?.message} {...register("ready_to_invest")}>
                I&apos;m ready to invest $300 if I love the result.
              </Checkbox>
              {!isPrivate && (
                <Checkbox required error={errors.consent_stream?.message} {...register("consent_stream")}>
                  I agree to have my business featured on a live stream and in replays.
                </Checkbox>
              )}
              <Checkbox required error={errors.available_dm?.message} {...register("available_dm")}>
                I&apos;ll be available by DM during my build.
              </Checkbox>
              <p className="pt-2 text-sm text-muted">
                By applying you agree to the{" "}
                <a href="/terms" target="_blank" className="text-gold-300 underline underline-offset-4 hover:text-gold-100">
                  Terms
                </a>
                .
              </p>
            </fieldset>
          )}
        </div>

        {serverError && (
          <p role="alert" className="mt-6 rounded-xl border border-alert/40 bg-alert/10 px-4 py-3 text-sm text-cream">
            {serverError}
          </p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((n) => n - 1)}
              disabled={busy}
              className="min-h-12 rounded-full border border-white/15 px-6 py-3 font-medium text-cream transition hover:border-gold-400/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 disabled:opacity-50"
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="min-h-12 rounded-full bg-gold px-8 py-3 font-semibold text-ink shadow-[0_10px_40px_-12px_rgb(224_187_99/0.6)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300 disabled:cursor-wait disabled:opacity-70"
          >
            {phase === "uploading"
              ? "Uploading your images…"
              : phase === "saving"
                ? "Submitting…"
                : step < STEPS.length - 1
                  ? "Continue →"
                  : "Submit application"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result                                                              */
/* ------------------------------------------------------------------ */

function ResultPanel({
  result,
  headingRef,
  topRef,
}: {
  result: Result;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  topRef: React.RefObject<HTMLDivElement | null>;
}) {
  const qualified = result.status === "qualified";
  const message = !qualified
    ? "Thanks for applying! Right now live builds are reserved for established, revenue-generating businesses. Follow along on the live, and apply again when you're ready."
    : result.buildFormat === "private"
      ? "You're in! I'll reach out to schedule your private build and send your preview link when it's ready."
      : "You're in the running! Watch for your name on the next live.";

  return (
    <div ref={topRef} role="status" aria-live="polite" className="animate-fade-up scroll-mt-6 py-6 text-center">
      <div
        aria-hidden="true"
        className={`mx-auto mb-6 grid size-16 place-items-center rounded-full text-2xl font-bold ${qualified ? "bg-gold text-ink" : "border border-gold-400/40 text-gold-300"}`}
      >
        {qualified ? "✓" : "♡"}
      </div>
      <h3 ref={headingRef} tabIndex={-1} className="font-serif text-3xl font-semibold outline-none sm:text-4xl">
        {qualified ? <span className="text-gold">Application received</span> : "Thank you"}
      </h3>
      <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted">{message}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

function fieldError(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "object" && err && "message" in err && typeof err.message === "string") return err.message;
  if (Array.isArray(err)) return err.find((e) => e?.message)?.message;
  return undefined;
}

const inputCls =
  "block w-full rounded-xl border bg-white/[0.035] px-4 py-3.5 text-base text-cream placeholder:text-muted/60 transition focus:outline-none focus:ring-2 focus:ring-gold-400/60 disabled:opacity-40";

function ErrorText({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-sm text-[#ff8a8c]">
      <span aria-hidden="true">!</span> {children}
    </p>
  );
}

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; ref?: React.Ref<HTMLInputElement> };

function TextField({ label, error, className, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-cream">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${inputCls} ${error ? "border-alert/70" : "border-white/12 hover:border-white/25"}`}
        {...props}
      />
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </div>
  );
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; ref?: React.Ref<HTMLTextAreaElement> };

function TextArea({ label, error, ...props }: TextAreaProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-cream">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`${inputCls} resize-y ${error ? "border-alert/70" : "border-white/12 hover:border-white/25"}`}
        {...props}
      />
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </div>
  );
}

function RadioGroup({
  legend,
  name,
  options,
  register,
  error,
  columns = 2,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  register: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  error?: string;
  columns?: 2 | 3 | 4;
}) {
  const id = useId();
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }[columns];
  return (
    <fieldset aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-3 text-sm font-medium text-cream">{legend}</legend>
      <div className={`grid gap-2.5 ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className="relative block cursor-pointer">
            <input type="radio" value={o.value} className="peer sr-only" {...register} name={name} />
            <span
              className={`flex min-h-12 items-center gap-3 rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-cream transition peer-checked:border-gold-400 peer-checked:bg-gold-400/10 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-400/70 hover:border-white/30 ${error ? "border-alert/60" : "border-white/12"}`}
            >
              <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-full border border-gold-400/60">
                <span className="size-2 scale-0 rounded-full bg-gold-400 transition-transform [label:has(:checked)_&]:scale-100" />
              </span>
              {o.label}
            </span>
          </label>
        ))}
      </div>
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </fieldset>
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  children: ReactNode;
  error?: string;
  ref?: React.Ref<HTMLInputElement>;
};

function Checkbox({ children, error, className = "", required, ...props }: CheckboxProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-base leading-relaxed text-cream">
        <span className="relative mt-1 grid size-5 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : undefined}
            className={`peer size-5 cursor-pointer appearance-none rounded-md border bg-white/[0.03] transition checked:border-gold-400 checked:bg-gold-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 ${error ? "border-alert/80" : "border-gold-400/60"}`}
            {...props}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute size-3.5 text-ink opacity-0 transition-opacity peer-checked:opacity-100"
          >
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span>
          {children}
          {required && <span className="sr-only"> (required)</span>}
        </span>
      </label>
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </div>
  );
}

function FilePicker({
  label,
  hint,
  files,
  max,
  multiple,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  hint: string;
  files: File[];
  max: number;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  onBlur: () => void;
  error?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const full = files.length >= max;

  return (
    <div>
      <p id={`${id}-label`} className="mb-2 block text-sm font-medium text-cream">
        {label} <span className="font-normal text-muted">({files.length}/{max})</span>
      </p>
      <p id={`${id}-hint`} className="mb-3 text-sm text-muted">
        {hint}
      </p>

      {files.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className="relative">
              <Thumb file={f} />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.name}`}
                className="absolute -right-1.5 -top-1.5 grid size-7 place-items-center rounded-full border border-white/20 bg-ink text-sm text-cream hover:border-alert hover:text-alert focus-visible:outline-2 focus-visible:outline-gold-300"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <label
          htmlFor={id}
          className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-4 py-6 text-center transition hover:border-gold-400/70 hover:bg-gold-400/[0.04] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-400/60 ${error ? "border-alert/70" : "border-white/20"}`}
        >
          <span className="text-sm font-medium text-gold-300">{multiple ? "Add photos" : "Upload logo"}</span>
          <span className="text-xs text-muted">Tap to choose from your device</span>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="sr-only"
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-hint${error ? ` ${id}-err` : ""}`}
            aria-invalid={!!error}
            onBlur={onBlur}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              onChange([...files, ...picked].slice(0, max));
              e.target.value = "";
            }}
          />
        </label>
      )}
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </div>
  );
}

function Thumb({ file }: { file: File }) {
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    if (imgRef.current) imgRef.current.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const tooBig = file.size > MAX_FILE_BYTES;
  return (
    <div className={`aspect-square overflow-hidden rounded-xl border bg-white/5 ${tooBig ? "border-alert" : "border-white/10"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} alt={file.name} className="size-full object-cover" />
    </div>
  );
}
