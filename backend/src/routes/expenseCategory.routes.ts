import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/expenseCategory.schema.js';
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
} from '../controllers/expenseCategory.controller.js';

const router = Router();

router.get('/', authMiddleware, listCategoriesHandler);
router.post('/', authMiddleware, validate(createCategorySchema), createCategoryHandler);
router.patch('/:id', authMiddleware, validate(updateCategorySchema), updateCategoryHandler);

export default router;
