import { Schema, model } from 'mongoose';

const reportSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  type: { type: String, required: true, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
  format: { type: String, required: true, enum: ['PDF', 'Excel', 'CSV'] },
  fileUrl: { type: String, required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Report = model('Report', reportSchema);
