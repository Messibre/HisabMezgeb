import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

const validate = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the request data (body, params, query) – but don't assign them back
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => {
          const path = issue.path.join('.');
          return `${path}: ${issue.message}`;
        });
        return next(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Validation failed', errorMessages));
      }
      next(error);
    }
  };
};

export default validate;
