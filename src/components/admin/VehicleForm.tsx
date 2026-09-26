"use client"
import { useState } from "react"
import { createVehicle } from "@/server/actions/vehicle"
import { getPresignedUrl } from "@/server/actions/upload"
import { useRouter } from "next/navigation"

export default function VehicleForm({ categories }: { categories: { id: string, name: string }[] }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)

    try {
      let imageUrl = undefined

      if (file) {
        const { url, key } = await getPresignedUrl(file.name, file.type, file.size)
        
        // Mock upload or real upload based on URL
        if (url.startsWith("https://mock-s3-url.com")) {
          imageUrl = url
        } else {
          const uploadRes = await fetch(url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type
            }
          })
          if (!uploadRes.ok) throw new Error("Gagal mengunggah gambar")
          imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`
        }
      }

      await createVehicle({
        categoryId: formData.get("categoryId") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        licensePlate: formData.get("licensePlate") as string,
        year: parseInt(formData.get("year") as string),
        pricePerDay: parseFloat(formData.get("pricePerDay") as string),
        seatingCapacity: parseInt(formData.get("seatingCapacity") as string),
        transmission: formData.get("transmission") as string,
        fuelType: formData.get("fuelType") as string,
        imageUrl
      })

      router.push("/admin/vehicles")
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Terjadi kesalahan")
      } else {
        setError("Terjadi kesalahan")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <div>
        <label htmlFor="categoryId">Kategori</label>
        <select id="categoryId" name="categoryId" required className="w-full border p-2 rounded">
          <option value="">Pilih Kategori</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="brand">Merek</label>
        <input id="brand" name="brand" type="text" required className="w-full border p-2 rounded" />
      </div>

      <div>
        <label htmlFor="model">Model</label>
        <input id="model" name="model" type="text" required className="w-full border p-2 rounded" />
      </div>

      <div>
        <label htmlFor="licensePlate">Plat Nomor</label>
        <input id="licensePlate" name="licensePlate" type="text" required className="w-full border p-2 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="year">Tahun</label>
          <input id="year" name="year" type="number" required min="1900" className="w-full border p-2 rounded" />
        </div>
        <div>
          <label htmlFor="pricePerDay">Harga per Hari</label>
          <input id="pricePerDay" name="pricePerDay" type="number" required min="0" className="w-full border p-2 rounded" />
        </div>
        <div>
          <label htmlFor="seatingCapacity">Kapasitas Kursi</label>
          <input id="seatingCapacity" name="seatingCapacity" type="number" required min="1" className="w-full border p-2 rounded" />
        </div>
        <div>
          <label htmlFor="transmission">Transmisi</label>
          <select id="transmission" name="transmission" required className="w-full border p-2 rounded">
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
          </select>
        </div>
        <div>
          <label htmlFor="fuelType">Bahan Bakar</label>
          <select id="fuelType" name="fuelType" required className="w-full border p-2 rounded">
            <option value="Bensin">Bensin</option>
            <option value="Diesel">Diesel</option>
            <option value="Listrik">Listrik</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="image">Gambar Mobil</label>
        <input 
          id="image" 
          type="file" 
          accept="image/jpeg, image/png, image/webp" 
          onChange={e => setFile(e.target.files?.[0] || null)} 
          className="w-full border p-2 rounded" 
        />
      </div>

      <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded">
        {loading ? "Menyimpan..." : "Simpan Kendaraan"}
      </button>
    </form>
  )
}
