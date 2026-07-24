"use client";

import React, { useState } from 'react';
import { FileText, Download, Sparkles, TrendingUp, Check } from 'lucide-react';

interface ExecutiveSummaryCardProps {
  businessName?: string;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  riskScore?: number;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  businessName = "Rural Enterprise",
  monthlyRevenue = 45000,
  monthlyExpenses = 28000,
  riskScore = 72
}) => {
  const [copied, setCopied] = useState(false);
  const netMargin = monthlyRevenue - monthlyExpenses;
  const marginPercent = Math.round((netMargin / (monthlyRevenue || 1)) * 100);

  const narrativeText = `MONTHLY PERFORMANCE SUMMARY (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
Business: ${businessName}

1. Financial Trajectory:
   - Verified Monthly Revenue: Rs. ${monthlyRevenue.toLocaleString()}
   - Operating Expenses: Rs. ${monthlyExpenses.toLocaleString()}
   - Net Cash Flow Margin: Rs. ${netMargin.toLocaleString()} (${marginPercent}% margin)

2. Underwriting & Risk Outlook:
   - Calculated Risk Score: ${riskScore} / 100 (${riskScore < 30 ? 'Low Default Risk' : riskScore < 70 ? 'Moderate Risk' : 'High Risk'})
   - Borrowing Capacity: Rs. ${(netMargin * 3.5).toLocaleString()} pre-approved limit.

3. Key Action Items:
   - Maintain UPI ledger scanning to retain +15% Self Help Group credit multiplier.
   - Eligible for Kisan Credit Card (KCC) 4.0% subvention interest rate.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Executive Narrative Summary</h3>
            <p className="text-xs text-slate-500">Automated performance summary for bank audit reviews</p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-blue-600" />}
          {copied ? 'Copied to Clipboard' : 'Copy Summary'}
        </button>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {narrativeText}
      </div>
    </div>
  );
};
