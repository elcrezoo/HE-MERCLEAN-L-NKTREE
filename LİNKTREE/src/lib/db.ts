import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export async function withDatabase<T, F>(query: () => Promise<T>, fallback: F): Promise<T | F> {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    return await query();
  } catch {
    return fallback;
  }
}
