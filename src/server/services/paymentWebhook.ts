import { db } from "@/lib/db"
import crypto from "crypto"

export async function processWebhook(payload: string, signature: string, secret: string) {
  // 1. HMAC Signature Validation
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  if (expectedSignature !== signature) {
    throw new Error("Invalid signature")
  }
  
  const data = JSON.parse(payload)
  const transactionId = data.transactionId
  
  // 2. Cek eksistensi
  const payment = await db.payment.findFirst({ where: { transactionId } })
  if (!payment) throw new Error("Payment not found")
  
  // 3. Idempotency Check
  if (payment.status === "PAID" || payment.status === "FAILED") {
    return { success: true, message: "Already processed" }
  }

  // 4. Update Payment dan Booking secara atomik
  const newStatus = data.status === "success" ? "PAID" : "FAILED"
  const newBookingStatus = data.status === "success" ? "CONFIRMED" : "CANCELLED"

  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: { status: newStatus }
    }),
    db.booking.update({
      where: { id: payment.bookingId },
      data: { status: newBookingStatus }
    })
  ])
  
  return { success: true }
}
