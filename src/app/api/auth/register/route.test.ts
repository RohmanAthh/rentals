import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_pw')
  }
}))

describe('Register API Rate Limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(db.user.create).mockResolvedValue({ id: 'mock-id' } as unknown as import('@prisma/client').User)
  })

  it('allows 5 requests and blocks the 6th with 429', async () => {
    const makeReq = () => {
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'x-forwarded-for': '123.123.123.123' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          phone: '08123456789',
          password: 'password123'
        })
      })
      return POST(req)
    }

    // Requests 1 to 5 should succeed (status 201)
    for (let i = 0; i < 5; i++) {
      const res = await makeReq()
      expect(res.status).toBe(201)
    }

    // Request 6 should fail with 429
    const res6 = await makeReq()
    expect(res6.status).toBe(429)
    const body6 = await res6.json()
    expect(body6.message).toBe("Too Many Requests")
  })
})
