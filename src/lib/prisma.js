import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Force Prisma to regenerate in Vercel environment
if (process.env.VERCEL && !globalForPrisma.prisma) {
    try {
        // Try to require Prisma Client directly
        const { PrismaClient: PrismaClientDirect } = require("@prisma/client");
        globalForPrisma.prisma = new PrismaClientDirect({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });
    } catch (error) {
        console.error("Failed to create Prisma Client:", error);
    }
}

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