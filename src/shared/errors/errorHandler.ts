import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger';
import { env } from '../../config';
import { ApiResponse } from '../utils/HttpResponse';

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

    const response: ApiResponse = {
      code: 'ERROR',
      message: err.message,
      serverTime: new Date().toISOString(),
    };

    res.status(err.statusCode).json(response);
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

  const response: ApiResponse = {
    code: 'ERROR',
    message,
    serverTime: new Date().toISOString(),
  };

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    serverTime: new Date().toISOString(),
  };

  res.status(404).json(response);
}
