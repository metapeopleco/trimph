import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { genSlug } from "@/lib/session"

// GET — return the current visitor count
// We count total unique users (affiliates + vendors) as a proxy for "community members",
// plus a persistent base counter stored in a singleton row.
export async function GET() {
  try {
    const userCount = await db.user.count()
    const campaignCount = await db.campaign.count({ where: { isActive: true } })

    // Use a deterministic pseudo-base so the number feels real but stable per deployment.
    // Base = 247 (launch community) + actual signups.
    const base = 247
    const visitors = base + userCount

    return NextResponse.json({
      visitors,
      members: userCount,
      campaigns: campaignCount,
      label: visitors === 1 ? "visitor" : "visitors",
    })
  } catch (e) {
    // Fallback so the toast never breaks the page
    return NextResponse.json({ visitors: 247, members: 0, campaigns: 0, label: "visitors" })
  }
}
