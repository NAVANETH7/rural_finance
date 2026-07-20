import { Router } from 'express';
import { listUsers, updateUserRole, getLogs, getSystemHealth } from '../controllers/admin';
import { protect, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(protect);
router.use(requireRole(['Admin']));

router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/logs', getLogs);
router.get('/system-health', getSystemHealth);

export default router;
