"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function MockPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  
  const transactionId = searchParams.get("transactionId")
  const amount = searchParams.get("amount")

  async function handleSimulate(status: "success" | "failed") {
    setLoading(true)
    try {
      const payload = JSON.stringify({ transactionId, status })
      const res = await fetch("/api/v1/payments/mock-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      })

      if (res.ok) {
        alert("Simulasi pembayaran berhasil diproses Webhook!")
        router.push("/customer/bookings")
      } else {
        alert("Gagal memproses webhook")
      }
    } catch (e) {
      alert("Error")
    } finally {
      setLoading(false)
    }
  }

  if (!transactionId) return <div>Invalid Transaction</div>

  return (
    <div className="max-w-md mx-auto p-8 border rounded shadow-md mt-12 text-center bg-white">
      <h1 className="text-2xl font-bold mb-4">Payment Gateway (MOCK)</h1>
      <p className="mb-2">Transaction ID: <strong>{transactionId}</strong></p>
      <p className="mb-8">Total Pembayaran: <strong className="text-blue-600 text-xl">Rp {Number(amount).toLocaleString("id-ID")}</strong></p>
      
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => handleSimulate("success")} 
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Bayar Sukses (Trigger Webhook)
        </button>
        
        <button 
          onClick={() => handleSimulate("failed")} 
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Gagalkan Pembayaran
        </button>
      </div>
    </div>
  )
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MockPaymentContent />
    </Suspense>
  )
}
