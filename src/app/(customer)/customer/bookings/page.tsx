import { getCustomerBookings } from "@/server/actions/booking"
import BookingActions from "@/components/customer/BookingActions"
import ReviewForm from "@/components/customer/ReviewForm"

export const dynamic = "force-dynamic"

export default async function CustomerBookingsPage() {
  const bookings = await getCustomerBookings()

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Riwayat Pemesanan Saya</h1>
      
      {bookings.length === 0 ? (
        <p className="text-gray-500">Anda belum memiliki riwayat pemesanan.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {bookings.map(booking => (
            <div key={booking.id} className="border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold">{booking.vehicle.brand} {booking.vehicle.model}</h3>
                <p className="text-gray-600 mb-2">
                  {booking.startDate.toLocaleDateString("id-ID")} s/d {booking.endDate.toLocaleDateString("id-ID")}
                </p>
                <p className="font-semibold text-blue-600">Total: Rp {Number(booking.totalPrice).toLocaleString("id-ID")}</p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-3 py-1 rounded-full text-sm font-bold
                  ${booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                  ${booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                  ${booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {booking.status}
                </span>
                
                {booking.status === 'PENDING' && (
                  <BookingActions bookingId={booking.id} />
                )}
                
                {booking.status === 'COMPLETED' && !booking.review && (
                  <div className="w-full mt-4">
                    <ReviewForm bookingId={booking.id} />
                  </div>
                )}
                {booking.status === 'COMPLETED' && booking.review && (
                  <div className="w-full mt-4 p-4 border rounded bg-gray-50 text-sm">
                    <p className="font-semibold text-gray-700">Ulasan Anda ({booking.review.rating} Bintang)</p>
                    <p className="text-gray-600 mt-1">{booking.review.comment || "-"}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
