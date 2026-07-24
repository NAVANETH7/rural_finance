import { Schema, model } from 'mongoose';

const transactionSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
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

export const Transaction = model('Transaction', transactionSchema);
