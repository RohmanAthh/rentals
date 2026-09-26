import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import BookingForm from "@/components/customer/BookingForm"
import Image from "next/image"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const vehicle = await db.vehicle.findUnique({
    where: { id: params.id },
    include: { category: true }
  })

  if (!vehicle) {
    return { title: "Kendaraan Tidak Ditemukan" }
  }

  return {
    title: `Sewa ${vehicle.brand} ${vehicle.model} | Rental Mobil`,
    description: `Sewa ${vehicle.brand} ${vehicle.model} (${vehicle.year}) dengan harga terjangkau. Kategori: ${vehicle.category.name}. Kapasitas: ${vehicle.seatingCapacity} kursi.`,
  }
}

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = await db.vehicle.findUnique({
    where: { id: params.id },
    include: { 
      images: true, 
      category: true,
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!vehicle) {
    notFound()
  }

  const avgRating = vehicle.reviews.length > 0 
    ? (vehicle.reviews.reduce((acc, r) => acc + r.rating, 0) / vehicle.reviews.length).toFixed(1)
    : null

  return (
    <main className="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h1 className="text-3xl font-bold mb-2">{vehicle.brand} {vehicle.model}</h1>
        <p className="text-gray-500 mb-6">
          {vehicle.category.name} • {vehicle.year}
          {avgRating && <span className="ml-2 text-yellow-600 font-bold">★ {avgRating} ({vehicle.reviews.length} Ulasan)</span>}
        </p>
        
        {vehicle.images[0] ? (
          <Image 
            src={vehicle.images[0].url} 
            alt={vehicle.model} 
            width={800} 
            height={600}
            className="w-full rounded-lg mb-8" 
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-lg mb-8 flex items-center justify-center">
            Tanpa Gambar
          </div>
        )}

        <h3 className="text-xl font-semibold mb-4">Spesifikasi</h3>
        <ul className="grid grid-cols-2 gap-4 text-gray-700 mb-8">
          <li><strong>Transmisi:</strong> {vehicle.transmission}</li>
          <li><strong>Bahan Bakar:</strong> {vehicle.fuelType}</li>
          <li><strong>Kapasitas:</strong> {vehicle.seatingCapacity} Kursi</li>
          <li><strong>Plat Nomor:</strong> {vehicle.licensePlate}</li>
        </ul>

        <h3 className="text-xl font-semibold mb-4 border-t pt-8">Ulasan Pelanggan</h3>
        {vehicle.reviews.length === 0 ? (
          <p className="text-gray-500">Belum ada ulasan untuk kendaraan ini.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {vehicle.reviews.map(review => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{review.user.name}</span>
                  <span className="text-yellow-500 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p className="text-gray-700 text-sm">{review.comment || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <BookingForm vehicle={vehicle} />
      </div>
    </main>
  )
}
