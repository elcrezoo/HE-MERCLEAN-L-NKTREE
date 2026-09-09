import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const blocked = /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80)/i;

async function validate(urlText: string) {
  let current = new URL(urlText);
  for (let hop = 0; hop < 4; hop++) {
    if (!["https:","http:"].includes(current.protocol)) throw new Error("protocol");
    const addresses = await lookup(current.hostname, { all: true });
    if (addresses.some(({ address }) => isIP(address) && blocked.test(address))) throw new Error("private address");
    const response = await fetch(current, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(5000) });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) { current = new URL(response.headers.get("location")!, current); continue; }
    return response.status;
  }
  throw new Error("redirect limit");
}

async function main() {
  const links = await prisma.link.findMany();
  for (const link of links) {
    try {
      const status = await validate(link.destinationUrl);
      await prisma.link.update({ where: { id: link.id }, data: { lastCheckedAt: new Date(), lastStatusCode: status, lastCheckState: status < 400 ? "ok" : "error" } });
      console.log(`${link.slug}: ${status}`);
    } catch (error) {
      await prisma.link.update({ where: { id: link.id }, data: { lastCheckedAt: new Date(), lastCheckState: "error" } });
      console.error(`${link.slug}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
