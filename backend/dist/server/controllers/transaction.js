"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAggregates = exports.ocrScan = exports.importTransactions = exports.deleteTransaction = exports.updateTransaction = exports.listTransactions = exports.createTransaction = void 0;
const models_1 = require("../models");
const redis_1 = require("../config/redis");
const fs_1 = __importDefault(require("fs"));
const createTransaction = async (req, res) => {
    try {
        const { business, type, category, amount, paymentMethod, date, description, invoiceUrl } = req.body;
        // Validate business ownership
        const biz = await models_1.Business.findById(business);
        if (!biz) {
            return res.status(404).json({ message: 'Business not found' });
        }
        if (req.user.role === 'Business Owner' && biz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to this business profile.' });
        }
        const transaction = await models_1.Transaction.create({
            business,
            type,
            category,
            amount: Number(amount),
            paymentMethod,
            date: date ? new Date(date) : new Date(),
            description,
            invoiceUrl,
            isManual: true
        });
        // Invalidate Cache
        await redis_1.redisClient.del(`dashboard_kpis_${business}`);
        await redis_1.redisClient.del(`forecast_${business}`);
        // Emit Socket.IO event to update frontend dashboard live
        if (req.io) {
            req.io.emit(`transaction_${business}`, transaction);
        }
        res.status(201).json(transaction);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createTransaction = createTransaction;
const listTransactions = async (req, res) => {
    try {
        const { business, type, category, startDate, endDate, page = 1, limit = 20 } = req.query;
        if (!business) {
            return res.status(400).json({ message: 'business ID is required' });
        }
        const biz = await models_1.Business.findById(business);
        if (!biz) {
            return res.status(404).json({ message: 'Business not found' });
        }
        if (req.user.role === 'Business Owner' && biz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const filter = { business };
        if (type)
            filter.type = type;
        if (category)
            filter.category = category;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate)
                filter.date.$gte = new Date(startDate);
            if (endDate)
                filter.date.$lte = new Date(endDate);
        }
        const skip = (Number(page) - 1) * Number(limit);
        const transactions = await models_1.Transaction.find(filter)
            .sort({ date: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await models_1.Transaction.countDocuments(filter);
        res.json({
            data: transactions,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
            total
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listTransactions = listTransactions;
const updateTransaction = async (req, res) => {
    try {
        const transaction = await models_1.Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        const biz = await models_1.Business.findById(transaction.business);
        if (req.user.role === 'Business Owner' && biz?.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { type, category, amount, paymentMethod, date, description } = req.body;
        if (type)
            transaction.type = type;
        if (category)
            transaction.category = category;
        if (amount !== undefined)
            transaction.amount = Number(amount);
        if (paymentMethod)
            transaction.paymentMethod = paymentMethod;
        if (date)
            transaction.date = new Date(date);
        if (description !== undefined)
            transaction.description = description;
        await transaction.save();
        await redis_1.redisClient.del(`dashboard_kpis_${transaction.business}`);
        await redis_1.redisClient.del(`forecast_${transaction.business}`);
        res.json(transaction);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.updateTransaction = updateTransaction;
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await models_1.Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        const biz = await models_1.Business.findById(transaction.business);
        if (req.user.role === 'Business Owner' && biz?.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        await transaction.deleteOne();
        await redis_1.redisClient.del(`dashboard_kpis_${transaction.business}`);
        await redis_1.redisClient.del(`forecast_${transaction.business}`);
        res.json({ message: 'Transaction deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteTransaction = deleteTransaction;
const importTransactions = async (req, res) => {
    try {
        const { business } = req.body;
        if (!business) {
            return res.status(400).json({ message: 'business ID is required' });
        }
        const biz = await models_1.Business.findById(business);
        if (!biz) {
            return res.status(404).json({ message: 'Business not found' });
        }
        if (req.user.role === 'Business Owner' && biz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a CSV file' });
        }
        const fileContent = fs_1.default.readFileSync(req.file.path, 'utf-8');
        const lines = fileContent.split('\n');
        const transactionsToInsert = [];
        const errors = [];
        // Simple CSV parser: Header line is date,type,category,amount,paymentMethod,description
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const columns = line.split(',');
            if (columns.length < 5) {
                errors.push({ row: i, error: `Invalid columns count (expected 5+, got ${columns.length})` });
                continue;
            }
            const [dateStr, type, category, amountStr, paymentMethod, description = ''] = columns;
            const amount = parseFloat(amountStr);
            if (isNaN(amount) || amount < 0) {
                errors.push({ row: i, error: `Invalid amount: ${amountStr}` });
                continue;
            }
            if (type !== 'Income' && type !== 'Expense') {
                errors.push({ row: i, error: `Invalid type: ${type} (must be Income or Expense)` });
                continue;
            }
            const validMethods = ['UPI', 'Cash', 'Bank Transfer', 'Other'];
            if (!validMethods.includes(paymentMethod)) {
                errors.push({ row: i, error: `Invalid payment method: ${paymentMethod}` });
                continue;
            }
            transactionsToInsert.push({
                business,
                type,
                category: category.trim(),
                amount,
                paymentMethod: paymentMethod,
                date: dateStr ? new Date(dateStr) : new Date(),
                description: description.trim(),
                isManual: false
            });
        }
        if (transactionsToInsert.length > 0) {
            await models_1.Transaction.insertMany(transactionsToInsert);
            await redis_1.redisClient.del(`dashboard_kpis_${business}`);
            await redis_1.redisClient.del(`forecast_${business}`);
        }
        // Delete temp file
        fs_1.default.unlinkSync(req.file.path);
        res.json({
            message: 'Import completed',
            insertedCount: transactionsToInsert.length,
            errorsCount: errors.length,
            errors
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.importTransactions = importTransactions;
const ocrScan = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded for OCR' });
        }
        // Mock OCR parsing of invoices/receipts
        const textSample = req.file.originalname.toLowerCase();
        let category = 'Utilities';
        let amount = 1250.00;
        let type = 'Expense';
        if (textSample.includes('invoice') || textSample.includes('bill')) {
            category = 'Inventory';
            amount = 8500.00;
        }
        else if (textSample.includes('salary') || textSample.includes('pay')) {
            category = 'Salary';
            amount = 15000.00;
        }
        else if (textSample.includes('sales') || textSample.includes('receipt')) {
            category = 'Sales';
            amount = 450.00;
            type = 'Income';
        }
        // Cleanup temp file
        fs_1.default.unlinkSync(req.file.path);
        res.json({
            message: 'OCR Scan completed',
            extractedData: {
                date: new Date().toISOString().split('T')[0],
                type,
                category,
                amount,
                paymentMethod: 'UPI',
                description: `OCR Extracted from file: ${req.file.originalname}`
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.ocrScan = ocrScan;
const getAggregates = async (req, res) => {
    try {
        const { businessId } = req.params;
        const transactions = await models_1.Transaction.find({ business: businessId });
        // Sum details
        let income = 0;
        let expenses = 0;
        const categoriesMap = {};
        transactions.forEach((tx) => {
            if (tx.type === 'Income') {
                income += tx.amount;
            }
            else {
                expenses += tx.amount;
            }
            categoriesMap[tx.category] = (categoriesMap[tx.category] || 0) + tx.amount;
        });
        res.json({
            totalIncome: income,
            totalExpenses: expenses,
            balance: income - expenses,
            categoriesBreakdown: Object.keys(categoriesMap).map(cat => ({
                category: cat,
                value: categoriesMap[cat]
            }))
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getAggregates = getAggregates;
