"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScore = void 0;
const mongoose_1 = require("mongoose");
const riskScoreSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business', required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    color: { type: String, required: true, enum: ['green', 'yellow', 'red'] },
    severity: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
    triggeredFlags: [{
            flagName: { type: String, required: true },
            explanation: { type: String, required: true }
        }],
    explainabilityData: { type: mongoose_1.Schema.Types.Mixed, default: {} }, // for SHAP values
    evaluatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.RiskScore = (0, mongoose_1.model)('RiskScore', riskScoreSchema);
