import { db } from "@/lib/db"
import { z } from "zod"
import { startOfDay, endOfDay, isBefore } from "date-fns"

const checkAvailabilitySchema = z.object({
  vehicleId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date()
}).refine(data => !isBefore(data.endDate, data.startDate), {
  message: "Tanggal akhir tidak boleh lebih awal dari tanggal mulai"
})

export async function checkAvailability(data: { vehicleId: string, startDate: Date, endDate: Date }) {
  const parsed = checkAvailabilitySchema.parse({
    vehicleId: data.vehicleId,
    // Gunakan startOfDay dan endOfDay untuk normalisasi jam
    startDate: startOfDay(data.startDate),
    endDate: endOfDay(data.endDate)
  })

  // Periksa apakah ada booking yang overlap
  // Logika Overlap: (NewStart <= ExistingEnd) AND (NewEnd >= ExistingStart)
  const overlappingBookings = await db.booking.findMany({
    where: {
      vehicleId: parsed.vehicleId,
      status: {
        in: ['PENDING', 'CONFIRMED', 'ONGOING']
      },
      AND: [
        { startDate: { lte: parsed.endDate } },
        { endDate: { gte: parsed.startDate } }
      ]
    }
  })

  return {
    isAvailable: overlappingBookings.length === 0,
    conflicts: overlappingBookings
  }
}
