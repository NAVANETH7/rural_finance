import { Router } from 'express';
import { getNotifications, readNotification, readAllNotifications, getPreferences, updatePreferences } from '../controllers/notification';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, getNotifications);
router.put('/read-all', protect, readAllNotifications);
router.put('/:id/read', protect, readNotification);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);

export default router;
