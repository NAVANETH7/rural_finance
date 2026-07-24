import { Router } from 'express';
import { getRecommendedSchemes, createScheme } from '../controllers/scheme';
import { protect, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/recommendations', protect, getRecommendedSchemes);
router.post('/', protect, requireRole(['Admin', 'Tenant Admin']), createScheme);

export default router;
