"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Filter, Download, FileText, Loader2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { queryFetch, ApiError } from '@/lib/apiClient';

interface LogEntry {
  timestamp: string;
  service_name: string;
  event_name: string;
  payload: string | Record<string, unknown>;
  trace_id?: string;
  span_id?: string;
}

interface ErrorState {
  message: string;
  code?: string;
  retryable: boolean;
}

const SERVICE_OPTIONS = [
  { value: '', label: 'All Services' },
  { value: 'api-gateway', label: 'API Gateway' },
  { value: 'auth-service', label: 'Auth Service' },
  { value: 'log-service', label: 'Log Service' },
  { value: 'query-service', label: 'Query Service' },
  { value: 'alert-service', label: 'Alert Service' },
];

function LogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [service, setService] = useState(searchParams.get('service') || '');
  const [hasSearched, setHasSearched] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground && !hasSearched) {
      setLoading(true);
    } else if (isBackground) {
      setRefreshing(true);
    }

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (service) params.append('service', service);

      const data = await queryFetch(`/api/v1/logs?${params.toString()}`, { retries: 2 });

      if (!isMountedRef.current) return;

      if (data.success) {
        setLogs(data.data || []);
        setError(null);
        setHasSearched(true);
      } else {
        setError({
          message: data.error?.message || 'Failed to load logs',
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
  }, [search, service, hasSearched]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchLogs(false);

    intervalRef.current = setInterval(() => {
      if (!loading && hasSearched) {
        fetchLogs(true);
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchLogs, loading, hasSearched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(false);
    if (search || service) {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (service) params.set('service', service);
      router.push(`/logs?${params.toString()}`, { scroll: false });
    } else {
      router.push('/logs', { scroll: false });
    }
    fetchLogs(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setService('');
    setHasSearched(false);
    router.push('/logs', { scroll: false });
    fetchLogs(false);
  };

  const handleExport = () => {
    if (logs.length === 0) return;

    const exportData = logs.map(log => ({
      ...log,
      payload: typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload)
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `galecto-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    setError(null);
    fetchLogs(false);
  };

  const formatPayload = (payload: string | Record<string, unknown> | null | undefined): string => {
    if (!payload) return '';
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return payload;
      }
    }
    return JSON.stringify(payload, null, 2);
  };

  const renderPayload = (payload: string | Record<string, unknown> | null | undefined): React.ReactNode => {
    if (!payload) return <span className="text-slate-300">-</span>;

    const formatted = formatPayload(payload);
    const isMultiline = formatted.includes('\n');

    return (
      <div className="text-[11px] font-mono text-emerald-600 bg-emerald-50/50 p-2 rounded-lg max-w-md">
        <pre className={`whitespace-pre-wrap ${isMultiline ? 'max-h-20 overflow-y-auto' : 'truncate'}`}>
          {formatted}
        </pre>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black font-sora tracking-tight">Logs Explorer</h2>
          <p className="text-slate-500 font-medium">Deep-search across millions of structured events.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export JSON {logs.length > 0 && `(${logs.length})`}
          </button>
          <button
            onClick={() => { setRefreshing(true); fetchLogs(true); }}
            disabled={refreshing || loading}
            className="btn-secondary !py-2.5 !px-5 !rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
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

      {/* Filters Bar */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-10">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-grow relative min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by message, trace ID, or payload content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-sm"
            />
          </div>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
          >
            {SERVICE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary !py-3 !px-8">
            Search
          </button>
          {(search || service) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </form>

      {/* Logs Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
              <th className="px-8 py-5 w-48">Timestamp</th>
              <th className="px-8 py-5 w-48">Service</th>
              <th className="px-8 py-5">Event Signature</th>
              <th className="px-8 py-5">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Scanning ClickHouse clusters...
                    </span>
                  </div>
                </td>
              </tr>
            ) : !loading && logs.length === 0 && hasSearched ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">No records matching your filters found.</p>
                    <p className="text-xs mt-2 text-slate-300">Try adjusting your search terms or filters</p>
                  </div>
                </td>
              </tr>
            ) : !hasSearched && !loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">Enter search criteria to query logs</p>
                    <p className="text-xs mt-2 text-slate-300">Filter by service, search by message content</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6 text-xs font-mono text-slate-400">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-md">
                      {log.service_name || 'unknown'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-black font-sora text-slate-900">
                    {log.event_name || '-'}
                  </td>
                  <td className="px-8 py-6">
                    {renderPayload(log.payload)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {logs.length > 0 && (
          <div className="p-4 bg-slate-50/30 flex justify-between items-center border-t border-slate-50">
            <span className="text-xs text-slate-400 font-medium">
              Showing {logs.length} log entries
            </span>
            <button
              onClick={() => { setRefreshing(true); fetchLogs(true); }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Refresh Stream
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function LogsPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black font-sora tracking-tight">Logs Explorer</h2>
            <p className="text-slate-500 font-medium">Deep-search across millions of structured events.</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </DashboardLayout>
    }>
      <LogsContent />
    </Suspense>
  );
}