import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const rl = createInterface({ input: stdin, output: stdout });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || await rl.question("Owner email: ")).trim().toLowerCase();
  const password = await rl.question("Owner password (12+ characters): ");
  if (!email.includes("@") || password.length < 12) throw new Error("Provide a valid email and a password of at least 12 characters.");
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({ where: { email }, update: { passwordHash, role: "OWNER", isActive: true }, create: { email, name: "Owner", passwordHash, role: "OWNER" } });
  console.log(`Owner ready: ${email}`);
}

main().finally(async () => { rl.close(); await prisma.$disconnect(); });
