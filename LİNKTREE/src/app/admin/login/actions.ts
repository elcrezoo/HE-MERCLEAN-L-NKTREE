"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, setSession } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

async function attemptKey(email: string) {
  const forwarded = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", secret).update(`${forwarded}|${email.trim().toLowerCase()}`).digest("hex");
}

export async function loginAction(_: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };
  const key = await attemptKey(email);
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= 5) {
    return { error: "Too many attempts. Try again later." };
  }
  const result = await authenticate(email, password);
  if (!result) {
    attempts.set(key, current && current.resetAt > now
      ? { ...current, count: current.count + 1 }
      : { count: 1, resetAt: now + 15 * 60_000 });
    return { error: "Credentials were not accepted." };
  }
  attempts.delete(key);
  await setSession(result.userId, result.role);
  redirect("/admin");
}
