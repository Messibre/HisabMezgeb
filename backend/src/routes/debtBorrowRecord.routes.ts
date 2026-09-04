import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { updateBorrowRecordSchema } from '../schemas/debtBorrowRecord.schema.js';
import {
  updateBorrowRecordHandler,
  deleteBorrowRecordHandler,
} from '../controllers/debtBorrowRecord.controller.js';

const router = Router();

router.patch('/:id', authMiddleware, validate(updateBorrowRecordSchema), updateBorrowRecordHandler);
router.delete('/:id', authMiddleware, deleteBorrowRecordHandler);

export default router;
