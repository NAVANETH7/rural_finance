import { Schema, model } from 'mongoose';

const riskScoreSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  color: { type: String, required: true, enum: ['green', 'yellow', 'red'] },
  severity: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  triggeredFlags: [{
    flagName: { type: String, required: true },
    explanation: { type: String, required: true }
  }],
  explainabilityData: { type: Schema.Types.Mixed, default: {} }, // for SHAP values
  evaluatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const RiskScore = model('RiskScore', riskScoreSchema);
