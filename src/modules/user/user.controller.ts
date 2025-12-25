import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../../shared/errors/AppError';
import { HttpResponse } from '../../shared/utils/HttpResponse';
import { UserService } from './user.service';

const uuidRegex = /^[0-9a-fA-F-]{36}$/;

export class UserController {
  constructor(private userService: UserService = new UserService()) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.userService.createUser(req.body);
      HttpResponse.created(res, result.user, 'User created');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid user id');
      }
      const result = await this.userService.updateUser(id, req.body);
      HttpResponse.success(res, result.user, 'User updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!uuidRegex.test(id)) {
        throw new ValidationError('Invalid user id');
      }
      await this.userService.deleteUser(id);
      HttpResponse.success(res, null, 'User deleted');
    } catch (error) {
      next(error);
    }
  };
}
