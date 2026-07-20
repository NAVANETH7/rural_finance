"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const mongoose_1 = require("mongoose");
const logSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    ipAddress: { type: String, default: 'unknown' },
    details: { type: String, default: '' },
    severity: { type: String, required: true, enum: ['info', 'warning', 'error'], default: 'info' }
}, { timestamps: true });
exports.Log = (0, mongoose_1.model)('Log', logSchema);
