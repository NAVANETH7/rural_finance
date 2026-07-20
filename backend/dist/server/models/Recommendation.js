"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recommendation = void 0;
const mongoose_1 = require("mongoose");
const recommendationSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business', required: true },
    category: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: { type: String, required: true, enum: ['low', 'medium', 'high'] },
    status: { type: String, required: true, enum: ['pending', 'applied', 'dismissed'], default: 'pending' },
    financialImpact: { type: Number, default: 0 } // Estimated savings/earnings
}, { timestamps: true });
exports.Recommendation = (0, mongoose_1.model)('Recommendation', recommendationSchema);
