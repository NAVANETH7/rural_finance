"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const reportSchema = new mongoose_1.Schema({
    business: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Business', required: true },
    type: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    format: { type: String, required: true, enum: ['PDF', 'Excel', 'CSV'] },
    fileUrl: { type: String, required: true },
    requestedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
exports.Report = (0, mongoose_1.model)('Report', reportSchema);
