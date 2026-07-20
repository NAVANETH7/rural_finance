import { Router } from 'express';
import { generateReport, downloadReport, listReports } from '../controllers/report';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.post('/generate', protect, generateReport);
router.get('/download/:reportId', downloadReport); // Public download with URL
router.get('/business/:businessId', protect, listReports);

export default router;
