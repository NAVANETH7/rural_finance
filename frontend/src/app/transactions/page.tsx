'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import Link from 'next/link';

export default function TransactionsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // States
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<any | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Single Transaction Form
  const [type, setType] = useState('Income');
  const [category, setCategory] = useState('Sales');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  // Bulk / OCR States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  const fetchTransactions = async () => {
    if (!activeBusiness) return;
    setLoading(true);
    try {
      const res = await api.get(`/transactions?business=${activeBusiness._id}&limit=50`);
      setTxs(res.data.data || []);
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
      fetchTransactions();
    }
  }, [activeBusiness]);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        business: activeBusiness._id,
        type,
        category,
        amount,
        paymentMethod,
        date: date || new Date().toISOString().split('T')[0],
        description
      };
      await api.post('/transactions', payload);
      fetchTransactions();
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTx = async (txId: string) => {
    try {
      await api.delete(`/transactions/${txId}`);
      setTxs(prev => prev.filter(t => t._id !== txId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !activeBusiness) return;
    const formData = new FormData();
    formData.append('business', activeBusiness._id);
    formData.append('file', csvFile);

    try {
      setImportStatus('Processing CSV...');
      const res = await api.post('/transactions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportStatus(`Imported ${res.data.insertedCount} rows successfully. Errors: ${res.data.errorsCount}`);
      setCsvFile(null);
      fetchTransactions();
    } catch (err) {
      setImportStatus('CSV Import failed.');
      console.error(err);
    }
  };

  const handleOcrScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceFile) return;
    const formData = new FormData();
    formData.append('file', invoiceFile);

    try {
      setImportStatus('Analyzing invoice image...');
      const res = await api.post('/transactions/ocr-scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setOcrResult(res.data.extractedData);
      setImportStatus('Scan completed successfully.');
      setInvoiceFile(null);
    } catch (err) {
      setImportStatus('OCR Scan failed.');
      console.error(err);
    }
  };

  const handleAddOcrTx = async () => {
    if (!ocrResult || !activeBusiness) return;
    try {
      await api.post('/transactions', {
        business: activeBusiness._id,
        ...ocrResult
      });
      setOcrResult(null);
      fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Rural Finance
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-semibold">Transactions Ledger</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Add/Import forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Add transaction form */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4 text-slate-800">
            <h3 className="text-base font-bold text-slate-900">Add Single Transaction</h3>
            <form onSubmit={handleAddTx} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Transaction Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Income">Income (+)</option>
                  <option value="Expense">Expense (-)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Sales, Rent, Utilities, Inventory"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Amount (Rs.)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1250"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition"
              >
                Save Transaction
              </button>
            </form>
          </div>

          {/* CSV Import / OCR Scan */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4 text-slate-800">
            <h3 className="text-base font-bold text-slate-900">Import Methods</h3>
            
            {importStatus && (
              <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-[11px] text-blue-600">
                {importStatus}
              </div>
            )}

            {/* CSV Import */}
            <form onSubmit={handleCsvImport} className="space-y-2 border-b border-slate-100 pb-4">
              <label className="text-xs font-bold text-slate-700 block">Bulk Import (CSV)</label>
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-800 file:cursor-pointer"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-[10px] border border-slate-200 transition"
              >
                Upload CSV
              </button>
            </form>

            {/* OCR Scanner */}
            <form onSubmit={handleOcrScan} className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">OCR Invoice Scanner</label>
              <input
                type="file"
                accept="image/*,.pdf"
                required
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-800 file:cursor-pointer"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-[10px] border border-slate-200 transition"
              >
                Scan Invoice
              </button>
            </form>

            {/* OCR Extracted confirmation */}
            {ocrResult && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2 mt-3 animate-pulse">
                <span className="text-[10px] font-bold text-blue-600 block uppercase">Extracted Details:</span>
                <div className="text-[11px] space-y-1 text-slate-700">
                  <p>• Category: <strong>{ocrResult.category}</strong></p>
                  <p>• Amount: <strong>Rs. {ocrResult.amount}</strong></p>
                  <p>• Type: <strong>{ocrResult.type}</strong></p>
                  <p>• Date: <strong>{ocrResult.date}</strong></p>
                </div>
                <button
                  onClick={handleAddOcrTx}
                  className="w-full py-1.5 mt-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] transition"
                >
                  Verify & Import Row
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Ledger list */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-900">Transaction Logs</h3>
            <span className="text-[11px] text-slate-400 font-semibold">Showing last 50 entries</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
              </div>
            ) : txs.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No transactions recorded for this business yet
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Type</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Method</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txs.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${t.type === 'Income' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-700">{t.category}</td>
                      <td className="py-2.5 font-bold text-slate-900">Rs. {t.amount.toLocaleString()}</td>
                      <td className="py-2.5 text-slate-500">{t.paymentMethod}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteTx(t._id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded border border-rose-100 transition text-[10px]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
