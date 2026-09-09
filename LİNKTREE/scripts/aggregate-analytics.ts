import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const days = Number(process.env.ANALYTICS_RETENTION_DAYS ?? 90);
  const cutoff = new Date(Date.now() - days * 86400000);
  const result = await prisma.clickEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  console.log(`Removed ${result.count} raw events older than ${days} days.`);
}
main().finally(() => prisma.$disconnect());
