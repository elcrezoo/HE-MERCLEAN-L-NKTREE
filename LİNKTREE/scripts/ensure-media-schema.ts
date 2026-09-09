import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'MediaAsset'",
  );
  if (!tables.length) return;

  const columns = await prisma.$queryRawUnsafe<{ name: string }[]>(
    'PRAGMA table_info("MediaAsset")',
  );
  if (!columns.some((column) => column.name === "usageKey")) {
    await prisma.$executeRawUnsafe('ALTER TABLE "MediaAsset" ADD COLUMN "usageKey" TEXT');
  }
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_usageKey_key" ON "MediaAsset"("usageKey")',
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
