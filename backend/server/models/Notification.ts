import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  channels: [{ type: String, enum: ['Email', 'SMS', 'Push', 'WhatsApp', 'In-App'], required: true }],
  message: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['prediction', 'risk_flag', 'loan_status', 'threshold_alert'] 
  },
  isRead: { type: Boolean, default: false },
  triggeredBy: { type: String, default: null }
}, { timestamps: true });

export const Notification = model('Notification', notificationSchema);
