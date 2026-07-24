"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Business = void 0;
const mongoose_1 = require("mongoose");
const businessSchema = new mongoose_1.Schema({
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    monthlyIncome: { type: Number, required: true, default: 0 },
    monthlyExpenses: { type: Number, required: true, default: 0 },
    businessAge: { type: Number, required: true, default: 0 }, // in months
    healthScore: { type: Number, default: 75, min: 0, max: 100 },
    shgRating: { type: String, default: 'A', enum: ['A+', 'A', 'B', 'C', 'None'] },
    warehouseReceiptBags: { type: Number, default: 0 },
    location: {
        village: { type: String, required: true, trim: true },
        district: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true }
    },
    gstNumber: { type: String, default: null, trim: true },
    bankDetails: {
        bankName: { type: String, required: true, trim: true },
        accountNumber: { type: String, required: true, trim: true },
        ifscCode: { type: String, required: true, trim: true }
    },
    documents: [{
            name: { type: String, required: true },
            url: { type: String, required: true },
            fileType: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
        }]
}, { timestamps: true });
exports.Business = (0, mongoose_1.model)('Business', businessSchema);
