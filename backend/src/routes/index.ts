import { Router } from 'express';
import authRoutes from './auth.routes.js';
import settingsRoutes from './settings.routes.js';
import incomeRoutes from './income.routes.js';
import expenseCategoryRoutes from './expenseCategory.routes.js';
import expenseRoutes from './expense.routes.js';
import fundingRoutes from './funding.routes.js';
import debtCustomerRoutes from './debtCustomer.routes.js';
import debtBorrowRecordRoutes from './debtBorrowRecord.routes.js';
import debtPaymentRoutes from './debtPayment.routes.js';
import reportsRoutes from './reports.routes.js';

const router = Router();

router.use('/auth', authRoutes);

router.use('/settings', settingsRoutes);
router.use('/income', incomeRoutes);
router.use('/expense-categories', expenseCategoryRoutes);
router.use('/expenses', expenseRoutes);
router.use('/funding', fundingRoutes);
router.use('/debt-customers', debtCustomerRoutes);
router.use('/debt-borrow-records', debtBorrowRecordRoutes);
router.use('/debt-payments', debtPaymentRoutes);
router.use('/reports', reportsRoutes);

export default router;
