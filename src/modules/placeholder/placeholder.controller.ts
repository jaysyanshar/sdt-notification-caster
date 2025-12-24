import { Request, Response, NextFunction } from 'express';
import { PlaceholderService } from './placeholder.service';

export class PlaceholderController {
  private placeholderService: PlaceholderService;

  constructor() {
    this.placeholderService = new PlaceholderService();
  }

  getHelloWorld = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const message = await this.placeholderService.getHelloWorld();
      res.status(200).send(message);
    } catch (error) {
      next(error);
    }
  };
}
