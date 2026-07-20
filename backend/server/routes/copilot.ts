import express from 'express';
import { handleCopilotQuery } from '../controllers/copilot';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/query', protect, handleCopilotQuery);

export default router;
