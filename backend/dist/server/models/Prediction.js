"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prediction = void 0;
const mongoose_1 = require("mongoose");
const predictionSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business', required: true },
    type: { type: String, required: true, default: 'cash_flow_forecast' },
    horizon: { type: String, required: true, enum: ['week', 'month', 'quarter', 'year'] },
    predictionData: [{
            date: { type: Date, required: true },
            predictedIncome: { type: Number, required: true },
            predictedExpense: { type: Number, required: true },
            predictedBalance: { type: Number, required: true }
        }],
    confidenceScore: { type: Number, required: true, min: 0, max: 100 },
    modelVersion: { type: String, required: true, default: '1.0.0' },
    generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
exports.Prediction = (0, mongoose_1.model)('Prediction', predictionSchema);
