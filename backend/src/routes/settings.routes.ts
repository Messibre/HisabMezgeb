import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { updateSettingsSchema } from '../schemas/settings.schema.js';
import { getSettingsHandler, updateSettingsHandler } from '../controllers/settings.controller.js';

const router = Router();

router.get('/', authMiddleware, getSettingsHandler);
router.patch('/', authMiddleware, validate(updateSettingsSchema), updateSettingsHandler);

export default router;
