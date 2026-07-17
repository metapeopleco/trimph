import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export type SessionUser = {
  id: string
  email: string
  name: string | null
  role: "vendor_digital" | "vendor_traditional" | "affiliate"
  city: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const u = session.user as any
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role,
    city: u.city ?? null,
  }
}

export async function requireRole(role: string | string[]) {
  const user = await getSessionUser()
  if (!user) return { user: null, error: "Unauthorized" as const }
  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(user.role)) {
    return { user: null, error: "Forbidden" as const }
  }
  return { user, error: null }
}

// Generate a random alphanumeric slug for tracking links
export function genSlug(len = 8) {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789"
  let s = ""
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// Generate a TRIM-prefixed offline code
export function genTrimCode(suffix = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = "TRIM-"
  for (let i = 0; i < suffix; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// Update user online status
export async function touchOnline(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { isOnline: true, lastSeen: new Date() },
  })
}
