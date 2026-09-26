import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcrypt"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8)
})

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
    try {
      await limiter.check(5, ip) // 5 requests per minute
    } catch {
      return NextResponse.json({ message: "Too Many Requests" }, { status: 429 })
    }

    const body = await req.json()
    const { name, email, phone, password } = registerSchema.parse(body)

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "CUSTOMER"
      }
    })

    return NextResponse.json(
      { message: "Registrasi berhasil", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Data tidak valid", errors: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: "Terjadi kesalahan pada sistem" },
      { status: 500 }
    )
  }
}
