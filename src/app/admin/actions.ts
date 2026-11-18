"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, isAdmin, passwordMatches, sessionToken } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) redirect("/admin?error=1");
  (await cookies()).set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin");
}

export async function toggleFlag(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  const flag = String(formData.get("flag") ?? "");
  const value = formData.get("value") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id) || (flag !== "is_built" && flag !== "is_paid")) return;

  const stamp = flag === "is_built" ? "built_at" : "paid_at";
  const { error } = await supabaseAdmin()
    .from("applications")
    .update({ [flag]: value, [stamp]: value ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) console.error("[admin] toggle failed", error);
  revalidatePath("/admin");
}
