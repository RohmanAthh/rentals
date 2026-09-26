import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardStats, getAllBookings, updateBookingStatus } from './admin'
import { getServerSession } from 'next-auth/next'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

vi.mock('@/lib/db', () => ({
  db: {
    booking: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn()
    },
    user: {
      count: vi.fn()
    }
  }
}))

describe('Admin Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws Unauthorized if no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    
    await expect(getDashboardStats()).rejects.toThrow('Unauthorized: Admin access required')
    await expect(getAllBookings()).rejects.toThrow('Unauthorized: Admin access required')
    await expect(updateBookingStatus('1', 'COMPLETED')).rejects.toThrow('Unauthorized: Admin access required')
  })

  it('throws Unauthorized if role is CUSTOMER', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1', role: 'CUSTOMER' } } as unknown as import('next-auth').Session)
    
    await expect(getDashboardStats()).rejects.toThrow('Unauthorized: Admin access required')
  })

  it('allows access if role is ADMIN', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1', role: 'ADMIN' } } as unknown as import('next-auth').Session)
    
    // Test should pass the requireAdmin check and fail on db mock logic if not mocked, but let's mock it
    const { db } = await import('@/lib/db')
    vi.mocked(db.booking.update).mockResolvedValue({} as unknown as import('@prisma/client').Booking)

    
    await expect(updateBookingStatus('1', 'COMPLETED')).resolves.not.toThrow()
  })
})
