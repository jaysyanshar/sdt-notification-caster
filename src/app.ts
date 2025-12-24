import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler';
import { requestLogger, bodyParser } from './shared/middleware';
import placeholderRoutes from './modules/placeholder/placeholder.routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(bodyParser);
  app.use(requestLogger);

  // Routes
  app.use('/api/placeholder', placeholderRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
