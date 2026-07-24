"use client";

import React, { useEffect, useState } from 'react';
import { Award, ExternalLink, CheckCircle, ShieldAlert } from 'lucide-react';
import axios from 'axios';

interface SchemeItem {
  scheme: {
    _id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    maxBenefitAmount: number;
    subsidizedInterestRate?: number;
    applicationLink: string;
  };
  matchScore: number;
  matchReason: string;
}

export const SchemesList: React.FC<{ businessId?: string }> = ({ businessId }) => {
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchemes();
  }, [businessId]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const url = businessId
        ? `http://localhost:5000/api/v1/schemes/recommendations?businessId=${businessId}`
        : `http://localhost:5000/api/v1/schemes/recommendations`;
      const res = await axios.get(url);
      if (res.data.success) {
        setSchemes(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch scheme recommendations:', err);
      // Fallback default list
      setSchemes([
        {
          scheme: {
            _id: '1',
            name: 'Kisan Credit Card (KCC) Subsidized Interest Gateway',
            code: 'KCC_SUBSIDY',
            category: 'Subsidy',
            description: 'Slashes micro-farm loan interest rates down to 4.0% with government interest subvention reimbursements.',
            maxBenefitAmount: 300000,
            subsidizedInterestRate: 4.0,
            applicationLink: 'https://pmkisan.gov.in/'
          },
          matchScore: 95,
          matchReason: 'Operating sector and active transaction history satisfy prime KCC guidelines.'
        },
        {
          scheme: {
            _id: '2',
            name: 'Pradhan Mantri MUDRA Yojana (Tarun Scheme)',
            code: 'MUDRA_TARUN',
            category: 'Micro-loan',
            description: 'Collateral-free business expansion loan up to Rs. 10 Lakhs for established rural micro-enterprises.',
            maxBenefitAmount: 1000000,
            subsidizedInterestRate: 8.0,
            applicationLink: 'https://www.mudra.org.in/'
          },
          matchScore: 88,
          matchReason: 'Monthly revenue margin satisfies collateral-free MUDRA borrowing caps.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200">
        Loading Government Scheme Matches...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Matched Government Schemes</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">{schemes.length} Eligible Programs Found</span>
      </div>

      <div className="space-y-4">
        {schemes.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.scheme.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{item.scheme.description}</p>
              </div>
              <span className="shrink-0 text-xs font-extrabold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                {item.matchScore}% Match
              </span>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 mb-3">
              <span className="font-semibold text-emerald-600 block mb-0.5">Why You Match:</span>
              {item.matchReason}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="flex gap-4 text-slate-600 dark:text-slate-400">
                <span>Benefit Cap: <strong className="text-slate-900 dark:text-white">Rs. {item.scheme.maxBenefitAmount.toLocaleString()}</strong></span>
                {item.scheme.subsidizedInterestRate && (
                  <span>Rate: <strong className="text-emerald-600 dark:text-emerald-400">{item.scheme.subsidizedInterestRate}%</strong></span>
                )}
              </div>
              <a
                href={item.scheme.applicationLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold"
              >
                Apply Online <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
