-- =====================================================================
-- Free Live Website Build — Supabase schema
-- Run in Supabase Dashboard → SQL Editor. Safe to re-run.
-- =====================================================================

-- ---------- applications table ----------
create table if not exists public.applications (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),

  -- Step 1: basics
  full_name             text not null,
  business_name         text not null,
  email                 text not null,
  phone                 text not null,
  social_handle         text not null,
  build_format          text not null default 'either'
                        check (build_format in ('live', 'private', 'either')),

  -- Step 2: qualification
  business_description  text not null,
  time_operating        text not null check (time_operating in ('lt_3m', '3_12m', '1_3y', '3y_plus')),
  generating_income     boolean not null,
  monthly_revenue       text not null check (monthly_revenue in ('under_1k', '1k_5k', '5k_20k', '20k_plus')),
  current_website       text not null check (current_website in ('yes', 'no', 'hate_it')),

  -- Step 3: build assets (paths inside the applicant-assets bucket)
  logo_path             text,
  photo_paths           text[] not null default '{}',
  brand_colors          text,
  pick_colors_for_me    boolean not null default false,
  primary_action        text not null check (primary_action in ('book', 'call', 'buy', 'dm')),
  inspiration_url       text,
  services              text not null,

  -- Step 4: agreement
  agree_preview         boolean not null default false,
  ready_to_invest       boolean not null default false,
  consent_stream        boolean not null default false,  -- only required for live / either
  available_dm          boolean not null default false,

  -- Computed on the server
  status                text not null check (status in ('qualified', 'disqualified')),
  disqualify_reasons    text[] not null default '{}',
  priority_score        integer not null default 0,

  -- Admin pipeline
  is_built              boolean not null default false,
  is_paid               boolean not null default false,
  built_at              timestamptz,
  paid_at               timestamptz
);

-- If you created the table before build_format existed, this adds it:
alter table public.applications
  add column if not exists build_format text not null default 'either';
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_build_format_check'
  ) then
    alter table public.applications
      add constraint applications_build_format_check
      check (build_format in ('live', 'private', 'either'));
  end if;
end $$;

create index if not exists applications_status_idx       on public.applications (status);
create index if not exists applications_build_format_idx on public.applications (build_format);
create index if not exists applications_priority_idx     on public.applications (priority_score desc, created_at desc);

-- RLS on, with NO public policies. Only the server (service-role key) can read/write.
alter table public.applications enable row level security;


-- ---------- storage bucket ----------
-- Private bucket, images only, 10MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'applicant-assets',
  'applicant-assets',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','image/svg+xml']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies:
-- No anon/authenticated policies are needed on storage.objects for this bucket.
--   • Uploads use one-time signed upload URLs created by /api/uploads (service role).
--   • The admin page reads files through short-lived signed URLs (service role).
-- With RLS enabled on storage.objects (the Supabase default) and no policies
-- for this bucket, the public cannot list, read, overwrite or delete files.
-- Do NOT add a public SELECT/INSERT policy for 'applicant-assets'.
