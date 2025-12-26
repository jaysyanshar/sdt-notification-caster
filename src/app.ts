import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler';
import { requestLogger, bodyParser } from './shared/middleware';
import userRoutes from './modules/user/user.routes';
import { createOpenApiRouter } from './shared/openapi/openapi.routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(bodyParser);
  app.use(requestLogger);

  // Docs
  app.use(createOpenApiRouter());

  // Routes
  app.use('/api/user', userRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
