"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Key, Shield, User, Bell, Database, Globe, ChevronRight, Plus, Copy, Check, Loader2, FolderOpen } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

export default function SettingsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [retentionLoading, setRetentionLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/projects');
      if (data.success) setProjects(data.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRetentionSettings = async () => {
    try {
      const data = await apiFetch('/organization/settings');
      if (data.success && data.data?.retentionDays) {
        setRetentionDays(data.data.retentionDays);
      }
    } catch (err) {
      console.error('Failed to fetch retention settings', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchRetentionSettings();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newProjectName })
      });
      setNewProjectName('');
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  const handleRetentionUpdate = async () => {
    setRetentionLoading(true);
    try {
      await apiFetch('/organization/settings', {
        method: 'PUT',
        body: JSON.stringify({ retentionDays })
      });
    } catch (err) {
      console.error('Failed to update retention', err);
    } finally {
      setRetentionLoading(false);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">System Settings</h2>
          <p className="text-slate-500 font-medium">Manage your workspace, projects, and API security.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        {/* Navigation Sidebar */}
        <div className="col-span-3 space-y-2">
           <SettingsNavItem icon={<User size={18} />} label="General Account" active />
           <SettingsNavItem icon={<FolderOpen size={18} />} label="Projects" />
           <SettingsNavItem icon={<Key size={18} />} label="API Integration" />
           <SettingsNavItem icon={<Shield size={18} />} label="Security & Access" />
           <SettingsNavItem icon={<Database size={18} />} label="Data Retention" />
        </div>

        {/* Content Area */}
        <div className="col-span-9 space-y-10 max-w-4xl">
           {/* Section: Projects & API Keys */}
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-xl font-black font-sora mb-1">Projects & API Keys</h3>
                    <p className="text-sm text-slate-500 font-medium">Segment your data across different environments or applications.</p>
                 </div>
                 <form onSubmit={handleCreateProject} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Project Name..." 
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                    <button type="submit" className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
                       <Plus size={20} />
                    </button>
                 </form>
              </div>

              <div className="space-y-6">
                 {loading ? (
                   <div className="py-10 flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Loading Projects...</span>
                   </div>
                 ) : projects.length === 0 ? (
                   <div className="py-10 text-center text-slate-400 font-medium italic">No projects found. Create your first one above!</div>
                 ) : projects.map((project) => (
                   <div key={project.id} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                      <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                               <FolderOpen className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                               <h4 className="font-black font-sora text-slate-900">{project.name}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Project ID: {project.id.substring(0, 8)}</p>
                            </div>
                         </div>
                         <button className="text-xs font-bold text-emerald-600 hover:underline">+ New Key</button>
                      </div>

                      <div className="space-y-3">
                         {project.apiKeys?.map((apiKey: any) => (
                           <div key={apiKey.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 group/key">
                              <div className="flex-grow">
                                 <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{apiKey.name}</div>
                                 <div className="font-mono text-xs text-slate-600">{copiedKey === apiKey.key ? apiKey.key : '••••••••••••••••••••••••••••'}</div>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(apiKey.key)}
                                className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-emerald-500"
                              >
                                 {copiedKey === apiKey.key ? <Check size={16} /> : <Copy size={16} />}
                              </button>
                           </div>
                         ))}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Section 2: Team */}
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black font-sora mb-2">Workspace Access</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Manage who can collaborate in this organization.</p>
              
              <div className="space-y-4">
                 <UserRow name="Totok Michael" role="Account Owner" email="t.michael@galecto.io" />
              </div>
           </div>

{/* Section 3: Data Retention */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="flex items-center gap-4 mb-2">
                  <Database className="text-orange-500" size={24} />
                  <h3 className="text-xl font-black font-sora">Data Retention Policy</h3>
               </div>
               <p className="text-sm text-slate-500 mb-8 font-medium">Control how long your traces and logs are stored in our OLAP clusters.</p>
               
               <div className="flex items-center gap-8 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex-grow">
                     <div className="text-sm font-black font-sora text-slate-900 mb-1">Retention Period</div>
                     <div className="text-xs text-slate-400 font-medium">Traces older than this period will be automatically purged from ClickHouse.</div>
                  </div>
                  <div className="flex items-center gap-4">
                     <select 
                       className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-emerald-500"
                       value={retentionDays}
                       onChange={(e) => setRetentionDays(Number(e.target.value))}
                     >
                        <option value="7">7 Days</option>
                        <option value="14">14 Days</option>
                        <option value="30">30 Days</option>
                        <option value="90">90 Days</option>
                     </select>
                     <button 
                       onClick={handleRetentionUpdate}
                       disabled={retentionLoading}
                       className="btn-primary !py-3 !px-8"
                     >
                       {retentionLoading ? 'Saving...' : 'Update'}
                     </button>
                  </div>
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
       </div>
    </div>
  );
}
