"use client";

import React from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Users, Globe, Target, Heart, Linkedin, Twitter, Github } from 'lucide-react';

export default function AboutPage() {
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
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/about" className="text-sm font-bold text-emerald-600">About</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900">Contact</Link>
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900">Login</Link>
            <Link 
              href="/signup" 
              className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-black font-sora tracking-tight text-slate-900 mb-8">
              Building the future of observability
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed mb-12">
              Galecto was founded in 2024 with a simple mission: make distributed systems debugging 
              as intuitive as reading a story. We believe every engineering team deserves world-class 
              observability without the complexity.
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">San Francisco, CA</span>
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Remote-First</span>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black font-sora text-slate-900 text-center mb-16">Our Values</h2>
            <div className="grid grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black font-sora text-slate-900 mb-4">Simplicity First</h3>
                <p className="text-slate-500 leading-relaxed">
                  Complex distributed systems shouldn't require complex tools. We design every 
                  interaction to be intuitive and powerful.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-black font-sora text-slate-900 mb-4">Developer-Centric</h3>
                <p className="text-slate-500 leading-relaxed">
                  Every feature we build starts with developer experience. If it's not delightful 
                  to use, we go back to the drawing board.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-black font-sora text-slate-900 mb-4">Customer Obsessed</h3>
                <p className="text-slate-500 leading-relaxed">
                  Your debugging success is our success. We obsess over customer feedback 
                  and measure ourselves by your outcomes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black font-sora text-white text-center mb-16">The Team</h2>
            <div className="grid grid-cols-4 gap-8">
              {[
                { name: 'Alex Chen', role: 'CEO & Co-founder', bio: 'Former Google SRE, 15 years in distributed systems' },
                { name: 'Maria Santos', role: 'CTO & Co-founder', bio: 'Ex-Stripe, built observability at scale' },
                { name: 'James Wilson', role: 'VP Engineering', bio: 'Led observability team at Datadog' },
                { name: 'Priya Sharma', role: 'Head of Product', bio: 'Previously built APM at New Relic' },
              ].map((member, i) => (
                <div key={i} className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{member.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <h3 className="text-lg font-black font-sora text-white mb-1">{member.name}</h3>
                  <p className="text-emerald-400 text-sm font-bold mb-3">{member.role}</p>
                  <p className="text-slate-400 text-sm">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black font-sora text-slate-900 mb-8">Join Our Journey</h2>
            <p className="text-xl text-slate-500 mb-12">
              We're growing fast and always looking for talented people who share our passion 
              for making observability accessible to everyone.
            </p>
            <div className="flex items-center justify-center gap-6">
              <a href="#" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                <Linkedin className="w-5 h-5 text-slate-600" />
              </a>
              <a href="#" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                <Twitter className="w-5 h-5 text-slate-600" />
              </a>
              <a href="#" className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                <Github className="w-5 h-5 text-slate-600" />
              </a>
            </div>
          </div>
        </section>

        <section className="py-24 px-8 bg-emerald-500 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black font-sora text-white mb-6">Let's talk</h2>
            <p className="text-emerald-100 text-lg mb-8">
              Have questions about Galecto? Want to schedule a demo? We'd love to hear from you.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-colors"
            >
              Get in Touch <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-black font-sora tracking-tight text-white">Galecto</span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-sm">© 2026 Galecto Inc.</p>
        </div>
      </footer>
    </div>
  );
}