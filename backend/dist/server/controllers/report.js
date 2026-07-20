"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReports = exports.downloadReport = exports.generateReport = void 0;
const models_1 = require("../models");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const generateReport = async (req, res) => {
    try {
        const { business, type, format } = req.body;
        const biz = await models_1.Business.findById(business);
        if (!biz) {
            return res.status(404).json({ message: 'Business not found' });
        }
        if (req.user.role === 'Business Owner' && biz.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const transactions = await models_1.Transaction.find({ business }).sort({ date: -1 });
        const reportsDir = path_1.default.join(__dirname, '../../uploads/reports');
        if (!fs_1.default.existsSync(reportsDir)) {
            fs_1.default.mkdirSync(reportsDir, { recursive: true });
        }
        const fileName = `report_${business}_${type}_${Date.now()}.${format.toLowerCase()}`;
        const filePath = path_1.default.join(reportsDir, fileName);
        if (format === 'CSV' || format === 'Excel') {
            let content = 'Date,Type,Category,Amount,Payment Method,Description\n';
            transactions.forEach((t) => {
                content += `"${t.date.toISOString().split('T')[0]}","${t.type}","${t.category}",${t.amount},"${t.paymentMethod}","${t.description.replace(/"/g, '""')}"\n`;
            });
            fs_1.default.writeFileSync(filePath, content);
        }
        else {
            // Mock PDF Generation
            let content = `=======================================\n`;
            content += `FINANCIAL SUMMARY: ${biz.name.toUpperCase()}\n`;
            content += `Report Type: ${type.toUpperCase()} | Format: PDF\n`;
            content += `Generated At: ${new Date().toISOString()}\n`;
            content += `=======================================\n\n`;
            content += `Recent Transactions:\n`;
            transactions.forEach((t) => {
                content += `${t.date.toISOString().split('T')[0]} | ${t.type.padEnd(7)} | ${t.category.padEnd(12)} | Rs. ${t.amount.toString().padEnd(8)} | ${t.paymentMethod}\n`;
            });
            fs_1.default.writeFileSync(filePath, content);
        }
        const fileUrl = `/uploads/reports/${fileName}`;
        const report = await models_1.Report.create({
            business,
            type,
            format,
            fileUrl,
            requestedBy: req.user._id
        });
        res.status(201).json(report);
    }
    catch (error) {
        console.error('Generate Report Error:', error);
        res.status(500).json({ message: error.message });
    }
};
exports.generateReport = generateReport;
const downloadReport = async (req, res) => {
    try {
        const report = await models_1.Report.findById(req.params.reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        const filePath = path_1.default.join(__dirname, '../../', report.fileUrl);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ message: 'Physical file not found on disk' });
        }
        res.download(filePath);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.downloadReport = downloadReport;
const listReports = async (req, res) => {
    try {
        const { businessId } = req.params;
        const reports = await models_1.Report.find({ business: businessId }).sort({ createdAt: -1 });
        res.json(reports);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.listReports = listReports;
