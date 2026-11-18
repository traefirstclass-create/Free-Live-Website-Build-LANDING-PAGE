-- =====================================================================
-- Free Live Website Build: Neon Postgres schema
-- Run once in Neon's SQL Editor (Vercel → Storage → your database →
-- "Open in Neon" → SQL Editor). Safe to re-run.
-- Images are NOT stored here; they live in Vercel Blob under
-- applications/<id>/logo.* and applications/<id>/photo-N.*
-- =====================================================================

create table if not exists applications (
  id                    uuid primary key,
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

  -- Step 3: build assets (Vercel Blob pathnames)
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

create index if not exists applications_status_idx       on applications (status);
create index if not exists applications_build_format_idx on applications (build_format);
create index if not exists applications_priority_idx     on applications (priority_score desc, created_at desc);
