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
    // Add explicit configuration for Vercel
    __internal: {
        engine: {
            binaryTargets: ["native", "rhel-openssl-1.0.x"],
        },
    },
});

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}