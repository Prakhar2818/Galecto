"use client";

import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-black font-sora tracking-tight text-slate-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: January 15, 2026</p>

        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm prose prose-slate max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Galecto, Inc. ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our services.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Please read this Privacy Policy carefully. By accessing or using Galecto's services, you acknowledge 
              that you have read, understood, and agree to be bound by all the terms of this policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">2. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>2.1 Information You Provide</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-6">
              <li>Account information (name, email, company name, password)</li>
              <li>Billing information (credit card details, billing address)</li>
              <li>Communications and correspondence</li>
            </ul>
            
            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>2.2 Information Collected Automatically</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage data and telemetry</li>
              <li>Cookies and tracking technologies</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-600 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address fraud and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">4. Data Retention</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We retain your personal information for as long as your account is active or as needed to 
              provide you services. Following termination or deactivation of your account, we will retain 
              your information for a reasonable period for backup, archival, or audit purposes.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Trace data retention periods vary by plan. Free tier data is retained for 7 days, Pro tier 
              for 30 days, and Enterprise tier for up to 1 year.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">5. Information Sharing</h2>
            <p className="text-slate-600 leading-relaxed mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>With service providers who assist in our operations</li>
              <li>To comply with legal requirements or valid legal processes</li>
              <li>To protect the rights, property, or safety of Galecto or others</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">6. Data Security</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. These 
              measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">7. Your Rights</h2>
            <p className="text-slate-600 leading-relaxed mb-4">Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Right to access your personal data</li>
              <li>Right to correct inaccurate data</li>
              <li>Right to delete your data ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">8. Cookies</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to collect and track information about your 
              visits to our services. You can control cookies through your browser settings.
            </p>
            <p className="text-slate-600 leading-relaxed">
              For more information about the cookies we use, please refer to our Cookie Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">9. Children's Privacy</h2>
            <p className="text-slate-600 leading-relaxed">
              Our services are not directed to individuals under 18. We do not knowingly collect personal 
              information from children. If you believe we have collected information from a child, 
              please contact us immediately.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black font-sora text-slate-900 mb-4">11. Contact</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:<br /><br />
              <strong>privacy@galecto.io</strong><br />
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