import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Zap,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BarChart2,
  Database,
  ArrowUpRight,
  Info,
  Save,
  Download,
  Activity
} from 'lucide-react';
import { DseStockData } from '../types';
import { getDatasetFreshness, syncLiveBdShareData, BdShareSyncStatus } from '../utils/bdshareSync';
import { saveDatabaseToStorage, exportDatabaseToFile, getLastSavedTimestamp, clearDatabaseStorage } from '../utils/databaseStorage';

interface BdShareLiveSyncBarProps {
  stocks: DseStockData[];
  onStocksUpdated: (updatedStocks: DseStockData[]) => void;
}

export const BdShareLiveSyncBar: React.FC<BdShareLiveSyncBarProps> = ({
  stocks,
  onStocksUpdated,
}) => {
  const [freshness, setFreshness] = useState<BdShareSyncStatus>(() => getDatasetFreshness(stocks));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string | null>(() => getLastSavedTimestamp());
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  
  const hasAttemptedAutoSync = useRef(false);

  // Recalculate freshness when stocks prop changes
  useEffect(() => {
    const fresh = getDatasetFreshness(stocks);
    setFreshness(fresh);
  }, [stocks]);

  // Handle Save Database Click
  const handleSaveDatabase = async () => {
    try {
      setIsSaving(true);
      const res = await saveDatabaseToStorage(stocks);
      if (res.success) {
        setLastSaved(getLastSavedTimestamp());
        setSyncNotice({
          type: 'success',
          message: res.message,
        });
      } else {
        setSyncNotice({
          type: 'error',
          message: res.message,
        });
      }
    } catch (err: any) {
      setSyncNotice({
        type: 'error',
        message: err.message || 'Failed to save database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Export/Download Database File
  const handleExportDatabase = () => {
    exportDatabaseToFile(stocks, 'dse_stock_database');
    setSyncNotice({
      type: 'success',
      message: `Downloaded dse_stock_database.json with ${stocks.length} stocks!`,
    });
  };

  const handleFactoryReset = async () => {
    if (confirm('Are you sure you want to completely reset the database to factory defaults? This will erase any downloaded missing days.')) {
      await clearDatabaseStorage();
      alert('Database wiped successfully. Reloading page to apply defaults.');
      window.location.reload();
    }
  };

  // Handle manual live sync click
  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      setSyncNotice(null);

      const result = await syncLiveBdShareData(stocks);

      if (result.success) {
        onStocksUpdated(result.updatedStocks);
        const newFresh = getDatasetFreshness(result.updatedStocks);
        setFreshness(newFresh);
        
        // Auto-save database to storage after live sync
        await saveDatabaseToStorage(result.updatedStocks);
        setLastSaved(getLastSavedTimestamp());

        setSyncNotice({
          type: 'success',
          message: result.addedCandlesCount > 0
            ? `Synced ${result.missingDates.length} missing trading days! Appended ${result.addedCandlesCount} candles up to ${newFresh.lastAvailableDate} and saved database.`
            : 'BD Share market dataset is already fully up to date and saved in database.',
        });
      }
    } catch (err: any) {
      console.error('BD Share sync error:', err);
      setSyncNotice({
        type: 'error',
        message: err.message || 'Failed to connect to BD Share live market proxy.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync on mount if enabled and dataset is not up to date
  useEffect(() => {
    if (!hasAttemptedAutoSync.current && autoSync && !freshness.isUpToDate && stocks.length > 0) {
      hasAttemptedAutoSync.current = true;
      handleSyncNow();
    }
  }, [autoSync, freshness.isUpToDate, stocks]);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
      {/* Background Subtle Grid & Glow */}
      <div className="absolute top-0 right-0 w-80 h-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section: Status & Feed Badges */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 relative">
            <Globe className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono border border-indigo-500/40 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" /> BD SHARE LIVE FEED
              </span>

              {freshness.isUpToDate ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Fully Synced (Up to {freshness.lastAvailableDate})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono border border-amber-500/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {freshness.missingDaysCount} Missing Trading Days Detected
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 font-mono flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Max Candle Date: <strong className="text-white">{freshness.lastAvailableDate}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                Active Tickers: <strong className="text-white">{stocks.length} Stocks</strong> ({freshness.totalCandlesCount} Candles)
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

        {/* Right Section: Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            <span>Auto-Sync Live Feed</span>
          </label>

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

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className={`px-4 py-2 rounded-xl font-bold font-mono text-xs shadow-lg flex items-center gap-2 transition-all ${
              isSyncing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : freshness.isUpToDate
                ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30'
                : 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-emerald-900/40'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing BD Share...' : 'Sync Live BD Share Data'}</span>
          </button>

          <button
            onClick={() => setShowDetailModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="BD Share Synchronization Details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sync Status Banner Toast */}
      {syncNotice && (
        <div
          className={`p-3 rounded-xl text-xs font-mono border flex items-center justify-between gap-2 ${
            syncNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{syncNotice.message}</span>
          </div>

          <button
            onClick={() => setSyncNotice(null)}
            className="text-slate-400 hover:text-white text-xs font-bold font-mono px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Details Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-mono">
                  BD Share Live Market Sync Pipeline
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-mono leading-relaxed">
              <p>
                The live market engine checks historical stock datasets against current Dhaka Stock Exchange (DSE) trading days. Any missing daily trading sessions between the last available candle and today are fetched and appended seamlessly.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Bangladesh Market Days:</span>
                  <span className="text-emerald-400 font-bold">Sunday to Thursday</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Weekend Days (Excluded):</span>
                  <span className="text-amber-400 font-bold">Friday & Saturday</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-400">Historical Last Candle:</span>
                  <span className="text-white font-bold">{freshness.lastAvailableDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Missing Days to Sync:</span>
                  <span className="text-indigo-300 font-bold">{freshness.missingDaysCount} Trading Sessions</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
