"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoanEligibility = exports.updateLoanStatus = exports.listLoans = exports.getLoan = exports.applyLoan = void 0;
const models_1 = require("../models");
const applyLoan = async (req, res) => {
    try {
        const { business, amount, interestRate, term } = req.body;
        const biz = await models_1.Business.findById(business);
        if (!biz) {
            return res.status(404).json({ message: 'Business not found' });
        }
        if (req.user.role === 'Business Owner' && biz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const loan = await models_1.Loan.create({
            business,
            user: req.user._id,
            amount: Number(amount),
            interestRate: Number(interestRate),
            term: Number(term),
            status: 'Pending'
        });
        res.status(201).json(loan);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.applyLoan = applyLoan;
const getLoan = async (req, res) => {
    try {
        const loan = await models_1.Loan.findById(req.params.id)
            .populate('business')
            .populate('user', 'email profile');
        if (!loan) {
            return res.status(404).json({ message: 'Loan application not found' });
        }
        if (req.user.role === 'Business Owner' && loan.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json(loan);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLoan = getLoan;
const listLoans = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'Business Owner') {
            filter.user = req.user._id;
        }
        if (req.query.business) {
            filter.business = req.query.business;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        const loans = await models_1.Loan.find(filter).populate('business').populate('user', 'email profile');
        res.json(loans);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listLoans = listLoans;
const updateLoanStatus = async (req, res) => {
    try {
        const { status, bankNotes } = req.body;
        const loan = await models_1.Loan.findById(req.params.id);
        if (!loan) {
            return res.status(404).json({ message: 'Loan application not found' });
        }
        loan.status = status;
        if (bankNotes) {
            loan.bankNotes = bankNotes;
        }
        const updated = await loan.save();
        // Notify user
        const msg = `Your loan application for Rs. ${loan.amount} has been ${status}.`;
        const notif = await models_1.Notification.create({
            user: loan.user,
            channels: ['In-App', 'Email'],
            message: msg,
            type: 'loan_status',
            triggeredBy: loan._id.toString()
        });
        if (req.io) {
            req.io.emit(`notification_${loan.user.toString()}`, notif);
        }
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateLoanStatus = updateLoanStatus;
const getLoanEligibility = async (req, res) => {
    try {
        const { businessId } = req.params;
        const business = await models_1.Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: 'Business not found' });
        }
        let score = 50; // Starting baseline
        const breakdown = ['Baseline stability: 50 points'];
        // 1. Income Stability
        if (business.monthlyIncome > 50000) {
            score += 20;
            breakdown.push('High monthly income (>Rs 50,000): +20 points');
        }
        else if (business.monthlyIncome < 15000) {
            score -= 15;
            breakdown.push('Low monthly income (<Rs 15,000): -15 points');
        }
        else {
            breakdown.push('Moderate monthly income: +0 points');
        }
        // 2. Expense-to-Income Ratio
        const expenseRatio = business.monthlyExpenses / (business.monthlyIncome || 1);
        if (expenseRatio <= 0.4) {
            score += 20;
            breakdown.push('Excellent expense ratio (<40% of income): +20 points');
        }
        else if (expenseRatio >= 0.8) {
            score -= 25;
            breakdown.push('High expense ratio (>80% of income): -25 points');
        }
        else {
            breakdown.push('Standard expense ratio: +0 points');
        }
        // 3. Business Age
        if (business.businessAge > 24) {
            score += 15;
            breakdown.push('Established business history (>2 years): +15 points');
        }
        else if (business.businessAge < 6) {
            score -= 15;
            breakdown.push('New business profile (<6 months): -15 points');
        }
        else {
            breakdown.push('Growing business history: +0 points');
        }
        // Bind limits
        score = Math.max(0, Math.min(100, score));
        let status = 'Not Eligible';
        let maxLoanAmount = 0;
        if (score >= 80) {
            status = 'Highly Eligible';
            maxLoanAmount = Math.round(business.monthlyIncome * 5); // 5x monthly income
        }
        else if (score >= 50) {
            status = 'Eligible';
            maxLoanAmount = Math.round(business.monthlyIncome * 2.5); // 2.5x monthly income
        }
        res.json({
            score,
            status,
            maxLoanAmount,
            breakdown
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getLoanEligibility = getLoanEligibility;
