import { Schema, model } from 'mongoose';

const loanSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null },
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
    officer: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['Approved', 'Rejected', 'Overridden'] },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const Loan = model('Loan', loanSchema);
