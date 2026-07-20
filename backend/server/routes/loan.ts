import { Router } from 'express';
import { applyLoan, getLoan, listLoans, updateLoanStatus, getLoanEligibility } from '../controllers/loan';
import { protect, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', protect, applyLoan);
router.get('/', protect, listLoans);
router.get('/:id', protect, getLoan);
router.put('/:id/status', protect, requireRole(['Bank Officer', 'Admin']), updateLoanStatus);
router.get('/eligibility/:businessId', protect, getLoanEligibility);

export default router;
