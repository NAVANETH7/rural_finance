"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business', required: true },
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    type: { type: String, required: true, enum: ['Income', 'Expense'] },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    gstAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true, enum: ['UPI', 'Cash', 'Bank Transfer', 'Other'] },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, default: '', trim: true },
    invoiceUrl: { type: String, default: null },
    isManual: { type: Boolean, default: true },
    isAnomaly: { type: Boolean, default: false },
    duplicateHash: { type: String, default: null }
}, { timestamps: true });
exports.Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
