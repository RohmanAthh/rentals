"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBooking } from "@/server/actions/booking"

export default function BookingForm({ vehicle }: { vehicle: { id: string, pricePerDay: number | string | { toString: () => string } } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Calculate days for UI display
  let days = 0
  if (startDate && endDate) {
    const s = new Date(startDate)
    const e = new Date(endDate)
    if (e >= s) {
      days = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
    }
  }
  const totalPrice = days * Number(vehicle.pricePerDay)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = {
        vehicleId: vehicle.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }

      await createBooking(data)
      router.push("/customer/bookings")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Gagal membuat booking")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border p-6 rounded-lg flex flex-col gap-4 shadow-sm bg-white">
      <h3 className="text-xl font-bold border-b pb-2 mb-2">Pesan Kendaraan Ini</h3>
      
      {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      <div className="flex flex-col gap-1">
        <label htmlFor="startDate" className="font-semibold text-sm">Tanggal Pengambilan</label>
        <input 
          id="startDate" 
          type="date" 
          required 
          value={startDate} 
          onChange={e => setStartDate(e.target.value)} 
          className="border p-2 rounded" 
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="endDate" className="font-semibold text-sm">Tanggal Pengembalian</label>
        <input 
          id="endDate" 
          type="date" 
          required 
          value={endDate} 
          onChange={e => setEndDate(e.target.value)} 
          className="border p-2 rounded" 
          min={startDate || new Date().toISOString().split("T")[0]}
        />
      </div>

      {days > 0 && (
        <div className="bg-gray-50 p-4 rounded mt-2 border">
          <div className="flex justify-between mb-1">
            <span>Durasi:</span>
            <span>{days} Hari</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Harga per Hari:</span>
            <span>Rp {Number(vehicle.pricePerDay).toLocaleString("id-ID")}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Bayar:</span>
            <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading || days <= 0} 
        className="w-full bg-blue-600 text-white font-bold py-3 rounded mt-2 hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Memproses..." : "Konfirmasi Pesanan"}
      </button>
    </form>
  )
}
