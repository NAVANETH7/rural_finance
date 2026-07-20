"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCashflowPrediction = void 0;
const models_1 = require("../models");
const redis_1 = require("../config/redis");
const axios_1 = __importDefault(require("axios"));
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const getCashflowPrediction = async (req, res) => {
    try {
        const { businessId } = req.params;
        const { horizon = 'month' } = req.query;
        // Check Redis Cache
        const cacheKey = `forecast_${businessId}_${horizon}`;
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
        // Retrieve last 100 transactions to send to FastAPI
        const transactions = await models_1.Transaction.find({ business: businessId }).sort({ date: -1 }).limit(100);
        const payload = {
            business_id: businessId,
            horizon: horizon,
            transactions: transactions.map(t => ({
                date: t.date.toISOString().split('T')[0],
                type: t.type,
                category: t.category,
                amount: t.amount,
                paymentMethod: t.paymentMethod
            }))
        };
        let forecastResult;
        try {
            // Query Python FastAPI ML Engine
            const response = await axios_1.default.post(`${FASTAPI_URL}/predict/cashflow`, payload, { timeout: 3000 });
            forecastResult = response.data;
        }
        catch (err) {
            console.warn('FastAPI Service Offline. Falling back to local forecasting regression.', err);
            // Rule-based regression forecasting fallback
            // Average monthly income and expenses
            const incomeTx = transactions.filter(t => t.type === 'Income');
            const expenseTx = transactions.filter(t => t.type === 'Expense');
            const avgIncome = incomeTx.length > 0 ? incomeTx.reduce((sum, t) => sum + t.amount, 0) / incomeTx.length : 15000;
            const avgExpense = expenseTx.length > 0 ? expenseTx.reduce((sum, t) => sum + t.amount, 0) / expenseTx.length : 10000;
            // Project sequence
            const forecast = [];
            const now = new Date();
            let balance = avgIncome - avgExpense;
            const stepsCount = horizon === 'week' ? 7 : horizon === 'quarter' ? 3 : horizon === 'year' ? 12 : 30;
            const stepName = horizon === 'week' ? 'Day' : horizon === 'quarter' ? 'Month' : horizon === 'year' ? 'Month' : 'Day';
            for (let i = 1; i <= stepsCount; i++) {
                const date = new Date();
                if (stepName === 'Day') {
                    date.setDate(now.getDate() + i);
                }
                else {
                    date.setMonth(now.getMonth() + i);
                }
                // Add some random noise (-10% to +10%)
                const noiseIncome = avgIncome * (1 + (Math.random() * 0.2 - 0.1));
                const noiseExpense = avgExpense * (1 + (Math.random() * 0.2 - 0.1));
                balance += (noiseIncome - noiseExpense);
                forecast.push({
                    date: date.toISOString().split('T')[0],
                    predictedIncome: Math.round(noiseIncome),
                    predictedExpense: Math.round(noiseExpense),
                    predictedBalance: Math.round(balance)
                });
            }
            forecastResult = {
                business_id: businessId,
                horizon,
                forecast,
                confidence_score: 75.0
            };
        }
        // Save Prediction in DB
        await models_1.Prediction.create({
            business: businessId,
            type: 'cash_flow_forecast',
            horizon: horizon,
            predictionData: forecastResult.forecast,
            confidenceScore: forecastResult.confidence_score,
            modelVersion: '1.0.0'
        });
        // Cache results in Redis for 1 Hour (3600 seconds)
        await redis_1.redisClient.setEx(cacheKey, 3600, JSON.stringify(forecastResult));
        res.json(forecastResult);
    }
    catch (error) {
        console.error('Prediction Error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.getCashflowPrediction = getCashflowPrediction;
