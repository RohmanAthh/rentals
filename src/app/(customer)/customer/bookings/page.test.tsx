import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CustomerBookingsPage from './page'
import * as bookingActions from '@/server/actions/booking'

// Mock the module
vi.mock('@/server/actions/booking', () => ({
  getCustomerBookings: vi.fn(),
  cancelBooking: vi.fn()
}))

// Mock the BookingActions client component to avoid router issues in test
vi.mock('@/components/customer/BookingActions', () => ({
  default: () => <div data-testid="booking-actions">Actions</div>
}))

describe('Customer Bookings Page', () => {
  it('shows empty state when no bookings exist', async () => {
    vi.mocked(bookingActions.getCustomerBookings).mockResolvedValueOnce([])
    
    // Server components return a promise of JSX
    const jsx = await CustomerBookingsPage()
    render(jsx)
    
    expect(screen.getByText('Anda belum memiliki riwayat pemesanan.')).toBeDefined()
  })

  it('shows transaction history when bookings exist', async () => {
    vi.mocked(bookingActions.getCustomerBookings).mockResolvedValueOnce([
      {
        id: '1',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-03'),
        totalPrice: 1500000 as unknown as import('@prisma/client').Prisma.Decimal,
        status: 'CONFIRMED',
        vehicle: { brand: 'Toyota', model: 'Avanza' },
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'u1',
        vehicleId: 'v1'
      } as unknown as Awaited<ReturnType<typeof bookingActions.getCustomerBookings>>[0]
    ])
    
    const jsx = await CustomerBookingsPage()
    render(jsx)
    
    expect(screen.getByText('Toyota Avanza')).toBeDefined()
    expect(screen.getByText('Total: Rp 1.500.000')).toBeDefined()
    expect(screen.getByText('CONFIRMED')).toBeDefined()
  })
})
