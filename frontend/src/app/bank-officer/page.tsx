'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function BankOfficerPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Guard routing
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'Bank Officer')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  // States
  const [loans, setLoans] = useState<any[]>([]);
  const [activeLoan, setActiveLoan] = useState<any | null>(null);
  const [businessData, setBusinessData] = useState<any | null>(null);
  const [riskData, setRiskData] = useState<any | null>(null);
  const [kpis, setKpis] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Review states
  const [status, setStatus] = useState<'Approved' | 'Rejected'>('Approved');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bank/loans/all');
      setLoans(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setActiveLoan(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'Bank Officer') {
      fetchLoans();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeLoan) {
      const fetchBusinessProfile = async () => {
        try {
          const [bizRes, riskRes, kpisRes] = await Promise.all([
            api.get(`/business/profile/${activeLoan.business._id}`),
            api.get(`/risk/${activeLoan.business._id}`),
            api.get(`/analytics/dashboard/${activeLoan.business._id}`)
          ]);
          setBusinessData(bizRes.data.data);
          setRiskData(riskRes.data);
          setKpis(kpisRes.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchBusinessProfile();
    }
  }, [activeLoan]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;
    setSubmitting(true);
    try {
      await api.put(`/bank/loans/${activeLoan._id}/evaluate`, {
        status,
        bankNotes: notes
      });
      setNotes('');
      fetchLoans();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Rural Finance
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-semibold">Bank Officer Review Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-semibold">{user.email} (Officer)</span>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg text-xs font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Incoming Applications list */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md flex flex-col space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Loan Applications</h3>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
              </div>
            ) : loans.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No active applications queued.</div>
            ) : (
              loans.map((l) => (
                <div
                  key={l._id}
                  onClick={() => setActiveLoan(l)}
                  className={`p-3.5 rounded-xl cursor-pointer transition ${
                    activeLoan?._id === l._id ? 'bg-slate-100 border border-slate-200 shadow-sm' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{l.business.name}</span>
                    <span className="font-extrabold text-blue-600">Rs. {l.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>Term: {l.term} Mo</span>
                    <span className={`px-1 rounded ${
                      l.status === 'Approved' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      l.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                      'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right columns: Selected Application profiles */}
        <div className="lg:col-span-2 space-y-6">
          {activeLoan && businessData && riskData && kpis ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Business Profile & Diagnostics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Name</span>
                    <strong className="text-slate-800">{businessData.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Category</span>
                    <strong className="text-slate-800">{businessData.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Operating Age</span>
                    <strong className="text-slate-800">{businessData.businessAge} Months</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location</span>
                    <strong className="text-slate-800">{businessData.location.village}, {businessData.location.district}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Monthly Income</span>
                    <span className="text-sm font-black text-slate-800">Rs. {businessData.monthlyIncome.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Monthly Expenses</span>
                    <span className="text-sm font-black text-slate-800">Rs. {businessData.monthlyExpenses.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Net Savings Ratio</span>
                    <span className="text-sm font-black text-blue-600">
                      {Math.round(((businessData.monthlyIncome - businessData.monthlyExpenses) / businessData.monthlyIncome) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Credit Risk evaluation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Gauge */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Credit Evaluation</h4>
                  
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-3xl font-black" style={{ color: riskData.color === 'red' ? '#dc2626' : riskData.color === 'yellow' ? '#d97706' : '#2563eb' }}>
                      {riskData.score}%
                    </span>
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Calculated Default Risk</p>
                      <p className="text-slate-500">Classification: <span className="font-bold" style={{ color: riskData.color === 'red' ? '#dc2626' : riskData.color === 'yellow' ? '#d97706' : '#2563eb' }}>{riskData.severity}</span></p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Risk Contributions:</span>
                    {riskData.explainabilityData ? (
                      <div className="space-y-1 text-[11px] text-slate-600">
                        <p>• Expense Ratio Impact: <strong>{Math.round(riskData.explainabilityData.expense_to_income_ratio_contribution * 100)}%</strong></p>
                        <p>• Operating Life Impact: <strong>{Math.round(riskData.explainabilityData.business_age_contribution * 100)}%</strong></p>
                        <p>• Savings Index Impact: <strong>{Math.round(riskData.explainabilityData.net_savings_contribution * 100)}%</strong></p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">No score breakdown details available.</p>
                    )}
                  </div>
                </div>

                {/* Audit Flags */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Risk Alerts</h4>
                  <div className="space-y-2">
                    {riskData.triggeredFlags && riskData.triggeredFlags.length > 0 ? (
                      riskData.triggeredFlags.map((f: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                          <strong>{f.flagName}:</strong> {f.explanation}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold text-center">
                        ✔ 100% clean check. No risk flags triggered.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Review Input Box */}
              {activeLoan.status === 'Pending' && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Evaluate Loan Request</h3>
                  
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="Approved"
                          checked={status === 'Approved'}
                          onChange={() => setStatus('Approved')}
                          className="text-blue-600"
                        />
                        Approve Application
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="reviewStatus"
                          value="Rejected"
                          checked={status === 'Rejected'}
                          onChange={() => setStatus('Rejected')}
                          className="text-rose-600"
                        />
                        Reject Application
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Decision Notes & Feedback</label>
                      <textarea
                        required
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write details regarding the decision justification..."
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-2.5 text-white font-bold rounded-lg text-xs transition ${
                        status === 'Approved' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {submitting ? 'Submitting...' : 'Submit Evaluation'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              Select a loan application from the left panel to review diagnostics
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
