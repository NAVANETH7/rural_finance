import { Router } from 'express';
import { getRiskScore, evaluateRisk } from '../controllers/risk';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:businessId', protect, getRiskScore);
router.post('/evaluate/:businessId', protect, evaluateRisk);

export default router;
