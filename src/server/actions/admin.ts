"use server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required")
  }
  return session
}

export async function getDashboardStats() {
  await requireAdmin()

  const [totalBookings, totalRevenue, activeUsers, bookings] = await Promise.all([
    db.booking.count(),
    db.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: { in: ["CONFIRMED", "ONGOING", "COMPLETED"] } }
    }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.booking.findMany({
      where: { status: { in: ["CONFIRMED", "ONGOING", "COMPLETED"] } },
      select: { createdAt: true, totalPrice: true },
      orderBy: { createdAt: 'asc' }
    })
  ])

  // Group by date (YYYY-MM-DD)
  const chartDataMap: Record<string, number> = {}
  bookings.forEach(b => {
    const dateStr = b.createdAt.toISOString().split('T')[0]
    chartDataMap[dateStr] = (chartDataMap[dateStr] || 0) + Number(b.totalPrice)
  })
  
  const chartData = Object.entries(chartDataMap).map(([date, total]) => ({
    date,
    total
  }))

  return {
    totalBookings,
    totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
    activeUsers,
    chartData
  }
}

export async function getAllBookings() {
  await requireAdmin()
  
  return db.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      vehicle: { select: { brand: true, model: true, licensePlate: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function updateBookingStatus(id: string, status: "PENDING" | "CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED") {
  await requireAdmin()
  
  await db.booking.update({
    where: { id },
    data: { status }
  })
}
