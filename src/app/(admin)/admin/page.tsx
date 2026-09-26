import { getDashboardStats } from "@/server/actions/admin"
import DashboardChart from "@/components/admin/DashboardChart"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link href="/admin/bookings" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Kelola Transaksi
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-gray-500 font-semibold mb-1">Total Pemesanan Aktif</h3>
          <p className="text-3xl font-bold">{stats.totalBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-gray-500 font-semibold mb-1">Total Pendapatan (Gross)</h3>
          <p className="text-3xl font-bold text-green-700">Rp {stats.totalRevenue.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-gray-500 font-semibold mb-1">Pelanggan Aktif</h3>
          <p className="text-3xl font-bold text-blue-700">{stats.activeUsers}</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6">Grafik Transaksi Harian</h2>
        <DashboardChart data={stats.chartData} />
      </div>
    </main>
  )
}
