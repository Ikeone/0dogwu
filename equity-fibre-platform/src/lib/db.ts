/**
 * Prisma client singleton. Reused across hot reloads in development to avoid
 * exhausting connections.
 */
import { PrismaClient } from "@prisma/client";

// Zero-config demo fallback: resolves to prisma/dev.db (relative to the schema
// directory). Production sets DATABASE_URL to a managed Postgres instance.
process.env.DATABASE_URL ??= "file:./dev.db";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.LOG_LEVEL === "debug" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
