"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_1 = require("../controllers/report");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/generate', authMiddleware_1.protect, report_1.generateReport);
router.get('/download/:reportId', report_1.downloadReport); // Public download with URL
router.get('/business/:businessId', authMiddleware_1.protect, report_1.listReports);
exports.default = router;
