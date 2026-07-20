"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recommendation_1 = require("../controllers/recommendation");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/:businessId', authMiddleware_1.protect, recommendation_1.getRecommendations);
router.put('/:id/status', authMiddleware_1.protect, recommendation_1.updateRecommendationStatus);
exports.default = router;
