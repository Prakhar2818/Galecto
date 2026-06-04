"use client";

import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function TermsPage() {
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
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900">About</Link>
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

      <main className="max-w-4xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-black font-sora tracking-tight text-slate-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: January 15, 2026</p>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm prose prose-slate max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              By accessing or using Galecto's services, you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, you may not access or use our services.
            </p>
            <p className="text-slate-600 leading-relaxed">
              These Terms constitute a legally binding agreement between you and Galecto, Inc. ("Galecto", "we", "us", or "our").
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">2. Description of Service</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Galecto provides a distributed tracing and observability platform ("Service") that enables 
              organizations to monitor, analyze, and debug their microservices-based applications.
            </p>
            <p className="text-slate-600 leading-relaxed">
              The Service includes but is not limited to: trace collection, storage and analysis, 
              real-time monitoring dashboards, alerting capabilities, and API access.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">3. Account Registration</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              To use our Service, you must create an account. You agree to provide accurate, current, 
              and complete information during registration and to update such information to keep it accurate.
            </p>
            <p className="text-slate-600 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and 
              for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">4. Acceptable Use</h2>
            <p className="text-slate-600 leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Use the Service for any illegal purposes or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to any systems or networks</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Use the Service to transmit malware or other harmful code</li>
              <li>Resell, redistribute, or sublicense the Service without our written consent</li>
              <li>Use automated tools to access the Service without prior written approval</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">5. Data Storage and Retention</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Galecto stores trace data and other information you provide on our servers. You retain 
              ownership of all data you submit to the Service.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Default retention periods vary by plan. You may request data deletion by contacting 
              support@galecto.io.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">6. Fees and Payment</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Paid subscriptions are billed in advance on a monthly or annual basis. All fees are 
              non-refundable except as required by law or as specified in our refund policy.
            </p>
            <p className="text-slate-600 leading-relaxed">
              You authorize us to charge your payment method for all fees associated with your account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">7. Termination</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              You may terminate your account at any time through the Settings page or by contacting us. 
              We may suspend or terminate your access if you violate these Terms.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Upon termination, we will provide you an opportunity to export your data within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-slate-600 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, 
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
              PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed">
              IN NO EVENT SHALL GALECTO BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
              OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, 
              OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">10. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              For questions about these Terms, please contact us at:<br />
              <strong>legal@galecto.io</strong><br />
              Galecto, Inc.<br />
              100 Market Street<br />
              San Francisco, CA 94105
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-8 mt-16">
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