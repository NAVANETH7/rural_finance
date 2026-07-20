"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const business_1 = require("../controllers/business");
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
router.post('/', authMiddleware_1.protect, upload.single('document'), business_1.createBusiness);
router.get('/', authMiddleware_1.protect, business_1.listBusinesses);
router.get('/:id', authMiddleware_1.protect, business_1.getBusiness);
router.put('/:id', authMiddleware_1.protect, upload.single('document'), business_1.updateBusiness);
router.delete('/:id', authMiddleware_1.protect, business_1.deleteBusiness);
exports.default = router;
