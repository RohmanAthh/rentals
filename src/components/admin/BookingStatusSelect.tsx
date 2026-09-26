"use client"
import { useRouter } from "next/navigation"
import { updateBookingStatus } from "@/server/actions/admin"
import { useState } from "react"

export default function BookingStatusSelect({ 
  bookingId, 
  currentStatus 
}: { 
  bookingId: string, 
  currentStatus: "PENDING" | "CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED" 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as "PENDING" | "CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED"
    if (confirm(`Ubah status menjadi ${newStatus}?`)) {
      setLoading(true)
      try {
        await updateBookingStatus(bookingId, newStatus)
        router.refresh()
      } catch (error) {
        alert("Gagal mengubah status")
      } finally {
        setLoading(false)
      }
    } else {
      e.target.value = currentStatus
    }
  }

  return (
    <select 
      disabled={loading}
      defaultValue={currentStatus}
      onChange={handleChange}
      className={`border rounded p-1 text-sm font-semibold
        ${currentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
        ${currentStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
        ${currentStatus === 'ONGOING' ? 'bg-blue-100 text-blue-800' : ''}
        ${currentStatus === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
        ${currentStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
      `}
    >
      <option value="PENDING">PENDING</option>
      <option value="CONFIRMED">CONFIRMED</option>
      <option value="ONGOING">ONGOING</option>
      <option value="COMPLETED">COMPLETED</option>
      <option value="CANCELLED">CANCELLED</option>
    </select>
  )
}
