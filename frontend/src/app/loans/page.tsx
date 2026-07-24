'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Link from 'next/link';
import { NavigationHeader } from '@/components/NavigationHeader';

export default function LoansPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // States
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<any | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Apply form states
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('12');
  const [interestRate, setInterestRate] = useState('8.5');

  // Advanced Loans upgrades states
  const [simWarehouseBags, setSimWarehouseBags] = useState(0);
  const [claimedOverdraft, setClaimedOverdraft] = useState(false);
  const [useSubsidizedRate, setUseSubsidizedRate] = useState(false);
  const [leaseDays, setLeaseDays] = useState(5);

  useEffect(() => {
    setInterestRate(useSubsidizedRate ? '4.0' : '8.5');
  }, [useSubsidizedRate]);

  // Credit Score Simulator States
  const [simRevenue, setSimRevenue] = useState(25000);
  const [simExpenses, setSimExpenses] = useState(15000);
  const [simAge, setSimAge] = useState(12);

  // Calculate simulated parameters dynamically
  let calculatedScore = 50;
  if (simRevenue > 50000) calculatedScore += 15;
  const ratio = simExpenses / (simRevenue || 1);
  if (ratio < 0.5) calculatedScore += 20;
  else if (ratio > 0.8) calculatedScore -= 25;
  if (simAge > 24) calculatedScore += 15;
  else if (simAge < 6) calculatedScore -= 10;
  
  const simScore = Math.max(10, Math.min(95, calculatedScore));

  let simMaxLoan = 0;
  if (simScore >= 75) {
    simMaxLoan = Math.round(simRevenue * 3.5);
  } else if (simScore >= 50) {
    simMaxLoan = Math.round(simRevenue * 2.0);
  } else {
    simMaxLoan = Math.round(simRevenue * 0.8);
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchBusinesses = async () => {
    try {
      const res = await api.get('/business');
      setBusinesses(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setActiveBusiness(res.data.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLoansData = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const [loansRes, eligRes] = await Promise.all([
        api.get(`/loans?business=${activeBusiness._id}`),
        api.get(`/loans/eligibility/${activeBusiness._id}`)
      ]);
      setLoans(loansRes.data || []);
      setEligibility(eligRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBusinesses();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeBusiness) {
      fetchLoansData();
      setSimRevenue(activeBusiness.monthlyIncome || 25000);
      setSimExpenses(activeBusiness.monthlyExpenses || 15000);
      setSimAge(activeBusiness.businessAge || 12);
    }
  }, [activeBusiness]);

  const handleClaimOverdraft = async () => {
    if (!activeBusiness) return;
    try {
      await api.post('/loans', {
        business: activeBusiness._id,
        amount: 10000,
        term: 6,
        interestRate: 0
      });
      setClaimedOverdraft(true);
      fetchLoansData();
    } catch (err) {
      console.error(err);
      alert('Failed to claim overdraft relief.');
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    try {
      await api.post('/loans', {
        business: activeBusiness._id,
        amount,
        term,
        interestRate
      });
      setAmount('');
      fetchLoansData();
    } catch (err) {
      console.error('Error applying for loan:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <NavigationHeader title="Micro-credit & Loans" />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Emergency Weather Overdraft Alert */}
        {!claimedOverdraft && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex gap-3">
              <span className="text-2xl">🚨</span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-amber-800 font-sans">Emergency Climate Relief Overdraft</h4>
                <p className="text-[11px] text-amber-700 leading-relaxed font-sans">
                  Local climate advisory reports low monsoon rainfall in your region. You are pre-approved for an interest-free **Rs. 10,000 Emergency Overdraft Line** to protect your crops.
                </p>
              </div>
            </div>
            <button
              onClick={handleClaimOverdraft}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm self-stretch md:self-auto text-center"
            >
              Claim Overdraft (Rs. 10,000)
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Eligibility and Apply Form */}
          <div className="lg:col-span-1 space-y-6">
          {/* Eligibility Display */}
          {eligibility && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4 text-slate-800">
              <h3 className="text-base font-bold text-slate-900">Eligibility Assessment</h3>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block font-semibold mb-1">Max Credit Limit</span>
                  <span className="text-xl font-black text-blue-600">Rs. {(eligibility.maxLoanAmount + (simWarehouseBags * 2500)).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">Credit Score</span>
                  <span className="text-xl font-black text-slate-800">{eligibility.score}%</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                {eligibility.breakdown.map((item: string, idx: number) => (
                  <p key={idx}>• {item}</p>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Collateral: Warehouse Receipt Financing */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4 text-slate-800">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>🌾</span> Warehouse Receipt Financing
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Verify bags of grain stored in licensed government warehouses to unlock instant collateral-backed borrowing limits.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Stored Harvest Volume (Bags)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={simWarehouseBags || ''}
                    onChange={(e) => setSimWarehouseBags(Number(e.target.value))}
                    placeholder="Enter bag count (e.g. 50)"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center min-w-[70px]">
                    +Rs. {(simWarehouseBags * 2500).toLocaleString()} Limit
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Score Simulator playground */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4 text-slate-800">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>🎮</span> Credit Score Simulator
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Simulate changes to your business financials to see how it would boost your borrowing power and loan eligibility.
            </p>

            <div className="space-y-3">
              {/* Revenue Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Monthly Revenue</span>
                  <span className="text-blue-600">Rs. {simRevenue.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="150000"
                  step="5000"
                  value={simRevenue}
                  onChange={(e) => setSimRevenue(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Expenses Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Monthly Expenses</span>
                  <span className="text-rose-600">Rs. {simExpenses.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="100000"
                  step="2000"
                  value={simExpenses}
                  onChange={(e) => setSimExpenses(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Business Age Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Business Age (Months)</span>
                  <span className="text-indigo-600">{simAge} months</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={simAge}
                  onChange={(e) => setSimAge(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Simulation Results Gauge */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between mt-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider mb-0.5">Simulated Credit Limit</span>
                <span className="text-sm font-black text-slate-900">Rs. {simMaxLoan.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-blue-600 block uppercase tracking-wider mb-0.5">Projected Score</span>
                <span className={`text-sm font-black ${simScore >= 75 ? 'text-blue-600' : simScore >= 50 ? 'text-yellow-600' : 'text-rose-600'}`}>
                  {simScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4 text-slate-800">
            <h3 className="text-base font-bold text-slate-900">Apply for Micro-loan</h3>
            <form onSubmit={handleApplyLoan} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Required Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="E.g., 50000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Repayment Term</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                </select>
              </div>

              {/* Kisan Credit Card (KCC) Subsidy Apply Toggle */}
              <div className="flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-100 rounded-lg">
                <input
                  type="checkbox"
                  id="kcc-subsidy"
                  checked={useSubsidizedRate}
                  onChange={(e) => setUseSubsidizedRate(e.target.checked)}
                  className="h-3.5 w-3.5 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="kcc-subsidy" className="text-[10px] font-bold text-blue-700 cursor-pointer leading-tight">
                  Apply Kisan Credit Card (KCC) 4.0% Interest Subsidy
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Estimated Interest Rate (%)</label>
                <input
                  type="text"
                  disabled
                  value={`${interestRate}%`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-xs focus:outline-none cursor-not-allowed font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={eligibility ? amount ? Number(amount) > (eligibility.maxLoanAmount + (simWarehouseBags * 2500)) : true : true}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 disabled:pointer-events-none"
              >
                Submit Application
              </button>
              {eligibility && amount && Number(amount) > (eligibility.maxLoanAmount + (simWarehouseBags * 2500)) && (
                <p className="text-[10px] text-rose-600 text-center font-semibold mt-1">
                  Requested amount exceeds your calculated eligible credit limit.
                </p>
              )}
            </form>
          </div>

          {/* Micro-Leasing ROI Calculator */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4 text-slate-800">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>🚜</span> Machinery Leasing ROI
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Compare tractor/irrigation pump micro-leasing costs against taking out capital purchase debt.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Usage Required (Days/Season)</span>
                  <span className="text-blue-600">{leaseDays} Days</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={leaseDays}
                  onChange={(e) => setLeaseDays(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Leasing Cost</span>
                  <span className="font-bold text-slate-800">Rs. {(leaseDays * 1500).toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400 block">(Rs. 1,500/day lease)</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 block font-bold uppercase">Loan EMIs (3 mo)</span>
                  <span className="font-bold text-rose-600">Rs. 18,000</span>
                  <span className="text-[9px] text-slate-400 block">(Rs. 60k buying loan)</span>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase tracking-wider mb-0.5">Estimated Cash Saved</span>
                <span className="text-sm font-black text-emerald-700">Rs. {Math.max(0, 18000 - (leaseDays * 1500)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Current Application List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md flex flex-col space-y-4 text-slate-800">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Loan History</h3>
          
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
              </div>
            ) : loans.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No active loans or pending applications
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-2.5">Date Applied</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Term</th>
                    <th className="py-2.5">Rate</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Bank Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 text-slate-600">{new Date(l.applicationDate).toLocaleDateString()}</td>
                      <td className="py-2.5 font-bold text-slate-900">Rs. {l.amount.toLocaleString()}</td>
                      <td className="py-2.5 text-slate-600">{l.term} Months</td>
                      <td className="py-2.5 text-slate-500">{l.interestRate}%</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          l.status === 'Approved' || l.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          l.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 italic max-w-xs truncate">{l.bankNotes || 'No notes yet'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
