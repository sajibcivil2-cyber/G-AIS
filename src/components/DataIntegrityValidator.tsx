import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
  X,
  RefreshCw,
  AlertOctagon,
  Loader2,
  Check
} from 'lucide-react';
import { DseStockData } from '../types';
import {
  validateStockDataIntegrity,
  PriceAnomalyRecord,
  DSE_OFFICIAL_BENCHMARK_PRICES
} from '../utils/dseBacktestEngine';

export interface DataIntegrityValidatorProps {
  stocks: DseStockData[];
  onAutoFixAnomalies?: (correctedStocks: DseStockData[]) => void;
  thresholdPct?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  details?: string;
  timestamp: string;
}

export const DataIntegrityValidator: React.FC<DataIntegrityValidatorProps> = ({
  stocks,
  onAutoFixAnomalies,
  thresholdPct = 2.0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Array<{ timestamp: string; totalChecked: number; anomaliesCount: number; message: string }>>([]);
  
  // Auto-resolve states
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingSymbol, setResolvingSymbol] = useState<string | null>(null);
  const [simulateFailureMode, setSimulateFailureMode] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const validationResult = useMemo(() => {
    return validateStockDataIntegrity(stocks, thresholdPct);
  }, [stocks, thresholdPct]);

  // Toast auto-dismiss effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (validationResult.anomaliesFound > 0) {
      const newEntry = {
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        totalChecked: validationResult.totalChecked,
        anomaliesCount: validationResult.anomaliesFound,
        message: `Detected ${validationResult.anomaliesFound} stock price anomaly(ies) exceeding >${thresholdPct}% variance threshold against DSE official feed.`,
      };
      setAuditLogs((prev) => [newEntry, ...prev.slice(0, 19)]);
    }
  }, [validationResult.anomaliesFound, validationResult.checkedAt, thresholdPct, validationResult.totalChecked]);

  // Core API Re-fetch & Auto-Resolve Logic
  const handleAutoResolve = async (symbolsToResolve?: string[]) => {
    const targetSymbols = symbolsToResolve && symbolsToResolve.length > 0
      ? symbolsToResolve
      : validationResult.anomalies.map((a) => a.symbol);

    if (targetSymbols.length === 0) return;

    setIsResolving(true);
    if (targetSymbols.length === 1) {
      setResolvingSymbol(targetSymbols[0]);
    } else {
      setResolvingSymbol(null);
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      // Call simulated DSE API endpoint
      const response = await fetch('/api/dse/refetch-ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: targetSymbols,
          forceFailure: simulateFailureMode,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || `Server responded with status ${response.status}`);
      }

      // Re-fetch succeeded! Apply updated ticker data to stock pool
      const refetchedMap: Record<string, number> = {};
      Object.entries(resData.data || {}).forEach(([sym, item]: [string, any]) => {
        refetchedMap[sym.toUpperCase()] = item.close;
      });

      const updatedStocks = stocks.map((s) => {
        const targetPrice = refetchedMap[s.symbol.toUpperCase()];
        if (targetPrice !== undefined && s.candles && s.candles.length > 0) {
          const updatedCandles = [...s.candles];
          const lastIdx = updatedCandles.length - 1;
          const oldCandle = updatedCandles[lastIdx];
          const open = oldCandle.open === 0 ? targetPrice : oldCandle.open;
          const high = Math.max(oldCandle.high, targetPrice, open);
          const low = Math.min(oldCandle.low, targetPrice, open);

          updatedCandles[lastIdx] = {
            ...oldCandle,
            open,
            high,
            low,
            close: targetPrice,
          };

          return { ...s, candles: updatedCandles };
        }
        return s;
      });

      if (onAutoFixAnomalies) {
        onAutoFixAnomalies(updatedStocks);
      }

      // Show Success Toast
      const symbolNames = targetSymbols.join(', ');
      setToast({
        id: `toast-${Date.now()}`,
        type: 'success',
        title: 'Auto-Resolve Succeeded',
        message: `Re-fetched & synchronized ticker data for ${targetSymbols.length} stock(s): ${symbolNames}`,
        details: `Prices updated from DSE Live API feed at ${nowStr}`,
        timestamp: nowStr,
      });

      // Add to audit logs
      setAuditLogs((prev) => [
        {
          timestamp: nowStr,
          totalChecked: stocks.length,
          anomaliesCount: Math.max(0, validationResult.anomaliesFound - targetSymbols.length),
          message: `[Auto-Resolve Success] Re-fetched API data for ${targetSymbols.length} ticker(s) (${symbolNames}). Discrepancy eliminated.`,
        },
        ...prev.slice(0, 19),
      ]);

    } catch (err: any) {
      const errorMsg = err.message || 'Network error while reaching simulated DSE ticker feed';
      
      // Show Failure Toast
      setToast({
        id: `toast-${Date.now()}`,
        type: 'error',
        title: 'Auto-Resolve Failed',
        message: `Failed to re-fetch ticker data from simulated DSE API`,
        details: errorMsg,
        timestamp: nowStr,
      });

      // Add to audit logs
      setAuditLogs((prev) => [
        {
          timestamp: nowStr,
          totalChecked: stocks.length,
          anomaliesCount: validationResult.anomaliesFound,
          message: `[Auto-Resolve Failed] API error while fetching ${targetSymbols.length} ticker(s): ${errorMsg}`,
        },
        ...prev.slice(0, 19),
      ]);
    } finally {
      setIsResolving(false);
      setResolvingSymbol(null);
    }
  };

  // Quick fallback fix using baseline
  const handleFixSingleBaseline = (symbol: string) => {
    handleAutoResolve([symbol]);
  };

  if (validationResult.anomaliesFound === 0) {
    return (
      <div className="relative">
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-slate-300 shadow">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">DSE Data Integrity Verified:</strong> {validationResult.totalChecked} stock tickers benchmarked against official DSE web feed. Zero price anomalies (&gt;{thresholdPct}%) detected.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Sync: {validationResult.checkedAt}</span>
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-slideInRight">
            <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 text-xs ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200 shadow-emerald-900/20'
                : 'bg-slate-900/95 border-rose-500/50 text-rose-200 shadow-rose-900/20'
            }`}>
              {toast.type === 'success' ? (
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                  <AlertOctagon className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between font-bold text-white text-sm">
                  <span>{toast.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
                </div>
                <p className="text-slate-300">{toast.message}</p>
                {toast.details && <p className="text-[11px] text-slate-400 font-mono mt-1">{toast.details}</p>}
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 shadow-lg transition-all animate-fadeIn my-3 relative">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-200">
                Data Integrity Warning: {validationResult.anomaliesFound} Stock Price Anomaly(ies) Detected
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                &gt;{thresholdPct}% Variance
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              App stock prices deviate from live DSE website baseline prices. Click Auto-Resolve to re-fetch ticker data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Simulation Toggle for Testing Failure Toast */}
          <button
            onClick={() => setSimulateFailureMode(!simulateFailureMode)}
            title="Toggle API failure simulation to test error toast handling"
            className={`px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
              simulateFailureMode
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 font-bold'
                : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {simulateFailureMode ? 'Simulate API Failure: ON' : 'API Mode: Normal'}
          </button>

          {/* Primary Auto-Resolve Button */}
          <button
            onClick={() => handleAutoResolve()}
            disabled={isResolving}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 border border-indigo-400/30 cursor-pointer"
          >
            {isResolving && !resolvingSymbol ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-200" />
            )}
            <span>Auto-Resolve All ({validationResult.anomaliesFound})</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
          >
            <span>{isExpanded ? 'Hide' : 'Details'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Breakdown Table */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3">Symbol</th>
                  <th className="py-2 px-3">App Price</th>
                  <th className="py-2 px-3">DSE Website Price</th>
                  <th className="py-2 px-3">Variance</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3 text-right">Auto-Resolve Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {validationResult.anomalies.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {item.symbol}
                      <span className="block text-[10px] font-normal text-slate-400">{item.name}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-rose-300">
                      ৳{item.appClose.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-300">
                      ৳{item.benchmarkClose.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          Math.abs(item.variancePct) > 5.0
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.variancePct > 0 ? '+' : ''}{item.variancePct.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleFixSingleBaseline(item.symbol)}
                        disabled={isResolving}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold transition-all shadow flex items-center gap-1 justify-end ml-auto cursor-pointer"
                      >
                        {isResolving && resolvingSymbol === item.symbol ? (
                          <Loader2 className="w-3 h-3 animate-spin text-white" />
                        ) : (
                          <RefreshCw className="w-3 h-3 text-indigo-200" />
                        )}
                        <span>Resolve</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Simulated DSE API Ticker Feed endpoint active.
            </span>
            <button
              onClick={() => setShowLogModal(true)}
              className="text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              View Anomaly Audit Logs ({auditLogs.length})
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Price Anomaly Audit Log</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 font-mono text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-slate-500 italic text-center py-6">No historical anomaly events recorded.</p>
              ) : (
                auditLogs.map((log, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-amber-400 font-bold">{log.timestamp}</span>
                      <span>Checked: {log.totalChecked} tickers</span>
                    </div>
                    <p className="text-slate-200">{log.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-slideInRight">
          <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 text-xs ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200 shadow-emerald-900/30'
              : 'bg-slate-900/95 border-rose-500/50 text-rose-200 shadow-rose-900/30'
          }`}>
            {toast.type === 'success' ? (
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertOctagon className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between font-bold text-white text-sm">
                <span>{toast.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-slate-300">{toast.message}</p>
              {toast.details && <p className="text-[11px] text-slate-400 font-mono mt-1">{toast.details}</p>}
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
