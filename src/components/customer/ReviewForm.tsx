"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createReview } from "@/server/actions/review"

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createReview({ bookingId, rating, comment })
      setSubmitted(true)
      router.refresh()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return <p className="text-green-600 font-semibold text-sm">Terima kasih atas ulasan Anda!</p>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2 w-full p-4 border rounded bg-gray-50">
      <h4 className="font-semibold text-sm text-gray-700">Berikan Ulasan</h4>
      
      <div className="flex gap-2 items-center">
        <label className="text-sm">Bintang:</label>
        <select 
          value={rating} 
          onChange={(e) => setRating(Number(e.target.value))}
          className="border p-1 rounded text-sm"
        >
          {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num} Bintang</option>)}
        </select>
      </div>

      <textarea 
        placeholder="Tulis ulasan Anda... (opsional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="border p-2 rounded text-sm"
        rows={2}
        maxLength={1000}
      />

      <button 
        type="submit" 
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
      >
        Kirim Ulasan
      </button>
    </form>
  )
}
