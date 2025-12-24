import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './shared/errors/errorHandler';
import { logger } from './shared/logger';
import placeholderRoutes from './modules/placeholder/placeholder.routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/api/placeholder', placeholderRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
