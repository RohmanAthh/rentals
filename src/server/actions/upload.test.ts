import { describe, it, expect, vi } from 'vitest'
import { getPresignedUrl } from './upload'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { role: 'ADMIN' } })
}))

describe('Upload Server Action', () => {
  it('rejects invalid file types', async () => {
    await expect(getPresignedUrl('test.txt', 'text/plain', 1000))
      .rejects.toThrow('Tipe file tidak didukung. Harus image/jpeg, image/png, atau image/webp.')
  })

  it('rejects large files', async () => {
    await expect(getPresignedUrl('test.jpg', 'image/jpeg', 6 * 1024 * 1024))
      .rejects.toThrow('Ukuran file maksimal 5MB')
  })

  it('generates presigned url for valid inputs', async () => {
    const res = await getPresignedUrl('test.jpg', 'image/jpeg', 1000)
    expect(res.url).toBeDefined()
    expect(res.key).toBeDefined()
  })
})
