"use server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
})

export async function createCategory(data: z.infer<typeof categorySchema>) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  
  const parsed = categorySchema.parse(data)
  return await db.vehicleCategory.create({ data: parsed })
}

export async function getCategories() {
  return await db.vehicleCategory.findMany()
}
