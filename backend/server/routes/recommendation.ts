import { Router } from 'express';
import { getRecommendations, updateRecommendationStatus } from '../controllers/recommendation';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:businessId', protect, getRecommendations);
router.put('/:id/status', protect, updateRecommendationStatus);

export default router;
