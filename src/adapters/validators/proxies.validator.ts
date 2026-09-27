import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

export const createProxySchema = z.object({
  namespace: z.string().min(1).regex(/^[\w-]+$/, 'Namespace can only contain letters, numbers, hyphens and underscores').openapi({
    example: 'users',
  }),
  target: z.string().url().optional().openapi({
    example: 'https://users.yourmicroservices.dev',
  }),
  cacheTtl: z.number().int().nonnegative().optional().openapi({
    example: 60,
  }),
  headersToInject: z.record(z.string(), z.string()).optional().openapi({
    example: { 'X-Custom-Header': 'value' },
  }),
  headersToRemove: z.array(z.string()).optional().openapi({
    example: ['cookie'],
  }),
  rateLimitWindowMs: z.number().int().positive().optional().openapi({
    example: 60000,
  }),
  rateLimitMax: z.number().int().positive().optional().openapi({
    example: 100,
  }),
  targets: z.array(z.string().url()).min(1).optional().openapi({
    example: ['https://users1.yourmicroservices.dev', 'https://users2.yourmicroservices.dev'],
  }),
  loadBalancerStrategy: z.enum(['round-robin', 'random']).optional().openapi({
    example: 'round-robin',
  }),
}).refine(data => data.target || (data.targets && data.targets.length > 0), {
  message: 'Either target or targets must be provided',
  path: ['target'],
}).openapi('ProxyParams')

export const updateProxySchema = z.object({
  namespace: z.string().min(1).regex(/^[\w-]+$/, 'Namespace can only contain letters, numbers, hyphens and underscores').optional().openapi({
    example: 'users',
  }),
  target: z.string().url().optional().openapi({
    example: 'https://users.yourmicroservices.dev',
  }),
  cacheTtl: z.number().int().nonnegative().optional().openapi({
    example: 60,
  }),
  headersToInject: z.record(z.string(), z.string()).optional().openapi({
    example: { 'X-Custom-Header': 'value' },
  }),
  headersToRemove: z.array(z.string()).optional().openapi({
    example: ['cookie'],
  }),
  rateLimitWindowMs: z.number().int().positive().optional().openapi({
    example: 60000,
  }),
  rateLimitMax: z.number().int().positive().optional().openapi({
    example: 100,
  }),
  targets: z.array(z.string().url()).min(1).optional().openapi({
    example: ['https://users1.yourmicroservices.dev', 'https://users2.yourmicroservices.dev'],
  }),
  loadBalancerStrategy: z.enum(['round-robin', 'random']).optional().openapi({
    example: 'round-robin',
  }),
}).openapi('UpdateProxyParams')

export const proxySchema = z.object({
  id: z.string()
    .openapi({ example: '664bbec08e4dcfefbe811345' }),
  namespace: z.string().min(1).regex(/^[\w-]+$/).openapi({ example: 'users' }),
  target: z.string().url().openapi({ example: 'https://users.yourmicroservices.dev' }),
  cacheTtl: z.number().int().nonnegative().optional().openapi({ example: 60 }),
  headersToInject: z.record(z.string(), z.string()).optional().openapi({
    example: { 'X-Custom-Header': 'value' },
  }),
  headersToRemove: z.array(z.string()).optional().openapi({
    example: ['cookie'],
  }),
  rateLimitWindowMs: z.number().int().positive().optional().openapi({
    example: 60000,
  }),
  rateLimitMax: z.number().int().positive().optional().openapi({
    example: 100,
  }),
  targets: z.array(z.string().url()).min(1).optional().openapi({
    example: ['https://users1.yourmicroservices.dev', 'https://users2.yourmicroservices.dev'],
  }),
  loadBalancerStrategy: z.enum(['round-robin', 'random']).optional().openapi({
    example: 'round-robin',
  }),
  createdAt: z.string().datetime().openapi({ example: '2026-09-24T12:00:00.000Z' }),
}).openapi('Proxy')

export type CreateProxyInput = z.infer<typeof createProxySchema>
export type UpdateProxyInput = z.infer<typeof updateProxySchema>
