"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Key, Shield, User, Bell, Database, Globe, ChevronRight, Plus, Copy, Check, Loader2, FolderOpen, Trash2, Mail, X, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [retentionDays, setRetentionDays] = useState(30);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // General tab state
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  
   // Security tab state
   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
   const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'authenticator'>('email');
   const [show2FASetup, setShow2FASetup] = useState(false);
   const [setup2FAStep, setSetup2FAStep] = useState<'select' | 'verify' | 'success'>('select');
   const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
   const [verificationCode, setVerificationCode] = useState('');
   const [twoFactorLoading, setTwoFactorLoading] = useState(false);
   const [sessionTimeout, setSessionTimeout] = useState('30');
  
  // Team tab state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('DEVELOPER');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch organization settings
  const fetchOrgSettings = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await apiFetch('/organization/settings');
      if (data.success && data.data) {
        setOrgName(data.data.name || '');
        setOrgId(data.data.id || '');
        setRetentionDays(data.data.retentionDays || 30);
      }
    } catch (err) {
      console.error('Failed to fetch org settings', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Fetch team members
  const fetchUsers = async (isBackground = false) => {
    try {
      const data = await apiFetch('/users');
      if (data.success) setUsers(data.data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchProjects = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await apiFetch('/projects');
      if (data.success) setProjects(data.data || []);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      if (!isBackground) setLoading(false);
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
    fetchOrgSettings(false);
    fetchUsers(false);
    fetchProjects(false);
    fetchRetentionSettings();
  }, []);

  // Setup 2FA
  const handleSetup2FA = async (method: 'email' | 'authenticator') => {
    setTwoFactorLoading(true);
    try {
      const res = await apiFetch('/api/v1/auth/2fa/setup', {
        method: 'POST',
        body: JSON.stringify({ method })
      });
      if (res.success) {
        setTwoFactorMethod(method);
        if (method === 'authenticator' && res.qrCodeUrl) {
          setQrCodeUrl(res.qrCodeUrl);
        }
        setSetup2FAStep('verify');
      } else {
        showToast(res.error || 'Failed to setup 2FA', 'error');
      }
    } catch (err) {
      showToast('Failed to setup 2FA', 'error');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Please enter a 6-digit code', 'error');
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await apiFetch('/api/v1/auth/2fa/verify-enable', {
        method: 'POST',
        body: JSON.stringify({ code: verificationCode })
      });
      if (res.success) {
        setTwoFactorEnabled(true);
        setSetup2FAStep('success');
        showToast('2FA enabled successfully!', 'success');
        setTimeout(() => {
          setShow2FASetup(false);
          setSetup2FAStep('select');
          setVerificationCode('');
          setQrCodeUrl(null);
        }, 2000);
      } else {
        showToast(res.error || 'Invalid verification code', 'error');
      }
    } catch (err) {
      showToast('Failed to verify 2FA code', 'error');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Please enter your password to disable 2FA:');
    if (!password) return;
    setTwoFactorLoading(true);
    try {
      const res = await apiFetch('/api/v1/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      if (res.success) {
        setTwoFactorEnabled(false);
        showToast('2FA disabled successfully', 'success');
      } else {
        showToast(res.error || 'Failed to disable 2FA', 'error');
      }
    } catch (err) {
      showToast('Failed to disable 2FA', 'error');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Save organization name
  const handleSaveOrgSettings = async () => {
    setSaveLoading(true);
    try {
      const res = await apiFetch('/organization/settings', {
        method: 'PUT',
        body: JSON.stringify({ name: orgName })
      });
      if (res.success) {
        showToast('Organization updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to update org', err);
      showToast('Failed to update organization', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Invite team member
  const handleInviteUser = async () => {
    if (!inviteEmail) {
      showToast('Please enter an email address', 'error');
      return;
    }
    setInviteLoading(true);
    try {
      const res = await apiFetch('/users/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (res.success) {
        showToast('Invitation sent successfully!', 'success');
        setShowInviteModal(false);
        setInviteEmail('');
        fetchUsers();
      } else {
        showToast(res.error || 'Failed to send invite', 'error');
      }
    } catch (err) {
      showToast('Failed to send invitation', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  // Remove user
  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      const res = await apiFetch(`/users/${userId}`, { method: 'DELETE' });
      if (res.success) {
        showToast('User removed successfully!', 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast('Failed to remove user', 'error');
    }
  };

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

  const handleCreateKey = async () => {
    if (!selectedProjectId) {
      alert("No project selected. Please try closing and re-opening the modal.");
      return;
    }
    if (!newKeyName) {
      alert("Please enter a name for your API key.");
      return;
    }

    try {
      const data = await apiFetch(`/projects/${selectedProjectId}/keys`, {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName })
      });
      if (data.success) {
        setShowNewKeyModal(false);
        setNewKeyName('');
        setSelectedProjectId(null);
        fetchProjects(); // Refresh to show new key
      } else {
        alert(`Failed to create key: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to create API key', err);
      alert("A network error occurred while creating the API key.");
    }
  };

  const handleRetentionUpdate = async () => {
    setRetentionLoading(true);
    try {
      const res = await apiFetch('/organization/settings', {
        method: 'PUT',
        body: JSON.stringify({ retentionDays })
      });
      if (res.success) {
        showToast('Data retention updated successfully!', 'success');
      } else {
        showToast(res.error || 'Failed to update retention', 'error');
      }
    } catch (err) {
      console.error('Failed to update retention', err);
      showToast('Failed to update retention settings', 'error');
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
           <SettingsNavItem 
             icon={<User size={18} />} 
             label="General Account" 
             active={activeTab === 'general'} 
             onClick={() => setActiveTab('general')} 
           />
           <SettingsNavItem 
             icon={<FolderOpen size={18} />} 
             label="Projects" 
             active={activeTab === 'projects'} 
             onClick={() => setActiveTab('projects')} 
           />
           <SettingsNavItem 
             icon={<Key size={18} />} 
             label="API Integration" 
             active={activeTab === 'api'} 
             onClick={() => setActiveTab('api')} 
           />
           <SettingsNavItem 
             icon={<Shield size={18} />} 
             label="Security & Access" 
             active={activeTab === 'security'} 
             onClick={() => setActiveTab('security')} 
           />
           <SettingsNavItem 
             icon={<Database size={18} />} 
             label="Data Retention" 
             active={activeTab === 'retention'} 
             onClick={() => setActiveTab('retention')} 
           />
        </div>

        {/* Content Area */}
        <div className="col-span-9 space-y-10 max-w-4xl">
           {/* Show content based on active tab */}
           
           {/* General Tab */}
           {activeTab === 'general' && (
           <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-xl font-black font-sora mb-1">General Account</h3>
                    <p className="text-sm text-slate-500 font-medium">Manage your account settings and preferences.</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="p-6 bg-slate-50 rounded-2xl">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Organization Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                      placeholder="Your Organization"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Your Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white"
                      value={user?.email || ''}
                      disabled
                    />
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Organization ID</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white font-mono text-sm"
                      value={orgId}
                      disabled
                    />
                 </div>
                 <button 
                    onClick={handleSaveOrgSettings}
                    disabled={saveLoading}
                    className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                 >
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                 </button>
              </div>
           </div>
           )}

           {/* Projects Tab */}
           {activeTab === 'projects' && (
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
                         <button 
                             onClick={() => {
                               setSelectedProjectId(project.id);
                               setShowNewKeyModal(true);
                             }}
                             className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            + New Key
                          </button>
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

            {/* Team Members Section */}
            <div className="mt-10 pt-10 border-t border-slate-200">
               <div className="flex justify-between items-center mb-6">
                  <div>
                     <h3 className="text-xl font-black font-sora mb-1">Team Members</h3>
                     <p className="text-sm text-slate-500 font-medium">People who have access to this workspace.</p>
                  </div>
                  <button 
                     onClick={() => setShowInviteModal(true)}
                     className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 flex items-center gap-2"
                  >
                     <Plus size={16} /> Invite
                  </button>
               </div>
               
                <div className="space-y-3">
                   {users.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">No team members found</div>
                   ) : users.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              u.memberStatus === 'PENDING' ? 'bg-orange-100' : 'bg-emerald-100'
                            }`}>
                               <User size={18} className={u.memberStatus === 'PENDING' ? 'text-orange-600' : 'text-emerald-600'} />
                            </div>
                            <div>
                               <div className="flex items-center gap-2">
                                  <div className="font-bold text-slate-900">{u.email}</div>
                                  {u.memberStatus === 'PENDING' && (
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-black uppercase rounded-full">
                                      Pending
                                    </span>
                                  )}
                                  {u.memberStatus === 'ACTIVE' && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded-full">
                                      Active
                                    </span>
                                  )}
                               </div>
                               <div className="text-xs text-slate-500">{u.role}</div>
                               {u.memberStatus === 'PENDING' && u.expiresAt && (
                                 <div className="text-[10px] text-slate-400">
                                   Expires {new Date(u.expiresAt).toLocaleDateString()}
                                 </div>
                               )}
                            </div>
                         </div>
                         <button 
                            onClick={() => handleRemoveUser(u.id)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   ))}
                </div>
            </div>
            </div>
            )}

            {/* API Integration Tab - Show projects and their API keys */}
            {activeTab === 'api' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
               <h3 className="text-xl font-black font-sora mb-2">API Integration</h3>
               <p className="text-sm text-slate-500 mb-8 font-medium">Manage API keys for programmatic access.</p>
               
               {loading ? (
                 <div className="flex items-center gap-2 py-8">
                   <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                   <span className="text-slate-400">Loading...</span>
                 </div>
               ) : projects.length === 0 ? (
                 <div className="text-center py-10 text-slate-400">
                    No projects found. Create a project first.
                 </div>
               ) : (
                 <div className="space-y-6">
                    {projects.map((project) => (
                       <div key={project.id} className="p-6 bg-slate-50 rounded-2xl">
                          <div className="flex justify-between items-center mb-4">
                             <div className="font-bold text-slate-900">{project.name}</div>
                             <button 
                               onClick={() => { setSelectedProjectId(project.id); setShowNewKeyModal(true); }}
                               className="text-xs font-bold text-emerald-600 hover:underline"
                             >
                               + New Key
                             </button>
                          </div>
                          <div className="text-sm text-slate-500">
                             Project ID: {project.id.substring(0, 8)}...
                          </div>
                       </div>
                    ))}
                 </div>
               )}
            </div>
           )}

            {/* Security Tab */}
            {activeTab === 'security' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
               <h3 className="text-xl font-black font-sora mb-2">Security & Access</h3>
               <p className="text-sm text-slate-500 mb-8 font-medium">Manage security settings and access controls.</p>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                     <div>
                        <div className="font-bold text-slate-900">Two-Factor Authentication</div>
                        <div className="text-sm text-slate-500">Add an extra layer of security</div>
                        {twoFactorEnabled && (
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            Currently enabled with {twoFactorMethod === 'email' ? 'Email OTP' : 'Authenticator App'}
                          </div>
                        )}
                     </div>
                     <button 
                        onClick={() => {
                          if (twoFactorEnabled) {
                            handleDisable2FA();
                          } else {
                            setShow2FASetup(true);
                          }
                        }}
                        disabled={twoFactorLoading}
                        className={`px-4 py-2 rounded-xl text-sm font-bold ${twoFactorEnabled ? 'bg-green-100 text-green-600' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                     >
                        {twoFactorLoading ? 'Processing...' : (twoFactorEnabled ? 'Enabled' : 'Enable')}
                     </button>
                  </div>
                  
                  {/* 2FA Setup Modal */}
                  {show2FASetup && (
                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                      {setup2FAStep === 'select' && (
                        <div className="space-y-4">
                          <h4 className="font-bold text-slate-900">Choose 2FA Method</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => handleSetup2FA('email')}
                              disabled={twoFactorLoading}
                              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition-all text-left"
                            >
                              <div className="font-bold text-slate-900 mb-1">Email OTP</div>
                              <div className="text-xs text-slate-500">Receive codes via email</div>
                            </button>
                            <button
                              onClick={() => handleSetup2FA('authenticator')}
                              disabled={twoFactorLoading}
                              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 transition-all text-left"
                            >
                              <div className="font-bold text-slate-900 mb-1">Authenticator App</div>
                              <div className="text-xs text-slate-500">Use Google Authenticator or similar</div>
                            </button>
                          </div>
                          <button
                            onClick={() => setShow2FASetup(false)}
                            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      
                      {setup2FAStep === 'verify' && (
                        <div className="space-y-4">
                          <h4 className="font-bold text-slate-900">Verify Setup</h4>
                          
                          {twoFactorMethod === 'authenticator' && qrCodeUrl && (
                            <div className="text-center">
                              <p className="text-sm text-slate-600 mb-3">Scan this QR code with your authenticator app:</p>
                              <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto rounded-xl border border-slate-200" />
                            </div>
                          )}
                          
                          {twoFactorMethod === 'email' && (
                            <p className="text-sm text-slate-600">A verification code has been sent to your email. Enter it below:</p>
                          )}
                          
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Enter 6-digit code</label>
                            <input
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center tracking-[0.5em] font-mono focus:outline-none focus:border-emerald-500"
                              maxLength={6}
                            />
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setShow2FASetup(false);
                                setSetup2FAStep('select');
                                setVerificationCode('');
                              }}
                              className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleVerify2FA}
                              disabled={twoFactorLoading || verificationCode.length !== 6}
                              className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                            >
                              {twoFactorLoading ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {setup2FAStep === 'success' && (
                        <div className="text-center py-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          </div>
                          <h4 className="font-bold text-slate-900 mb-1">2FA Enabled!</h4>
                          <p className="text-sm text-slate-500">Your account is now more secure.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                     <div>
                        <div className="font-bold text-slate-900">Session Timeout</div>
                        <div className="text-sm text-slate-500">Auto logout after inactivity</div>
                     </div>
                     <select 
                        value={sessionTimeout}
                        onChange={(e) => {
                          setSessionTimeout(e.target.value);
                          showToast('Session timeout updated', 'success');
                        }}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                     >
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="240">4 hours</option>
                     </select>
                  </div>
               </div>
            </div>
            )}

           {/* Data Retention Tab */}
           {activeTab === 'retention' && (
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
           )}
        </div>
      </div>

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-black text-slate-900 mb-6">Create New API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Key Name</label>
                <input 
                  type="text" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-sm text-slate-500">The key will be generated and displayed once. Make sure to copy it - it cannot be retrieved later.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowNewKeyModal(false); setNewKeyName(''); setSelectedProjectId(null); }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateKey}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Invite Team Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="OWNER">Owner</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="OBSERVER">Observer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleInviteUser}
                disabled={inviteLoading}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviteLoading ? 'Sending...' : <><Mail size={16} /> Send Invite</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-xl z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="font-bold">{toast.message}</div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SettingsNavItem({ icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-white text-emerald-600 font-bold shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-100'}`}
    >
      <div className={active ? 'text-emerald-500' : ''}>{icon}</div>
      <span className="text-sm">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
    </div>
  );
}

