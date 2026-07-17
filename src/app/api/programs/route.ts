import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET — browse public programs for affiliates
// supports ?city=&category=&type=&q=
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get("city") || undefined
  const category = searchParams.get("category") || undefined
  const type = searchParams.get("type") || undefined
  const q = searchParams.get("q") || undefined

  const where: any = {
    isActive: true,
  }
  if (type) where.type = type
  if (city) where.city = city
  if (category) where.category = category
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ]
  }

  const programs = await db.campaign.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { name: true, email: true, isOnline: true } },
      _count: { select: { trackingLinks: true } },
    },
    take: 200,
  })

  return NextResponse.json({ programs })
}
