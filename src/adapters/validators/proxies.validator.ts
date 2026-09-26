import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const createProxySchema = z.object({
  namespace: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Namespace can only contain letters, numbers, hyphens and underscores').openapi({
    example: 'users',
  }),
  target: z.string().url().openapi({
    example: 'https://users.yourmicroservices.dev',
  }),
  cacheTtl: z.number().int().nonnegative().optional()
    .openapi({
      example: 60,
    }),
}).openapi('ProxyParams');

export const updateProxySchema = z.object({
  namespace: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Namespace can only contain letters, numbers, hyphens and underscores').optional()
    .openapi({
      example: 'users',
    }),
  target: z.string().url().optional().openapi({
    example: 'https://users.yourmicroservices.dev',
  }),
  cacheTtl: z.number().int().nonnegative().optional()
    .openapi({
      example: 60,
    }),
}).openapi('UpdateProxyParams');

export const proxySchema = z.object({
  id: z.string().openapi({ example: '664bbec08e4dcfefbe811345' }),
  namespace: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/).openapi({ example: 'users' }),
  target: z.string().url().openapi({ example: 'https://users.yourmicroservices.dev' }),
  cacheTtl: z.number().int().nonnegative().optional()
    .openapi({ example: 60 }),
  createdAt: z.string().datetime().openapi({ example: '2026-09-24T12:00:00.000Z' }),
}).openapi('Proxy');

export type CreateProxyInput = z.infer<typeof createProxySchema>;
export type UpdateProxyInput = z.infer<typeof updateProxySchema>;
