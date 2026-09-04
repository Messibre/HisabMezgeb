import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
} from '../schemas/expense.schema.js';
import {
  listExpensesHandler,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
} from '../controllers/expense.controller.js';

const router = Router();

router.get('/', authMiddleware, validate(listExpensesSchema), listExpensesHandler);
router.post('/', authMiddleware, validate(createExpenseSchema), createExpenseHandler);
router.patch('/:id', authMiddleware, validate(updateExpenseSchema), updateExpenseHandler);
router.delete('/:id', authMiddleware, deleteExpenseHandler);

export default router;
