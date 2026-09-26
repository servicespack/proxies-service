import http from 'node:http';

import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import proxy from 'express-http-proxy';
import helmet from 'helmet';
import pino from 'pino-http';

import { resolveProxyTargetUseCase, router } from './router.js';

import { logger } from '@/config/logger.js';
import { responseCache } from '@/infrastructure/cache/response-cache.js';
import { ProxiesEmitter } from '@/infrastructure/events/proxies.emitter.js';

ProxiesEmitter.emitter.removeAllListeners(ProxiesEmitter.Events.UPDATED_PROXY);
ProxiesEmitter.emitter.on(ProxiesEmitter.Events.UPDATED_PROXY, (proxyEntity) => {
  responseCache.invalidateNamespace(proxyEntity.namespace);
});

ProxiesEmitter.emitter.removeAllListeners(ProxiesEmitter.Events.DELETED_PROXY);
ProxiesEmitter.emitter.on(ProxiesEmitter.Events.DELETED_PROXY, (proxyEntity) => {
  responseCache.invalidateNamespace(proxyEntity.namespace);
});

export function sanitizeLogRequest(req: Record<string, unknown>): Record<string, unknown> {
  const serialized = { ...req };
  if (typeof serialized.url === 'string') {
    serialized.url = serialized.url.replace(/([?&])token=[^&]+/, '$1token=***');
  }
  if (serialized.query && typeof serialized.query === 'object') {
    const { token: _token, ...restQuery } = serialized.query as Record<string, unknown>;
    serialized.query = restQuery;
  }
  return serialized;
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(pino({
  logger,
  redact: ['req.headers.authorization', 'req.query.token'],
  serializers: {
    req: sanitizeLogRequest,
  },
}));

app.get('/', (_request: Request, response: Response) => response.json({ I: 'am alive' }));
app.use(router);

function isRequestCacheable(request: Request): boolean {
  const authKey = Object.keys(request.headers).find((k) => k.toLowerCase() === 'authorization');
  const cookieKey = Object.keys(request.headers).find((k) => k.toLowerCase() === 'cookie');
  if ((authKey && request.headers[authKey]) || (cookieKey && request.headers[cookieKey])) {
    return false;
  }
  if (request.query && request.query.token) {
    return false;
  }
  return true;
}

function isResponseCacheable(headers: Record<string, string | string[] | undefined>): boolean {
  const cacheControlKey = Object.keys(headers).find((k) => k.toLowerCase() === 'cache-control');
  if (!cacheControlKey) return true;

  const cacheControlHeader = headers[cacheControlKey];
  if (!cacheControlHeader) return true;

  const cacheControls = Array.isArray(cacheControlHeader)
    ? cacheControlHeader
    : [cacheControlHeader];
  for (const ccVal of cacheControls) {
    if (typeof ccVal === 'string') {
      const cc = ccVal.toLowerCase();
      if (cc.includes('private') || cc.includes('no-store') || cc.includes('no-cache')) {
        return false;
      }
    }
  }
  return true;
}

const dynamicProxyRouter = express.Router();
dynamicProxyRouter.use('/:namespace', async (request: Request, response: Response, next: NextFunction) => {
  try {
    const namespace = String(request.params.namespace);
    const proxyEntity = await resolveProxyTargetUseCase.execute(namespace);
    if (!proxyEntity) {
      response.status(404).json({ error: 'Namespace not found' });
      return;
    }

    const { target, cacheTtl } = proxyEntity;

    if (request.method === 'GET' && cacheTtl && cacheTtl > 0 && isRequestCacheable(request)) {
      const cacheKey = `${namespace}:${request.method}:${request.originalUrl}`;
      const cached = responseCache.get(cacheKey);

      if (cached) {
        response.setHeader('X-Proxy-Cache', 'HIT');
        response.status(cached.statusCode);
        for (const [key, value] of Object.entries(cached.headers)) {
          if (value !== undefined) {
            response.setHeader(key, value);
          }
        }
        response.send(cached.body);
        return;
      }

      proxy(target, {
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
          const isSuccess = proxyRes.statusCode
            && proxyRes.statusCode >= 200
            && proxyRes.statusCode < 300;
          if (isSuccess && isResponseCacheable(proxyRes.headers)) {
            userRes.setHeader('X-Proxy-Cache', 'MISS');
            const expiresAt = Date.now() + cacheTtl * 1000;

            const headersToCache: Record<string, string | string[] | undefined> = {};
            const excludedHeaders = [
              'connection',
              'transfer-encoding',
              'keep-alive',
              'upgrade',
              'proxy-authenticate',
              'content-encoding',
              'content-length',
            ];

            for (const [key, value] of Object.entries(proxyRes.headers)) {
              if (!excludedHeaders.includes(key.toLowerCase())) {
                headersToCache[key] = value;
              }
            }

            responseCache.set(cacheKey, {
              statusCode: proxyRes.statusCode as number,
              headers: headersToCache,
              body: proxyResData,
              expiresAt,
            });
          }
          return proxyResData;
        },
      })(request, response, next);
    } else {
      proxy(target)(request, response, next);
    }
  } catch (error) {
    next(error);
  }
});
app.use(dynamicProxyRouter);

export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

app.use((error: HttpError, _request: Request, response: Response, _next: NextFunction): void => {
  const status = error.status || error.statusCode || 500;
  response.status(status).json({
    error: error.message || 'Internal Server Error',
  });
});

export const server = http.createServer(app);
export { app };
