import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Business, Loan, Transaction, RiskScore, Recommendation } from '../models';

export const handleCopilotQuery = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, businessId } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Query message is required' });
    }

    const cleanMsg = message.toLowerCase().trim();

    // Context parameters
    let businessName = 'your business';
    let revenue = 0;
    let profit = 0;
    let debt = 0;
    let riskScore = 15;
    let riskSeverity = 'Low';
    let maxLoan = 0;
    let recsCount = 0;

    if (businessId) {
      const biz = await Business.findById(businessId);
      if (biz) {
        businessName = biz.name;
        revenue = biz.monthlyIncome;
        profit = biz.monthlyIncome - biz.monthlyExpenses;

        // Fetch outstanding loans
        const activeLoans = await Loan.find({ business: businessId, status: 'Active' });
        debt = activeLoans.reduce((sum, l) => sum + l.amount, 0);

        // Fetch risk score
        const risk = await RiskScore.findOne({ business: businessId }).sort({ createdAt: -1 });
        if (risk) {
          riskScore = risk.score;
          riskSeverity = risk.severity;
        }

        // Fetch recommendations
        const pendingRecs = await Recommendation.find({ business: businessId, status: 'pending' });
        recsCount = pendingRecs.length;

        // Calculate max loan
        if (riskScore < 50) {
          maxLoan = Math.round(biz.monthlyIncome * 2.5);
        } else if (riskScore < 80) {
          maxLoan = Math.round(biz.monthlyIncome * 1.2);
        }
      }
    }

    let responseText = '';

    if (cleanMsg.includes('loan') || cleanMsg.includes('borrow') || cleanMsg.includes('eligible')) {
      if (debt > 0) {
        responseText = `Hello! You currently have an active outstanding loan debt of **Rs. ${debt.toLocaleString()}**. According to our lending guidelines, you should clear your active micro-credit lines before requesting new loans to maintain a healthy repayment profile.`;
      } else if (maxLoan > 0) {
        responseText = `Based on your monthly operating income of Rs. ${revenue.toLocaleString()} and a **${riskSeverity}** credit risk rating (${riskScore}%), you are eligible for a maximum loan value of **Rs. ${maxLoan.toLocaleString()}**. You can apply directly in the **Loans** panel!`;
      } else {
        responseText = `Your current credit evaluation score indicates a **High Risk** profile. We recommend applying our cost-savings advice (such as reducing vendor operating overhead) to improve your margins before applying for credit.`;
      }
    } else if (cleanMsg.includes('risk') || cleanMsg.includes('rating') || cleanMsg.includes('score')) {
      responseText = `Your current AI Credit Risk is rated at **${riskScore}% (${riskSeverity} Risk)**. ${
        riskSeverity === 'High'
          ? 'This is primarily due to a cash deficit or high operational expense ratio. Consolidating supply runs can help lower this rating.'
          : 'Your margins are healthy! Maintain consistent deposits via UPI QR codes to keep this rating optimal.'
      }`;
    } else if (cleanMsg.includes('cash') || cleanMsg.includes('profit') || cleanMsg.includes('margin') || cleanMsg.includes('revenue')) {
      responseText = `For **${businessName}**, your monthly revenue is Rs. ${revenue.toLocaleString()} with expenses at Rs. ${(revenue - profit).toLocaleString()}, resulting in a net monthly surplus of **Rs. ${profit.toLocaleString()}** (Savings margin: ${Math.round((profit / (revenue || 1)) * 100)}%).`;
    } else if (cleanMsg.includes('recommend') || cleanMsg.includes('advice') || cleanMsg.includes('scheme') || cleanMsg.includes('help')) {
      responseText = `You currently have **${recsCount} pending recommendations** to optimize your business. I advise enrolling in *PM Fasal Bima Yojana* if you are in farming, or setting up a *Digital UPI QR Code* to accelerate cash collections and reduce inventory leakage.`;
    } else {
      // Default welcoming response
      responseText = `Namaste! I am **Seva**, your AI Financial Assistant. I can help analyze cash flows, evaluate micro-loan borrowing limits, or review cost-reduction ideas for **${businessName}**.\n\nTry asking me: \n• *"Can I get a loan?"*\n• *"What is my default risk?"*\n• *"How much profit did I make?"*`;
    }

    res.json({
      message: responseText,
      timestamp: new Date()
    });
  } catch (error: any) {
    console.error('Copilot Query Error:', error);
    res.status(500).json({ message: error.message || 'Server error processing chat query' });
  }
};
