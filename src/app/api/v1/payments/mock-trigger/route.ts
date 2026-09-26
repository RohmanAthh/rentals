import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payloadString = JSON.stringify(body)
    
    const secret = process.env.WEBHOOK_SECRET || "default-secret"
    const signature = crypto.createHmac("sha256", secret).update(payloadString).digest("hex")

    // Forward to the actual webhook endpoint locally
    const baseUrl = req.headers.get('host') 
      ? `http://${req.headers.get('host')}` 
      : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: {
        'x-webhook-signature': signature
      },
      body: payloadString
    })

    if (!res.ok) throw new Error("Webhook rejected")

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Mock trigger failed" }, { status: 500 })
  }
}
