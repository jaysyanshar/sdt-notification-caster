import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger';
import { env } from '../../config';
import { HttpResponse } from '../utils/HttpResponse';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    HttpResponse.send(res, err.statusCode, err.message, 'ERROR');
    return;
  }

  // Log unexpected errors
  logger.error(`Unexpected error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't expose internal error details in production
  const message = env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  HttpResponse.error(res, message);
}

export function notFoundHandler(req: Request, res: Response): void {
  HttpResponse.notFound(res, `Route ${req.method} ${req.path} not found`);
}
