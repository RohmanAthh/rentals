import { describe, it, expect, vi } from 'vitest'
import { createVehicle } from './vehicle'

const mockCreate = vi.fn()
vi.mock('@/lib/db', () => ({
  db: {
    vehicle: {
      create: (...args: unknown[]) => mockCreate(...args)
    }
  }
}))

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } })
}))

describe('Vehicle Server Actions', () => {
  it('validates minimum year correctly', async () => {
    const invalidData = {
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      brand: 'Toyota',
      model: 'Kijang',
      licensePlate: 'B123',
      year: 1800, // Invalid year
      pricePerDay: 500000,
      seatingCapacity: 7,
      transmission: 'Manual',
      fuelType: 'Bensin'
    }

    await expect(createVehicle(invalidData)).rejects.toThrow()
  })

  it('creates vehicle with valid data', async () => {
    const validData = {
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      brand: 'Toyota',
      model: 'Kijang',
      licensePlate: 'B123',
      year: 2022,
      pricePerDay: 500000,
      seatingCapacity: 7,
      transmission: 'Manual',
      fuelType: 'Bensin',
      imageUrl: 'https://example.com/image.jpg'
    }

    mockCreate.mockResolvedValueOnce({ id: 'new-id', ...validData })

    const result = await createVehicle(validData)
    expect(result).toBeDefined()
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ brand: 'Toyota' })
    }))
  })
})
