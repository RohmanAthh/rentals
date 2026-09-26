"use server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { startOfDay, endOfDay, differenceInCalendarDays } from "date-fns"
import { Prisma } from "@prisma/client"

const bookingSchema = z.object({
  vehicleId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date()
}).refine(data => data.endDate >= data.startDate, {
  message: "Tanggal akhir harus lebih dari atau sama dengan tanggal mulai"
})

export async function createBooking(data: z.infer<typeof bookingSchema>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const parsed = bookingSchema.parse(data)
  const start = startOfDay(parsed.startDate)
  const end = endOfDay(parsed.endDate)
  
  // Calculate duration (inclusive)
  const days = Math.max(1, differenceInCalendarDays(parsed.endDate, parsed.startDate) + 1)

  try {
    const booking = await db.$transaction(async (tx) => {
      // 1. Get vehicle price per day
      const vehicle = await tx.vehicle.findUnique({
        where: { id: parsed.vehicleId }
      })

      if (!vehicle) throw new Error("Kendaraan tidak ditemukan")
      if (vehicle.status !== "AVAILABLE") throw new Error("Kendaraan sedang tidak tersedia")

      // 2. Race-condition check: Overlapping bookings
      const overlaps = await tx.booking.findMany({
        where: {
          vehicleId: parsed.vehicleId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'ONGOING']
          },
          AND: [
            { startDate: { lte: end } },
            { endDate: { gte: start } }
          ]
        }
      })

      if (overlaps.length > 0) {
        throw new Error("Kendaraan sudah dibooking pada tanggal tersebut")
      }

      // 3. Calculate snapshot total price
      const totalPrice = Number(vehicle.pricePerDay) * days

      // 4. Create booking
      const newBooking = await tx.booking.create({
        data: {
          userId: session.user.id,
          vehicleId: parsed.vehicleId,
          startDate: start,
          endDate: end,
          totalPrice,
          status: "PENDING"
        }
      })

      return newBooking
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    })

    return booking
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || "Gagal membuat booking")
    }
    throw new Error("Gagal membuat booking")
  }
}

export async function getCustomerBookings() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return await db.booking.findMany({
    where: { userId: session.user.id },
    include: {
      vehicle: {
        include: { images: true }
      },
      review: true
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function cancelBooking(bookingId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) throw new Error("Booking tidak ditemukan")
  if (booking.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    throw new Error("Booking tidak bisa dibatalkan pada status ini")
  }

  return await db.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" }
  })
}
