import { Router } from 'express';
import { getDashboardKPIs, getTrends } from '../controllers/analytics';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/dashboard/:businessId', protect, getDashboardKPIs);
router.get('/trends/:businessId', protect, getTrends);

export default router;
