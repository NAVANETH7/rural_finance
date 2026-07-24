"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scheme_1 = require("../controllers/scheme");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.get('/recommendations', authMiddleware_1.protect, scheme_1.getRecommendedSchemes);
router.post('/', authMiddleware_1.protect, (0, authMiddleware_1.requireRole)(['Admin', 'Tenant Admin']), scheme_1.createScheme);
exports.default = router;
