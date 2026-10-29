import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { exportLimiter, exportTimeoutGuard } from '../middlewares/rateLimiter.middleware.js';
import { reportPeriodSchema, exportReportSchema } from '../schemas/reports.schema.js';
import {
  getSummaryHandler,
  getDebtsPeriodHandler,
  getExpenseBreakdownHandler,
  exportReportHandler,
} from '../controllers/reports.controller.js';

const router = Router();

router.get('/summary', authMiddleware, validate(reportPeriodSchema), getSummaryHandler);
router.get('/debts-period', authMiddleware, validate(reportPeriodSchema), getDebtsPeriodHandler);
router.get(
  '/expenses-breakdown',
  authMiddleware,
  validate(reportPeriodSchema),
  getExpenseBreakdownHandler,
);
router.get(
  '/export',
  authMiddleware,
  exportLimiter,
  exportTimeoutGuard(),
  validate(exportReportSchema),
  exportReportHandler,
);

export default router;
