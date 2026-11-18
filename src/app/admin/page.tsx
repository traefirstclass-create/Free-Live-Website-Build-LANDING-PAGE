import type { Metadata } from "next";
import { Suspense } from "react";
import { isAdmin } from "@/lib/admin-auth";
import { ASSET_BUCKET, supabaseAdmin, type ApplicationRow } from "@/lib/supabase/server";
import {
  BUILD_FORMAT_LABELS,
  PRIMARY_ACTION_LABELS,
  REVENUE_LABELS,
  TIME_OPERATING_LABELS,
  WEBSITE_LABELS,
} from "@/lib/schema";
import { login, logout, toggleFlag } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Admin always reads the request (cookie + filters); opt out of instant-nav validation.
export const instant = false;

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <main id="main" className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <AdminGate searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function AdminGate({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  if (!(await isAdmin())) return <Login error={one(sp.error) === "1"} />;
  return <Dashboard sp={sp} />;
}

function Login({ error }: { error: boolean }) {
  return (
    <div className="glass mx-auto mt-16 max-w-sm rounded-3xl p-8">
      <h1 className="font-serif text-3xl font-semibold">
        <span className="text-gold">Admin</span>
      </h1>
      <form action={login} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={error}
            aria-describedby={error ? "pw-err" : undefined}
            className="block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-cream focus:outline-none focus:ring-2 focus:ring-gold-400/60"
          />
          {error && (
            <p id="pw-err" role="alert" className="mt-2 text-sm text-[#ff8a8c]">
              Incorrect password.
            </p>
          )}
        </div>
        <button className="min-h-11 w-full rounded-full bg-gold px-6 py-3 font-semibold text-ink hover:brightness-110">
          Sign in
        </button>
      </form>
    </div>
  );
}

const STATUS_FILTERS = ["all", "qualified", "disqualified"] as const;
const FORMAT_FILTERS = ["all", "live", "private", "either"] as const;
const SORTS = { priority: "Priority score", newest: "Newest first" } as const;

async function Dashboard({ sp }: { sp: SP }) {
  const status = STATUS_FILTERS.find((v) => v === one(sp.status)) ?? "all";
  const format = FORMAT_FILTERS.find((v) => v === one(sp.format)) ?? "all";
  const sort = one(sp.sort) === "newest" ? "newest" : "priority";

  const supabase = supabaseAdmin();
  let q = supabase.from("applications").select("*").limit(500);
  if (status !== "all") q = q.eq("status", status);
  if (format !== "all") q = q.eq("build_format", format);
  q =
    sort === "priority"
      ? q.order("priority_score", { ascending: false }).order("created_at", { ascending: false })
      : q.order("created_at", { ascending: false });

  const { data, error } = await q;
  const rows = (data ?? []) as ApplicationRow[];

  // Signed thumbnail URLs (bucket is private), valid 1 hour.
  const paths = rows.flatMap((r) => [r.logo_path, ...(r.photo_paths ?? [])]).filter(Boolean) as string[];
  const urlByPath = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from(ASSET_BUCKET).createSignedUrls(paths, 3600);
    signed?.forEach((s) => s.path && s.signedUrl && urlByPath.set(s.path, s.signedUrl));
  }

  const counts = {
    total: rows.length,
    qualified: rows.filter((r) => r.status === "qualified").length,
    built: rows.filter((r) => r.is_built).length,
    paid: rows.filter((r) => r.is_paid).length,
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            <span className="text-gold">Applications</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {counts.total} shown · {counts.qualified} qualified · {counts.built} built · {counts.paid} paid
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-gold-400/60">Sign out</button>
        </form>
      </div>

      <form method="get" className="glass mt-6 flex flex-wrap items-end gap-4 rounded-2xl p-4">
        <Select name="status" label="Status" value={status} options={STATUS_FILTERS.map((v) => [v, v === "all" ? "All" : cap(v)])} />
        <Select
          name="format"
          label="Build format"
          value={format}
          options={FORMAT_FILTERS.map((v) => [v, v === "all" ? "All" : BUILD_FORMAT_LABELS[v]])}
        />
        <Select name="sort" label="Sort by" value={sort} options={Object.entries(SORTS)} />
        <button className="min-h-10 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink">Apply filters</button>
      </form>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-alert/40 bg-alert/10 p-4 text-sm">
          Could not load applications: {error.message}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Score</th>
              <th scope="col" className="px-4 py-3">Applicant</th>
              <th scope="col" className="px-4 py-3">Build format</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Business</th>
              <th scope="col" className="px-4 py-3">Assets</th>
              <th scope="col" className="px-4 py-3">Built</th>
              <th scope="col" className="px-4 py-3">Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  No applications match these filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-4">
                  <span className="font-serif text-2xl font-semibold text-gold">{r.priority_score}</span>
                </td>
                <td className="px-4 py-4">
                  <p className="font-semibold text-cream">{r.business_name}</p>
                  <p className="text-muted">{r.full_name}</p>
                  <p className="mt-1">
                    <a className="text-gold-300 hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
                  </p>
                  <p className="text-muted">
                    <a href={`tel:${r.phone}`}>{r.phone}</a> · {r.social_handle}
                  </p>
                  <p className="mt-1 text-xs text-muted">{new Date(r.created_at).toLocaleString("en-US")}</p>
                  <details className="mt-2 max-w-xs">
                    <summary className="cursor-pointer text-xs text-gold-300">Full answers</summary>
                    <dl className="mt-2 space-y-1.5 text-xs">
                      <Detail k="What they do" v={r.business_description} />
                      <Detail k="Current website" v={WEBSITE_LABELS[r.current_website]} />
                      <Detail k="Primary action" v={PRIMARY_ACTION_LABELS[r.primary_action]} />
                      <Detail k="Brand colours" v={r.pick_colors_for_me ? "Pick for me" : r.brand_colors ?? "—"} />
                      <Detail k="Inspiration" v={r.inspiration_url ?? "—"} />
                      <Detail k="Services" v={r.services} />
                      <Detail k="Ready to invest" v={r.ready_to_invest ? "Yes" : "No"} />
                      <Detail k="Stream consent" v={r.build_format === "private" ? "n/a" : r.consent_stream ? "Yes" : "No"} />
                    </dl>
                  </details>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-1 text-xs ${
                      r.build_format === "private"
                        ? "border-white/20 text-cream"
                        : r.build_format === "live"
                          ? "border-alert/50 text-[#ff9a9c]"
                          : "border-gold-400/50 text-gold-300"
                    }`}
                  >
                    {BUILD_FORMAT_LABELS[r.build_format]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.status === "qualified" ? "bg-gold text-ink" : "bg-white/10 text-muted"
                    }`}
                  >
                    {cap(r.status)}
                  </span>
                  {r.disqualify_reasons?.length > 0 && (
                    <ul className="mt-2 list-disc pl-4 text-xs text-muted">
                      {r.disqualify_reasons.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-4 text-muted">
                  <p>{REVENUE_LABELS[r.monthly_revenue]}/mo</p>
                  <p>{TIME_OPERATING_LABELS[r.time_operating]}</p>
                  <p>Income: {r.generating_income ? "Yes" : "No"}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex max-w-[260px] flex-wrap gap-1.5">
                    {[r.logo_path, ...(r.photo_paths ?? [])].filter(Boolean).map((p, i) => {
                      const url = urlByPath.get(p!);
                      return url ? (
                        <a key={p} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={i === 0 ? `${r.business_name} logo` : `${r.business_name} photo ${i}`}
                            className={`size-14 rounded-lg border object-cover ${i === 0 ? "border-gold-400/60 bg-white/90 object-contain p-1" : "border-white/10"}`}
                            loading="lazy"
                          />
                        </a>
                      ) : null;
                    })}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Toggle id={r.id} flag="is_built" on={r.is_built} label="Built" />
                </td>
                <td className="px-4 py-4">
                  <Toggle id={r.id} flag="is_paid" on={r.is_paid} label="Paid" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Toggle({ id, flag, on, label }: { id: string; flag: "is_built" | "is_paid"; on: boolean; label: string }) {
  return (
    <form action={toggleFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="value" value={String(!on)} />
      <button
        role="switch"
        aria-checked={on}
        aria-label={`${on ? "Unmark" : "Mark"} as ${label}`}
        className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          on ? "border-gold-400 bg-gold text-ink" : "border-white/15 text-muted hover:border-gold-400/60 hover:text-cream"
        }`}
      >
        <span aria-hidden="true">{on ? "✓" : "○"}</span>
        {on ? label : `Mark ${label}`}
      </button>
    </form>
  );
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][] | readonly (readonly [string, string])[];
}) {
  return (
    <label className="text-xs text-muted">
      <span className="mb-1 block uppercase tracking-wider">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="min-h-10 rounded-lg border border-white/15 bg-ink-2 px-3 py-2 text-sm text-cream focus:outline-none focus:ring-2 focus:ring-gold-400/60"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="whitespace-pre-wrap text-cream">{v}</dd>
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
