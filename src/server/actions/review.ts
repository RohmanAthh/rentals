"use server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const ReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  // Basic XSS sanitization replacing angle brackets
  comment: z.string().max(1000).optional().transform(val => val ? val.replace(/</g, "&lt;").replace(/>/g, "&gt;") : null)
})

export async function createReview(data: { bookingId: string, rating: number, comment?: string }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const parsed = ReviewSchema.parse(data)

  const booking = await db.booking.findUnique({ where: { id: parsed.bookingId } })
  if (!booking) throw new Error("Booking tidak ditemukan")
  if (booking.userId !== session.user.id) throw new Error("Unauthorized")
  if (booking.status !== "COMPLETED") throw new Error("Hanya booking COMPLETED yang dapat di-review")

  const existing = await db.review.findUnique({ where: { bookingId: parsed.bookingId } })
  if (existing) throw new Error("Booking sudah memiliki review")

  await db.review.create({
    data: {
      userId: session.user.id,
      vehicleId: booking.vehicleId,
      bookingId: parsed.bookingId,
      rating: parsed.rating,
      comment: parsed.comment
    }
  })

  return { success: true }
}
