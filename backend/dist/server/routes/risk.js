"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const risk_1 = require("../controllers/risk");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/:businessId', authMiddleware_1.protect, risk_1.getRiskScore);
router.post('/evaluate/:businessId', authMiddleware_1.protect, risk_1.evaluateRisk);
exports.default = router;
