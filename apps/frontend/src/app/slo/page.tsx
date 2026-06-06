"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  X, Edit2, Save, Loader2, RefreshCw, Settings, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { queryFetch, apiFetch, ApiError } from '@/lib/apiClient';

interface SLOData {
  service: string;
  totalRequests: number;
  errorCount: number;
  successRate: number;
  slowRequestRate: number;
  errorRate: number;
  meetsErrorSlo: boolean;
  meetsLatencySlo: boolean;
}

interface SloTarget {
  service: string;
  errorRateThreshold: number;
  latencyThreshold: number;
}

interface ErrorState {
  message: string;
  retryable: boolean;
}

export default function SloPage() {
  const [sloData, setSloData] = useState<SLOData[]>([]);
  const [sloTargets, setSloTargets] = useState<SloTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ errorRate: '', latency: '' });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSloStatus = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const data = await queryFetch('/api/v1/slo-status', { retries: 2 });

      if (data.success && data.data) {
        const services = Array.isArray(data.data) ? data.data : [];
        setSloData(services);
        
        const targets = services.map((s: SLOData) => ({
          service: s.service,
          errorRateThreshold: 1.0,
          latencyThreshold: 500
        }));
        setSloTargets(targets);
        setError(null);
      } else {
        setError({
          message: data.error?.message || 'Failed to load SLO status',
          retryable: true
        });
      }
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      setError({
        message: apiError.message,
        retryable: apiError.status > 0 && apiError.status < 500
      });
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSloTargets = useCallback(async () => {
    try {
      const data = await apiFetch('/api/v1/slo/targets', { retries: 1 });
      if (data.success && data.data) {
        setSloTargets(data.data);
      }
    } catch {
      // Use default targets
    }
  }, []);

  useEffect(() => {
    fetchSloStatus(false);
    fetchSloTargets();
  }, [fetchSloStatus, fetchSloTargets]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSloStatus(true);
  };

  const handleEditStart = (service: string, currentSlo: SLOData) => {
    setEditingService(service);
    const target = sloTargets.find(t => t.service === service);
    setEditForm({
      errorRate: target ? (1 - target.errorRateThreshold / 100).toFixed(2) : '99.00',
      latency: target ? target.latencyThreshold.toString() : '500'
    });
  };

  const handleEditCancel = () => {
    setEditingService(null);
    setEditForm({ errorRate: '', latency: '' });
  };

  const handleEditSave = async () => {
    if (!editingService) return;
    
    setSaving(true);
    try {
      const errorRatePercent = parseFloat(editForm.errorRate) || 1.0;
      const latencyMs = parseInt(editForm.latency) || 500;

      const data = await apiFetch('/api/v1/slo/targets', {
        method: 'PUT',
        body: JSON.stringify({
          service: editingService,
          errorRateThreshold: errorRatePercent,
          latencyThreshold: latencyMs
        })
      });

      if (data.success) {
        setSloTargets(prev => {
          const existing = prev.findIndex(t => t.service === editingService);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = {
              service: editingService,
              errorRateThreshold: errorRatePercent,
              latencyThreshold: latencyMs
            };
            return updated;
          }
          return [...prev, {
            service: editingService,
            errorRateThreshold: errorRatePercent,
            latencyThreshold: latencyMs
          }];
        });
        setEditingService(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      // Handle error
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (meetsError: boolean, meetsLatency: boolean) => {
    if (meetsError && meetsLatency) return { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' };
    if (!meetsError && !meetsLatency) return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' };
    return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' };
  };

  const getOverallStats = () => {
    const total = sloData.length;
    const meeting = sloData.filter(s => s.meetsErrorSlo && s.meetsLatencySlo).length;
    const breaching = total - meeting;
    const atRisk = sloData.filter(s => !s.meetsErrorSlo || !s.meetsLatencySlo).length - breaching;
    
    return { total, meeting, breaching, atRisk };
  };

  const stats = getOverallStats();

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">SLO Dashboard</h2>
          <p className="text-slate-500 font-medium">Service Level Objectives - Monitor and configure reliability targets.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-red-700 font-medium text-sm">{error.message}</p>
          </div>
          <div className="flex gap-2">
            {error.retryable && (
              <button onClick={() => fetchSloStatus(false)} className="text-xs text-red-600 hover:text-red-800 font-medium">
                Retry
              </button>
            )}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-700 font-medium text-sm">SLO targets saved successfully!</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Services</div>
              <div className="text-3xl font-black font-sora">{stats.total}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting SLO</div>
              <div className="text-3xl font-black font-sora text-emerald-600">{stats.meeting}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-yellow-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">At Risk</div>
              <div className="text-3xl font-black font-sora text-yellow-600">{stats.atRisk}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breaching</div>
              <div className="text-3xl font-black font-sora text-red-600">{stats.breaching}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SLO Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-xl font-black font-sora">Service SLO Status</h3>
        </div>

        {loading && sloData.length === 0 ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          </div>
        ) : sloData.length === 0 ? (
          <div className="p-20 text-center">
            <Target className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Services Found</h3>
            <p className="text-slate-500">Connect your application to start monitoring SLOs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Requests</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Error Rate</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Slow Requests</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Error SLO</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Latency SLO</th>
                  <th className="text-center px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-right px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sloData.map((slo) => {
                  const colors = getStatusColor(slo.meetsErrorSlo, slo.meetsLatencySlo);
                  const isEditing = editingService === slo.service;
                  const target = sloTargets.find(t => t.service === slo.service);
                  
                  return (
                    <tr key={slo.service} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-900">{slo.service}</div>
                      </td>
                      <td className="text-center px-4 py-6">
                        <span className="text-slate-600 font-medium">{(Number(slo.totalRequests) || 0).toLocaleString()}</span>
                      </td>
                      <td className="text-center px-4 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-bold ${Number(slo.errorRate) > 1 ? 'text-red-500' : 'text-slate-600'}`}>
                            {(Number(slo.errorRate) || 0).toFixed(2)}%
                          </span>
                          {Number(slo.errorRate) > 1 ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </td>
                      <td className="text-center px-4 py-6">
                        <span className={`font-bold ${Number(slo.successRate) >= 99 ? 'text-emerald-600' : Number(slo.successRate) >= 95 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {(Number(slo.successRate) || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-center px-4 py-6">
                        <span className={`font-medium ${Number(slo.slowRequestRate) > 5 ? 'text-red-500' : 'text-slate-600'}`}>
                          {(Number(slo.slowRequestRate) || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-center px-4 py-6">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.errorRate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, errorRate: e.target.value }))}
                            className="w-20 px-2 py-1 text-center border border-slate-200 rounded-lg text-sm font-medium"
                          />
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${slo.meetsErrorSlo ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {slo.meetsErrorSlo ? 'PASS' : 'FAIL'}
                          </span>
                        )}
                      </td>
                      <td className="text-center px-4 py-6">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.latency}
                            onChange={(e) => setEditForm(prev => ({ ...prev, latency: e.target.value }))}
                            className="w-20 px-2 py-1 text-center border border-slate-200 rounded-lg text-sm font-medium"
                          />
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${slo.meetsLatencySlo ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {slo.meetsLatencySlo ? 'PASS' : 'FAIL'}
                          </span>
                        )}
                      </td>
                      <td className="text-center px-4 py-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${colors.bg} ${colors.border} border`}>
                          {slo.meetsErrorSlo && slo.meetsLatencySlo ? (
                            <>
                              <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
                              <span className={`text-sm font-bold ${colors.text}`}>Healthy</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {!slo.meetsErrorSlo && !slo.meetsLatencySlo ? 'Critical' : 'At Risk'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="text-right px-8 py-6">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={handleEditSave}
                              disabled={saving}
                              className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditStart(slo.service, slo)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                          >
                            <Settings className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <h4 className="font-bold text-slate-900 mb-2">About SLOs</h4>
        <p className="text-sm text-slate-500 leading-relaxed">
          Service Level Objectives (SLOs) define the acceptable performance thresholds for your services. 
          Error SLO measures the percentage of successful requests (target: {">="}99%). 
          Latency SLO measures slow requests where P99 {">"} 500ms (target: {"<"}5%).
        </p>
      </div>
    </DashboardLayout>
  );
}