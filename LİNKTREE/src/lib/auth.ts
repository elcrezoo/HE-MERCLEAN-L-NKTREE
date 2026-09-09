import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const COOKIE = "hc_admin";
const lifetime = 60 * 60 * 8;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, role: string) {
  const payload = Buffer.from(JSON.stringify({ userId, role, exp: Date.now() + lifetime * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = signature(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string; role: string; exp: number };
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}

export async function authenticate(email: string, password: string) {
  if (process.env.DATABASE_URL) {
    try {
      const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (user?.isActive && await bcrypt.compare(password, user.passwordHash)) {
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { userId: user.id, role: user.role };
      }
    } catch { /* Do not fall back when a configured database rejects access. */ }
  }
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (!process.env.DATABASE_URL && configuredEmail && configuredHash && email.trim().toLowerCase() === configuredEmail && await bcrypt.compare(password, configuredHash)) {
    return { userId: "env-owner", role: "OWNER" };
  }
  return null;
}

export async function setSession(userId: string, role: string) {
  (await cookies()).set(COOKIE, createSessionToken(userId, role), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: lifetime,
  });
}

export async function getSession() {
  try { return verifySessionToken((await cookies()).get(COOKIE)?.value); } catch { return null; }
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function clearSession() { (await cookies()).delete(COOKIE); }
