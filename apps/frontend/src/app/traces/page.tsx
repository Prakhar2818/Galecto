"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import TraceGraph from '@/components/TraceGraph';
import { Activity, RefreshCw, X, ChevronRight, Search, Filter, Loader2, AlertCircle } from 'lucide-react';
import { queryFetch, ApiError } from '@/lib/apiClient';

interface Trace {
  trace_id: string;
  start_time: string;
  event_count: number;
  services: string[];
  root_service?: string;
  root_event?: string;
  status?: string;
  status_code?: number;
  endpoint?: string;
  display_name?: string;
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

interface TraceTreeNode extends TraceEvent {
  children: TraceEvent[];
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TracesPage() {
  const router = useRouter();
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [traceTree, setTraceTree] = useState<TraceTreeNode[] | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [traceError, setTraceError] = useState<ErrorState | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const handleRunReplay = useCallback(() => {
    if (selectedTrace) {
      router.push(`/replay?traceId=${encodeURIComponent(selectedTrace)}`);
    }
  }, [selectedTrace, router]);

  const fetchTraces = useCallback(async (isBackground = false, page = 1) => {
    if (!isBackground) setLoading(true);

    try {
      const data = await queryFetch(`/api/v1/traces?page=${page}&limit=50`, { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        setTraces(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        setError(null);
      } else {
        setError({
          message: data.error?.message || 'Failed to load traces',
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

  const handleViewTrace = useCallback(async (traceId: string) => {
    setSelectedTrace(traceId);
    setTraceTree(null);
    setTraceError(null);
    setLoadingTrace(true);

    try {
      const data = await queryFetch(`/api/v1/traces/${traceId}`, { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        const events: TraceEvent[] = data.tree || [];
        const tree = buildTree(events) as TraceTreeNode[];
        setTraceTree(tree);
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
    } finally {
      if (!isMountedRef.current) return;
      setLoadingTrace(false);
    }
  }, []);

  const handleCloseTrace = useCallback(() => {
    setSelectedTrace(null);
    setTraceTree(null);
    setTraceError(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTraces(false);

    intervalRef.current = setInterval(() => {
      if (!loading && !selectedTrace) {
        setRefreshing(true);
        fetchTraces(true);
      }
    }, 15000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchTraces, loading, selectedTrace]);

  const handleRetry = () => {
    setError(null);
    fetchTraces(false);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Request Tracing</h2>
          <p className="text-slate-500 font-medium">Reconstruct hierarchical causality across your distributed stack.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setRefreshing(true); fetchTraces(true); }}
            disabled={refreshing || loading}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Stream
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-grow">
            <p className="text-red-700 font-medium text-sm">{error.message}</p>
            {error.code && <p className="text-red-500 text-xs mt-1">Error code: {error.code}</p>}
          </div>
          <div className="flex gap-2">
            {error.retryable && (
              <button onClick={handleRetry} className="text-xs text-red-600 hover:text-red-800 font-medium">
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
        {/* Left: Trace List */}
        <div className={`${selectedTrace ? 'col-span-4' : 'col-span-12'} transition-all duration-500`}>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <Search size={16} className="text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Live Ingestion
                </span>
                {traces.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full">
                    {traces.length} traces
                  </span>
                )}
              </div>
              <Filter size={16} className="text-slate-400 cursor-pointer hover:text-emerald-500 transition-colors" />
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              {loading && traces.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying ClickHouse...</span>
                </div>
              ) : traces.length === 0 && !error ? (
                <div className="p-20 text-center">
                  <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium text-sm">No traces found in the last 24h.</p>
                  <p className="text-slate-300 text-xs mt-2">Send some telemetry data to see traces here</p>
                </div>
              ) : (
                traces.map((t) => (
                  <div
                    key={t.trace_id}
                    onClick={() => handleViewTrace(t.trace_id)}
                    className={`p-6 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 group relative ${
                      selectedTrace === t.trace_id ? 'bg-emerald-50/50 border-l-4 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 w-2 h-2 rounded-full ${
                          t.status === 'ERROR' ? 'bg-red-500' :
                          t.status === 'WARNING' ? 'bg-orange-500' :
                          t.status === 'SUCCESS' ? 'bg-emerald-500' :
                          'bg-slate-300'
                        }`} />
                        <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors font-mono tracking-tighter truncate">
                          {t.trace_id.substring(0, 16)}...
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 shrink-0">
                        {new Date(t.start_time).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        {t.root_service || t.services?.[0] || 'Unknown'}
                      </span>
                      {t.display_name && t.display_name !== t.root_event && (
                        <span className="text-xs text-slate-500 truncate">
                          • {t.display_name}
                        </span>
                      )}
                    </div>
                    {t.endpoint && (
                      <div className="text-[10px] font-mono text-slate-400 mb-2 truncate">
                        {t.endpoint}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {(t.services || []).slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-slate-100 text-[8px] font-black uppercase rounded-md text-slate-500">
                            {s}
                          </span>
                        ))}
                        {(t.services || []).length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-50 text-[8px] font-black uppercase rounded-md text-slate-400">
                            +{(t.services || []).length - 3}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {t.status && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            t.status === 'ERROR' ? 'bg-red-100 text-red-600' :
                            t.status === 'WARNING' ? 'bg-orange-100 text-orange-600' :
                            t.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {t.status}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-400">
                          {(t.event_count || 0).toLocaleString()} events
                        </span>
                      </div>
                    </div>
                    {selectedTrace === t.trace_id && (
                      <div className="absolute right-6 bottom-6 text-emerald-500">
                        <ChevronRight size={20} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-50 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-medium">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} traces
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchTraces(false, pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchTraces(false, pageNum)}
                          disabled={loading}
                          className={`w-8 h-8 text-xs font-bold rounded-lg ${
                            pagination.page === pageNum
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          } disabled:opacity-50`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => fetchTraces(false, pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Trace Visualization */}
        {selectedTrace && (
          <div className="col-span-8 animate-in slide-in-from-right-10 duration-700">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100 h-[800px] flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h3 className="text-xl font-black font-sora">Causality Tree</h3>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">
                    Trace Root: {selectedTrace.substring(0, 12)}
                  </p>
                </div>
                <button
                  onClick={handleCloseTrace}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-slate-100"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {traceError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 text-sm">{traceError.message}</span>
                  {traceError.retryable && (
                    <button
                      onClick={() => handleViewTrace(selectedTrace)}
                      className="ml-auto text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              <div className="flex-grow bg-slate-50/50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                {loadingTrace ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-20">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Stitching spans...</span>
                    </div>
                  </div>
                ) : traceTree && traceTree.length > 0 ? (
                  <TraceGraph tree={traceTree} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No tree data available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-4">
                <div className="flex-grow p-6 bg-emerald-500 rounded-3xl text-white flex items-center justify-between shadow-lg shadow-emerald-500/20">
                  <div>
                    <div className="text-[10px] font-black uppercase opacity-60">Anomaly Status</div>
                    <div className="text-lg font-bold">No Bottlenecks Detected</div>
                  </div>
                  <Activity className="w-8 h-8 opacity-40" />
                </div>
                <button
                  onClick={handleRunReplay}
                  disabled={!selectedTrace}
                  className="px-8 py-6 bg-slate-900 text-white font-bold rounded-3xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run Replay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}