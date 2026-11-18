import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

/** Neon Postgres client. Lazy so `next build` works before env vars exist. */
export function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!url) throw new Error("Missing DATABASE_URL (connect a Neon database in Vercel → Storage)");
    _sql = neon(url);
  }
  return _sql;
}

export type ApplicationRow = {
  id: string;
  created_at: string | Date;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  social_handle: string;
  build_format: "live" | "private" | "either";
  business_description: string;
  time_operating: "lt_3m" | "3_12m" | "1_3y" | "3y_plus";
  generating_income: boolean;
  monthly_revenue: "under_1k" | "1k_5k" | "5k_20k" | "20k_plus";
  current_website: "yes" | "no" | "hate_it";
  logo_path: string | null;
  photo_paths: string[];
  brand_colors: string | null;
  pick_colors_for_me: boolean;
  primary_action: "book" | "call" | "buy" | "dm";
  inspiration_url: string | null;
  services: string;
  agree_preview: boolean;
  ready_to_invest: boolean;
  consent_stream: boolean;
  available_dm: boolean;
  status: "qualified" | "disqualified";
  disqualify_reasons: string[];
  priority_score: number;
  is_built: boolean;
  is_paid: boolean;
  built_at: string | Date | null;
  paid_at: string | Date | null;
};
