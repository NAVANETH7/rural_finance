import { Schema, model } from 'mongoose';

const predictionSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  type: { type: String, required: true, default: 'cash_flow_forecast' },
  horizon: { type: String, required: true, enum: ['week', 'month', 'quarter', 'year'] },
  predictionData: [{
    date: { type: Date, required: true },
    predictedIncome: { type: Number, required: true },
    predictedExpense: { type: Number, required: true },
    predictedBalance: { type: Number, required: true }
  }],
  confidenceScore: { type: Number, required: true, min: 0, max: 100 },
  modelVersion: { type: String, required: true, default: '1.0.0' },
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Prediction = model('Prediction', predictionSchema);
