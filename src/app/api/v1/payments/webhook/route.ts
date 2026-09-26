import { NextResponse } from "next/server"
import { processWebhook } from "@/server/services/paymentWebhook"

export async function POST(req: Request) {
  try {
    const payload = await req.text()
    const signature = req.headers.get("x-webhook-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    const secret = process.env.WEBHOOK_SECRET || "default-secret"

    await processWebhook(payload, signature, secret)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: unknown) {
    // Hindari membocorkan detail error internal yang spesifik
    const msg = error instanceof Error ? error.message : "Internal Error"
    
    if (msg === "Invalid signature") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }
}
