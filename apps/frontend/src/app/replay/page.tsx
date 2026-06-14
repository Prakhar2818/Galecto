"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  RotateCcw, Play, History, CheckCircle2,
  AlertCircle, ChevronRight, Zap, Loader2, Database, X, RefreshCw, AlertTriangle, Video, Activity
} from 'lucide-react';
import { queryFetch, apiFetch, ApiError } from '@/lib/apiClient';
import TraceGraph from '@/components/TraceGraph';
import SessionReplayPlayer from '@/components/SessionReplayPlayer';

interface Anomaly {
  trace_id: string;
  service_name: string;
  status: string;
  start_time: string;
}

interface ReplayExecution {
  id: string;
  traceId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  requestMethod?: string;
  requestUrl?: string;
  responseStatus?: number;
  executedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface TraceEvent {
  span_id: string;
  parent_span_id: string | null;
  event_name: string;
  service_name: string;
  timestamp: string;
  payload: string | Record<string, unknown>;
  duration_ms?: number;
  status_code?: number;
  children?: TraceEvent[];
}

interface ErrorState {
  message: string;
  code?: string;
  retryable: boolean;
}

function buildTree(events: TraceEvent[]): TraceEvent[] {
  if (!events || events.length === 0) return [];
  const spanMap = new Map<string, TraceEvent>();
  const roots: TraceEvent[] = [];

  events.forEach(event => {
    const node: TraceEvent = { ...event, children: [] };
    spanMap.set(event.span_id, node);
  });

  events.forEach(event => {
    const node = spanMap.get(event.span_id);
    if (!node) return;
    if (event.parent_span_id && spanMap.has(event.parent_span_id)) {
      const parent = spanMap.get(event.parent_span_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function ReplayPageContent() {
  const searchParams = useSearchParams();
  const urlTraceId = searchParams.get('traceId');
  const urlTab = searchParams.get('tab');

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [history, setHistory] = useState<ReplayExecution[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [originalTree, setOriginalTree] = useState<TraceEvent[] | null>(null);
  const [replayTree, setReplayTree] = useState<TraceEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [traceError, setTraceError] = useState<ErrorState | null>(null);
  const [activeTab, setActiveTab] = useState<'request' | 'session'>('request');
  const [sessionReplayData, setSessionReplayData] = useState<any>(null);
  const [sessionReplayLoading, setSessionReplayLoading] = useState(false);
  const [sessionReplayError, setSessionReplayError] = useState<ErrorState | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const urlSelectionProcessed = useRef(false);

  const fetchAnomalies = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);

    try {
      const data = await queryFetch('/api/v1/traces/anomalies', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        setAnomalies(data.data || []);
        setError(null);
      } else {
        setError({
          message: data.error?.message || 'Failed to load anomalies',
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

  const fetchReplayHistory = useCallback(async () => {
    try {
      const data = await apiFetch('/api/v1/replays', { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch replay history:', err);
    }
  }, []);

  const fetchData = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    await Promise.all([fetchAnomalies(isBackground), fetchReplayHistory()]);
    if (!isBackground) setLoading(false);
    setRefreshing(false);
  }, [fetchAnomalies, fetchReplayHistory]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData(false);

    intervalRef.current = setInterval(() => {
      if (!loading && !executing) {
        fetchData(true);
      }
    }, 15000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData, loading, executing]);

  const handleFetchSessionReplay = useCallback(async (traceId: string) => {
    setSessionReplayLoading(true);
    setSessionReplayError(null);
    setSessionReplayData(null);

    try {
      const metaData = await apiFetch(`/api/v1/session-replay/by-trace/${traceId}`, { retries: 1 });
      if (!isMountedRef.current) return;

      if (!metaData.success || !metaData.data) {
        setSessionReplayError({
          message: 'No session replay recorded for this trace. Enable sessionReplay in the SDK.',
          retryable: false,
        });
        setSessionReplayLoading(false);
        return;
      }

      const sessionId = metaData.data.sessionId;
      const fullData = await apiFetch(`/api/v1/session-replay/${sessionId}`, { retries: 1 });
      if (!isMountedRef.current) return;

      if (fullData.success && fullData.data) {
        setSessionReplayData(fullData.data);
      } else {
        setSessionReplayError({
          message: fullData.error?.message || 'Failed to load session replay',
          retryable: true,
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      setSessionReplayError({
        message: apiError.message,
        retryable: true,
      });
    } finally {
      if (isMountedRef.current) setSessionReplayLoading(false);
    }
  }, []);

  const handleSelectAnomaly = useCallback(async (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setOriginalTree(null);
    setReplayTree(null);
    setTraceError(null);

    try {
      const data = await queryFetch(`/api/v1/traces/${anomaly.trace_id}`, { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        const events: TraceEvent[] = data.tree || [];
        const tree = buildTree(events);
        setOriginalTree(tree);
      } else {
        setTraceError({
          message: data.error?.message || 'Failed to load trace details',
          code: data.error?.code,
          retryable: true
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      setTraceError({
        message: apiError.message,
        code: apiError.code,
        retryable: apiError.status > 0 && apiError.status < 500
      });
    }
  }, []);

  useEffect(() => {
    if (urlTab === 'session') {
      setActiveTab('session');
    }
  }, [urlTab]);

  useEffect(() => {
    if (urlTraceId && anomalies.length > 0 && !selectedAnomaly && !urlSelectionProcessed.current) {
      const matchingAnomaly = anomalies.find(a => a.trace_id === urlTraceId);
      if (matchingAnomaly) {
        urlSelectionProcessed.current = true;
        handleSelectAnomaly(matchingAnomaly);
      }
    }
  }, [urlTraceId, anomalies, selectedAnomaly, handleSelectAnomaly]);

  useEffect(() => {
    if (activeTab === 'session' && !sessionReplayData && !sessionReplayLoading) {
      const traceId = selectedAnomaly?.trace_id || urlTraceId;
      if (traceId) {
        handleFetchSessionReplay(traceId);
      }
    }
  }, [activeTab, selectedAnomaly, urlTraceId, sessionReplayData, sessionReplayLoading, handleFetchSessionReplay]);

  const handleExecuteReplay = useCallback(async () => {
    if (!selectedAnomaly) return;

    setExecuting(true);
    setReplayTree(null);

    try {
      const data = await apiFetch(`/api/v1/replay/${selectedAnomaly.trace_id}`, {
        method: 'POST',
        retries: 1
      });

      if (!isMountedRef.current) return;

      if (data.success && data.replayTraceId) {
        let attempts = 0;
        const maxAttempts = 10;

        const pollReplay = async () => {
          if (!isMountedRef.current) return;

          try {
            const replayData = await queryFetch(`/api/v1/traces/${data.replayTraceId}`, { retries: 1 });

            if (!isMountedRef.current) return;

            if (replayData.success && replayData.tree && replayData.tree.length > 0) {
              const tree = buildTree(replayData.tree as TraceEvent[]);
              setReplayTree(tree);
              setExecuting(false);
              fetchReplayHistory();
              return;
            }
          } catch (err) {
            console.error('Polling replay trace:', err);
          }

          attempts++;
          if (attempts < maxAttempts && isMountedRef.current) {
            setTimeout(pollReplay, 1500);
          } else if (isMountedRef.current) {
            setExecuting(false);
          }
        };

        setTimeout(pollReplay, 1500);
      } else {
        setTraceError({
          message: data.error?.message || 'Failed to start replay',
          code: data.error?.code,
          retryable: true
        });
        setExecuting(false);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      const apiError = err instanceof ApiError ? err : new ApiError('Network error', 0);
      setTraceError({
        message: apiError.message,
        code: apiError.code,
        retryable: true
      });
      setExecuting(false);
    }
  }, [selectedAnomaly, fetchReplayHistory]);

  const handleCloseTrace = () => {
    setSelectedAnomaly(null);
    setOriginalTree(null);
    setReplayTree(null);
    setTraceError(null);
    setActiveTab('request');
    setSessionReplayData(null);
    setSessionReplayError(null);
  };

  const getDuration = (start: string, end?: string): number => {
    if (!end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return endTime - startTime;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Causality Replay</h2>
          <p className="text-slate-500 font-medium">Re-fire anomalous requests in isolated environments to verify fixes.</p>
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
            onClick={() => { setShowHistory(true); fetchReplayHistory(); }}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            View History
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
        {/* Left: Anomalies List */}
        <div className={`${selectedAnomaly ? 'col-span-4' : 'col-span-12'} transition-all duration-500`}>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Anomalous Events</h4>
              {anomalies.length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-lg">
                  {anomalies.length} found
                </span>
              )}
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading && anomalies.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Scanning for failures...</span>
                </div>
              ) : anomalies.length === 0 && !error ? (
                <div className="p-20 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No anomalous events detected</p>
                  <p className="text-slate-300 text-xs mt-2">System is running normally</p>
                </div>
              ) : (
                anomalies.map((a) => (
                  <div
                    key={a.trace_id}
                    onClick={() => handleSelectAnomaly(a)}
                    className={`p-8 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 group relative ${
                      selectedAnomaly?.trace_id === a.trace_id ? 'bg-red-50/30 border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-red-100 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {a.start_time ? new Date(a.start_time).toLocaleTimeString() : ''}
                        </div>
                        <div className="text-xs font-bold text-red-600">Failed Request</div>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 mb-1 font-sora truncate">
                      {a.service_name || 'Unknown Service'}
                    </div>
                    <div className="text-xs font-mono text-slate-400 truncate">
                      {a.trace_id}
                    </div>
                    {selectedAnomaly?.trace_id === a.trace_id && (
                      <div className="absolute right-8 bottom-8 text-emerald-500">
                        <ChevronRight size={24} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Replay Workspace */}
        {selectedAnomaly && (
          <div className="col-span-8 animate-in slide-in-from-right-10 duration-700">
            <div className="space-y-6">
              {/* Controls */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl">
                <div className="flex gap-8">
                  <div>
                    <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Target Service</div>
                    <div className="font-bold font-sora">{selectedAnomaly.service_name || 'Unknown'}</div>
                  </div>
                  <div className="border-l border-white/10 pl-8">
                    <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Isolation Mode</div>
                    <div className="font-bold font-sora">Shadow Proxy</div>
                  </div>
                </div>
                <button
                  onClick={handleExecuteReplay}
                  disabled={executing}
                  className="px-10 py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3 disabled:opacity-70"
                >
                  {executing ? <Loader2 className="animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  {executing ? 'Executing...' : 'Execute Replay'}
                </button>
              </div>

              {traceError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 text-sm">{traceError.message}</span>
                  {traceError.retryable && (
                    <button
                      onClick={() => handleSelectAnomaly(selectedAnomaly)}
                      className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                  <button
                    onClick={() => setActiveTab('request')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      activeTab === 'request'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Activity size={14} />
                    Request Replay
                  </button>
                  <button
                    onClick={() => setActiveTab('session')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      activeTab === 'session'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Video size={14} />
                    Session Replay
                  </button>
                </div>

                {activeTab === 'request' ? (
                  <div className="grid grid-cols-2 gap-6">
                    {/* Original Trace */}
                    <div className="bg-slate-50/50 rounded-3xl border border-slate-50 p-6 h-[520px] flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600"><History size={16} /></div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Original Request Flow</span>
                      </div>
                      <div className="flex-grow relative overflow-hidden">
                        {originalTree && originalTree.length > 0 ? (
                          <TraceGraph tree={originalTree} />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-slate-400">
                              <Database className="w-10 h-10 mx-auto mb-4 opacity-30" />
                              <p className="text-sm">Loading trace tree...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Replay Trace */}
                    <div className={`bg-slate-50/50 rounded-3xl border ${replayTree ? 'border-emerald-500/30' : 'border-dashed border-slate-200'} p-6 h-[520px] flex flex-col transition-all`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 ${replayTree ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'} rounded-lg transition-all`}>
                          <RotateCcw size={16} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Replay Results</span>
                        {replayTree && (
                          <span className="ml-auto px-2 py-1 bg-emerald-100 text-emerald-600 text-[8px] font-black rounded uppercase">
                            Success
                          </span>
                        )}
                      </div>
                      <div className="flex-grow relative overflow-hidden flex items-center justify-center">
                        {executing ? (
                          <div className="flex flex-col items-center gap-4">
                            <Zap className="w-10 h-10 text-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Warming up nodes...</span>
                          </div>
                        ) : replayTree ? (
                          <TraceGraph tree={replayTree} />
                        ) : (
                          <div className="text-center p-10">
                            <Database className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                              Execute a replay to see<br />shadow results here.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[540px]">
                    {sessionReplayLoading ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p className="text-sm font-medium">Loading session replay...</p>
                      </div>
                    ) : sessionReplayError ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <AlertTriangle className="w-10 h-10 mb-4 opacity-40" />
                        <p className="text-sm font-medium">{sessionReplayError.message}</p>
                        {sessionReplayError.retryable && (
                          <button
                            onClick={() => selectedAnomaly && handleFetchSessionReplay(selectedAnomaly.trace_id)}
                            className="mt-4 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    ) : sessionReplayData ? (
                      <SessionReplayPlayer
                        events={sessionReplayData.events}
                        metadata={sessionReplayData.metadata}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Video className="w-10 h-10 mb-4 opacity-40" />
                        <p className="text-sm font-medium">No session replay available</p>
                        <p className="text-xs mt-1">Enable sessionReplay in the SDK to record user sessions.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={handleCloseTrace}
                className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Close Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replay History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900">Replay History</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No replay history yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase">Trace ID</th>
                      <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                      <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase">Duration</th>
                      <th className="text-left py-3 text-xs font-bold text-slate-400 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-4 font-mono text-sm text-slate-600">{item.traceId}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            item.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                            item.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                            item.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {item.completedAt ? `${getDuration(item.executedAt, item.completedAt)}ms` : '-'}
                        </td>
                        <td className="py-4 text-sm text-slate-400">
                          {item.executedAt ? new Date(item.executedAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Replay...</span>
        </div>
      </div>
    }>
      <ReplayPageContent />
    </Suspense>
  );
}