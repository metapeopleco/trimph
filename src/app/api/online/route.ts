import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

// POST — heartbeat to mark the user online
export async function POST() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.user.update({
    where: { id: user.id },
    data: { isOnline: true, lastSeen: new Date() },
  })
  return NextResponse.json({ ok: true })
}

// DELETE — mark offline
export async function DELETE() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.user.update({
    where: { id: user.id },
    data: { isOnline: false, lastSeen: new Date() },
  })
  return NextResponse.json({ ok: true })
}
