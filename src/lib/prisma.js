import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Create Prisma client with explicit configuration
export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}