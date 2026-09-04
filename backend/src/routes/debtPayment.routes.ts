import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createPaymentSchema, updatePaymentSchema } from '../schemas/debtPayment.schema.js';
import {
  createPaymentHandler,
  updatePaymentHandler,
  deletePaymentHandler,
} from '../controllers/debtPayment.controller.js';

const router = Router();

// POST /debt-customers/:id/payments is mounted via debtCustomer routes in index.ts
router.patch('/:id', authMiddleware, validate(updatePaymentSchema), updatePaymentHandler);
router.delete('/:id', authMiddleware, deletePaymentHandler);

export default router;
