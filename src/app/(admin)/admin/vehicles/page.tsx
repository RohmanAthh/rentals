import Link from "next/link"
import { getVehicles } from "@/server/actions/vehicle"

export const dynamic = "force-dynamic"

export default async function AdminVehiclesPage() {
  const vehicles = await getVehicles()

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Daftar Kendaraan</h1>
        <Link href="/admin/vehicles/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          Tambah Kendaraan
        </Link>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Plat Nomor</th>
            <th className="p-2">Merek & Model</th>
            <th className="p-2">Kategori</th>
            <th className="p-2">Harga / Hari</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">Tidak ada data kendaraan.</td>
            </tr>
          ) : (
            vehicles.map(v => (
              <tr key={v.id} className="border-b">
                <td className="p-2">{v.licensePlate}</td>
                <td className="p-2">{v.brand} {v.model} ({v.year})</td>
                <td className="p-2">{v.category?.name}</td>
                <td className="p-2">Rp {Number(v.pricePerDay).toLocaleString("id-ID")}</td>
                <td className="p-2">{v.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
