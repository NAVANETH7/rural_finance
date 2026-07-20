import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Recommendation, Business } from '../models';

export const getRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check if recommendations already exist
    let recs = await Recommendation.find({ business: businessId, status: 'pending' });

    if (recs.length === 0) {
      // Generate dynamic recommendations matching business profile
      const newRecs = [];

      // Category check
      if (business.category === 'Agriculture' || business.category === 'Farming') {
        newRecs.push({
          business: business._id,
          category: 'Government Schemes',
          title: 'Enroll in PM Fasal Bima Yojana',
          description: 'Secure your agricultural yield from weather irregularities with low-premium government crop insurance.',
          priority: 'high',
          financialImpact: 15000
        });
      }

      // Expense ratio check
      const expenseRatio = business.monthlyExpenses / (business.monthlyIncome || 1);
      if (expenseRatio > 0.75) {
        newRecs.push({
          business: business._id,
          category: 'Reduce Expense',
          title: 'Consolidate Vendor Sourcing',
          description: 'Negotiate bulk prices or defer non-essential inventory purchases to reduce operating expenses by 15%.',
          priority: 'high',
          financialImpact: 8000
        });
      } else {
        newRecs.push({
          business: business._id,
          category: 'Savings Advice',
          title: 'High-Yield Fixed Deposit',
          description: 'You have a healthy surplus. Reinvest 20% of profits into small-business savings products to earn 7.5% annual interest.',
          priority: 'low',
          financialImpact: 4500
        });
      }

      // Business age check
      if (business.businessAge < 12) {
        newRecs.push({
          business: business._id,
          category: 'Insurance',
          title: 'Establish Asset Insurance',
          description: 'Mitigate risk of asset loss. Protect machinery and inventory against fire or theft.',
          priority: 'medium',
          financialImpact: 5000
        });
      }

      // Standard optimization
      newRecs.push({
        business: business._id,
        category: 'Pricing Optimization',
        title: 'Introduce Digital UPI QR',
        description: 'Reduce cash collection losses. Set up digital UPI payments to accelerate receivables flow.',
        priority: 'medium',
        financialImpact: 3000
      });

      recs = (await Recommendation.insertMany(newRecs)) as any;
    }

    res.json(recs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRecommendationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const rec = await Recommendation.findById(req.params.id);
    if (!rec) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    rec.status = status;
    const updated = await rec.save();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
