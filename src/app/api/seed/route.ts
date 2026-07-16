import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// POST — seed a few sample campaigns (marked isSeeded=true) so the marketplace isn't empty.
// These are clearly labeled as Beta Test mockups and can be removed after Aug 15, 2026.
export async function POST() {
  const count = await db.campaign.count({ where: { isSeeded: true } })
  if (count > 0) return NextResponse.json({ ok: true, alreadySeeded: true, count })

  // create a placeholder vendor for seeded campaigns
  let vendor = await db.user.findUnique({ where: { email: "demo@trim.ph" } })
  if (!vendor) {
    const bcrypt = await import("bcryptjs")
    vendor = await db.user.create({
      data: {
        email: "demo@trim.ph",
        passwordHash: await bcrypt.default.hash("demo-no-login", 10),
        role: "vendor_digital",
        name: "Trim.ph Demo",
      },
    })
  }

  const seeds = [
    {
      title: "TaskFlow — Productivity App",
      description: "Help users organize tasks & projects. Earn per verified signup email.",
      type: "digital",
      targetUrl: "https://example.com/taskflow/signup",
      rewardType: "email",
      rewardAmount: 12,
      category: "SaaS",
      city: null,
    },
    {
      title: "Bean & Brew Coffee Co.",
      description: "10% off any handcrafted latte. Show code in-store.",
      type: "take_one",
      targetUrl: null,
      rewardType: "walk_in",
      rewardAmount: 25,
      category: "Food & Beverage",
      city: "Makati",
    },
    {
      title: "FitForge Gym — Free Trial Pass",
      description: "7-day full access pass for new members.",
      type: "take_one",
      targetUrl: null,
      rewardType: "walk_in",
      rewardAmount: 80,
      category: "Health & Fitness",
      city: "Quezon City",
    },
  ]

  for (const s of seeds) {
    const camp = await db.campaign.create({
      data: {
        vendorId: vendor.id,
        title: s.title,
        description: s.description,
        type: s.type,
        targetUrl: s.targetUrl,
        rewardType: s.rewardType,
        rewardAmount: s.rewardAmount,
        category: s.category,
        city: s.city,
        isActive: true,
        isSeeded: true,
      },
    })
    if (s.type === "take_one") {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
      const gen = () => "TRIM-" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
      const codes = Array.from({ length: 8 }, () => gen())
      await db.takeOneCode.createMany({
        data: codes.map((code) => ({ campaignId: camp.id, code })),
      })
    }
  }

  return NextResponse.json({ ok: true, seeded: seeds.length })
}
