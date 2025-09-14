// Ultimate Prisma client that bypasses Vercel caching issues
let prisma;

// Force Prisma client regeneration on every import
const createPrismaClient = () => {
    try {
        // Clear any cached Prisma client
        delete require.cache[require.resolve("@prisma/client")];
        
        // Dynamic import to bypass caching
        const { PrismaClient } = require("@prisma/client");
        
        return new PrismaClient({
            log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });
    } catch (error) {
        console.error("Failed to create Prisma Client:", error);
        // Return a mock client as fallback
        return {
            user: { findMany: () => [], create: () => {}, update: () => {}, delete: () => {}, findFirst: () => null, findUnique: () => null },
            collection: { findMany: () => [], create: () => {}, update: () => {}, delete: () => {}, findFirst: () => null, findUnique: () => null },
            payer: { findMany: () => [], create: () => {}, update: () => {}, delete: () => {}, findFirst: () => null, findUnique: () => null },
            account: { findMany: () => [], create: () => {}, update: () => {}, delete: () => {}, findFirst: () => null, findUnique: () => null },
            session: { findMany: () => [], create: () => {}, update: () => {}, delete: () => {}, findFirst: () => null, findUnique: () => null },
            verificationToken: { findMany: () => [], create: () => {}, update: () => {}, delete: () => {}, findFirst: () => null, findUnique: () => null },
        };
    }
};

// Always create a fresh client instance
prisma = createPrismaClient();

export { prisma };