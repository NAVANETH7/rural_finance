"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRisk = exports.getRiskScore = void 0;
const models_1 = require("../models");
const axios_1 = __importDefault(require("axios"));
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const getRiskScore = async (req, res) => {
    try {
        const { businessId } = req.params;
        const risk = await models_1.RiskScore.findOne({ business: businessId }).sort({ createdAt: -1 });
        if (!risk) {
            return res.status(404).json({ message: 'No risk evaluation data found for this business' });
        }
        res.json(risk);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getRiskScore = getRiskScore;
const evaluateRisk = async (req, res) => {
    try {
        const { businessId } = req.params;
        const business = await models_1.Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }
        // Get recent transactions (last 6 months or 100 rows)
        const transactions = await models_1.Transaction.find({ business: businessId }).sort({ date: -1 }).limit(100);
        const payload = {
            business_id: businessId,
            category: business.category,
            monthly_income: business.monthlyIncome,
            monthly_expenses: business.monthlyExpenses,
            business_age: business.businessAge,
            transactions: transactions.map(t => ({
                date: t.date.toISOString().split('T')[0],
                type: t.type,
                category: t.category,
                amount: t.amount,
                paymentMethod: t.paymentMethod
            }))
        };
        let riskResult;
        try {
            // Try fetching from FastAPI ML Engine
            const response = await axios_1.default.post(`${FASTAPI_URL}/risk-score`, payload, { timeout: 3000 });
            riskResult = response.data;
        }
        catch (err) {
            console.warn('FastAPI Service Offline. Falling back to rule-based evaluation.', err);
            // Local fallback rule-based evaluation
            let score = 15.0;
            let color = 'green';
            let severity = 'Low';
            const flags = [];
            const expenseRatio = business.monthlyExpenses / (business.monthlyIncome || 1);
            if (expenseRatio > 0.8) {
                flags.push({ flagName: 'high_expense_ratio', explanation: 'Expenses are over 80% of income.' });
                score = 65;
                color = 'yellow';
                severity = 'Medium';
            }
            // Check for revenue drop or default indicators
            const incomeTx = transactions.filter(t => t.type === 'Income');
            const expenseTx = transactions.filter(t => t.type === 'Expense');
            if (expenseRatio > 0.95 || (incomeTx.length === 0 && expenseTx.length > 0)) {
                flags.push({ flagName: 'critical_cash_flow', explanation: 'Critical cash deficit detected.' });
                score = 85;
                color = 'red';
                severity = 'High';
            }
            riskResult = {
                score,
                color,
                severity,
                triggered_flags: flags,
                explainability_data: { expense_ratio: expenseRatio }
            };
        }
        const savedRisk = await models_1.RiskScore.create({
            business: businessId,
            score: riskResult.score,
            color: riskResult.color,
            severity: riskResult.severity,
            triggeredFlags: riskResult.triggered_flags,
            explainabilityData: riskResult.explainability_data
        });
        // Create Notification and Dispatch via Socket.IO if Medium/High risk
        if (riskResult.severity !== 'Low') {
            const msg = `Risk Alert for ${business.name}: ${riskResult.severity} Risk Score (${riskResult.score}). Action required.`;
            const notif = await models_1.Notification.create({
                user: business.owner,
                channels: ['In-App', 'Email'],
                message: msg,
                type: 'risk_flag',
                triggeredBy: savedRisk._id.toString()
            });
            if (req.io) {
                req.io.emit(`notification_${business.owner.toString()}`, notif);
            }
        }
        res.json(savedRisk);
    }
    catch (error) {
        console.error('Evaluate Risk Error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.evaluateRisk = evaluateRisk;
