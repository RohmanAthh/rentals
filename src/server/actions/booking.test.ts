import { describe, it, expect, vi } from 'vitest'
import { createBooking } from './booking'

const mockTxFindUnique = vi.fn()
const mockTxFindMany = vi.fn()
const mockTxCreate = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: async (callback: (tx: unknown) => unknown) => {
      // Execute the callback with the mocked tx object
      return callback({
        vehicle: { findUnique: mockTxFindUnique },
        booking: { findMany: mockTxFindMany, create: mockTxCreate }
      })
    }
  }
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', role: 'CUSTOMER' } })
}))

describe('Booking Server Action', () => {
  it('prevents double booking (race condition simulation)', async () => {
    mockTxFindUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', pricePerDay: 500000, status: 'AVAILABLE' })
    
    // Simulate overlap returned from DB during transaction
    mockTxFindMany.mockResolvedValue([
      { id: 'b-1', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-05') }
    ])

    const data = {
      vehicleId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: new Date('2026-10-02'),
      endDate: new Date('2026-10-06')
    }

    await expect(createBooking(data)).rejects.toThrow("Kendaraan sudah dibooking pada tanggal tersebut")
    expect(mockTxCreate).not.toHaveBeenCalled()
  })

  it('calculates total price accurately based on server snapshot', async () => {
    // 3 days: 01 Oct to 03 Oct
    mockTxFindUnique.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', pricePerDay: 500000, status: 'AVAILABLE' })
    mockTxFindMany.mockResolvedValue([])
    mockTxCreate.mockResolvedValue({ id: 'b-new' })

    const data = {
      vehicleId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-03')
    }

    await createBooking(data)

    expect(mockTxCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        totalPrice: 1500000 // 500000 * 3
      })
    }))
  })
})
