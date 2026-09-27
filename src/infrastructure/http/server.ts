import type { NextFunction, Request, Response } from 'express'

import type { ProxyEntity } from '@/domain/entities/proxy.entity.js'
import http from 'node:http'
import cors from 'cors'
import express from 'express'
import proxy from 'express-http-proxy'
import helmet from 'helmet'

import pino from 'pino-http'

import { logger } from '@/config/logger.js'
import { responseCache } from '@/infrastructure/cache/response-cache.js'
import { ProxiesEmitter } from '@/infrastructure/events/proxies.emitter.js'
import { resolveProxyTargetUseCase, router } from './router.js'

ProxiesEmitter.emitter.removeAllListeners(ProxiesEmitter.Events.UPDATED_PROXY)
ProxiesEmitter.emitter.on(ProxiesEmitter.Events.UPDATED_PROXY, (proxyEntity) => {
  responseCache.invalidateNamespace(proxyEntity.namespace)
})

ProxiesEmitter.emitter.removeAllListeners(ProxiesEmitter.Events.DELETED_PROXY)
ProxiesEmitter.emitter.on(ProxiesEmitter.Events.DELETED_PROXY, (proxyEntity) => {
  responseCache.invalidateNamespace(proxyEntity.namespace)
})

export function sanitizeLogRequest(req: Record<string, unknown>): Record<string, unknown> {
  const serialized = { ...req }
  if (typeof serialized.url === 'string') {
    serialized.url = serialized.url.replace(/([?&])token=[^&]+/, '$1token=***')
  }
  if (serialized.query && typeof serialized.query === 'object') {
    const { token: _token, ...restQuery } = serialized.query as Record<string, unknown>
    serialized.query = restQuery
  }
  return serialized
}

const app = express()

app.use(cors())
app.use(express.json())
app.use(helmet())
app.use(pino({
  logger,
  redact: ['req.headers.authorization', 'req.query.token'],
  serializers: {
    req: sanitizeLogRequest,
  },
}))

app.get('/', (_request: Request, response: Response) => response.json({ I: 'am alive' }))
app.use(router)

function isRequestCacheable(request: Request): boolean {
  const authKey = Object.keys(request.headers).find(k => k.toLowerCase() === 'authorization')
  const cookieKey = Object.keys(request.headers).find(k => k.toLowerCase() === 'cookie')
  if ((authKey && request.headers[authKey]) || (cookieKey && request.headers[cookieKey])) {
    return false
  }
  if (request.query && request.query.token) {
    return false
  }
  return true
}

function isResponseCacheable(headers: Record<string, string | string[] | undefined>): boolean {
  const cacheControlKey = Object.keys(headers).find(k => k.toLowerCase() === 'cache-control')
  if (!cacheControlKey)
    return true

  const cacheControlHeader = headers[cacheControlKey]
  if (!cacheControlHeader)
    return true

  const cacheControls = Array.isArray(cacheControlHeader)
    ? cacheControlHeader
    : [cacheControlHeader]
  for (const ccVal of cacheControls) {
    if (typeof ccVal === 'string') {
      const cc = ccVal.toLowerCase()
      if (cc.includes('private') || cc.includes('no-store') || cc.includes('no-cache')) {
        return false
      }
    }
  }
  return true
}

const rateLimitStores = new Map<string, number[]>()

function checkRateLimit(namespace: string, ip: string, windowMs: number, max: number): boolean {
  const key = `${namespace}:${ip}`
  const now = Date.now()
  let timestamps = rateLimitStores.get(key) || []

  timestamps = timestamps.filter(ts => now - ts < windowMs)

  if (timestamps.length >= max) {
    if (timestamps.length > 0) {
      rateLimitStores.set(key, timestamps)
    }
    else {
      rateLimitStores.delete(key)
    }
    return false
  }

  timestamps.push(now)
  rateLimitStores.set(key, timestamps)
  return true
}

setInterval(() => {
  for (const [key, timestamps] of rateLimitStores.entries()) {
    if (timestamps.length === 0) {
      rateLimitStores.delete(key)
    }
  }
}, 300000).unref?.()

const roundRobinIndices = new Map<string, number>()

function getNextTarget(proxyEntity: ProxyEntity): string {
  if (proxyEntity.targets && proxyEntity.targets.length > 0) {
    if (proxyEntity.loadBalancerStrategy === 'random') {
      const index = Math.floor(Math.random() * proxyEntity.targets.length)
      return proxyEntity.targets[index]
    }
    let index = roundRobinIndices.get(proxyEntity.id) || 0
    const selectedTarget = proxyEntity.targets[index]
    index = (index + 1) % proxyEntity.targets.length
    roundRobinIndices.set(proxyEntity.id, index)
    return selectedTarget
  }
  return proxyEntity.target
}

const dynamicProxyRouter = express.Router()
dynamicProxyRouter.use('/:namespace', async (request: Request, response: Response, next: NextFunction) => {
  try {
    const namespace = String(request.params.namespace)
    const proxyEntity = await resolveProxyTargetUseCase.execute(namespace)
    if (!proxyEntity) {
      response.status(404).json({ error: 'Namespace not found' })
      return
    }

    if (proxyEntity.rateLimitWindowMs && proxyEntity.rateLimitMax) {
      const ip = request.ip || request.socket.remoteAddress || 'unknown'
      const allowed = checkRateLimit(
        namespace,
        ip,
        proxyEntity.rateLimitWindowMs,
        proxyEntity.rateLimitMax,
      )
      if (!allowed) {
        response.status(429).json({ error: 'Too many requests' })
        return
      }
    }

    const target = getNextTarget(proxyEntity)
    const { cacheTtl } = proxyEntity

    const proxyOptions: any = {}
    if (proxyEntity.headersToInject || proxyEntity.headersToRemove) {
      proxyOptions.proxyReqOptDecorator = (proxyReqOpts: any) => {
        const decoratedOpts = { ...proxyReqOpts }
        if (proxyEntity.headersToInject) {
          decoratedOpts.headers = {
            ...decoratedOpts.headers,
            ...proxyEntity.headersToInject,
          }
        }
        if (proxyEntity.headersToRemove) {
          decoratedOpts.headers = { ...decoratedOpts.headers }
          for (const h of proxyEntity.headersToRemove) {
            delete decoratedOpts.headers[h.toLowerCase()]
            delete decoratedOpts.headers[h]
          }
        }
        return decoratedOpts
      }
    }

    if (request.method === 'GET' && cacheTtl && cacheTtl > 0 && isRequestCacheable(request)) {
      const cacheKey = `${namespace}:${request.method}:${request.originalUrl}`
      const cached = responseCache.get(cacheKey)

      if (cached) {
        response.setHeader('X-Proxy-Cache', 'HIT')
        response.status(cached.statusCode)
        for (const [key, value] of Object.entries(cached.headers)) {
          if (value !== undefined) {
            response.setHeader(key, value)
          }
        }
        response.send(cached.body)
        return
      }

      proxy(target, {
        ...proxyOptions,
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
          const isSuccess = proxyRes.statusCode
            && proxyRes.statusCode >= 200
            && proxyRes.statusCode < 300
          if (isSuccess && isResponseCacheable(proxyRes.headers)) {
            userRes.setHeader('X-Proxy-Cache', 'MISS')
            const expiresAt = Date.now() + cacheTtl * 1000

            const headersToCache: Record<string, string | string[] | undefined> = {}
            const excludedHeaders = [
              'connection',
              'transfer-encoding',
              'keep-alive',
              'upgrade',
              'proxy-authenticate',
              'content-encoding',
              'content-length',
            ]

            for (const [key, value] of Object.entries(proxyRes.headers)) {
              if (!excludedHeaders.includes(key.toLowerCase())) {
                headersToCache[key] = value
              }
            }

            responseCache.set(cacheKey, {
              statusCode: proxyRes.statusCode as number,
              headers: headersToCache,
              body: proxyResData,
              expiresAt,
            })
          }
          return proxyResData
        },
      })(request, response, next)
      return
    }

    proxy(target, proxyOptions)(request, response, next)
  }
  catch (error) {
    next(error)
  }
})
app.use(dynamicProxyRouter)

export interface HttpError extends Error {
  status?: number
  statusCode?: number
}

app.use((error: HttpError, _request: Request, response: Response, _next: NextFunction): void => {
  const status = error.status || error.statusCode || 500
  response.status(status).json({
    error: error.message || 'Internal Server Error',
  })
})

export const server = http.createServer(app)
export { app }
