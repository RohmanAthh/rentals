import { getCustomerBookings } from "@/server/actions/booking"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CustomerDashboardPage() {
  const bookings = await getCustomerBookings()

  const activeBookings = bookings.filter(b => b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "ONGOING")
  const totalSpent = bookings
    .filter(b => b.status === "CONFIRMED" || b.status === "ONGOING" || b.status === "COMPLETED")
    .reduce((acc, curr) => acc + Number(curr.totalPrice), 0)

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard Profil</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="text-gray-500 font-semibold mb-1">Total Pemesanan</h3>
          <p className="text-3xl font-bold text-blue-800">{bookings.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h3 className="text-gray-500 font-semibold mb-1">Pesanan Aktif</h3>
          <p className="text-3xl font-bold text-green-800">{activeBookings.length}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <h3 className="text-gray-500 font-semibold mb-1">Total Transaksi</h3>
          <p className="text-3xl font-bold text-purple-800">Rp {totalSpent.toLocaleString("id-ID")}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/customer/bookings" className="bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700">
          Lihat Riwayat Sewa
        </Link>
        <Link href="/" className="bg-gray-100 text-gray-800 px-6 py-3 rounded font-semibold hover:bg-gray-200 border">
          Sewa Kendaraan Baru
        </Link>
      </div>
    </main>
  )
}
