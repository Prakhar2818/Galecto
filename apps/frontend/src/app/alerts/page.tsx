"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Bell, AlertTriangle, CheckCircle2, Clock,
  Filter, Settings, RefreshCw, Loader2, X, Plus, Trash2
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);
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
    services: ''
  });
  const [creatingRule, setCreatingRule] = useState(false);
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

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    await Promise.all([fetchAlerts(isBackground), fetchRules()]);
    if (!isBackground) setLoading(false);
    setRefreshing(false);
  }, [fetchAlerts, fetchRules]);

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
          services
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
          services: ''
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
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {alert.service || 'unknown service'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : ''}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                      alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {alert.severity || 'MEDIUM'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black font-sora tracking-tight text-slate-900">
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
                      <div>
                        <div className="text-sm font-bold text-slate-100">{rule.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-1">
                          {rule.conditionType} • {rule.severity}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
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
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Alert Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-900">Email Notifications</div>
                  <div className="text-sm text-slate-500">Receive alerts via email</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-900">Slack Notifications</div>
                  <div className="text-sm text-slate-500">Send alerts to Slack channel</div>
                </div>
                <input type="checkbox" className="w-5 h-5 accent-emerald-500" />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-900">Auto-Acknowledge</div>
                  <div className="text-sm text-slate-500">Auto-resolve after 24h</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-emerald-500" />
              </div>
            </div>
            <button
              onClick={() => {
                showToast('Settings saved', 'success');
                setShowSettings(false);
              }}
              className="w-full mt-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600"
            >
              Save Settings
            </button>
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
                    <option value=">=">>=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
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