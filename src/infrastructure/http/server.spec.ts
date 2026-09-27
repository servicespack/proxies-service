import {
  describe,
  expect,
  it,
} from 'vitest'

process.env.TOKEN = 'test-token'

const { sanitizeLogRequest } = await import('@/infrastructure/http/server.js')

describe('server', () => {
  describe('sanitizeLogRequest', () => {
    it('should mask token in query parameter of url', () => {
      const req = {
        url: '/proxies?token=secret-token&other=value',
      }

      const result = sanitizeLogRequest(req)

      expect(result.url).toBe('/proxies?token=***&other=value')
    })

    it('should remove token from parsed query object', () => {
      const req = {
        url: '/proxies?token=secret-token&page=1',
        query: {
          token: 'secret-token',
          page: '1',
        },
      }

      const result = sanitizeLogRequest(req)

      expect(result.query).toEqual({ page: '1' })
    })

    it('should leave url unchanged when no token is present', () => {
      const req = {
        url: '/metrics',
        query: {},
      }

      const result = sanitizeLogRequest(req)

      expect(result.url).toBe('/metrics')
      expect(result.query).toEqual({})
    })

    it('should not mutate original request object', () => {
      const req = {
        url: '/proxies?token=secret',
        query: {
          token: 'secret',
        },
      }

      sanitizeLogRequest(req)

      expect(req.url).toBe('/proxies?token=secret')
      expect(req.query).toEqual({ token: 'secret' })
    })

    it('should handle request without url or query safely', () => {
      const req = {
        method: 'GET',
      }

      const result = sanitizeLogRequest(req)

      expect(result).toEqual({ method: 'GET' })
    })
  })
})
