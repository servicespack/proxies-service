import type { Request, Response } from 'express'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { auth } from '@/adapters/middlewares/auth.middleware.js'

describe('auth middleware', () => {
  const createMockResponse = () => {
    const response = {} as Response
    response.status = vi.fn().mockReturnValue(response) as any
    response.json = vi.fn().mockReturnValue(response) as any
    return response
  }

  const createMockRequest = (overrides = {}) => ({
    headers: {},
    query: {},
    ...overrides,
  } as Request)

  describe('when validToken is provided as a string', () => {
    it('should call next when token matches query param', () => {
      const middleware = auth({ token: 'secret-token' })
      const request = createMockRequest({
        query: { token: 'secret-token' },
      })
      const response = createMockResponse()
      const next = vi.fn()

      middleware(request, response, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(response.status).not.toHaveBeenCalled()
    })

    it('should return 401 when query token is invalid', () => {
      const middleware = auth({ token: 'secret-token' })
      const request = createMockRequest({
        query: { token: 'wrong-token' },
      })
      const response = createMockResponse()
      const next = vi.fn()

      middleware(request, response, next)

      expect(next).not.toHaveBeenCalled()
      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return 401 when no token is provided in request', () => {
      const middleware = auth({ token: 'secret-token' })
      const request = createMockRequest()
      const response = createMockResponse()
      const next = vi.fn()

      middleware(request, response, next)

      expect(next).not.toHaveBeenCalled()
      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })
  })

  describe('when validToken is provided as a function', () => {
    it('should call next when token function returns matching token', () => {
      const tokenFn = vi.fn().mockReturnValue('dynamic-token')
      const middleware = auth({ token: tokenFn })
      const request = createMockRequest({
        query: { token: 'dynamic-token' },
      })
      const response = createMockResponse()
      const next = vi.fn()

      middleware(request, response, next)

      expect(tokenFn).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(response.status).not.toHaveBeenCalled()
    })

    it('should return 401 when token function returns non-matching token', () => {
      const tokenFn = vi.fn().mockReturnValue('expected-token')
      const middleware = auth({ token: tokenFn })
      const request = createMockRequest({
        query: { token: 'wrong-token' },
      })
      const response = createMockResponse()
      const next = vi.fn()

      middleware(request, response, next)

      expect(tokenFn).toHaveBeenCalledTimes(1)
      expect(next).not.toHaveBeenCalled()
      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return 401 when token function returns undefined', () => {
      const tokenFn = vi.fn().mockReturnValue(undefined)
      const middleware = auth({ token: tokenFn })
      const request = createMockRequest({
        query: { token: 'any-token' },
      })
      const response = createMockResponse()
      const next = vi.fn()

      middleware(request, response, next)

      expect(tokenFn).toHaveBeenCalledTimes(1)
      expect(next).not.toHaveBeenCalled()
      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })
  })

  describe('when validToken is undefined', () => {
    it('should return 401 when params token is undefined', () => {
      const middleware = auth({})
      const request = createMockRequest({
        query: { token: 'any-token' },
      })
      const response = createMockResponse()
      const next = vi.fn()

      middleware(request, response, next)

      expect(next).not.toHaveBeenCalled()
      expect(response.status).toHaveBeenCalledWith(401)
      expect(response.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })
  })
})
