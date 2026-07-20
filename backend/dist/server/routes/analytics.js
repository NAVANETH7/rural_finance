"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_1 = require("../controllers/analytics");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/dashboard/:businessId', authMiddleware_1.protect, analytics_1.getDashboardKPIs);
router.get('/trends/:businessId', authMiddleware_1.protect, analytics_1.getTrends);
exports.default = router;
