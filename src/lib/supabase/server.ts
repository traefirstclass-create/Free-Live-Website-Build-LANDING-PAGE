import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ASSET_BUCKET_PUBLIC } from "../constants";

export const ASSET_BUCKET = ASSET_BUCKET_PUBLIC;

/** Service-role client. Server only — bypasses RLS. Never import into client code. */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type ApplicationRow = {
  id: string;
  created_at: string;
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
  built_at: string | null;
  paid_at: string | null;
};
