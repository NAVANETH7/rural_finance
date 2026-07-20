import { Schema, model } from 'mongoose';

const businessSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  monthlyIncome: { type: Number, required: true, default: 0 },
  monthlyExpenses: { type: Number, required: true, default: 0 },
  businessAge: { type: Number, required: true, default: 0 }, // in months
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

export const Business = model('Business', businessSchema);
