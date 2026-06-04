import React from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, CheckCircle2, Globe, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="text-xl font-black font-sora tracking-tight">Galecto</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link href="#features" className="hover:text-emerald-600 transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-emerald-600 transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors">Login</Link>
          <Link href="/signup" className="btn-primary !py-2 !px-5 text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold mb-8 animate-bounce">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Next-Gen Observability is Here
        </div>
        <h1 className="heading-hero text-slate-900 mb-8">
          Distributed Tracing for the <span className="text-emerald-500">Modern Cloud</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
          Uncover hidden bottlenecks and visualize complex microservice causality with a single line of code. Built for high-performance engineering teams.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20">
          <Link href="/signup" className="btn-primary text-lg px-10 py-4 flex items-center gap-2">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/demo" className="btn-secondary text-lg px-10 py-4">
            Watch Demo
          </Link>
        </div>

        {/* Dashboard Mockup Preview */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="relative glass-card overflow-hidden border-slate-200/50 p-2">
             <div className="bg-slate-100 rounded-[1.8rem] aspect-video flex items-center justify-center overflow-hidden border border-slate-200">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="glass-card p-8 flex items-center gap-4 scale-125 border-emerald-100">
                      <Zap className="w-8 h-8 text-emerald-500" />
                      <div className="text-left">
                        <div className="text-xs font-black text-emerald-500 uppercase">Live Stream</div>
                        <div className="text-xl font-bold">1.2k events/sec</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black font-sora mb-4">Engineered for Reliability</h2>
            <p className="text-slate-500 font-medium">The most powerful observability stack ever built.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-emerald-500" />}
              title="Real-time Ingestion"
              desc="Powered by ClickHouse and Kafka for sub-second latency visualization."
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-emerald-500" />}
              title="Causality Graphs"
              desc="Visualize every microservice hop with interactive React Flow diagrams."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-emerald-500" />}
              title="Enterprise Auth"
              desc="Bank-grade security with multi-tenant RBAC and SSO integration."
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-8 max-w-7xl mx-auto text-center">
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Trusted by fast-growing startups</p>
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale">
          <Globe className="w-32 h-8" />
          <CheckCircle2 className="w-32 h-8" />
          <Globe className="w-32 h-8" />
          <CheckCircle2 className="w-32 h-8" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-500 fill-current" />
            <span className="text-lg font-black font-sora">Galecto</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/status">Status</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <p className="text-sm text-slate-400 font-medium">© 2026 Galecto Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: any) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group">
      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-sora mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
