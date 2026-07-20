import { Router } from 'express';
import { getCashflowPrediction } from '../controllers/prediction';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/cashflow/:businessId', protect, getCashflowPrediction);

export default router;
