import { Schema, model } from 'mongoose';

const recommendationSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  category: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  priority: { type: String, required: true, enum: ['low', 'medium', 'high'] },
  status: { type: String, required: true, enum: ['pending', 'applied', 'dismissed'], default: 'pending' },
  financialImpact: { type: Number, default: 0 } // Estimated savings/earnings
}, { timestamps: true });

export const Recommendation = model('Recommendation', recommendationSchema);
