import { PrismaClient } from "@prisma/client";

// Next.js dev mode hot-reloads modules on every request, which would
// otherwise create a brand new PrismaClient (and a brand new SQLite
// connection) each time. Stashing the instance on `globalThis` keeps a
// single client alive across reloads in development. In production a
// fresh client is created once per server process, which is what we want.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
