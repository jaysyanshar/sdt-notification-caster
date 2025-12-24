import { Request, Response, NextFunction } from 'express';
import { PlaceholderService } from './placeholder.service';
import { HttpResponse } from '../../shared/utils/HttpResponse';

export class PlaceholderController {
  private placeholderService: PlaceholderService;

  constructor() {
    this.placeholderService = new PlaceholderService();
  }

  getHelloWorld = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const message = await this.placeholderService.getHelloWorld();
      HttpResponse.success(res, message, 'Hello World retrieved successfully', 'SUCCESS');
    } catch (error) {
      next(error);
    }
  };
}
