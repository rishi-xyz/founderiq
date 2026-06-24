import { PrismaClient } from '@/prisma/generated/client'
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton Prisma client backed by PostgreSQL.
 *
 * Configured with the Prisma Pg adapter for optimal Bun/PostgreSQL
 * compatibility. The connection string is read from the `DATABASE_URL`
 * environment variable.
 *
 * @remarks Import this singleton rather than creating a new
 * `PrismaClient` elsewhere to reuse the connection pool across
 * the entire application. The adapter ensures proper type mapping
 * between Prisma and the `pg` driver.
 *
 * @example
 * import { prisma } from "@/lib/database/client";
 * const users = await prisma.user.findMany();
 */
const adapter = new PrismaPg({
    connectionString:process.env.DATABASE_URL!,
});
export const prisma = new PrismaClient({adapter});