import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkAvailability } from './checkAvailability'

const mockFindMany = vi.fn()
vi.mock('@/lib/db', () => ({
  db: {
    booking: {
      findMany: (...args: unknown[]) => mockFindMany(...args)
    }
  }
}))

describe('Availability Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws error if endDate is before startDate', async () => {
    const data = {
      vehicleId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: new Date('2026-10-05'),
      endDate: new Date('2026-10-01')
    }

    await expect(checkAvailability(data)).rejects.toThrow()
  })

  it('returns false if there is an overlapping booking (Scenario A vs B)', async () => {
    // Scenario A exists in DB
    mockFindMany.mockResolvedValueOnce([
      { id: 'booking-a', startDate: new Date('2026-10-01'), endDate: new Date('2026-10-05') }
    ])

    // Customer tries Scenario B
    const data = {
      vehicleId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: new Date('2026-10-03'),
      endDate: new Date('2026-10-07')
    }

    const result = await checkAvailability(data)
    expect(result.isAvailable).toBe(false)
    expect(result.conflicts).toHaveLength(1)
  })

  it('returns true if dates do not overlap (Scenario C)', async () => {
    mockFindMany.mockResolvedValueOnce([])

    const data = {
      vehicleId: '123e4567-e89b-12d3-a456-426614174000',
      startDate: new Date('2026-10-08'),
      endDate: new Date('2026-10-10')
    }

    const result = await checkAvailability(data)
    expect(result.isAvailable).toBe(true)
    expect(result.conflicts).toHaveLength(0)
  })
})
