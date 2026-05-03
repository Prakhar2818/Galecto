"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Github, Mail, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, organizationName: orgName }),
      });

      if (data.success) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Connection refused. Is the API Gateway running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row-reverse">
      {/* Left side: Why Antigravity */}
      <div className="md:w-1/2 bg-slate-900 p-12 flex flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] -ml-32 -mt-32" />
        
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-black font-sora tracking-tight">Galecto</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black font-sora mb-12">Start your 14-day free trial.</h2>
          <div className="space-y-8">
            <FeaturePoint title="Unlimited Trace Storage" desc="Retain spans for up to 30 days with ClickHouse power." />
            <FeaturePoint title="Advanced Causality Diff" desc="Compare request trees across deployments." />
            <FeaturePoint title="Smart Anomaly Detection" desc="Get notified when P99 spikes in real-time." />
          </div>
        </div>

        <div className="text-slate-500 text-sm font-medium relative z-10">
          Trusted by over 500+ engineering teams worldwide.
        </div>
      </div>

      {/* Right side: Signup Form */}
      <div className="md:w-1/2 bg-white flex items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md space-y-10">
          <div>
            <h2 className="text-4xl font-black font-sora mb-3">Create Account</h2>
            <p className="text-slate-500 font-medium">Join the next generation of observability.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Organization Name</label>
              <input 
                type="text" 
                placeholder="Acme Corp" 
                className="input-soft" 
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Work Email</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                className="input-soft" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="input-soft" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center block py-4 text-lg flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500">
            Already have an account? <Link href="/login" className="text-emerald-600 font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeaturePoint({ title, desc }: any) {
  return (
    <div className="flex gap-4">
      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
      <div>
        <div className="font-bold text-slate-100">{title}</div>
        <div className="text-sm text-slate-400">{desc}</div>
      </div>
    </div>
  );
}
