import VehicleForm from "@/components/admin/VehicleForm"
import { getCategories } from "@/server/actions/category"

export const dynamic = "force-dynamic"

export default async function NewVehiclePage() {
  const categories = await getCategories()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Tambah Kendaraan Baru</h1>
      <VehicleForm categories={categories} />
    </div>
  )
}
