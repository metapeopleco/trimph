import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSessionUser } from "@/lib/session"

// GET — current user's wallet
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let wallet = await db.wallet.findUnique({ where: { userId: user.id } })
  if (!wallet) {
    wallet = await db.wallet.create({ data: { userId: user.id, entries: "[]" } })
  }
  return NextResponse.json({
    wallet: { ...wallet, entries: JSON.parse(wallet.entries) },
  })
}

// PUT — update wallet (affiliate only, or any user managing their payout info)
export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { entries } = await req.json()
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "entries must be an array" }, { status: 400 })
    }
    // sanitize
    const clean = entries
      .filter((e: any) => e && typeof e.name === "string" && typeof e.value === "string")
      .map((e: any) => ({ name: e.name.trim().slice(0, 60), value: e.value.trim().slice(0, 200) }))

    const wallet = await db.wallet.upsert({
      where: { userId: user.id },
      update: { entries: JSON.stringify(clean) },
      create: { userId: user.id, entries: JSON.stringify(clean) },
    })
    return NextResponse.json({
      wallet: { ...wallet, entries: JSON.parse(wallet.entries) },
    })
  } catch (e: any) {
    console.error("wallet error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}

// GET wallet for a specific affiliate (vendor viewing affiliate payout info)
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "vendor_digital" && user.role !== "vendor_traditional") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  let wallet = await db.wallet.findUnique({ where: { userId } })
  if (!wallet) wallet = { entries: "[]" } as any

  const affiliate = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, city: true },
  })

  return NextResponse.json({
    affiliate,
    wallet: { entries: JSON.parse(wallet.entries) },
  })
}
