import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Transaction, Business, RiskScore, Loan } from '../models';
import { redisClient } from '../config/redis';

export const getDashboardKPIs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.params;

    // Check Redis Cache
    const cacheKey = `dashboard_kpis_${businessId}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const transactions = await Transaction.find({ business: businessId });

    let totalRevenue = 0;
    let totalExpenses = 0;
    let pendingPayments = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'Income') {
        totalRevenue += tx.amount;
      } else if (tx.type === 'Expense') {
        totalExpenses += tx.amount;
      }
    });

    const monthlyProfit = totalRevenue - totalExpenses;

    // Retrieve active loans
    const loans = await Loan.find({ business: businessId, status: 'Active' });
    const outstandingDebt = loans.reduce((sum, l) => sum + l.amount, 0);

    // Retrieve risk score
    const risk = await RiskScore.findOne({ business: businessId }).sort({ createdAt: -1 });
    const riskScore = risk ? risk.score : 15.0;
    const riskColor = risk ? risk.color : 'green';
    const riskSeverity = risk ? risk.severity : 'Low';

    // Calculate loan eligibility percentage baseline
    let loanEligibility = 50;
    if (business.monthlyIncome > 50000) loanEligibility += 20;
    else if (business.monthlyIncome < 15000) loanEligibility -= 15;

    const expenseRatio = business.monthlyExpenses / (business.monthlyIncome || 1);
    if (expenseRatio <= 0.4) loanEligibility += 20;
    else if (expenseRatio >= 0.8) loanEligibility -= 25;

    loanEligibility = Math.max(0, Math.min(100, loanEligibility));

    const responsePayload = {
      totalRevenue,
      monthlyProfit,
      totalExpenses,
      pendingPayments,
      outstandingDebt,
      riskScore,
      riskColor,
      riskSeverity,
      loanEligibility,
      businessHealth: loanEligibility >= 75 ? 'Excellent' : loanEligibility >= 50 ? 'Good' : 'Needs Attention'
    };

    // Cache in Redis for 10 minutes
    await redisClient.setEx(cacheKey, 600, JSON.stringify(responsePayload));

    res.json(responsePayload);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrends = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.params;

    const transactions = await Transaction.find({ business: businessId }).sort({ date: 1 });

    const monthlyTrends: Record<string, { income: number; expense: number; profit: number }> = {};

    transactions.forEach((tx) => {
      const monthYear = tx.date.toLocaleString('default', { month: 'short', year: '2-digit' });

      if (!monthlyTrends[monthYear]) {
        monthlyTrends[monthYear] = { income: 0, expense: 0, profit: 0 };
      }

      if (tx.type === 'Income') {
        monthlyTrends[monthYear].income += tx.amount;
      } else {
        monthlyTrends[monthYear].expense += tx.amount;
      }

      monthlyTrends[monthYear].profit = monthlyTrends[monthYear].income - monthlyTrends[monthYear].expense;
    });

    const trendArray = Object.keys(monthlyTrends).map((month) => ({
      month,
      income: monthlyTrends[month].income,
      expense: monthlyTrends[month].expense,
      profit: monthlyTrends[month].profit
    }));

    res.json(trendArray);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
