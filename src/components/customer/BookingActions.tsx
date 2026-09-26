"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cancelBooking } from "@/server/actions/booking"
import { createPaymentIntent } from "@/server/actions/payment"

export default function BookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    try {
      setLoading(true)
      const res = await createPaymentIntent(bookingId)
      if (res.paymentUrl) {
        router.push(res.paymentUrl)
      }
    } catch (error) {
      alert("Gagal membuat pembayaran")
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!confirm("Yakin ingin membatalkan pesanan?")) return
    try {
      setLoading(true)
      await cancelBooking(bookingId)
      router.refresh()
    } catch (error) {
      alert("Gagal membatalkan pesanan")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full mt-2">
      <button 
        onClick={handlePay}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm text-center w-full hover:bg-blue-700 disabled:bg-gray-400"
      >
        Bayar Sekarang
      </button>
      <button 
        onClick={handleCancel}
        disabled={loading}
        className="text-red-500 hover:underline text-sm font-semibold text-center mt-2 disabled:text-gray-400"
      >
        Batalkan Pesanan
      </button>
    </div>
  )
}
