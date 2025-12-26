import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { createOpenApiSpec } from './openapi';

export function createOpenApiRouter(): Router {
  const router = Router();

  router.get('/openapi.json', (req, res) => {
    res.json(createOpenApiSpec());
  });

  router.use(
    '/api-docs',
    swaggerUi.serve,
    // swaggerUi.setup returns a middleware; pass the spec to ensure the UI shows correct data
    swaggerUi.setup(createOpenApiSpec(), { explorer: true })
  );

  return router;
}

