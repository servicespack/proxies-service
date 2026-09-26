import { Router } from 'express';
import swaggerUI from 'swagger-ui-express';

import packageJson from '../../../../package.json';

import { generateOpenApiDocument } from '@/docs/openapi-generator.js';

const router = Router();

const { ENABLE_SWAGGER = 'true' } = process.env;

if (ENABLE_SWAGGER === 'true') {
  const swaggerDocument = generateOpenApiDocument();
  router
    .use(
      swaggerUI.serve,
      swaggerUI.setup({
        ...swaggerDocument,
        info: {
          ...swaggerDocument.info,
          version: packageJson.version,
        },
        servers: [
          ...(swaggerDocument.servers || []),
          {
            url: 'http://localhost:3000',
          },
        ],
      }),
    );
}

export const docs = router;
