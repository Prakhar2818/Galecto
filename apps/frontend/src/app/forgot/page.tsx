"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('Unable to connect. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black font-sora text-slate-900 mb-4">Check Your Email</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            We've sent a password reset link to <span className="font-bold text-slate-700">{email}</span>.
            Please check your inbox and follow the instructions.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row-reverse">
      <div className="md:w-1/2 bg-slate-900 p-12 flex flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] -ml-32 -mt-32" />
        
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-black font-sora tracking-tight">Galecto</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black font-sora mb-8">Reset your password.</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="text-slate-500 text-sm font-medium relative z-10">
          © 2026 Galecto Inc. All rights reserved.
        </div>
      </div>

      <div className="md:w-1/2 bg-white flex items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md space-y-10">
          <div>
            <h2 className="text-4xl font-black font-sora mb-3">Forgot Password</h2>
            <p className="text-slate-500 font-medium">We'll help you get back in.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-base font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="text-center">
            <Link href="/login" className="text-slate-500 font-medium hover:text-slate-700 inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}