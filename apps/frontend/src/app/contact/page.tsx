"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Mail, MapPin, Phone, Send, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/v1/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (data.success || data.message) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Unable to send message. Please check your network connection and try again.');
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
          <h1 className="text-2xl font-black font-sora text-slate-900 mb-4">Message Sent!</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Thank you for reaching out. Our team will get back to you within 24 hours.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:underline"
          >
            Back to Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

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
            <Link href="/contact" className="text-sm font-bold text-emerald-600">Contact</Link>
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

      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black font-sora tracking-tight text-slate-900 mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Have questions about Galecto? Want to schedule a demo? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-8">
            <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Full Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="John Smith" 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-base font-medium"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Email *</label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="john@company.com" 
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-base font-medium"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Company</label>
                  <input 
                    type="text" 
                    name="company"
                    placeholder="Acme Corp" 
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-base font-medium"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Message *</label>
                  <textarea 
                    name="message"
                    placeholder="Tell us how we can help..." 
                    rows={6}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-base font-medium resize-none"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
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
                    <>
                      Send Message <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black font-sora text-slate-900 mb-6">Contact Info</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-1">Email</div>
                    <a href="mailto:hello@galecto.io" className="text-slate-500 hover:text-emerald-600 transition-colors">
                      hello@galecto.io
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-1">Phone</div>
                    <a href="tel:+14155551234" className="text-slate-500 hover:text-emerald-600 transition-colors">
                      +1 (415) 555-1234
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-1">Address</div>
                    <p className="text-slate-500">
                      100 Market Street<br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 text-white">
              <h3 className="text-lg font-black mb-4">Talk to Sales</h3>
              <p className="text-emerald-100 text-sm mb-6">
                Ready to get started? Our sales team is here to help you find the right plan.
              </p>
              <a 
                href="mailto:sales@galecto.io" 
                className="block w-full py-3 bg-white text-emerald-600 font-bold rounded-xl text-center hover:bg-emerald-50 transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
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