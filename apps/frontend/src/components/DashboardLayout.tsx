"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Activity, FileText, RotateCcw, 
  Bell, Zap, Settings, LogOut, Search, Mail, Users
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Activity size={20} />, label: "Request Tracing", href: "/traces" },
    { icon: <FileText size={20} />, label: "Logs Explorer", href: "/logs" },
    { icon: <RotateCcw size={20} />, label: "Replay System", href: "/replay" },
    { icon: <Bell size={20} />, label: "Alerts", href: "/alerts" },
    { icon: <Zap size={20} />, label: "Live Monitoring", href: "/monitoring" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="text-xl font-black font-sora tracking-tight">Antigravity</span>
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
                pathname === item.href 
                  ? 'bg-emerald-50 text-emerald-600 font-bold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`${pathname === item.href ? 'text-emerald-600' : 'group-hover:text-slate-900'}`}>
                {item.icon}
              </div>
              <span className="text-sm tracking-tight">{item.label}</span>
              {pathname === item.href && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full" />}
            </Link>
          ))}
        </nav>

        <div className="space-y-4 pt-8 border-t border-slate-50">
          <Link href="/settings" className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all ${pathname === '/settings' ? 'text-emerald-600 font-bold bg-emerald-50' : ''}`}>
            <Settings size={20} />
            <span className="text-sm tracking-tight">Settings</span>
          </Link>
          <Link href="/login" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <LogOut size={20} />
            <span className="text-sm tracking-tight">Logout</span>
          </Link>
          
          <div className="bg-slate-900 p-6 rounded-3xl mt-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <h4 className="text-white font-bold text-sm mb-2 relative z-10">Pro Plan Active</h4>
            <button className="w-full py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl relative z-10 hover:bg-emerald-600 transition-colors mt-2">
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-72">
        {/* Global Header */}
        <header className="flex justify-between items-center p-10 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/50">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search traces, services or logs..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <button className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm relative">
                <Mail className="w-4 h-4 text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
              </button>
              <button className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                <Bell className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <div className="text-sm font-black font-sora tracking-tight">Totok Michael</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Control</div>
              </div>
              <img src="https://i.pravatar.cc/100?img=32" alt="Profile" className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm" />
            </div>
          </div>
        </header>

        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
