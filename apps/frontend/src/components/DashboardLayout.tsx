"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Activity, FileText, RotateCcw, 
  Bell, Zap, Settings, LogOut, Search, Loader2, Code2, X, Target, Star, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/apiClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const favoritesRef = useRef<HTMLDivElement>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await apiFetch('/api/v1/favorites');
      if (data.success) {
        setFavorites(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setShowFavorites(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRemoveFavorite = async (id: string) => {
    try {
      await apiFetch(`/api/v1/favorites/${id}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

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
    { icon: <Target size={20} />, label: "SLO Dashboard", href: "/slo" },
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
            <div className="relative" ref={favoritesRef}>
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm relative"
              >
                <Star className={`w-4 h-4 ${favorites.length > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-slate-600'}`} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </button>
              
              {showFavorites && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Favorites</h4>
                    <span className="text-[10px] text-slate-400">{favorites.length} items</span>
                  </div>
                  {favorites.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No favorites yet. Star items to add them here.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {favorites.map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-700 truncate">{f.itemName || f.itemId}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{f.itemType}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveFavorite(f.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Link 
              href="/alerts"
              className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm relative"
            >
              <Bell className="w-4 h-4 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <div className="text-sm font-black font-sora tracking-tight">
                  {user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {user?.role || 'Member'}
                </div>
              </div>
              {user?.email && (
                <img
                  src={`https://i.pravatar.cc/100?u=${encodeURIComponent(user.email)}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
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
              <div className="p-4 border border-slate-200 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-900">Enterprise</span>
                  <span className="text-slate-600 font-bold">Contact Sales</span>
                </div>
                <p className="text-sm text-slate-600">Custom pricing - Dedicated support</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <a 
                href="mailto:sales@galecto.io"
                className="block w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-center hover:bg-slate-800 transition-colors"
              >
                Contact Sales
              </a>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="block w-full py-3 text-slate-500 font-medium text-center hover:text-slate-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
