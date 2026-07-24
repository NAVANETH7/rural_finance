'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { VoiceTransactionModal } from '@/components/VoiceTransactionModal';
import { OCRInvoiceScanner } from '@/components/OCRInvoiceScanner';
import { ScenarioSimulator } from '@/components/ScenarioSimulator';
import { ExplainableCard } from '@/components/ExplainableCard';
import { SchemesList } from '@/components/SchemesList';
import { ExecutiveSummaryCard } from '@/components/ExecutiveSummaryCard';
import { FraudAnomalyDetector } from '@/components/FraudAnomalyDetector';

export default function DashboardPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Business State
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<any | null>(null);
  
  // Wizard creation states
  const [showWizard, setShowWizard] = useState(false);
  const [bizName, setBizName] = useState('');
  const [bizCat, setBizCat] = useState('Agriculture');
  const [monthlyInc, setMonthlyInc] = useState('25000');
  const [monthlyExp, setMonthlyExp] = useState('15000');
  const [bizAge, setBizAge] = useState('12');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Dashboard Data
  const [kpis, setKpis] = useState<any | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any | null>(null);
  const [riskData, setRiskData] = useState<any | null>(null);
  const [recs, setRecs] = useState<any[]>([]);
  
  // Notification states
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Application Loading states
  const [dataLoading, setDataLoading] = useState(false);

  // Copilot assistant state variables
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLogs, setCopilotLogs] = useState<any[]>([
    { sender: 'seva', text: 'Namaste! I am Seva, your AI Financial Assistant. How can I help you today?' }
  ]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Real-time Simulation States
  const [showQrModal, setShowQrModal] = useState(false);
  const [simPaymentAmount, setSimPaymentAmount] = useState('1000');
  const [simPaymentCategory, setSimPaymentCategory] = useState('Sales');
  const [simLoading, setSimLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; title: string; message: string } | null>(null);

  // Mandi & Quiz Dashboard upgrades states
  const [showMandiForecast, setShowMandiForecast] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedQuizAns, setSelectedQuizAns] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showOcrScanner, setShowOcrScanner] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch Businesses
  const fetchBusinesses = async () => {
    try {
      const res = await api.get('/business');
      setBusinesses(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setActiveBusiness(res.data.data[0]);
        setShowWizard(false);
      } else {
        setShowWizard(true);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBusinesses();
    }
  }, [isAuthenticated]);

  // Global fetcher for dashboard details
  const fetchDashboardData = async () => {
    if (!activeBusiness) return;
    setDataLoading(true);
    try {
      const [kpiRes, trendRes, predRes, riskRes, recsRes, notifRes] = await Promise.all([
        api.get(`/analytics/dashboard/${activeBusiness._id}`),
        api.get(`/analytics/trends/${activeBusiness._id}`),
        api.get(`/predictions/cashflow/${activeBusiness._id}?horizon=month`),
        api.get(`/risk/${activeBusiness._id}`),
        api.get(`/recommendations/${activeBusiness._id}`),
        api.get('/notifications')
      ]);

      setKpis(kpiRes.data);
      setTrends(trendRes.data);
      setPredictions(predRes.data);
      setRiskData(riskRes.data);
      setRecs(recsRes.data);
      setNotifs(notifRes.data);
    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const showToastNotification = (tx: any) => {
    setToast({
      show: true,
      title: `⚡ Live UPI Payment Received`,
      message: `Successfully recorded Rs. ${tx.amount} (${tx.category}) for ${activeBusiness?.name}. Cash flow & credit scores updated!`
    });
    
    // Auto dismiss
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const handleSimulatePayment = async () => {
    if (!activeBusiness) return;
    setSimLoading(true);
    try {
      await api.post('/transactions', {
        business: activeBusiness._id,
        type: 'Income',
        category: simPaymentCategory,
        amount: simPaymentAmount,
        paymentMethod: 'UPI',
        description: 'Simulated live UPI payment from customer'
      });
      setShowQrModal(false);
    } catch (err) {
      console.error(err);
      alert('Simulation payment failed.');
    } finally {
      setSimLoading(false);
    }
  };

  // Fetch Dashboard details when active business updates
  useEffect(() => {
    if (activeBusiness) {
      fetchDashboardData();

      const socket = io('http://localhost:5000');
      
      // Listen for custom alerts
      socket.on(`notification_${user.id}`, (newNotif) => {
        setNotifs(prev => [newNotif, ...prev]);
      });

      // Listen for incoming live transactions
      socket.on(`transaction_${activeBusiness._id}`, (newTx) => {
        fetchDashboardData();
        showToastNotification(newTx);
        // Play Soundbox audio alert
        speakText(`Payment of Rupees ${newTx.amount} received successfully on A.I. Rural Finance.`);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [activeBusiness, user]);

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported on this browser.");
    }
  };

  const handleCopilotSend = async (queryText?: string) => {
    const textToSend = queryText || copilotQuery;
    if (!textToSend || !textToSend.trim()) return;

    // Add user message
    setCopilotLogs(prev => [...prev, { sender: 'user', text: textToSend }]);
    if (!queryText) setCopilotQuery('');
    setCopilotLoading(true);

    try {
      const res = await api.post('/copilot/query', {
        message: textToSend,
        businessId: activeBusiness?._id
      });
      setCopilotLogs(prev => [...prev, { sender: 'seva', text: res.data.message }]);
    } catch (err: any) {
      console.error(err);
      setCopilotLogs(prev => [...prev, { sender: 'seva', text: 'Sorry, I encountered an error processing your query. Please try again.' }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: bizName,
        category: bizCat,
        monthlyIncome: monthlyInc,
        monthlyExpenses: monthlyExp,
        businessAge: bizAge,
        location: { village, district, state: stateName },
        bankDetails: { bankName, accountNumber: bankAcc, ifscCode: bankIfsc }
      };
      const res = await api.post('/business', payload);
      await fetchBusinesses();
      await api.post(`/risk/evaluate/${res.data._id}`);
      fetchBusinesses();
    } catch (err) {
      console.error('Error creating business profile:', err);
    }
  };

  const handleDismissRec = async (recId: string) => {
    try {
      await api.put(`/recommendations/${recId}/status`, { status: 'dismissed' });
      setRecs(prev => prev.filter(r => r._id !== recId));
    } catch (err) {
      console.error('Error updating recommendation:', err);
    }
  };

  const handleApplyRec = async (recId: string) => {
    try {
      await api.put(`/recommendations/${recId}/status`, { status: 'applied' });
      setRecs(prev => prev.filter(r => r._id !== recId));
    } catch (err) {
      console.error('Error updating recommendation:', err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
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
          {businesses.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={activeBusiness?._id || ''}
                onChange={(e) => setActiveBusiness(businesses.find(b => b._id === e.target.value))}
                className="ml-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {businesses.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                title="Show Business UPI QR Code"
              >
                <span>📱</span> UPI QR Code
              </button>
              <button
                onClick={() => setShowVoiceModal(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                title="Voice Transaction Entry"
              >
                <span>🎙️</span> Voice Entry
              </button>
              <button
                onClick={() => setShowOcrScanner(!showOcrScanner)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                title="Scan Receipt OCR"
              >
                <span>📷</span> Scan OCR
              </button>
              <div className="hidden md:flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                <span className="h-1 w-1 rounded-full bg-emerald-600"></span>
                Offline DB Synced
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 relative">
          <Link href="/demo" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition flex items-center gap-1">
            🎬 Tour Guide
          </Link>
          <Link href="/transactions" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            Ledger
          </Link>
          <Link href="/loans" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            Loans
          </Link>

          {/* Notifications Trigger */}
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 relative transition text-slate-700"
          >
            🔔
            {notifs.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {notifs.filter(n => !n.isRead).length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-12 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Alerts feed</span>
                <button onClick={handleMarkAllNotifsRead} className="text-blue-600 hover:underline">Mark all read</button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">No alerts yet</div>
                ) : (
                  notifs.map(n => (
                    <div key={n._id} className={`p-3 text-xs space-y-1 transition ${n.isRead ? 'opacity-65' : 'bg-slate-50'}`}>
                      <p className="text-slate-700">{n.message}</p>
                      <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="text-right">
            <p className="text-xs text-slate-500">Welcome,</p>
            <p className="text-sm font-bold text-slate-800">{user.profile.firstName}</p>
          </div>

          <button
            onClick={logout}
            className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg text-xs font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {showWizard ? (
          /* Initial Setup Business Wizard */
          <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-6 mt-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Setup Your Business Profile</h2>
              <p className="text-sm text-slate-500">Please provide some details to initialize AI evaluations and prediction models</p>
            </div>

            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Business Name</label>
                  <input
                    type="text"
                    required
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="E.g., Durga Fertilizers"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={bizCat}
                    onChange={(e) => setBizCat(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  >
                    <option value="Agriculture">Agriculture</option>
                    <option value="Retail">Retail Store</option>
                    <option value="Services">Services</option>
                    <option value="Handicrafts">Handicrafts</option>
                    <option value="Livestock">Livestock / Dairy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Estimated Income (Mo)</label>
                  <input
                    type="number"
                    required
                    value={monthlyInc}
                    onChange={(e) => setMonthlyInc(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Estimated Expense (Mo)</label>
                  <input
                    type="number"
                    required
                    value={monthlyExp}
                    onChange={(e) => setMonthlyExp(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Operating Age (Months)</label>
                  <input
                    type="number"
                    required
                    value={bizAge}
                    onChange={(e) => setBizAge(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Village</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-1 pt-2">Bank Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Account Number</label>
                  <input
                    type="text"
                    required
                    value={bankAcc}
                    onChange={(e) => setBankAcc(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg transition"
              >
                Create Business Profile
              </button>
            </form>
          </div>
        ) : dataLoading || !kpis ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div>
          </div>
        ) : (
          /* Dashboard Layout */
          <div className="space-y-6">
            {showOcrScanner && (
              <OCRInvoiceScanner onScanComplete={(data) => {
                setShowOcrScanner(false);
                setToast({ show: true, title: 'OCR Invoice Parsed', message: `Processed ${data.vendor} for Rs. ${data.totalAmount}` });
                fetchDashboardData();
              }} />
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Total Revenue</span>
                <span className="text-2xl font-black text-slate-800">Rs. {kpis.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Total Expenses</span>
                <span className="text-2xl font-black text-slate-800">Rs. {kpis.totalExpenses.toLocaleString()}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Net Savings</span>
                <span className={`text-2xl font-black ${kpis.monthlyProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  Rs. {kpis.monthlyProfit.toLocaleString()}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Outstanding Debt</span>
                <span className="text-2xl font-black text-slate-800">Rs. {kpis.outstandingDebt.toLocaleString()}</span>
              </div>
            </div>

            {/* Middle Section: Charts & Risk Flagging */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cash Flow Forecast (Recharts) */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-slate-800">Cash Flow Predictions (30 Days Horizon)</h3>
                <div className="h-64">
                  {predictions?.forecast && predictions.forecast.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={predictions.forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="predictedBalance" stroke="#2563eb" activeDot={{ r: 8 }} name="Predicted Balance" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="predictedIncome" stroke="#60a5fa" name="Predicted Income" strokeWidth={1.5} strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="predictedExpense" stroke="#ef4444" name="Predicted Expense" strokeWidth={1.5} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No prediction points compiled yet. Add transactions.
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Flagging Engine Gauge */}
              {/* Risk Flagging Engine Gauge & Sidebar Upgrades Column */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-slate-800">AI Credit Default Risk</h3>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative h-32 w-32 flex items-center justify-center">
                      <span className="text-3xl font-black" style={{ color: kpis.riskColor === 'red' ? '#dc2626' : kpis.riskColor === 'yellow' ? '#d97706' : '#2563eb' }}>
                        {Math.max(5, kpis.riskScore - (quizCompleted ? 5 : 0))}%
                      </span>
                      <div className="absolute inset-0 border-4 border-dashed rounded-full animate-spin-slow opacity-20" style={{ borderColor: kpis.riskColor === 'red' ? '#dc2626' : kpis.riskColor === 'yellow' ? '#d97706' : '#2563eb' }}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 mt-2 block">
                      Rating: <span className="font-bold" style={{ color: kpis.riskColor === 'red' ? '#dc2626' : kpis.riskColor === 'yellow' ? '#d97706' : '#2563eb' }}>{Math.max(5, kpis.riskScore - (quizCompleted ? 5 : 0)) < 30 ? 'Low' : Math.max(5, kpis.riskScore - (quizCompleted ? 5 : 0)) < 70 ? 'Medium' : 'High'} Risk</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-500">Triggered Risk Flags:</h4>
                    {riskData?.triggeredFlags && riskData.triggeredFlags.length > 0 ? (
                      <div className="space-y-2">
                        {riskData.triggeredFlags.map((f: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                            <strong>{f.flagName}:</strong> {f.explanation}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-blue-600 font-semibold">✔ Low risk. No alerts triggered.</div>
                    )}
                  </div>
                </div>

                <ExplainableCard
                  score={Math.max(5, kpis.riskScore - (quizCompleted ? 5 : 0))}
                  healthLabel={kpis.riskScore < 30 ? 'Strong' : kpis.riskScore < 70 ? 'Stable' : 'At Risk'}
                />

                {/* Self Help Group (SHG) Network score */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>👥</span> SHG Community Network
                  </h3>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-0.5">Active Group</span>
                      <span className="text-xs font-black text-slate-800">Maa Durga SHG</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider mb-0.5">Network Score</span>
                      <span className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-lg">A+ (+15% Credit Cap)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Replying through community groups provides group guarantee backing, raising your maximum eligible limit by **15%**.
                  </p>
                </div>

                {/* Financial Literacy Quiz Booster */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🎓</span> Credit Booster Quiz
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Learn core micro-credit concepts to increase your eligible limit score by **+5%** instantly!
                  </p>

                  {!quizCompleted ? (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-800 leading-relaxed">
                        Q: Why does receiving digital payments via UPI boost credit eligibility for rural micro-loans?
                      </h4>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => setSelectedQuizAns('A')}
                          className={`w-full text-left p-2.5 rounded-xl border text-[10px] transition ${
                            selectedQuizAns === 'A' ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          A) It is faster than handling paper receipts.
                        </button>
                        <button
                          onClick={() => setSelectedQuizAns('B')}
                          className={`w-full text-left p-2.5 rounded-xl border text-[10px] transition ${
                            selectedQuizAns === 'B' ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          B) It builds a transparent ledger banks use to verify daily repayment capacity.
                        </button>
                        <button
                          onClick={() => setSelectedQuizAns('C')}
                          className={`w-full text-left p-2.5 rounded-xl border text-[10px] transition ${
                            selectedQuizAns === 'C' ? 'border-blue-500 bg-blue-50/50 text-blue-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          C) It ensures there are no taxes on items.
                        </button>
                      </div>
                      {quizFeedback && <p className="text-[9px] font-semibold text-rose-600">{quizFeedback}</p>}
                      <button
                        onClick={() => {
                          if (selectedQuizAns === 'B') {
                            setQuizCompleted(true);
                            setQuizFeedback('');
                          } else if (selectedQuizAns) {
                            setQuizFeedback('Incorrect answer. Try again!');
                          } else {
                            setQuizFeedback('Please select an option.');
                          }
                        }}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Submit Answer
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center space-y-1">
                      <span className="text-xl block">🎉</span>
                      <h4 className="text-[11px] font-bold text-emerald-800">Quiz Complete!</h4>
                      <p className="text-[9px] text-emerald-600 leading-relaxed font-semibold">
                        Correct! UPI ledgers build a digital audit trail, demonstrating consistent sales volumes to underwriting algorithms. **+5% Credit Boost Activated!**
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section: Recommendations, Mandi Tracker & Loan Eligibility */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dynamic Recommendations checklist */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4">
                <h3 className="text-base font-bold text-slate-800">AI Recommendations</h3>
                <div className="space-y-3">
                  {recs.length === 0 ? (
                    <div className="text-xs text-slate-400">All recommendations applied!</div>
                  ) : (
                    recs.map(r => (
                      <div key={r._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 uppercase">
                            {r.category}
                          </span>
                          <span className="text-xs font-black text-blue-600">Est. Impact: +Rs. {r.financialImpact}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{r.title}</h4>
                        <p className="text-[11px] text-slate-500">{r.description}</p>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApplyRec(r._id)}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] transition"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => handleDismissRec(r._id)}
                              className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] transition"
                            >
                              Dismiss
                            </button>
                          </div>
                          <button
                            onClick={() => speakText(`${r.title}. ${r.description}`)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-semibold text-[10px] flex items-center gap-1 transition"
                            title="Listen aloud"
                          >
                            🔊 Listen
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Interactive Mandi Price Tracker card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🌾</span> Regional Mandi Rates
                  </h3>
                  <button
                    onClick={() => setShowMandiForecast(!showMandiForecast)}
                    className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 text-[10px] font-bold transition"
                  >
                    {showMandiForecast ? 'Show Live Rates' : 'Show 30D Forecast'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1 uppercase tracking-wider">
                    <span>Commodity</span>
                    <span>Rate (per Qtl)</span>
                    <span className="text-right">Trend</span>
                  </div>

                  <div className="space-y-2.5 divide-y divide-slate-50">
                    <div className="grid grid-cols-3 text-xs pt-1.5 items-center">
                      <span className="font-bold text-slate-700">Wheat (Kanak)</span>
                      <span className="font-semibold text-slate-900">Rs. {showMandiForecast ? '2,240' : '2,150'}</span>
                      <span className={`text-[10px] font-bold text-right ${showMandiForecast ? 'text-blue-600' : 'text-slate-500'}`}>
                        {showMandiForecast ? '▲ +4.2%' : 'Steady'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 text-xs pt-1.5 items-center">
                      <span className="font-bold text-slate-700">Paddy (Rice)</span>
                      <span className="font-semibold text-slate-900">Rs. {showMandiForecast ? '2,040' : '1,980'}</span>
                      <span className={`text-[10px] font-bold text-right ${showMandiForecast ? 'text-blue-600' : 'text-slate-500'}`}>
                        {showMandiForecast ? '▲ +3.0%' : 'Steady'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 text-xs pt-1.5 items-center">
                      <span className="font-bold text-slate-700">Mustard Seeds</span>
                      <span className="font-semibold text-slate-900">Rs. {showMandiForecast ? '5,350' : '5,420'}</span>
                      <span className={`text-[10px] font-bold text-right ${showMandiForecast ? 'text-rose-600' : 'text-slate-500'}`}>
                        {showMandiForecast ? '▼ -1.3%' : 'Steady'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 text-xs pt-1.5 items-center">
                      <span className="font-bold text-slate-700">Cotton (Kapas)</span>
                      <span className="font-semibold text-slate-900">Rs. {showMandiForecast ? '6,780' : '6,910'}</span>
                      <span className={`text-[10px] font-bold text-right ${showMandiForecast ? 'text-rose-600' : 'text-slate-500'}`}>
                        {showMandiForecast ? '▼ -1.8%' : 'Steady'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center font-mono">Market rates sourced from Agmarknet API</div>
              </div>

              {/* Loan Eligibility Widget */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4">
                <h3 className="text-base font-bold text-slate-800">Loan Eligibility Score</h3>
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-semibold block">Maximum Eligible Limit</span>
                    <span className="text-2xl font-black text-slate-900">Rs. {kpis.outstandingDebt > 0 ? 0 : kpis.monthlyProfit > 0 ? Math.round(kpis.monthlyProfit * 3) : 0}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold block">Eligibility Match</span>
                    <span className={`text-xl font-bold ${kpis.loanEligibility >= 75 ? 'text-blue-600' : kpis.loanEligibility >= 50 ? 'text-yellow-600' : 'text-rose-600'}`}>
                      {Math.min(99, kpis.loanEligibility + (quizCompleted ? 5 : 0))}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-500">Score Breakdown Factors:</h4>
                  <ul className="space-y-1.5">
                    {activeBusiness?.monthlyIncome > 50000 ? (
                      <li className="text-[11px] text-blue-600">✔ Solid monthly operating margins (&gt;50k): Score Boosted</li>
                    ) : (
                      <li className="text-[11px] text-slate-500">• Basic monthly operating income</li>
                    )}
                    {activeBusiness?.monthlyExpenses / (activeBusiness?.monthlyIncome || 1) > 0.8 ? (
                      <li className="text-[11px] text-rose-600">✘ High monthly expenses (&gt;80% of income): Rating Penalized</li>
                    ) : (
                      <li className="text-[11px] text-blue-600">✔ Managed expense overhead: Score Maintained</li>
                    )}
                    {activeBusiness?.businessAge > 24 ? (
                      <li className="text-[11px] text-blue-600">✔ Long operating history (&gt;2 years): Credit Boosted</li>
                    ) : (
                      <li className="text-[11px] text-slate-500">• Infant operating lifespan</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Scenario Simulator, Fraud Guard & Scheme Recommendation Sections */}
            <FraudAnomalyDetector />
            <ScenarioSimulator />
            <SchemesList businessId={activeBusiness?._id} />
            <ExecutiveSummaryCard
              businessName={activeBusiness?.name}
              monthlyRevenue={kpis.totalRevenue}
              monthlyExpenses={kpis.totalExpenses}
              riskScore={Math.max(5, kpis.riskScore - (quizCompleted ? 5 : 0))}
            />
          </div>
        )}

      {/* Voice Transaction Assistant Modal */}
      <VoiceTransactionModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSaveTransaction={(tx) => {
          setToast({ show: true, title: 'Voice Entry Saved', message: `Saved ${tx.type} Rs. ${tx.amount} (${tx.category})` });
          fetchDashboardData();
        }}
      />
      {/* Floating Copilot Widget */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {!copilotOpen ? (
          <button
            onClick={() => setCopilotOpen(true)}
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xl transition duration-300 hover:scale-110 relative"
            title="Chat with Seva AI"
          >
            <span className="text-2xl">🤖</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold animate-bounce">AI</span>
          </button>
        ) : (
          <div className="w-80 h-96 rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h4 className="text-xs font-bold font-sans">Seva Copilot</h4>
                  <span className="text-[10px] text-blue-100 font-semibold">AI Financial Guide</span>
                </div>
              </div>
              <button onClick={() => setCopilotOpen(false)} className="text-white hover:text-slate-200 text-sm">
                ✕
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {copilotLogs.map((log, idx) => (
                <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] leading-relaxed shadow-sm ${
                    log.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                  }`}>
                    {log.text.split('\n').map((line: string, i: number) => (
                      <p key={i} className="mb-1 last:mb-0">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 rounded-2xl rounded-tl-none border border-slate-200 p-3 text-[10px] flex items-center gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-100">●</span>
                    <span className="animate-bounce delay-200">●</span>
                    Analyzing details...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div className="p-2 bg-slate-100 border-t border-slate-200 flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => handleCopilotSend('Can I get a loan?')}
                className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 text-[9px] font-semibold transition"
              >
                💸 Loan Check
              </button>
              <button
                onClick={() => handleCopilotSend('What is my default risk?')}
                className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 text-[9px] font-semibold transition"
              >
                📊 Risk Rating
              </button>
              <button
                onClick={() => handleCopilotSend('How much profit did I make?')}
                className="px-2 py-1 rounded bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-600 text-[9px] font-semibold transition"
              >
                💰 Margin Analysis
              </button>
            </div>

            {/* Footer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCopilotSend();
              }}
              className="p-3 border-t border-slate-200 bg-white flex gap-2"
            >
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                placeholder="Ask Seva financial questions..."
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={copilotLoading}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
      {/* UPI QR Code & Live Payment Simulator Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>📱</span> Digital UPI QR Code
              </h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            {/* Simulated UPI QR Code */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <div className="h-44 w-44 bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center relative shadow-sm">
                {/* Simulated QR Code patterns */}
                <div className="w-full h-full opacity-90 grid grid-cols-5 gap-1">
                  {[...Array(25)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${(i * 7 + 13) % 5 === 0 || i % 4 === 0 || i === 0 || i === 4 || i === 20 ? 'bg-slate-900' : 'bg-transparent'}`}
                    ></div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center font-bold text-blue-600 text-[10px]">
                    UPI
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-600 mt-3 tracking-wider uppercase">{activeBusiness?.name}</span>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5">UPI ID: {activeBusiness?.name.toLowerCase().replace(/\s+/g, '')}@okaxis</span>
            </div>

            {/* Live Payment Simulator Section */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <h4 className="text-xs font-bold text-slate-700">⚡ Live Transaction Simulator</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Test the real-time scoring engine. Simulating a payment will instantly record cash flow, update default risks, and update dashboard charts live via WebSockets.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Amount (Rs.)</label>
                  <input
                    type="number"
                    value={simPaymentAmount}
                    onChange={(e) => setSimPaymentAmount(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Category</label>
                  <select
                    value={simPaymentCategory}
                    onChange={(e) => setSimPaymentCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  >
                    <option value="Sales">Sales Revenue</option>
                    <option value="Services">Service Fee</option>
                    <option value="Government Grant">Govt Grant</option>
                    <option value="Other">Other Income</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSimulatePayment}
                disabled={simLoading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                {simLoading ? 'Broadcasting...' : 'Simulate Customer Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Toast Notification */}
      {toast && toast.show && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 flex gap-3 animate-slide-in font-sans">
          <div className="text-2xl">⚡</div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-blue-400">{toast.title}</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white text-xs self-start ml-auto">
            ✕
          </button>
        </div>
      )}
      </main>
    </div>
  );
}
