import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createBusiness, getBusiness, updateBusiness, deleteBusiness, listBusinesses } from '../controllers/business';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/', protect, upload.single('document'), createBusiness);
router.get('/', protect, listBusinesses);
router.get('/:id', protect, getBusiness);
router.put('/:id', protect, upload.single('document'), updateBusiness);
router.delete('/:id', protect, deleteBusiness);

export default router;
