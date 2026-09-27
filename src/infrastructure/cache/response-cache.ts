export interface CacheEntry {
  statusCode: number
  headers: Record<string, string | string[] | undefined>
  body: any
  expiresAt: number
}

export class InMemoryResponseCache {
  private readonly cache = new Map<string, CacheEntry>()

  private cleanupInterval?: ReturnType<typeof setInterval>

  private readonly maxSize: number

  constructor(maxSize = 1000) {
    this.maxSize = maxSize
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key)
        }
      }
    }, 60000)

    // unref prevents the interval from keeping the event loop alive
    this.cleanupInterval.unref?.()
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key)
    if (!entry)
      return undefined

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key)
      return undefined
    }

    return entry
  }

  set(key: string, entry: CacheEntry): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }
    this.cache.set(key, entry)
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  invalidateNamespace(namespace: string): void {
    const prefix = `${namespace}:`
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

export const responseCache = new InMemoryResponseCache()
