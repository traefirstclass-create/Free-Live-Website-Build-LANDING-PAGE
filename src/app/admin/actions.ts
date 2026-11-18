"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, isAdmin, passwordMatches, sessionToken } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) redirect("/admin?error=1");
  (await cookies()).set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/" });
  redirect("/admin");
}

export async function toggleFlag(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  const flag = String(formData.get("flag") ?? "");
  const value = formData.get("value") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id) || (flag !== "is_built" && flag !== "is_paid")) return;

  try {
    if (flag === "is_built") {
      await db()`update applications set is_built = ${value}, built_at = ${value ? new Date() : null} where id = ${id}`;
    } else {
      await db()`update applications set is_paid = ${value}, paid_at = ${value ? new Date() : null} where id = ${id}`;
    }
  } catch (err) {
    console.error("[admin] toggle failed", err);
  }
  revalidatePath("/admin");
}
