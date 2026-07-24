"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const simulation_1 = require("../controllers/simulation");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/simulate', authMiddleware_1.protect, simulation_1.simulateScenario);
exports.default = router;
