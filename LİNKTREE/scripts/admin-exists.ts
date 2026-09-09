import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerCount = await prisma.user.count({
    where: { role: "OWNER", isActive: true },
  });
  process.exitCode = ownerCount > 0 ? 0 : 1;
}

main()
  .catch(() => {
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
