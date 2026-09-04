import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createFundingSchema,
  updateFundingSchema,
  listFundingSchema,
} from '../schemas/funding.schema.js';
import {
  listFundingHandler,
  createFundingHandler,
  updateFundingHandler,
  deleteFundingHandler,
  getOutstandingHandler,
} from '../controllers/funding.controller.js';

const router = Router();

router.get('/', authMiddleware, validate(listFundingSchema), listFundingHandler);
router.post('/', authMiddleware, validate(createFundingSchema), createFundingHandler);
router.patch('/:id', authMiddleware, validate(updateFundingSchema), updateFundingHandler);
router.delete('/:id', authMiddleware, deleteFundingHandler);
router.get('/outstanding', authMiddleware, getOutstandingHandler);

export default router;
