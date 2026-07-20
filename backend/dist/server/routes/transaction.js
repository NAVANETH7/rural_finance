"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const transaction_1 = require("../controllers/transaction");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'server/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
router.post('/', authMiddleware_1.protect, transaction_1.createTransaction);
router.get('/', authMiddleware_1.protect, transaction_1.listTransactions);
router.put('/:id', authMiddleware_1.protect, transaction_1.updateTransaction);
router.delete('/:id', authMiddleware_1.protect, transaction_1.deleteTransaction);
router.post('/import', authMiddleware_1.protect, upload.single('file'), transaction_1.importTransactions);
router.post('/ocr-scan', authMiddleware_1.protect, upload.single('file'), transaction_1.ocrScan);
exports.default = router;
