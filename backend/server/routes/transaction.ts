import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createTransaction, listTransactions, updateTransaction, deleteTransaction, importTransactions, ocrScan } from '../controllers/transaction';
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

router.post('/', protect, createTransaction);
router.get('/', protect, listTransactions);
router.put('/:id', protect, updateTransaction);
router.delete('/:id', protect, deleteTransaction);
router.post('/import', protect, upload.single('file'), importTransactions);
router.post('/ocr-scan', protect, upload.single('file'), ocrScan);

export default router;
