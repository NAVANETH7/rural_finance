import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Report, Transaction, Business } from '../models';
import fs from 'fs';
import path from 'path';

export const generateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { business, type, format } = req.body;

    const biz = await Business.findById(business);
    if (!biz) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (req.user.role === 'Business Owner' && biz.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const transactions = await Transaction.find({ business }).sort({ date: -1 });

    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `report_${business}_${type}_${Date.now()}.${format.toLowerCase()}`;
    const filePath = path.join(reportsDir, fileName);

    if (format === 'CSV' || format === 'Excel') {
      let content = 'Date,Type,Category,Amount,Payment Method,Description\n';
      transactions.forEach((t) => {
        content += `"${t.date.toISOString().split('T')[0]}","${t.type}","${t.category}",${t.amount},"${t.paymentMethod}","${t.description.replace(/"/g, '""')}"\n`;
      });
      fs.writeFileSync(filePath, content);
    } else {
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
      fs.writeFileSync(filePath, content);
    }

    const fileUrl = `/uploads/reports/${fileName}`;

    const report = await Report.create({
      business,
      type,
      format,
      fileUrl,
      requestedBy: req.user._id
    });

    res.status(201).json(report);
  } catch (error: any) {
    console.error('Generate Report Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const downloadReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const filePath = path.join(__dirname, '../../', report.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found on disk' });
    }

    res.download(filePath);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.params;
    const reports = await Report.find({ business: businessId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
