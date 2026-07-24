"use client";

import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertOctagon, RefreshCw } from 'lucide-react';

interface AnomalyItem {
  id: string;
  type: string;
  amount: number;
  date: string;
  reason: string;
  severity: 'High' | 'Medium' | 'Low';
  resolved: boolean;
}

export const FraudAnomalyDetector: React.FC = () => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([
    {
      id: 'ANOM_101',
      type: 'Expense',
      amount: 45000,
      date: new Date().toISOString().split('T')[0],
      reason: 'Outlier transaction amount exceeds 3x historical daily mean.',
      severity: 'High',
      resolved: false
    },
    {
      id: 'ANOM_102',
      type: 'Income',
      amount: 2500,
      date: new Date().toISOString().split('T')[0],
      reason: 'Duplicate payment hash detected within 2 minutes of prior checkout.',
      severity: 'Medium',
      resolved: false
    }
  ]);

  const resolveAnomaly = (id: string) => {
    setAnomalies(anomalies.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const activeCount = anomalies.filter(a => !a.resolved).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Fraud & Anomaly Guard</h3>
        </div>
        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
          activeCount > 0
            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200'
            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
        }`}>
          {activeCount > 0 ? `${activeCount} Pending Anomalies` : '✔ All Clear'}
        </span>
      </div>

      <div className="space-y-3">
        {anomalies.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border transition ${
              item.resolved
                ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700/60 opacity-60'
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <AlertOctagon className={`w-4 h-4 ${item.resolved ? 'text-slate-400' : 'text-rose-600'}`} />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.type} — Rs. {item.amount.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">{item.date}</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{item.reason}</p>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Ref: {item.id}</span>
              {!item.resolved ? (
                <button
                  onClick={() => resolveAnomaly(item.id)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Verify & Confirm Legitimacy
                </button>
              ) : (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Clean
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
