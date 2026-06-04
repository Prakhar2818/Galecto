"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Play, Pause, SkipForward, RotateCcw, Activity, Globe, ChevronRight, CheckCircle2, ArrowLeft } from 'lucide-react';

interface DemoTrace {
  id: string;
  service: string;
  status: 'success' | 'error' | 'slow';
  duration: number;
  timestamp: string;
}

const DEMO_TRACES: DemoTrace[] = [
  { id: 'tr-001', service: 'api-gateway', status: 'success', duration: 45, timestamp: '2.3s ago' },
  { id: 'tr-002', service: 'auth-service', status: 'success', duration: 12, timestamp: '2.5s ago' },
  { id: 'tr-003', service: 'payment-api', status: 'error', duration: 890, timestamp: '2.8s ago' },
  { id: 'tr-004', service: 'user-service', status: 'slow', duration: 234, timestamp: '3.1s ago' },
  { id: 'tr-005', service: 'inventory-api', status: 'success', duration: 67, timestamp: '3.4s ago' },
];

const DEMO_STEPS = [
  {
    title: 'Connect Your Application',
    description: 'Integrate the Galecto SDK into your application with a single npm install.',
    code: 'npm install @galecto/sdk',
  },
  {
    title: 'Automatic Trace Collection',
    description: 'Galecto automatically captures every request, spanning your entire microservices architecture.',
    code: 'import { Galecto } from "@galecto/sdk";\nconst client = new Galecto({ apiKey: "your-key" });',
  },
  {
    title: 'Root Cause Analysis',
    description: 'When an error occurs, instantly see which service caused the bottleneck.',
    code: '// Error detected in payment-service\n// Causality: payment-api → inventory-api',
  },
];

export default function DemoPage() {
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [liveTraces, setLiveTraces] = useState(DEMO_TRACES);

  const handleNext = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setLiveTraces(DEMO_TRACES);
  };

  const togglePlay = () => {
    setPlaying(!playing);
  };

  const getStatusColor = (status: DemoTrace['status']) => {
    switch (status) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
      case 'slow': return 'bg-yellow-500';
    }
  };

  const getStatusLabel = (status: DemoTrace['status']) => {
    switch (status) {
      case 'success': return '200 OK';
      case 'error': return '500 ERR';
      case 'slow': return 'SLOW';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-8 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-black font-sora tracking-tight">Galecto</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900">
              Login
            </Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black font-sora tracking-tight text-slate-900 mb-6">
            See Galecto in Action
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Watch how Galecto captures, visualizes, and helps you debug distributed traces across your microservices.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-white/40 text-sm font-medium">Galecto Demo</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={togglePlay}
                    className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                  </button>
                  <button 
                    onClick={handleReset}
                    className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-3 h-3 rounded-full ${playing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">
                    {playing ? 'Live Tracing' : 'Paused'}
                  </span>
                </div>

                <div className="space-y-3">
                  {liveTraces.map((trace, i) => (
                    <div 
                      key={trace.id}
                      className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/10"
                    >
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(trace.status)}`} />
                      <span className="text-white/60 text-xs font-mono w-20">{trace.id}</span>
                      <span className="text-white font-bold flex-grow">{trace.service}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        trace.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        trace.status === 'error' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {getStatusLabel(trace.status)}
                      </span>
                      <span className="text-white/40 text-sm">{trace.duration}ms</span>
                      <span className="text-white/30 text-xs">{trace.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-8">
                <h3 className="text-white font-bold text-lg mb-4">
                  Step {currentStep + 1}: {DEMO_STEPS[currentStep].title}
                </h3>
                <p className="text-slate-400 mb-6">{DEMO_STEPS[currentStep].description}</p>
                <pre className="bg-slate-950 rounded-2xl p-6 text-emerald-400 text-sm font-mono overflow-x-auto">
                  {DEMO_STEPS[currentStep].code}
                </pre>
              </div>

              <div className="flex justify-between items-center mt-8">
                <button 
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {DEMO_STEPS.map((_, i) => (
                    <div 
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentStep ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                {currentStep < DEMO_STEPS.length - 1 ? (
                  <button 
                    onClick={handleNext}
                    className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link 
                    href="/signup"
                    className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
                  >
                    Start Free Trial <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black font-sora text-slate-900 mb-6">What You're Seeing</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Live Request Tracing</div>
                    <p className="text-sm text-slate-500">Every HTTP request is captured in real-time</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Service Mapping</div>
                    <p className="text-sm text-slate-500">Automatically discovers your microservices</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Error Detection</div>
                    <p className="text-sm text-slate-500">Instantly identifies failures and slowdowns</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white">
              <h3 className="text-lg font-black mb-4">Ready to try?</h3>
              <p className="text-emerald-100 text-sm mb-6">
                Start your 14-day free trial. No credit card required.
              </p>
              <Link 
                href="/signup"
                className="block w-full py-3 bg-white text-emerald-600 font-bold rounded-xl text-center hover:bg-emerald-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}