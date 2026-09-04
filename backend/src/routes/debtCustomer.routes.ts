import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createDebtCustomerSchema,
  updateDebtCustomerSchema,
  listDebtCustomersSchema,
  getDebtCustomerSchema,
} from '../schemas/debtCustomer.schema.js';
import { createBorrowRecordSchema } from '../schemas/debtBorrowRecord.schema.js';
import { createPaymentSchema } from '../schemas/debtPayment.schema.js';
import {
  listCustomersHandler,
  createCustomerHandler,
  getCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
} from '../controllers/debtCustomer.controller.js';
import { createBorrowRecordHandler } from '../controllers/debtBorrowRecord.controller.js';
import { createPaymentHandler } from '../controllers/debtPayment.controller.js';

const router = Router();

router.get('/', authMiddleware, validate(listDebtCustomersSchema), listCustomersHandler);
router.post('/', authMiddleware, validate(createDebtCustomerSchema), createCustomerHandler);
router.get('/:id', authMiddleware, validate(getDebtCustomerSchema), getCustomerHandler);
router.patch('/:id', authMiddleware, validate(updateDebtCustomerSchema), updateCustomerHandler);
router.delete('/:id', authMiddleware, deleteCustomerHandler);

router.post(
  '/:id/borrow-records',
  authMiddleware,
  validate(createBorrowRecordSchema),
  createBorrowRecordHandler,
);

router.post('/:id/payments', authMiddleware, validate(createPaymentSchema), createPaymentHandler);

export default router;
