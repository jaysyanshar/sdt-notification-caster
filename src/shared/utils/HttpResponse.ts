import { Response } from 'express';

export interface ApiResponse<T = any> {
  code: string;
  message: string;
  data?: T;
  serverTime: string;
}

export class HttpResponse {
  static success<T>(res: Response, data?: T, message: string = 'Success', code: string = 'SUCCESS'): Response {
    const response: ApiResponse<T> = {
      code,
      message,
      data,
      serverTime: new Date().toISOString(),
    };
    return res.status(200).json(response);
  }

  static created<T>(res: Response, data?: T, message: string = 'Created', code: string = 'CREATED'): Response {
    const response: ApiResponse<T> = {
      code,
      message,
      data,
      serverTime: new Date().toISOString(),
    };
    return res.status(201).json(response);
  }

  static badRequest(res: Response, message: string = 'Bad request', code: string = 'BAD_REQUEST'): Response {
    const response: ApiResponse = {
      code,
      message,
      serverTime: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized', code: string = 'UNAUTHORIZED'): Response {
    const response: ApiResponse = {
      code,
      message,
      serverTime: new Date().toISOString(),
    };
    return res.status(401).json(response);
  }

  static forbidden(res: Response, message: string = 'Forbidden', code: string = 'FORBIDDEN'): Response {
    const response: ApiResponse = {
      code,
      message,
      serverTime: new Date().toISOString(),
    };
    return res.status(403).json(response);
  }

  static notFound(res: Response, message: string = 'Not found', code: string = 'NOT_FOUND'): Response {
    const response: ApiResponse = {
      code,
      message,
      serverTime: new Date().toISOString(),
    };
    return res.status(404).json(response);
  }

  static error(res: Response, message: string = 'Internal server error', code: string = 'ERROR'): Response {
    const response: ApiResponse = {
      code,
      message,
      serverTime: new Date().toISOString(),
    };
    return res.status(500).json(response);
  }
}
