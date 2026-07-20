import { Schema, model } from 'mongoose';

const logSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  ipAddress: { type: String, default: 'unknown' },
  details: { type: String, default: '' },
  severity: { type: String, required: true, enum: ['info', 'warning', 'error'], default: 'info' }
}, { timestamps: true });

export const Log = model('Log', logSchema);
