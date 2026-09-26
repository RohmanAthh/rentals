export function rateLimit(options: { interval: number; uniqueTokenPerInterval: number }) {
  const tokenCache = new Map<string, number[]>()

  // Clear cache periodically to prevent memory leaks
  setInterval(() => {
    tokenCache.clear()
  }, options.interval)

  return {
    check: (limit: number, token: string) => {
      const now = Date.now()
      const tokenCount = tokenCache.get(token) || [0]
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1, now])
      } else {
        tokenCount[0] += 1
        tokenCache.set(token, tokenCount)
      }

      const currentUsage = tokenCache.get(token)?.[0] || 0
      const isRateLimited = currentUsage > limit

      return new Promise<void>((resolve, reject) => {
        if (isRateLimited) {
          reject(new Error("Rate limit exceeded"))
        } else {
          resolve()
        }
      })
    },
  }
}
