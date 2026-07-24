"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loan = void 0;
const mongoose_1 = require("mongoose");
const loanSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    amount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 }, // percentage
    term: { type: Number, required: true, min: 1 }, // in months
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Repaid'],
        default: 'Pending'
    },
    isSubsidizedKcc: { type: Boolean, default: false },
    subsidizedRate: { type: Number, default: 4.0 },
    bankNotes: { type: String, default: '', trim: true },
    applicationDate: { type: Date, default: Date.now },
    repaymentHistory: [{
            date: { type: Date, required: true },
            amount: { type: Number, required: true, min: 0 },
            remainingBalance: { type: Number, required: true, min: 0 }
        }],
    decisionLogs: [{
            officer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            action: { type: String, enum: ['Approved', 'Rejected', 'Overridden'] },
            notes: { type: String },
            timestamp: { type: Date, default: Date.now }
        }]
}, { timestamps: true });
exports.Loan = (0, mongoose_1.model)('Loan', loanSchema);
