"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business', required: true },
    type: { type: String, required: true, enum: ['Income', 'Expense'] },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true, enum: ['UPI', 'Cash', 'Bank Transfer', 'Other'] },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, default: '', trim: true },
    invoiceUrl: { type: String, default: null },
    isManual: { type: Boolean, default: true }
}, { timestamps: true });
exports.Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
