'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function AdminPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Guard routing
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'Admin')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  // States
  const [logs, setLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [logsRes, healthRes] = await Promise.all([
        api.get('/admin/logs?limit=50'),
        api.get('/admin/health')
      ]);
      setLogs(logsRes.data.data || []);
      setHealth(healthRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'Admin') {
      fetchAdminData();
    }
  }, [isAuthenticated, user]);

  const handleClearLogs = async () => {
    try {
      await api.delete('/admin/logs/clear');
      setLogs([]);
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
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-semibold">System Administrator Auditing</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-semibold">{user.email} (Admin)</span>
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-500 text-rose-600 hover:text-white rounded-lg text-xs font-semibold transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Health Diagnostics Panel */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Server Status</span>
              <span className="text-lg font-black text-blue-600">{health.serverStatus}</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
              <span className="text-xs font-semibold text-slate-500 block mb-1">System Memory</span>
              <span className="text-lg font-black text-slate-800">{health.memoryUsage.rss}</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Server Lifespan</span>
              <span className="text-lg font-black text-slate-800">{Math.round(health.uptime / 60)} Minutes</span>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-md">
              <span className="text-xs font-semibold text-slate-500 block mb-1">Audited Logs Count</span>
              <span className="text-lg font-black text-slate-800">{health.totalLogs} Entries</span>
            </div>
          </div>
        )}

        {/* Audit Logs List */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-900">Security & Request Logs</h3>
            <div className="flex gap-2">
              <button
                onClick={fetchAdminData}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
              >
                Refresh
              </button>
              <button
                onClick={handleClearLogs}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-500 border border-rose-200 rounded-lg text-[10px] font-bold text-rose-600 hover:text-white transition"
              >
                Clear Logs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[50vh]">
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No logs generated.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Level</th>
                    <th className="py-2">Action / Route</th>
                    <th className="py-2">Operator ID</th>
                    <th className="py-2">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
                  {logs.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50 transition">
                      <td className="py-2 text-slate-500">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="py-2">
                        <span className={`px-1 rounded text-[9px] font-bold uppercase ${
                          l.level === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          l.level === 'warn' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                          'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {l.level}
                        </span>
                      </td>
                      <td className="py-2 text-slate-800">{l.action}</td>
                      <td className="py-2">{l.operator || 'SYSTEM'}</td>
                      <td className="py-2 text-slate-400">{l.ipAddress || '127.0.0.1'}</td>
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
