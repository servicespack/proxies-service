import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { InMemoryResponseCache } from './response-cache.js'

describe('InMemoryResponseCache', () => {
  let cache: InMemoryResponseCache

  beforeEach(() => {
    vi.useFakeTimers()
    cache = new InMemoryResponseCache()
  })

  afterEach(() => {
    cache.destroy()
    vi.useRealTimers()
  })

  it('should store and retrieve an item', () => {
    const expiresAt = Date.now() + 10000
    cache.set('test-key', {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"foo":"bar"}',
      expiresAt,
    })

    const item = cache.get('test-key')
    expect(item).toBeDefined()
    expect(item?.statusCode).toBe(200)
    expect(item?.body).toBe('{"foo":"bar"}')
  })

  it('should return undefined and delete item if expired', () => {
    const expiresAt = Date.now() + 5000
    cache.set('test-key', {
      statusCode: 200,
      headers: {},
      body: 'data',
      expiresAt,
    })

    vi.advanceTimersByTime(6000)

    const item = cache.get('test-key')
    expect(item).toBeUndefined()
  })

  it('should invalidate namespace specific keys', () => {
    cache.set('users:GET:/users/1', {
      statusCode: 200,
      headers: {},
      body: 'user-1',
      expiresAt: Date.now() + 10000,
    })

    cache.set('products:GET:/products/1', {
      statusCode: 200,
      headers: {},
      body: 'product-1',
      expiresAt: Date.now() + 10000,
    })

    cache.invalidateNamespace('users')

    expect(cache.get('users:GET:/users/1')).toBeUndefined()
    expect(cache.get('products:GET:/products/1')).toBeDefined()
  })

  it('should cleanup expired items periodically', () => {
    cache.set('test-key-1', {
      statusCode: 200,
      headers: {},
      body: 'data',
      expiresAt: Date.now() + 30000,
    })

    cache.set('test-key-2', {
      statusCode: 200,
      headers: {},
      body: 'data',
      expiresAt: Date.now() + 90000,
    })

    vi.advanceTimersByTime(65000) // Exceeds the 60000ms cleanup interval

    // Since fake timers run, let's verify that get on test-key-1 deletes it or it's gone
    expect(cache.get('test-key-1')).toBeUndefined()
    expect(cache.get('test-key-2')).toBeDefined()
  })

  it('should evict the oldest item when the max size is reached', () => {
    const limitedCache = new InMemoryResponseCache(2)
    limitedCache.set('key-1', {
      statusCode: 200,
      headers: {},
      body: '1',
      expiresAt: Date.now() + 10000,
    })
    limitedCache.set('key-2', {
      statusCode: 200,
      headers: {},
      body: '2',
      expiresAt: Date.now() + 10000,
    })
    limitedCache.set('key-3', {
      statusCode: 200,
      headers: {},
      body: '3',
      expiresAt: Date.now() + 10000,
    })

    expect(limitedCache.get('key-1')).toBeUndefined()
    expect(limitedCache.get('key-2')).toBeDefined()
    expect(limitedCache.get('key-3')).toBeDefined()
    limitedCache.destroy()
  })
})
