"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Bell, AlertTriangle, CheckCircle2, Clock,
  Filter, Settings, RefreshCw, Loader2, X, Plus, Trash2,
  Mail, MessageSquare, Webhook, Send, ToggleLeft, ToggleRight
} from 'lucide-react';
import { alertFetch, apiFetch, ApiError } from '@/lib/apiClient';

interface Alert {
  id: string;
  traceId?: string;
  service?: string;
  type?: string;
  message?: string;
  status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  severity?: string;
  timestamp?: string;
}

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditionType: string;
  conditionValue: Record<string, unknown>;
  severity: string;
  services: string[];
  notifications?: {
    id: string;
    channelId: string;
    channelType: string;
  }[];
}

interface NotificationChannel {
  id: string;
  type: 'EMAIL' | 'SLACK' | 'TEAMS' | 'WEBHOOK';
  name: string;
  config: {
    webhook_url?: string;
    recipients?: string[];
  };
  enabled: boolean;
}

interface ErrorState {
  message: string;
  code?: string;
  retryable: boolean;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    conditionType: 'ERROR_RATE',
    threshold: '10',
    operator: '>=',
    windowMinutes: '5',
    severity: 'HIGH',
    services: '',
    notificationChannels: [] as string[]
  });
  const [newChannel, setNewChannel] = useState({
    type: 'EMAIL' as 'EMAIL' | 'SLACK' | 'TEAMS' | 'WEBHOOK',
    name: '',
    webhook_url: '',
    recipients: ''
  });
  const [creatingRule, setCreatingRule] = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [testingChannelId, setTestingChannelId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchAlerts = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const data = await alertFetch('/api/v1/alerts', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        setAlerts(data.data || []);
        setError(null);
      } else {
        setError({
          message: data.error?.message || 'Failed to load alerts',
          code: data.error?.code,
          retryable: true
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      setError({
        message: apiError.message,
        code: apiError.code,
        retryable: apiError.status > 0 && apiError.status < 500
      });
    } finally {
      if (!isMountedRef.current) return;
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchRules = useCallback(async () => {
    try {
      const data = await apiFetch('/api/v1/platform/rules', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        setRules(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch alert rules:', err);
    }
  }, []);

  const fetchChannels = useCallback(async () => {
    try {
      const data = await apiFetch('/api/v1/notifications', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        setChannels(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notification channels:', err);
    }
  }, []);

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    await Promise.all([fetchAlerts(isBackground), fetchRules(), fetchChannels()]);
    if (!isBackground) setLoading(false);
    setRefreshing(false);
  }, [fetchAlerts, fetchRules, fetchChannels]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData(false);

    intervalRef.current = setInterval(() => {
      if (!loading) {
        fetchData(true);
      }
    }, 10000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [fetchData, loading]);

  const resolveAlert = useCallback(async (id: string) => {
    setResolvingId(id);
    try {
      const data = await alertFetch(`/api/v1/alerts/${id}/resolve`, {
        method: 'POST',
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        showToast('Alert resolved successfully', 'success');
        fetchAlerts(false);
      } else {
        showToast(data.error?.message || 'Failed to resolve alert', 'error');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      showToast(apiError.message, 'error');
    } finally {
      if (!isMountedRef.current) return;
      setResolvingId(null);
    }
  }, [fetchAlerts, showToast]);

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      showToast('Rule name is required', 'error');
      return;
    }
    if (!newRule.services.trim()) {
      showToast('At least one service is required', 'error');
      return;
    }

    setCreatingRule(true);
    try {
      const services = newRule.services.split(',').map(s => s.trim()).filter(Boolean);

      const notificationChannels = newRule.notificationChannels.map(channelId => {
        const channel = channels.find(c => c.id === channelId);
        return {
          channelId,
          channelType: channel?.type || 'SLACK'
        };
      });

      const data = await apiFetch('/api/v1/platform/rules', {
        method: 'POST',
        body: JSON.stringify({
          name: newRule.name,
          description: newRule.description,
          conditionType: newRule.conditionType,
          conditionValue: {
            threshold: Number(newRule.threshold),
            operator: newRule.operator,
            windowMinutes: Number(newRule.windowMinutes)
          },
          severity: newRule.severity,
          services,
          notificationChannels: notificationChannels.length > 0 ? notificationChannels : undefined
        }),
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        showToast('Alert rule created successfully', 'success');
        setShowNewRule(false);
        setNewRule({
          name: '',
          description: '',
          conditionType: 'ERROR_RATE',
          threshold: '10',
          operator: '>=',
          windowMinutes: '5',
          severity: 'HIGH',
          services: '',
          notificationChannels: []
        });
        fetchRules();
      } else {
        showToast(data.error?.message || 'Failed to create rule', 'error');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      showToast(apiError.message, 'error');
    } finally {
      if (!isMountedRef.current) return;
      setCreatingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const data = await apiFetch(`/api/v1/platform/rules/${ruleId}`, {
        method: 'DELETE',
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        showToast('Rule deleted successfully', 'success');
        fetchRules();
      } else {
        showToast(data.error?.message || 'Failed to delete rule', 'error');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      showToast('Failed to delete rule', 'error');
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) {
      showToast('Channel name is required', 'error');
      return;
    }

    setCreatingChannel(true);
    try {
      const config: any = {};
      if (newChannel.type === 'SLACK' || newChannel.type === 'TEAMS' || newChannel.type === 'WEBHOOK') {
        if (!newChannel.webhook_url.trim()) {
          showToast('Webhook URL is required for ' + newChannel.type, 'error');
          setCreatingChannel(false);
          return;
        }
        config.webhook_url = newChannel.webhook_url;
      }
      if (newChannel.type === 'EMAIL') {
        if (!newChannel.recipients.trim()) {
          showToast('Recipients email is required', 'error');
          setCreatingChannel(false);
          return;
        }
        config.recipients = newChannel.recipients.split(',').map(e => e.trim()).filter(Boolean);
      }

      const data = await apiFetch('/api/v1/notifications', {
        method: 'POST',
        body: JSON.stringify({
          type: newChannel.type,
          name: newChannel.name,
          config,
          enabled: true
        }),
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        showToast('Notification channel created successfully', 'success');
        setShowNewChannel(false);
        setNewChannel({ type: 'EMAIL', name: '', webhook_url: '', recipients: '' });
        fetchChannels();
      } else {
        showToast(data.error?.message || 'Failed to create channel', 'error');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      showToast('Failed to create notification channel', 'error');
    } finally {
      if (!isMountedRef.current) return;
      setCreatingChannel(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const data = await apiFetch(`/api/v1/notifications/${channelId}`, {
        method: 'DELETE',
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        showToast('Channel deleted successfully', 'success');
        fetchChannels();
      } else {
        showToast(data.error?.message || 'Failed to delete channel', 'error');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      showToast('Failed to delete channel', 'error');
    }
  };

  const handleToggleChannel = async (channel: NotificationChannel) => {
    try {
      const data = await apiFetch(`/api/v1/notifications/${channel.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          type: channel.type,
          name: channel.name,
          config: channel.config,
          enabled: !channel.enabled
        }),
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        showToast(`Channel ${channel.enabled ? 'disabled' : 'enabled'} successfully`, 'success');
        fetchChannels();
      } else {
        showToast(data.error?.message || 'Failed to update channel', 'error');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      showToast('Failed to update channel', 'error');
    }
  };

  const handleTestChannel = async (channelId: string) => {
    setTestingChannelId(channelId);
    try {
      const data = await apiFetch(`/api/v1/notifications/${channelId}/test`, {
        method: 'POST',
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success) {
        showToast('Test notification sent! Check your ' + channels.find(c => c.id === channelId)?.type + ' channel.', 'success');
      } else {
        showToast(data.error?.message || 'Failed to send test notification', 'error');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      showToast('Failed to send test notification', 'error');
    } finally {
      if (!isMountedRef.current) return;
      setTestingChannelId(null);
    }
  };

  return (
    <DashboardLayout>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-right ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-slate-900 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Active Alerts</h2>
          <p className="text-slate-500 font-medium">Real-time anomaly detection and incident management.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setRefreshing(true); fetchData(true); }}
            disabled={refreshing || loading}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-primary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Alert Settings
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-red-700 font-medium text-sm">{error.message}</p>
          </div>
          <div className="flex gap-2">
            {error.retryable && (
              <button onClick={() => fetchData(false)} className="text-xs text-red-600 hover:text-red-800 font-medium">
                Retry
              </button>
            )}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Alerts List */}
        <div className="col-span-8 space-y-4">
          {loading && alerts.length === 0 ? (
            <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Watching Kafka Streams...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black font-sora">All Systems Clear</h3>
              <p className="text-slate-400 max-w-xs">No anomalies detected in the last 24 hours. Your services are running within normal parameters.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-8 ${
                  alert.status === 'RESOLVED' ? 'border-slate-50 opacity-60' : 'border-red-100 shadow-lg shadow-red-500/5'
                }`}
              >
                <div className={`p-4 rounded-2xl ${alert.status === 'RESOLVED' ? 'bg-slate-100' : 'bg-red-100'}`}>
                  {alert.type === 'ERROR' || alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? (
                    <AlertTriangle className="text-red-600" />
                  ) : (
                    <Clock className="text-orange-600" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      alert.type === 'ERROR' ? 'bg-red-100 text-red-600' :
                      alert.type === 'LATENCY' ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {alert.type || 'ALERT'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {alert.service || 'unknown service'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ''}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                      alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                      alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {alert.severity || 'MEDIUM'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black font-sora tracking-tight text-slate-900 leading-tight">
                    {alert.message || 'Alert message not available'}
                  </h4>
                  {alert.traceId && (
                    <div className="text-xs font-mono text-slate-400 mt-2">
                      Trace ID: {alert.traceId}
                    </div>
                  )}
                </div>
                {alert.status === 'ACTIVE' && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {resolvingId === alert.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    Resolve
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar Rules */}
        <div className="col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <h3 className="text-lg font-black font-sora mb-6 flex items-center gap-3">
              <Filter className="text-emerald-500" size={20} /> Active Rules
            </h3>
            <div className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-4">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No alert rules configured
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="border-l-2 border-emerald-500/30 pl-4 py-2 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-100">{rule.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-1">
                          {rule.conditionType} • {rule.severity}
                        </div>
                        {rule.notifications && rule.notifications.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {rule.notifications.map((n, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">
                                {n.channelType === 'EMAIL' && <Mail className="w-3 h-3" />}
                                {n.channelType === 'SLACK' && <MessageSquare className="w-3 h-3" />}
                                {n.channelType === 'TEAMS' && <MessageSquare className="w-3 h-3" />}
                                {n.channelType === 'WEBHOOK' && <Webhook className="w-3 h-3" />}
                                {channels.find(c => c.id === n.channelId)?.name || n.channelType}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity flex-shrink-0 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowNewRule(true)}
              className="w-full mt-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Rule
            </button>
          </div>
        </div>
      </div>

      {/* Alert Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Notification Channels</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {channels.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notification channels configured</p>
                  <p className="text-xs mt-1">Add channels to receive alerts</p>
                </div>
              ) : (
                channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        channel.type === 'EMAIL' ? 'bg-blue-100 text-blue-600' :
                        channel.type === 'SLACK' ? 'bg-purple-100 text-purple-600' :
                        channel.type === 'TEAMS' ? 'bg-indigo-100 text-indigo-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {channel.type === 'EMAIL' ? <Mail className="w-4 h-4" /> :
                         channel.type === 'SLACK' ? <MessageSquare className="w-4 h-4" /> :
                         channel.type === 'TEAMS' ? <MessageSquare className="w-4 h-4" /> :
                         <Webhook className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{channel.name}</div>
                        <div className="text-xs text-slate-500">
                          {channel.type === 'EMAIL' && channel.config?.recipients?.join(', ')}
                          {channel.type !== 'EMAIL' && channel.config?.webhook_url && (
                            <span className="font-mono truncate max-w-[200px] inline-block">{channel.config.webhook_url}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestChannel(channel.id)}
                        disabled={testingChannelId === channel.id}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-emerald-500 transition-colors disabled:opacity-50"
                        title="Test notification"
                      >
                        {testingChannelId === channel.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleChannel(channel)}
                        className={`p-2 rounded-lg transition-colors ${
                          channel.enabled ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-100'
                        }`}
                        title={channel.enabled ? 'Disable' : 'Enable'}
                      >
                        {channel.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowNewChannel(true)}
              className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Notification Channel
            </button>
          </div>
        </div>
      )}

      {/* Create New Channel Modal */}
      {showNewChannel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Add Notification Channel</h2>
              <button onClick={() => setShowNewChannel(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Channel Name *</label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  placeholder="e.g., Production Alerts"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Channel Type</label>
                <select
                  value={newChannel.type}
                  onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value as any })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SLACK">Slack</option>
                  <option value="TEAMS">Microsoft Teams</option>
                  <option value="WEBHOOK">Generic Webhook</option>
                </select>
              </div>
              {newChannel.type === 'SLACK' || newChannel.type === 'TEAMS' || newChannel.type === 'WEBHOOK' ? (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Webhook URL *</label>
                  <input
                    type="url"
                    value={newChannel.webhook_url}
                    onChange={(e) => setNewChannel({ ...newChannel, webhook_url: e.target.value })}
                    placeholder="https://hooks.slack.com/..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Recipients *</label>
                  <input
                    type="text"
                    value={newChannel.recipients}
                    onChange={(e) => setNewChannel({ ...newChannel, recipients: e.target.value })}
                    placeholder="email@example.com, another@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Comma-separated email addresses</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewChannel(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={creatingChannel}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingChannel && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Rule Modal */}
      {showNewRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Create New Alert Rule</h2>
              <button onClick={() => setShowNewRule(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rule Name *</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., High Error Rate"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Services *</label>
                <input
                  type="text"
                  value={newRule.services}
                  onChange={(e) => setNewRule({ ...newRule, services: e.target.value })}
                  placeholder="e.g., api-gateway, auth-service"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1">Comma-separated service names</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Condition</label>
                <select
                  value={newRule.conditionType}
                  onChange={(e) => setNewRule({ ...newRule, conditionType: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="ERROR_RATE">Error Rate (%)</option>
                  <option value="LATENCY">Latency (ms)</option>
                  <option value="THRESHOLD">Status Code Threshold</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Threshold</label>
                  <input
                    type="number"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Operator</label>
                  <select
                    value={newRule.operator}
                    onChange={(e) => setNewRule({ ...newRule, operator: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value=">=">{">="}</option>
                    <option value=">">{">"}</option>
                    <option value="<">{"<"}</option>
                    <option value="<=">{"<="}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Window (min)</label>
                  <input
                    type="number"
                    value={newRule.windowMinutes}
                    onChange={(e) => setNewRule({ ...newRule, windowMinutes: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notification Channels</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {channels.length === 0 ? (
                    <p className="text-xs text-slate-400">No channels configured. Create one in Alert Settings first.</p>
                  ) : (
                    channels.map((channel) => (
                      <label key={channel.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={newRule.notificationChannels.includes(channel.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRule({ ...newRule, notificationChannels: [...newRule.notificationChannels, channel.id] });
                            } else {
                              setNewRule({ ...newRule, notificationChannels: newRule.notificationChannels.filter(id => id !== channel.id) });
                            }
                          }}
                          className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <div className="flex items-center gap-2">
                          {channel.type === 'EMAIL' && <Mail className="w-4 h-4 text-blue-500" />}
                          {channel.type === 'SLACK' && <MessageSquare className="w-4 h-4 text-purple-500" />}
                          {channel.type === 'TEAMS' && <MessageSquare className="w-4 h-4 text-indigo-500" />}
                          {channel.type === 'WEBHOOK' && <Webhook className="w-4 h-4 text-slate-500" />}
                          <span className="text-sm font-medium text-slate-700">{channel.name}</span>
                          <span className="text-xs text-slate-400">({channel.type})</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Select which channels should receive alerts for this rule</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewRule(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={creatingRule}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingRule && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}