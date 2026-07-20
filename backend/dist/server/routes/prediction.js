"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prediction_1 = require("../controllers/prediction");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/cashflow/:businessId', authMiddleware_1.protect, prediction_1.getCashflowPrediction);
exports.default = router;
