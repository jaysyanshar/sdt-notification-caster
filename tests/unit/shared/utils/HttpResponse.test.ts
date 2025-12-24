import { Response } from 'express';
import { HttpResponse, ApiResponse } from '../../../../src/shared/utils/HttpResponse';

describe('HttpResponse', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('success', () => {
    it('should return 200 status with success response structure', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Operation successful';
      const code = 'SUCCESS';

      HttpResponse.success(mockResponse as Response, data, message, code);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SUCCESS',
          message: 'Operation successful',
          data: { id: 1, name: 'test' },
          serverTime: expect.any(String),
        })
      );
    });

    it('should use default message and code when not provided', () => {
      HttpResponse.success(mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SUCCESS',
          message: 'Success',
        })
      );
    });

    it('should include ISO 8601 timestamp in serverTime', () => {
      HttpResponse.success(mockResponse as Response);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('created', () => {
    it('should return 201 status with created response structure', () => {
      const data = { id: 1 };

      HttpResponse.created(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'CREATED',
          message: 'Created',
          data: { id: 1 },
        })
      );
    });
  });

  describe('badRequest', () => {
    it('should return 400 status with error response structure', () => {
      const message = 'Invalid input';

      HttpResponse.badRequest(mockResponse as Response, message);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
        })
      );
    });
  });

  describe('unauthorized', () => {
    it('should return 401 status with error response structure', () => {
      HttpResponse.unauthorized(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        })
      );
    });
  });

  describe('forbidden', () => {
    it('should return 403 status with error response structure', () => {
      HttpResponse.forbidden(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Forbidden',
        })
      );
    });
  });

  describe('notFound', () => {
    it('should return 404 status with error response structure', () => {
      const message = 'Resource not found';

      HttpResponse.notFound(mockResponse as Response, message);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'Resource not found',
        })
      );
    });
  });

  describe('error', () => {
    it('should return 500 status with error response structure', () => {
      const message = 'Internal server error';

      HttpResponse.error(mockResponse as Response, message);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ERROR',
          message: 'Internal server error',
        })
      );
    });
  });

  describe('send', () => {
    it('should send custom status code and response', () => {
      const statusCode = 418;
      const message = "I'm a teapot";
      const code = 'TEAPOT';
      const data = { type: 'teapot' };

      HttpResponse.send(mockResponse as Response, statusCode, message, code, data);

      expect(mockResponse.status).toHaveBeenCalledWith(418);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TEAPOT',
          message: "I'm a teapot",
          data: { type: 'teapot' },
          serverTime: expect.any(String),
        })
      );
    });

    it('should work without data parameter', () => {
      HttpResponse.send(mockResponse as Response, 204, 'No content', 'NO_CONTENT');

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NO_CONTENT',
          message: 'No content',
        })
      );
    });
  });

  describe('response structure consistency', () => {
    it('should always include required fields in ApiResponse', () => {
      const methods = [
        () => HttpResponse.success(mockResponse as Response),
        () => HttpResponse.created(mockResponse as Response),
        () => HttpResponse.badRequest(mockResponse as Response),
        () => HttpResponse.unauthorized(mockResponse as Response),
        () => HttpResponse.forbidden(mockResponse as Response),
        () => HttpResponse.notFound(mockResponse as Response),
        () => HttpResponse.error(mockResponse as Response),
      ];

      methods.forEach((method) => {
        (mockResponse.json as jest.Mock).mockClear();
        method();

        const response = (mockResponse.json as jest.Mock).mock.calls[0][0] as ApiResponse;
        expect(response).toHaveProperty('code');
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('serverTime');
      });
    });
  });
});
