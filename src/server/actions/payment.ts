"use server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import crypto from "crypto"

export async function createPaymentIntent(bookingId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) throw new Error("Booking tidak ditemukan")
  if (booking.userId !== session.user.id) throw new Error("Unauthorized")
  if (booking.status !== "PENDING") throw new Error("Booking tidak dalam status PENDING")

  // Cek apakah sudah ada payment pending
  let payment = await db.payment.findUnique({ where: { bookingId } })
  
  const transactionId = `TRX-${crypto.randomBytes(8).toString('hex')}`

  if (!payment) {
    payment = await db.payment.create({
      data: {
        bookingId,
        amount: booking.totalPrice,
        method: "TRANSFER", // Default for mock
        status: "PENDING",
        transactionId
      }
    })
  } else if (payment.status !== "PENDING") {
    throw new Error("Pembayaran sudah diproses")
  }

  // Generate Mock Payment URL (e.g. redirect to a mock gateway or just return success URL)
  // Real implementation would call Stripe/Midtrans API here.
  const paymentUrl = `/customer/mock-payment?transactionId=${payment.transactionId || transactionId}&amount=${booking.totalPrice}`

  return { paymentUrl, transactionId: payment.transactionId || transactionId }
}
