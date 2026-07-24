import { Request, Response } from 'express';
import { Business, Transaction } from '../models';

export const simulateScenario = async (req: Request, res: Response) => {
  try {
    const {
      businessId,
      revenueChangePercent = 0,
      expenseChangePercent = 0,
      newLoanAmount = 0,
      oneTimeExpense = 0,
      hvacDimmingPercent = 0,
      solarUpgradeKw = 0
    } = req.body;

    let baselineIncome = 45000;
    let baselineExpenses = 28000;
    let businessName = 'Rural Store Demo';

    if (businessId) {
      const b = await Business.findById(businessId);
      if (b) {
        baselineIncome = b.monthlyIncome || baselineIncome;
        baselineExpenses = b.monthlyExpenses || baselineExpenses;
        businessName = b.name;
      }
    }

    // Baseline calculation
    const baselineNetCash = baselineIncome - baselineExpenses;
    const baselineRiskScore = Math.max(30, Math.min(95, Math.round((baselineNetCash / (baselineIncome || 1)) * 100 + 40)));
    const baselineBorrowCap = Math.round(baselineNetCash * 3.5);

    // Simulation calculation
    const simulatedIncome = Math.round(baselineIncome * (1 + revenueChangePercent / 100));
    const rawSimulatedExpense = Math.round(baselineExpenses * (1 + expenseChangePercent / 100) + oneTimeExpense);
    
    // Apply energy dimming / solar upgrades savings
    const energySavings = Math.round((hvacDimmingPercent * 150) + (solarUpgradeKw * 800));
    const simulatedExpenses = Math.max(1000, rawSimulatedExpense - energySavings);

    const simulatedNetCash = simulatedIncome - simulatedExpenses;
    const simulatedRiskScore = Math.max(20, Math.min(99, Math.round((simulatedNetCash / (simulatedIncome || 1)) * 100 + 40)));
    const simulatedBorrowCap = Math.round(simulatedNetCash * 3.5 + (newLoanAmount > 0 ? newLoanAmount * 0.2 : 0));

    // Environmental offsets calculation
    const co2OffsetKg = Math.round((hvacDimmingPercent * 25) + (solarUpgradeKw * 140));
    const treesPlantedEquivalent = Math.round(co2OffsetKg / 28.5);

    res.status(200).json({
      success: true,
      businessName,
      baseline: {
        monthlyIncome: baselineIncome,
        monthlyExpenses: baselineExpenses,
        netCashFlow: baselineNetCash,
        creditRiskScore: baselineRiskScore,
        borrowingCap: baselineBorrowCap,
        healthLabel: baselineRiskScore >= 75 ? 'Strong' : baselineRiskScore >= 60 ? 'Stable' : 'At Risk'
      },
      simulated: {
        monthlyIncome: simulatedIncome,
        monthlyExpenses: simulatedExpenses,
        netCashFlow: simulatedNetCash,
        creditRiskScore: simulatedRiskScore,
        borrowingCap: simulatedBorrowCap,
        healthLabel: simulatedRiskScore >= 75 ? 'Strong' : simulatedRiskScore >= 60 ? 'Stable' : 'At Risk',
        deltas: {
          incomeDelta: simulatedIncome - baselineIncome,
          expenseDelta: simulatedExpenses - baselineExpenses,
          cashFlowDelta: simulatedNetCash - baselineNetCash,
          riskScoreDelta: simulatedRiskScore - baselineRiskScore,
          borrowCapDelta: simulatedBorrowCap - baselineBorrowCap
        },
        sustainability: {
          co2OffsetKg,
          treesPlantedEquivalent,
          monthlySavingsRupees: Math.max(0, baselineExpenses - simulatedExpenses)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Simulation failed: ' + error.message });
  }
};
