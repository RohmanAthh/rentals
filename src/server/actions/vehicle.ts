"use server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const vehicleSchema = z.object({
  categoryId: z.string().uuid(),
  brand: z.string().min(1),
  model: z.string().min(1),
  licensePlate: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  pricePerDay: z.number().min(0),
  seatingCapacity: z.number().min(1),
  transmission: z.string().min(1),
  fuelType: z.string().min(1),
  imageUrl: z.string().url().optional()
})

export async function createVehicle(data: z.infer<typeof vehicleSchema>) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  
  const parsed = vehicleSchema.parse(data)
  
  const vehicle = await db.vehicle.create({
    data: {
      categoryId: parsed.categoryId,
      brand: parsed.brand,
      model: parsed.model,
      licensePlate: parsed.licensePlate,
      year: parsed.year,
      pricePerDay: parsed.pricePerDay,
      seatingCapacity: parsed.seatingCapacity,
      transmission: parsed.transmission,
      fuelType: parsed.fuelType,
      images: parsed.imageUrl ? {
        create: { url: parsed.imageUrl, isPrimary: true }
      } : undefined
    }
  })

  return vehicle
}

export async function getVehicles() {
  return await db.vehicle.findMany({
    where: { deletedAt: null },
    include: {
      images: true,
      category: true
    }
  })
}
