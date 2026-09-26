import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { createProxySchema, proxySchema, updateProxySchema } from '@/adapters/validators/proxies.validator.js';

export const registry = new OpenAPIRegistry();

// 1. Security Schemes
const tokenSecurity = registry.registerComponent('securitySchemes', 'Token', {
  type: 'apiKey',
  in: 'query',
  name: 'token',
});

// 2. Component Schemas Registration (so they appear in #/components/schemas)
registry.register('ProxyParams', createProxySchema);
registry.register('UpdateProxyParams', updateProxySchema);
registry.register('Proxy', proxySchema);

// 3. Error Schemas Registration
const badRequestSchema = registry.register('BadRequest', z.object({
  errors: z.array(z.object({})),
}));

const conflictSchema = registry.register('Conflict', z.object({
  error: z.string().openapi({ example: "Proxy with namespace 'users' already exists" }),
}));

const notFoundSchema = registry.register('NotFound', z.object({
  error: z.string().openapi({ example: 'Not found' }),
}));

const unauthorizedSchema = registry.register('Unauthorized', z.object({
  error: z.string().openapi({ example: 'Unauthorized' }),
}));

// 4. Paths Registration
// GET /
registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Healthcheck / ping endpoint',
  responses: {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: z.object({
            I: z.string().openapi({ example: 'am alive' }),
          }),
        },
      },
    },
  },
});

// GET /proxies
registry.registerPath({
  method: 'get',
  path: '/proxies',
  tags: ['Proxies'],
  security: [{ [tokenSecurity.name]: [] }],
  responses: {
    200: {
      description: 'List of proxies',
      content: {
        'application/json': {
          schema: z.array(proxySchema),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: unauthorizedSchema,
        },
      },
    },
  },
});

// POST /proxies
registry.registerPath({
  method: 'post',
  path: '/proxies',
  tags: ['Proxies'],
  security: [{ [tokenSecurity.name]: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProxySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Proxy created',
      content: {
        'application/json': {
          schema: proxySchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: badRequestSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: unauthorizedSchema,
        },
      },
    },
    409: {
      description: 'Conflict',
      content: {
        'application/json': {
          schema: conflictSchema,
        },
      },
    },
  },
});

// GET /proxies/{proxyId}
registry.registerPath({
  method: 'get',
  path: '/proxies/{proxyId}',
  tags: ['Proxies'],
  security: [{ [tokenSecurity.name]: [] }],
  request: {
    params: z.object({
      proxyId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Proxy found',
      content: {
        'application/json': {
          schema: proxySchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: unauthorizedSchema,
        },
      },
    },
    404: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: notFoundSchema,
        },
      },
    },
  },
});

// PATCH /proxies/{proxyId}
registry.registerPath({
  method: 'patch',
  path: '/proxies/{proxyId}',
  tags: ['Proxies'],
  security: [{ [tokenSecurity.name]: [] }],
  request: {
    params: z.object({
      proxyId: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateProxySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Proxy updated',
      content: {
        'application/json': {
          schema: proxySchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: badRequestSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: unauthorizedSchema,
        },
      },
    },
    404: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: notFoundSchema,
        },
      },
    },
    409: {
      description: 'Conflict',
      content: {
        'application/json': {
          schema: conflictSchema,
        },
      },
    },
  },
});

// DELETE /proxies/{proxyId}
registry.registerPath({
  method: 'delete',
  path: '/proxies/{proxyId}',
  tags: ['Proxies'],
  security: [{ [tokenSecurity.name]: [] }],
  request: {
    params: z.object({
      proxyId: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Proxy deleted',
      content: {
        'application/json': {
          schema: proxySchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: unauthorizedSchema,
        },
      },
    },
    404: {
      description: 'Not found',
      content: {
        'application/json': {
          schema: notFoundSchema,
        },
      },
    },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Proxies Service',
      description: 'Dynamic reverse proxy management API',
      version: '1.0.0', // overridden by package.json version in docs.router.ts
    },
    servers: [],
  });
}
