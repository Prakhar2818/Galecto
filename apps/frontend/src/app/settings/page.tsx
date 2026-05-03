"use client";

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Key, Shield, User, Bell, Database, Globe, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">System Settings</h2>
          <p className="text-slate-500 font-medium">Manage API keys, user permissions, and node configurations.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Navigation Sidebar (Local) */}
        <div className="col-span-3 space-y-2">
           <SettingsNavItem icon={<User size={18} />} label="General Account" active />
           <SettingsNavItem icon={<Shield size={18} />} label="Security & Access" />
           <SettingsNavItem icon={<Key size={18} />} label="API Integration" />
           <SettingsNavItem icon={<Bell size={18} />} label="Notifications" />
           <SettingsNavItem icon={<Database size={18} />} label="Data Retention" />
           <SettingsNavItem icon={<Globe size={18} />} label="Cluster Config" />
        </div>

        {/* Content Area */}
        <div className="col-span-9 space-y-10 max-w-4xl">
           {/* Section 1: API Keys */}
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black font-sora mb-2">API Integration</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Connect your services to the Antigravity causality engine.</p>
              
              <div className="space-y-6">
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Key</span>
                       <span className="text-xs font-bold text-emerald-500">Active</span>
                    </div>
                    <div className="flex gap-4">
                       <input 
                         type="password" 
                         value="ag_prod_9921_xX90zZ_8821" 
                         readOnly 
                         className="flex-grow bg-white border border-slate-200 px-6 py-3 rounded-2xl font-mono text-sm"
                       />
                       <button className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors">Copy</button>
                    </div>
                 </div>
                 <button className="text-sm font-bold text-emerald-600 hover:underline">+ Generate New Secret</button>
              </div>
           </div>

           {/* Section 2: Users */}
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black font-sora mb-2">Team Access</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Manage who can view and replay traces.</p>
              
              <div className="space-y-4">
                 <UserRow name="Totok Michael" role="Administrator" email="t.michael@antigravity.io" />
                 <UserRow name="Alexandra Deff" role="Engineer" email="a.deff@antigravity.io" />
                 <UserRow name="Edwin Adenike" role="Viewer" email="e.adenike@antigravity.io" />
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SettingsNavItem({ icon, label, active }: any) {
  return (
    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-white text-emerald-600 font-bold shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100'}`}>
      <div className={active ? 'text-emerald-500' : ''}>{icon}</div>
      <span className="text-sm">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </div>
  );
}

function UserRow({ name, role, email }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl hover:bg-slate-100 transition-colors cursor-pointer group">
       <div className="flex items-center gap-4">
          <img src={`https://i.pravatar.cc/100?u=${name}`} alt={name} className="w-12 h-12 rounded-2xl" />
          <div>
             <div className="text-sm font-black font-sora text-slate-900">{name}</div>
             <div className="text-[10px] font-bold text-slate-400">{email}</div>
          </div>
       </div>
       <div className="text-right">
          <div className="text-xs font-bold text-slate-500">{role}</div>
          <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Edit Role</button>
       </div>
    </div>
  );
}
