import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const VALID_ROLES = ["vendor_digital", "vendor_traditional", "affiliate"]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, role, name, city } = body as {
      email: string
      password: string
      role: string
      name?: string
      city?: string
    }

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password and role are required." },
        { status: 400 }
      )
    }
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role,
        name: name?.trim() || null,
        city: city?.trim() || null,
      },
    })

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name, city: user.city },
    })
  } catch (e: any) {
    console.error("signup error", e)
    return NextResponse.json({ error: "Server error." }, { status: 500 })
  }
}
