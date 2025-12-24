import { Request, Response, NextFunction } from 'express';
import { PlaceholderController } from '../../../../src/modules/placeholder/placeholder.controller';
import { PlaceholderService } from '../../../../src/modules/placeholder/placeholder.service';
import { HttpResponse } from '../../../../src/shared/utils/HttpResponse';

// Mock the dependencies
jest.mock('../../../../src/modules/placeholder/placeholder.service');
jest.mock('../../../../src/shared/utils/HttpResponse');

describe('PlaceholderController', () => {
  let controller: PlaceholderController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockPlaceholderService: jest.Mocked<PlaceholderService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request, response, and next
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Create controller instance
    controller = new PlaceholderController();
    mockPlaceholderService = controller['placeholderService'] as jest.Mocked<PlaceholderService>;
  });

  describe('getHelloWorld', () => {
    it('should call service.getHelloWorld and return success response', async () => {
      const mockMessage = 'Hello World';
      mockPlaceholderService.getHelloWorld = jest.fn().mockResolvedValue(mockMessage);

      await controller.getHelloWorld(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPlaceholderService.getHelloWorld).toHaveBeenCalledTimes(1);
      expect(HttpResponse.success).toHaveBeenCalledWith(
        mockResponse,
        mockMessage,
        'Hello World retrieved successfully',
        'SUCCESS'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      const mockError = new Error('Service error');
      mockPlaceholderService.getHelloWorld = jest.fn().mockRejectedValue(mockError);

      await controller.getHelloWorld(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockPlaceholderService.getHelloWorld).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(HttpResponse.success).not.toHaveBeenCalled();
    });

    it('should handle service returning different data', async () => {
      const customMessage = 'Custom Message';
      mockPlaceholderService.getHelloWorld = jest.fn().mockResolvedValue(customMessage);

      await controller.getHelloWorld(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(HttpResponse.success).toHaveBeenCalledWith(
        mockResponse,
        customMessage,
        'Hello World retrieved successfully',
        'SUCCESS'
      );
    });
  });
});
