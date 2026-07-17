import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"

// Turso (libSQL) is the source of truth — all CRUD goes directly to Turso.
// The PrismaLibSQL adapter takes a config object { url, authToken }.
const url = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN

if (!url) {
  throw new Error("DATABASE_URL is not set. Check your .env file.")
}

const adapter = new PrismaLibSQL({ url, authToken })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Minimal logging to reduce memory pressure in dev
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
