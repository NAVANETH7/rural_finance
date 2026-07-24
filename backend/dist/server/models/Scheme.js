"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheme = void 0;
const mongoose_1 = require("mongoose");
const schemeSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String, required: true, trim: true }, // e.g. Subsidy, Micro-loan, Insurance, Relief
    description: { type: String, required: true, trim: true },
    maxBenefitAmount: { type: Number, required: true, default: 0 },
    subsidizedInterestRate: { type: Number, default: null }, // e.g. 4.0 for KCC
    applicationLink: { type: String, default: '#' },
    regionApplicability: [{ type: String, default: 'All' }],
    eligibilityCriteria: {
        minMonthlyIncome: { type: Number, default: 0 },
        maxMonthlyIncome: { type: Number, default: 500000 },
        minBusinessAgeMonths: { type: Number, default: 0 },
        allowedCategories: [{ type: String }],
        shgRequired: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
exports.Scheme = (0, mongoose_1.model)('Scheme', schemeSchema);
