"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = void 0;
const mongoose_1 = require("mongoose");
const tenantSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, required: true, enum: ['Bank', 'MFI', 'NGO', 'Government Body', 'Default'], default: 'Bank' },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
    settings: {
        maxAutoLoanAmount: { type: Number, default: 50000 },
        defaultInterestRate: { type: Number, default: 8.5 },
        minHealthScoreForLoan: { type: Number, default: 60 }
    }
}, { timestamps: true });
exports.Tenant = (0, mongoose_1.model)('Tenant', tenantSchema);
