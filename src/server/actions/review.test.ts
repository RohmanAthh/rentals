import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createReview } from './review'
import { getServerSession } from 'next-auth/next'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}))

const mockFindUniqueBooking = vi.fn()
const mockFindUniqueReview = vi.fn()
const mockCreateReview = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    booking: { findUnique: (...args: unknown[]) => mockFindUniqueBooking(...args) },
    review: { 
      findUnique: (...args: unknown[]) => mockFindUniqueReview(...args),
      create: (...args: unknown[]) => mockCreateReview(...args)
    }
  }
}))

describe('Review Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as unknown as import('next-auth').Session)
  })

  it('rejects if booking is not COMPLETED', async () => {
    mockFindUniqueBooking.mockResolvedValueOnce({ id: '123e4567-e89b-12d3-a456-426614174000', userId: 'user-1', status: 'CONFIRMED' })
    await expect(createReview({ bookingId: '123e4567-e89b-12d3-a456-426614174000', rating: 5 })).rejects.toThrow('Hanya booking COMPLETED yang dapat di-review')
  })

  it('rejects if booking belongs to someone else', async () => {
    mockFindUniqueBooking.mockResolvedValueOnce({ id: '123e4567-e89b-12d3-a456-426614174000', userId: 'user-2', status: 'COMPLETED' })
    await expect(createReview({ bookingId: '123e4567-e89b-12d3-a456-426614174000', rating: 5 })).rejects.toThrow('Unauthorized')
  })

  it('creates a review and sanitizes XSS', async () => {
    mockFindUniqueBooking.mockResolvedValueOnce({ id: '123e4567-e89b-12d3-a456-426614174000', userId: 'user-1', vehicleId: 'veh-1', status: 'COMPLETED' })
    mockFindUniqueReview.mockResolvedValueOnce(null)

    await createReview({ bookingId: '123e4567-e89b-12d3-a456-426614174000', rating: 4, comment: '<script>alert(1)</script>' })
    
    expect(mockCreateReview).toHaveBeenCalledWith({
      data: expect.objectContaining({
        comment: '&lt;script&gt;alert(1)&lt;/script&gt;'
      })
    })
  })
})
