import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Save,
  Download,
  Activity,
} from 'lucide-react';
import { DseStockData } from '../types';
import { getDatasetFreshness, BdShareSyncStatus } from '../utils/bdshareSync';
import { saveDatabaseToStorage, exportDatabaseToFile, getLastSavedTimestamp, clearDatabaseStorage } from '../utils/databaseStorage';

interface DatabaseStatusBarProps {
  stocks: DseStockData[];
  isDatabaseLoaded: boolean;
  onResetDatabase?: () => void;
}

// Shows how stale the loaded dataset is and provides local database controls (save/export/
// reset). This deliberately does NOT offer to "sync" or "fill" missing days — there is no
// real live data source for this app to pull from (dsebd.org's robots.txt disallows
// automated access, and even its live pages only expose today's snapshot, not historical
// data), so any auto-generated candle would be a guess presented as real. Guessed data is
// worse than no data for a tool whose entire purpose is price analysis: it silently
// contaminates the backtester and the screener's historical edge stats with numbers that
// never actually traded. If your data is behind, re-upload a fresh historical file instead.
export const DatabaseStatusBar: React.FC<DatabaseStatusBarProps> = ({
  stocks,
  isDatabaseLoaded,
  onResetDatabase,
}) => {
  const [freshness, setFreshness] = useState<BdShareSyncStatus>(() => getDatasetFreshness(stocks));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(() => getLastSavedTimestamp());
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setFreshness(getDatasetFreshness(stocks));
  }, [stocks]);

  const handleSaveDatabase = async () => {
    try {
      setIsSaving(true);
      const res = await saveDatabaseToStorage(stocks);
      setNotice({ type: res.success ? 'success' : 'error', message: res.message });
      if (res.success) setLastSaved(getLastSavedTimestamp());
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to save database.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDatabase = () => {
    exportDatabaseToFile(stocks, 'dse_stock_database');
    setNotice({ type: 'success', message: `Downloaded dse_stock_database.json with ${stocks.length} stocks.` });
  };

  const handleFactoryReset = async () => {
    if (confirm('Are you sure you want to completely reset the database to factory defaults? This will erase your saved dataset.')) {
      try {
        setIsSaving(true);
        await clearDatabaseStorage();
        setLastSaved(null);
        setNotice({ type: 'success', message: 'Database wiped successfully. Resetting to factory defaults...' });
        if (onResetDatabase) {
          onResetDatabase();
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      } catch (err: any) {
        setNotice({ type: 'error', message: err.message || 'Failed to reset database.' });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!isDatabaseLoaded) return null;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Freshness status (informational only — no fake-fill option) */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {freshness.isUpToDate ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Data up to {freshness.lastAvailableDate}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono border border-amber-500/40 flex items-center gap-1" title="This app does not generate placeholder price data. Re-upload a fresh historical file to close the gap.">
                  <Clock className="w-3 h-3" /> {freshness.missingDaysCount} trading day(s) behind — re-upload fresh data
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 font-mono flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Last Candle: <strong className="text-white">{freshness.lastAvailableDate}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                {stocks.length} Stocks ({freshness.totalCandlesCount} Candles)
              </span>
              {lastSaved && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <Save className="w-3 h-3 text-emerald-400" /> DB Saved: {lastSaved}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Local database controls only — no sync/fill */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleSaveDatabase}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all border border-emerald-400/40"
            title="Save current stock database to local browser storage"
          >
            <Save className={`w-4 h-4 text-emerald-200 ${isSaving ? 'animate-bounce' : ''}`} />
            <span>{isSaving ? 'Saving DB...' : 'Save Database'}</span>
          </button>

          <button
            onClick={handleExportDatabase}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold font-mono text-xs shadow-lg flex items-center gap-1.5 transition-all border border-sky-500/30"
            title="Download database backup JSON file"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export DB</span>
          </button>

          <button
            onClick={handleFactoryReset}
            className="px-3.5 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/60 text-red-300 hover:text-white font-bold font-mono text-xs shadow-lg flex items-center gap-1.5 transition-all border border-red-500/30"
            title="Reset database to factory defaults"
          >
            <Activity className="w-4 h-4 text-red-400" />
            <span>Reset DB</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl text-xs font-mono border flex items-center justify-between gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white text-xs font-bold font-mono px-1.5">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
