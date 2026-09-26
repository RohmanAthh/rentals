import { getAllBookings } from "@/server/actions/admin"
import BookingStatusSelect from "@/components/admin/BookingStatusSelect"

export const dynamic = "force-dynamic"

export default async function AdminBookingsPage() {
  const bookings = await getAllBookings()

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Master Tabel Transaksi</h1>
        <button className="bg-gray-100 border text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
          Ekspor Data (CSV)
        </button>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600">ID / Waktu</th>
              <th className="p-4 font-semibold text-gray-600">Pelanggan</th>
              <th className="p-4 font-semibold text-gray-600">Kendaraan</th>
              <th className="p-4 font-semibold text-gray-600">Jadwal Sewa</th>
              <th className="p-4 font-semibold text-gray-600">Total Harga</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Belum ada data transaksi.
                </td>
              </tr>
            )}
            {bookings.map(booking => (
              <tr key={booking.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="text-xs text-gray-500 mb-1">{booking.id.split('-')[0]}...</div>
                  <div className="text-sm">{booking.createdAt.toLocaleDateString("id-ID")}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold">{booking.user.name}</div>
                  <div className="text-sm text-gray-500">{booking.user.email}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold">{booking.vehicle.brand} {booking.vehicle.model}</div>
                  <div className="text-sm text-gray-500">{booking.vehicle.licensePlate}</div>
                </td>
                <td className="p-4 text-sm">
                  {booking.startDate.toLocaleDateString("id-ID")} <br/>
                  s/d <br/>
                  {booking.endDate.toLocaleDateString("id-ID")}
                </td>
                <td className="p-4 font-semibold text-blue-600">
                  Rp {Number(booking.totalPrice).toLocaleString("id-ID")}
                </td>
                <td className="p-4">
                  <BookingStatusSelect bookingId={booking.id} currentStatus={booking.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
