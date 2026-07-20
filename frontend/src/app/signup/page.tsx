'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const { signup, verifyOtp } = useAuth();
  const router = useRouter();

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Business Owner');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // States
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup({
        email,
        password,
        role,
        firstName,
        lastName,
        phone
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await verifyOtp(email, otpCode);
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            AI <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Rural Finance</span>
          </h1>
          <p className="text-sm text-slate-500">
            {step === 'details' ? 'Create a secure account' : 'Verify email verification code'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm text-center">
            {error}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rahul"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sharma"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@village-shop.com"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
              >
                <option value="Business Owner">Business Owner (Micro-entrepreneur)</option>
                <option value="Bank Officer">Bank / MFI Officer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none text-sm"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-center text-sm">
              We've simulated sending a 6-digit OTP verification code to <span className="text-slate-900 font-semibold">{email}</span>.
              <br />
              <span className="text-blue-600 font-semibold text-xs mt-2 block">
                Check your backend server console logs to retrieve the OTP code.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">6-Digit Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-900 transition"
            >
              Back to details
            </button>
          </form>
        )}

        <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-500 font-semibold transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
