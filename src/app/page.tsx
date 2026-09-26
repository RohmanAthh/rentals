import { getVehicles } from "@/server/actions/vehicle"
import Link from "next/link"
import Image from "next/image"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Katalog Mobil Rental | Solusi Sewa Kendaraan Cepat",
  description: "Temukan kendaraan terbaik untuk perjalanan Anda dengan harga terjangkau dan proses pemesanan yang cepat."
}

export default async function HomePage() {
  const vehicles = await getVehicles()

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-12">Katalog Mobil Rental</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {vehicles.map(vehicle => (
          <Link href={`/vehicles/${vehicle.id}`} key={vehicle.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition block cursor-pointer text-inherit no-underline">
            {vehicle.images?.[0] ? (
              <Image 
                src={vehicle.images[0].url} 
                alt={vehicle.model} 
                width={600} 
                height={400} 
                className="w-full h-48 object-cover" 
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                Tanpa Gambar
              </div>
            )}
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-1">{vehicle.category?.name}</div>
              <h2 className="text-xl font-semibold mb-2">{vehicle.brand} {vehicle.model} ({vehicle.year})</h2>
              <div className="text-sm text-gray-600 mb-4 grid grid-cols-2 gap-2">
                <span>🚘 {vehicle.transmission}</span>
                <span>⛽ {vehicle.fuelType}</span>
                <span>💺 {vehicle.seatingCapacity} Kursi</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-blue-600">Rp {Number(vehicle.pricePerDay).toLocaleString("id-ID")}</span>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">{vehicle.status}</span>
              </div>
            </div>
          </Link>
        ))}

        {vehicles.length === 0 && (
          <div className="col-span-3 text-center text-gray-500">
            Belum ada mobil yang tersedia.
          </div>
        )}
      </div>
    </main>
  )
}
