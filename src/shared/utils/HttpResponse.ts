import { Response } from 'express';

export interface ApiResponse<T = any> {
  code: string;
  message: string;
  data?: T;
  serverTime: string;
}

export class HttpResponse {
  private static buildResponse<T>(
    code: string,
    message: string,
    data?: T
  ): ApiResponse<T> {
    return {
      code,
      message,
      data,
      serverTime: new Date().toISOString(),
    };
  }

  static send<T>(res: Response, statusCode: number, message: string, code: string, data?: T): Response {
    return res.status(statusCode).json(this.buildResponse(code, message, data));
  }

  static success<T>(res: Response, data?: T, message: string = 'Success', code: string = 'SUCCESS'): Response {
    return res.status(200).json(this.buildResponse(code, message, data));
  }

  static created<T>(res: Response, data?: T, message: string = 'Created', code: string = 'CREATED'): Response {
    return res.status(201).json(this.buildResponse(code, message, data));
  }

  static badRequest(res: Response, message: string = 'Bad request', code: string = 'BAD_REQUEST'): Response {
    return res.status(400).json(this.buildResponse(code, message));
  }

  static unauthorized(res: Response, message: string = 'Unauthorized', code: string = 'UNAUTHORIZED'): Response {
    return res.status(401).json(this.buildResponse(code, message));
  }

  static forbidden(res: Response, message: string = 'Forbidden', code: string = 'FORBIDDEN'): Response {
    return res.status(403).json(this.buildResponse(code, message));
  }

  static notFound(res: Response, message: string = 'Not found', code: string = 'NOT_FOUND'): Response {
    return res.status(404).json(this.buildResponse(code, message));
  }

  static error(res: Response, message: string = 'Internal server error', code: string = 'ERROR'): Response {
    return res.status(500).json(this.buildResponse(code, message));
  }
}
