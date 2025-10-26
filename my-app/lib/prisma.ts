import { PrismaClient } from "@prisma/client";

const makeClient = () =>
  new PrismaClient({
    log: ["warn", "error"], // add "query" if you want verbose SQL logs
  });

declare global {
  // allow global var in dev to avoid new connections on HMR
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
