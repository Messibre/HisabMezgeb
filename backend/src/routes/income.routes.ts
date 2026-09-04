import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createIncomeSchema,
  updateIncomeSchema,
  listIncomeSchema,
} from '../schemas/income.schema.js';
import {
  listIncomeHandler,
  createIncomeHandler,
  updateIncomeHandler,
  deleteIncomeHandler,
} from '../controllers/income.controller.js';

const router = Router();

router.get('/', authMiddleware, validate(listIncomeSchema), listIncomeHandler);
router.post('/', authMiddleware, validate(createIncomeSchema), createIncomeHandler);
router.patch('/:id', authMiddleware, validate(updateIncomeSchema), updateIncomeHandler);
router.delete('/:id', authMiddleware, deleteIncomeHandler);

export default router;
