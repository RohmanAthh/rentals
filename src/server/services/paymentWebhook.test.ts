import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processWebhook } from './paymentWebhook'
import crypto from 'crypto'

const mockFindFirst = vi.fn()
const mockTx = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    payment: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: vi.fn().mockResolvedValue({})
    },
    booking: {
      update: vi.fn().mockResolvedValue({})
    },
    $transaction: (...args: unknown[]) => mockTx(...args)
  }
}))

describe('Payment Webhook', () => {
  const secret = 'my-super-secret'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects invalid signature', async () => {
    const payload = JSON.stringify({ transactionId: 'TRX-123', status: 'success' })
    const invalidSignature = 'bad-signature'

    await expect(processWebhook(payload, invalidSignature, secret)).rejects.toThrow('Invalid signature')
  })

  it('processes valid webhook and returns success', async () => {
    const payload = JSON.stringify({ transactionId: 'TRX-123', status: 'success' })
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    mockFindFirst.mockResolvedValueOnce({ id: 'pay-1', bookingId: 'book-1', status: 'PENDING' })
    mockTx.mockResolvedValueOnce([{}, {}])

    const result = await processWebhook(payload, signature, secret)
    expect(result.success).toBe(true)
    expect(mockTx).toHaveBeenCalled()
  })

  it('handles idempotency (already paid)', async () => {
    const payload = JSON.stringify({ transactionId: 'TRX-123', status: 'success' })
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    // Mock returning PAID status
    mockFindFirst.mockResolvedValueOnce({ id: 'pay-1', bookingId: 'book-1', status: 'PAID' })

    const result = await processWebhook(payload, signature, secret)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Already processed')
    expect(mockTx).not.toHaveBeenCalled()
  })
})
