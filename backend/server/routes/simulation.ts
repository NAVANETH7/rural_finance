import { Router } from 'express';
import { simulateScenario } from '../controllers/simulation';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/simulate', protect, simulateScenario);

export default router;
