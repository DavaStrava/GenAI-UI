import { PrismaClient } from "@/lib/generated/prisma"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

// Create SQLite database path - matches DATABASE_URL in .env
const dbPath = path.join(process.cwd(), "dev.db")

// Create Prisma adapter with URL
const adapter = new PrismaBetterSqlite3({ url: dbPath })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
