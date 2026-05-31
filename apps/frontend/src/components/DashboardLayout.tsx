"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Activity, FileText, RotateCcw, 
  Bell, Zap, Settings, LogOut, Search, Mail, Users, Loader2, Code2, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'High Error Rate', message: 'auth-service error rate > 10%', time: '2 min ago', type: 'error' },
    { id: 2, title: 'SLO Breach', message: 'API latency SLO breached', time: '15 min ago', type: 'warning' },
    { id: 3, title: 'New Deployment', message: 'log-service v2.1.0 deployed', time: '1 hour ago', type: 'info' },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/logs?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Validating Session...</span>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Activity size={20} />, label: "Request Tracing", href: "/traces" },
    { icon: <FileText size={20} />, label: "Logs Explorer", href: "/logs" },
    { icon: <RotateCcw size={20} />, label: "Replay System", href: "/replay" },
    { icon: <Bell size={20} />, label: "Alerts", href: "/alerts" },
    { icon: <Zap size={20} />, label: "Live Monitoring", href: "/monitoring" },
    { icon: <Code2 size={20} />, label: "Developer Hub", href: "/developer" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-8 fixed h-full z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <span className="text-xl font-black font-sora tracking-tight">Galecto</span>
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm tracking-tight font-medium">Logout</span>
          </button>
          
          <div className="bg-slate-900 p-6 rounded-3xl mt-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <h4 className="text-white font-bold text-sm mb-1 relative z-10">{user.organizationName || 'Pro Plan'}</h4>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest relative z-10 mb-3 italic">Production Tier</p>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl relative z-10 hover:bg-emerald-600 transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-72">
        {/* Global Header */}
        <header className="flex justify-between items-center p-10 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/50">
          <form onSubmit={handleSearch} className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search traces, services or logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium transition-all"
            />
          </form>
          <div className="flex items-center gap-6">
            <div className="flex gap-2 relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm relative"
              >
                <Mail className="w-4 h-4 text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
              </button>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm relative"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                          <span className="font-bold text-sm text-slate-900">{notif.title}</span>
                        </div>
                        <p className="text-xs text-slate-500">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                  <Link href="/alerts" className="block text-center text-sm text-emerald-600 font-bold mt-4 hover:underline">
                    View All Alerts
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <div className="text-sm font-black font-sora tracking-tight">{user.email.split('@')[0]}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Admin</div>
              </div>
              <img src={`https://i.pravatar.cc/100?u=${user.email}`} alt="Profile" className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm" />
            </div>
          </div>
        </header>

        <div className="p-10">
          {children}
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Upgrade Plan</h2>
              <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 border-2 border-emerald-500 bg-emerald-50 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-900">Pro Plan</span>
                  <span className="text-emerald-600 font-bold">Current</span>
                </div>
                <p className="text-sm text-slate-600">$99/month - Unlimited everything</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-2xl opacity-75">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-900">Enterprise</span>
                  <span className="text-slate-400 font-bold">Coming Soon</span>
                </div>
                <p className="text-sm text-slate-600">Custom pricing - Dedicated support</p>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-6">
              Contact sales@galecto.io for enterprise options
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
