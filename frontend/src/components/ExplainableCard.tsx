"use client";

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, BarChart2 } from 'lucide-react';

interface FeatureImportance {
  feature: string;
  importance: number; // 0 to 1
  description: string;
}

interface ExplainableCardProps {
  score: number;
  healthLabel?: string;
  featureImportances?: FeatureImportance[];
}

export const ExplainableCard: React.FC<ExplainableCardProps> = ({
  score,
  healthLabel = 'Stable',
  featureImportances = [
    { feature: 'Expense-to-Income Margin', importance: 0.42, description: 'Low expense ratios strongly improve creditworthiness.' },
    { feature: 'UPI Transaction Velocity', importance: 0.28, description: 'Consistent daily digital sales build credit footprints.' },
    { feature: 'Business Operating Age', importance: 0.18, description: 'Business vintage over 12 months improves stability scores.' },
    { feature: 'SHG Community Rating', importance: 0.12, description: 'Self Help Group peer ratings add limit multiplier boosts.' }
  ]
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Financial Health Score</h4>
            <p className="text-xs text-slate-500">Transparent model underwriting breakdown</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">{score} / 100</span>
            <span className={`block text-xs font-bold ${
              score >= 75 ? 'text-emerald-600' : score >= 60 ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {healthLabel}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-indigo-500" /> Key Driving Model Features (SHAP XAI)
          </h5>

          <div className="space-y-3">
            {featureImportances.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200">{item.feature}</span>
                  <span className="text-indigo-600 font-bold">{Math.round(item.importance * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.importance * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
