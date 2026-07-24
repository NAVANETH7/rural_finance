"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, CreditCard, ShieldCheck, Award, LogOut, Video } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const NavigationHeader: React.FC<{ title?: string }> = ({ title }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'Ledger & Voice Entry', icon: Wallet },
    { href: '/loans', label: 'Loans & Overdraft', icon: CreditCard },
  ];

  if (user?.role === 'Bank Officer') {
    navItems.push({ href: '/bank-officer', label: 'Officer Review Portal', icon: ShieldCheck });
  }

  if (user?.role === 'Admin') {
    navItems.push({ href: '/admin', label: 'Admin Logs', icon: Award });
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Brand & Connection Badge */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            AI Rural Finance
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">{title || 'Enterprise Portal'}</span>
          
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live DB Connected
          </div>
        </div>

        {/* Organized Navigation Bar Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile & Tour Guide */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/demo"
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-xl text-xs font-bold transition"
          >
            <Video className="w-3.5 h-3.5" />
            Tour Guide
          </Link>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Logged in</span>
                <strong className="text-slate-800">{user.profile?.firstName || user.email}</strong>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
