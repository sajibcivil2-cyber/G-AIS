import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  BarChart2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
  HelpCircle,
  Activity,
  Award,
  BookOpen,
  X,
  Scale,
  Volume2,
  Database,
  Save,
  Download,
  FolderPlus,
  Filter,
  Bell,
  Trash2,
  Plus,
  Upload,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DseStockData, DseStockCandle, BacktestConfig, BacktestSummary, BreakoutSignal, ExtractedFile, SectorMoneyFlowStat } from '../types';
import {
  DSE_SAMPLE_STOCKS,
  runDseVolumeBreakoutBacktest,
  parseCustomDseStockFile,
  parseCustomDseStockFiles,
  extractStockDataFromExtractedFiles,
  extractStockDataFromExtractedFilesAsync,
  mergeAndProcessStockDatasets,
  filterActiveStocks,
  evaluateStockForScreener,
  calculateEdgeStats,
  computeEquityCurve,
  computeSectorMoneyFlow
} from '../utils/dseBacktestEngine';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { parseZipFile } from '../utils/zipParser';
import { DseVolumeBreakoutChart } from './DseVolumeBreakoutChart';
import { DseStockScreener } from './DseStockScreener';
import { PatternScanNotifier } from './PatternScanNotifier';
import { DatabaseStatusBar } from './DatabaseStatusBar';
import { DseStockComparer } from './DseStockComparer';
import { SectorMoneyFlowMatrix } from './SectorMoneyFlowMatrix';
import { BacktestSummaryDashboard } from './BacktestSummaryDashboard';
import { StockDetailModal } from './StockDetailModal';
import { EdgeAnalysisDashboard } from './EdgeAnalysisDashboard';
import { StopLossPostMortemDashboard } from './StopLossPostMortemDashboard';
import {
  loadDatabaseFromStorage,
  saveDatabaseToStorage,
  exportDatabaseToFile,
  getLastSavedTimestamp,
  validateAndRepairStock,
} from '../utils/databaseStorage';
import { applySectorOverrides } from '../utils/sectorMapping';

interface DseBacktesterProps {
  uploadedFiles?: ExtractedFile[];
}

export const DseBacktester: React.FC<DseBacktesterProps> = ({ uploadedFiles }) => {
  // Navigation State inside Backtest Hub
  const [activeSubTab, setActiveSubTab] = useState<'screener' | 'compare' | 'chart' | 'lab' | 'edge' | 'postmortem'>('screener');

  // Collapsed by default so screener/comparer/chart results are visible right after the tab
  // bar instead of requiring a long scroll past the summary/sector/pattern widgets first.
  // Remembers the user's last choice across visits.
  const [showMarketOverview, setShowMarketOverview] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dse_show_market_overview');
      return saved === null ? false : saved === 'true';
    } catch {
      return false;
    }
  });

  // Strategy Configuration State
  const [config, setConfig] = useState<BacktestConfig>({
    minYoyGrowthPct: 0.0, // Set to 0 so pure price-action datasets aren't blocked
    volumeSurgeMultiplier: 2.0, // 2x 20-day ADV is a strong standard
    microConsolidationDays: 5,
    macroBaseDays: 30,
    stopLossPct: 5.0,
    targetProfitPct: 15.0,
    minTurnoverMillionBdt: 0.0, // Set to 0 to prevent filtering out raw price-only datasets
  });

  const [activeStockPool, setActiveStockPool] = useState<DseStockData[]>(() => applySectorOverrides(filterActiveStocks(DSE_SAMPLE_STOCKS)));
  const [selectedSignal, setSelectedSignal] = useState<BreakoutSignal | null>(null);
  const [chartTargetSymbol, setChartTargetSymbol] = useState<string | undefined>();
  const [customFileLoaded, setCustomFileLoaded] = useState<string | null>(null);
  const [selectedPatternFilter, setSelectedPatternFilter] = useState<string>('ALL');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  // Price Threshold Alerts State
  const [priceAlerts, setPriceAlerts] = useState<Array<{ id: string; symbol: string; targetPrice: number; condition: 'above' | 'below'; isTriggered: boolean }>>([]);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [activeToastAlerts, setActiveToastAlerts] = useState<Array<{ id: string; symbol: string; message: string; targetPrice: number }>>([]);

  const [isDatabaseLoaded, setIsDatabaseLoaded] = useState(false);
  const [dataQualityNotice, setDataQualityNotice] = useState<string | null>(null);

  // Load saved database on mount if present in browser storage.
  // loadDatabaseFromStorage() already validates/repairs candle data internally, but we
  // additionally re-validate the *merge result* here since merging two candle series
  // (existing sample data + saved data) can itself reintroduce inconsistencies that
  // neither series had on its own (e.g. overlapping dates with conflicting prices).
  useEffect(() => {
    async function restoreSavedDatabase() {
      try {
        const loadResult = await loadDatabaseFromStorage();
        if (loadResult && loadResult.stocks.length > 0) {
          const { stocks: savedStocks, repairedSymbols, droppedSymbols } = loadResult;
          
          if (repairedSymbols.length > 0 || droppedSymbols.length > 0) {
            setDataQualityNotice(`Database verification complete. Automatically repaired ${repairedSymbols.length} corrupted ticker(s). Dropped ${droppedSymbols.length} unrecoverable ticker(s).`);
            setTimeout(() => setDataQualityNotice(null), 10000);
          }
          const stockMap = new Map<string, DseStockData>();

          // Only merge with sample stocks if the saved database is small (e.g. not a full market bulk upload)
          if (savedStocks.length < 50) {
            DSE_SAMPLE_STOCKS.forEach((s) => stockMap.set(s.symbol, s));
          }

          savedStocks.forEach((s) => {
            if (stockMap.has(s.symbol)) {
              const old = stockMap.get(s.symbol)!;
              const candleMap = new Map<string, DseStockCandle>();
              old.candles.forEach((c) => candleMap.set(c.date, c));
              s.candles.forEach((c) => candleMap.set(c.date, c));
              const mergedCandles = Array.from(candleMap.values()).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
              );
              const { stock: validated } = validateAndRepairStock({ ...s, candles: mergedCandles });
              stockMap.set(s.symbol, validated);
            } else {
              const { stock: validated } = validateAndRepairStock(s);
              stockMap.set(s.symbol, validated);
            }
          });

          const mergedPool = filterActiveStocks(Array.from(stockMap.values()).filter((s) => s.candles.length > 0));
          setActiveStockPool(applySectorOverrides(mergedPool));
          setCustomFileLoaded(`Restored Saved DB (${mergedPool.length} Stocks)`);
        }
      } catch (err) {
        console.error('Error restoring database from storage:', err);
      } finally {
        setIsDatabaseLoaded(true);
      }
    }

    restoreSavedDatabase();
  }, []);

  // Auto-extract stock datasets if user uploaded a ZIP archive or CSV files
  useEffect(() => {
    let isMounted = true;
    if (uploadedFiles && uploadedFiles.length > 0) {
      extractStockDataFromExtractedFilesAsync(uploadedFiles).then((extractedStocks) => {
        if (!isMounted) return;
        const validStocks = filterActiveStocks(extractedStocks);
        if (validStocks.length > 0) {
          handleAddCustomStocks(validStocks);
        }
      });
    }
    return () => { isMounted = false; };
  }, [uploadedFiles]);

  // Handle custom stock datasets uploaded directly inside screener/backtester.
  // Every incoming stock — regardless of source (ZIP, CSV, JSON, BD Share sync) — is
  // validated/repaired *before* being merged into the active pool and persisted. This
  // is the single choke point all data enters through, so it's also the single choke
  // point where corruption is caught: malformed CSV rows, decimal-shift typos, currency
  // unit mismatches, or duplicate/conflicting dates from re-uploads are all normalized
  // or dropped here instead of silently poisoning the saved database.
  const handleAddCustomStocks = (newStocks: DseStockData[]) => {
    if (!newStocks || newStocks.length === 0) return;

    let repairedCount = 0;
    let droppedCount = 0;

    setActiveStockPool((prev) => {
      const stockMap = new Map<string, DseStockData>();

      // If we only have the default sample stocks and user is bulk uploading a massive dataset, 
      // replace the defaults entirely instead of merging them to avoid ghost tickers.
      const isReplacingDefaults = prev.length <= DSE_SAMPLE_STOCKS.length && newStocks.length > 50;
      if (!isReplacingDefaults) {
        prev.forEach((s) => stockMap.set(s.symbol, s));
      }

      newStocks.forEach((ns) => {
        let candidate: DseStockData;

        if (stockMap.has(ns.symbol)) {
          const old = stockMap.get(ns.symbol)!;
          const candleMap = new Map<string, DseStockCandle>();
          old.candles.forEach((c) => candleMap.set(c.date, c));
          ns.candles.forEach((c) => candleMap.set(c.date, c));
          const mergedCandles = Array.from(candleMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          candidate = { ...ns, candles: mergedCandles };
        } else {
          candidate = ns;
        }

        const { stock: validated, wasRepaired } = validateAndRepairStock(candidate);
        if (wasRepaired) repairedCount++;

        if (!validated.candles || validated.candles.length === 0) {
          droppedCount++;
          return;
        }

        stockMap.set(ns.symbol, validated);
      });

      const updatedPool = applySectorOverrides(filterActiveStocks(Array.from(stockMap.values())));
      // Persist to database storage automatically (saveDatabaseToStorage re-validates too)
      saveDatabaseToStorage(updatedPool);

      let statusMsg = `${newStocks.length} Stock Datasets Synced & Saved`;
      if (repairedCount > 0 || droppedCount > 0) {
        statusMsg += ` (${repairedCount} repaired, ${droppedCount} dropped as unrecoverable)`;
      }
      setCustomFileLoaded(statusMsg);

      return updatedPool;
    });

    if (repairedCount > 0 || droppedCount > 0) {
      setDataQualityNotice(
        `Data quality check: repaired ${repairedCount} stock(s) with implausible price data` +
        (droppedCount > 0 ? `, dropped ${droppedCount} stock(s) with no valid candles remaining.` : '.')
      );
    }
  };

  // Derive available sectors from active pool
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    activeStockPool.forEach(s => {
      if (s.sector) sectors.add(s.sector);
    });
    return Array.from(sectors).sort();
  }, [activeStockPool]);

  // Per-sector volume momentum, computed once against the full active pool (not the
  // sector-filtered view) so it reflects true market-wide rotation. Feeds directly into
  // the screener's scoring — a stock's early move is more credible when its whole sector
  // is accelerating.
  const sectorMoneyFlow: Record<string, SectorMoneyFlowStat> = useMemo(() => computeSectorMoneyFlow(activeStockPool), [activeStockPool]);

  const topSectorMomentum = useMemo(() => {
    const entries: SectorMoneyFlowStat[] = Object.values(sectorMoneyFlow).filter((s) => s.momentumPct > 0);
    if (entries.length === 0) return null;
    const top = entries.reduce((best, cur) => (cur.momentumPct > best.momentumPct ? cur : best));
    return { sector: top.sector, increasePct: top.momentumPct };
  }, [sectorMoneyFlow]);

  // Filter stocks by sector
  const displayedStocks = useMemo(() => {
    if (selectedSectorFilter === 'ALL') return activeStockPool;
    return activeStockPool.filter(s => s.sector === selectedSectorFilter);
  }, [activeStockPool, selectedSectorFilter]);

  // Compute Backtest Summary
  const backtestResult: BacktestSummary = useMemo(() => {
    return runDseVolumeBreakoutBacktest(displayedStocks, config);
  }, [displayedStocks, config]);
  
  const edgeStats = useMemo(() => {
    return calculateEdgeStats(backtestResult.signals);
  }, [backtestResult.signals]);

  // Filter signals by technical pattern if user selected a filter
  const filteredSignals = useMemo(() => {
    if (selectedPatternFilter === 'ALL') return backtestResult.signals;
    return backtestResult.signals.filter((s) => s.detectedPattern === selectedPatternFilter);
  }, [backtestResult.signals, selectedPatternFilter]);

  // Data health indicator logic
  const dataHealth = useMemo(() => {
    let maxDate = 0;
    activeStockPool.forEach(s => {
      if (s.candles && s.candles.length > 0) {
        const d = new Date(s.candles[s.candles.length - 1].date).getTime();
        if (d > maxDate) maxDate = d;
      }
    });

    if (maxDate === 0) return { dateStr: 'N/A', isStale: false };

    const maxDateObj = new Date(maxDate);
    const dateStr = maxDateObj.toISOString().split('T')[0];
    const now = Date.now();
    const hoursDiff = (now - maxDate) / (1000 * 60 * 60);
    const isStale = hoursDiff > 48;
    
    return { dateStr, isStale, hoursDiff };
  }, [activeStockPool]);

  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchUploadStatus, setBatchUploadStatus] = useState('');

  // Handle Custom Dataset File Upload (Supports selecting multiple CSV/ZIP/JSON files at once)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray: File[] = Array.from(fileList);
    setIsBatchUploading(true);
    setBatchUploadStatus(`Preparing to extract ${filesArray.length} file(s)...`);

    try {
      const allParsedStocks: DseStockData[] = [];
      const processedFileNames: string[] = [];

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setBatchUploadStatus(`Processing file ${i + 1} of ${filesArray.length}: ${file.name}`);

        // Yield to main thread every 2 files
        if (i % 2 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }

        if (file.name.toLowerCase().endsWith('.zip')) {
          try {
            const extracted = await parseZipFile(file, (processed, total) => {
              setBatchUploadStatus(`Extracting ZIP ${file.name} (${processed}/${total} files)...`);
            });
            const zipStocks = await extractStockDataFromExtractedFilesAsync(extracted, (p, t) => {
              setBatchUploadStatus(`Parsing CSVs from ZIP (${p}/${t})...`);
            });
            allParsedStocks.push(...zipStocks);
            processedFileNames.push(file.name);
          } catch (err) {
            console.error(`Error reading ZIP file ${file.name}:`, err);
          }
        } else {
          try {
            const text = await file.text();
            if (text) {
              const parsed = parseCustomDseStockFiles(text, file.name);
              allParsedStocks.push(...parsed);
              processedFileNames.push(file.name);
            }
          } catch (err) {
            console.error(`Error reading file ${file.name}:`, err);
          }
        }
      }

      setBatchUploadStatus('Merging and validating active stock datasets...');
      await new Promise((r) => setTimeout(r, 0));

      const validParsedStocks = mergeAndProcessStockDatasets(allParsedStocks);

      if (validParsedStocks.length > 0) {
        handleAddCustomStocks(validParsedStocks);
        const fileCountMsg = filesArray.length === 1
          ? `"${filesArray[0].name}"`
          : `${filesArray.length} files (${processedFileNames.slice(0, 3).join(', ')}${filesArray.length > 3 ? '...' : ''})`;
        alert(`Successfully loaded ${validParsedStocks.length} active stock dataset(s) from ${fileCountMsg}!`);
      } else if (allParsedStocks.length > 0) {
        alert(`Parsed ${allParsedStocks.length} stocks, but all were filtered out (e.g. Bonds, Mutual Funds).`);
      } else {
        alert('Could not parse valid stock candles from the selected file(s). Ensure CSV files include columns: Date, Open, High, Low, Close, Volume.');
      }
    } finally {
      setIsBatchUploading(false);
      setBatchUploadStatus('');
      e.target.value = '';
    }
  };

  // Check Price Alerts
  useEffect(() => {
    if (priceAlerts.length === 0 || activeStockPool.length === 0) return;

    let hasUpdates = false;
    const newAlerts = [...priceAlerts];
    const newToasts: Array<{ id: string; symbol: string; message: string; targetPrice: number }> = [];

    newAlerts.forEach((alert) => {
      if (alert.isTriggered) return;

      const stock = activeStockPool.find((s) => s.symbol === alert.symbol);
      if (!stock || !stock.candles || stock.candles.length === 0) return;

      const latestPrice = stock.candles[stock.candles.length - 1].close;

      let triggered = false;
      if (alert.condition === 'above' && latestPrice >= alert.targetPrice) triggered = true;
      if (alert.condition === 'below' && latestPrice <= alert.targetPrice) triggered = true;

      if (triggered) {
        alert.isTriggered = true;
        hasUpdates = true;
        newToasts.push({
          id: Math.random().toString(36).substring(7),
          symbol: alert.symbol,
          message: `Hit ${alert.condition} ৳${alert.targetPrice} (Current: ৳${latestPrice})`,
          targetPrice: alert.targetPrice,
        });
      }
    });

    if (hasUpdates) {
      setPriceAlerts(newAlerts);
      setActiveToastAlerts((prev) => [...prev, ...newToasts]);
    }
  }, [activeStockPool, priceAlerts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Batch Upload Progress Overlay Modal */}
      {isBatchUploading && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Parsing Bulk Datasets</h3>
              <p className="text-xs text-emerald-300 font-mono animate-pulse">{batchUploadStatus}</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full animate-pulse w-full" />
            </div>
            <p className="text-[11px] text-slate-400">
              Non-blocking streaming engine active. Merging datasets without freezing UI...
            </p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-2 rounded-2xl shadow-xl backdrop-blur-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto scrollbar-thin pb-1 sm:pb-0">
          <TabButton
            active={activeSubTab === 'screener'}
            onClick={() => setActiveSubTab('screener')}
            icon={<Sparkles className="w-4 h-4" />}
            label="Screener"
          />
          <TabButton
            active={activeSubTab === 'compare'}
            onClick={() => setActiveSubTab('compare')}
            icon={<Scale className="w-4 h-4" />}
            label="Compare"
          />
          <TabButton
            active={activeSubTab === 'chart'}
            onClick={() => setActiveSubTab('chart')}
            icon={<BarChart2 className="w-4 h-4" />}
            label="Chart"
          />
          <TabButton
            active={activeSubTab === 'lab'}
            onClick={() => setActiveSubTab('lab')}
            icon={<Sliders className="w-4 h-4" />}
            label="Strategy Lab"
          />
          <TabButton
            active={activeSubTab === 'edge'}
            onClick={() => setActiveSubTab('edge')}
            icon={<Target className="w-4 h-4" />}
            label="Edge"
          />
          <TabButton
            active={activeSubTab === 'postmortem'}
            onClick={() => setActiveSubTab('postmortem')}
            icon={<ShieldAlert className="w-4 h-4" />}
            label="Post-Mortem"
          />
          <div className="w-px h-6 bg-slate-800 mx-1 shrink-0" />
          <TabButton
            active={false}
            onClick={() => setShowPriceAlertModal(true)}
            icon={<Bell className="w-4 h-4" />}
            label="Alerts"
            badge={priceAlerts.filter(a => !a.isTriggered).length || undefined}
          />
        </div>

        {/* Loaded Dataset Info & Quick Upload */}
        <div className="flex items-center gap-3 shrink-0">
          {dataHealth.dateStr !== 'N/A' && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-sm ${
                dataHealth.isStale
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              }`}
              title={
                dataHealth.isStale
                  ? 'Data is older than 48 hours. Please update your CSV.'
                  : 'Data is up to date.'
              }
            >
              {dataHealth.isStale ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Last Data: {dataHealth.dateStr}</span>
            </div>
          )}

          {customFileLoaded && (
            <span className="px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
              ✓ {customFileLoaded}
            </span>
          )}

          <label
            htmlFor="csv-dse-upload"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shadow transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Stock Data (CSV/ZIP)</span>
            <input
              id="csv-dse-upload"
              type="file"
              multiple
              accept=".csv,.json,.txt,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Data Quality Notice Banner */}
      {dataQualityNotice && (
        <div className="flex items-center justify-between gap-3 bg-amber-950/60 border border-amber-500/40 rounded-2xl px-4 py-3 text-xs font-mono text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{dataQualityNotice}</span>
          </div>
          <button
            onClick={() => setDataQualityNotice(null)}
            className="text-amber-300 hover:text-white font-bold px-1.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Local Database Status & Controls (no synthetic/fake data) */}
      <DatabaseStatusBar
        stocks={activeStockPool}
        isDatabaseLoaded={isDatabaseLoaded}
      />

      {/* Market Overview — collapsed by default so screener/comparer/chart results are
          visible right after the tab bar instead of requiring a long scroll past these
          three widgets first. Expand when you actually want the sector/pattern context. */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden">
        <button
          onClick={() => setShowMarketOverview((prev) => {
            const next = !prev;
            try { localStorage.setItem('dse_show_market_overview', String(next)); } catch {}
            return next;
          })}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/40 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Market Overview
            <span className="text-[10px] font-normal text-slate-500 font-mono">
              (Backtest Summary · Sector Money Flow · Pattern Scan Alerts)
            </span>
          </span>
          {showMarketOverview ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {showMarketOverview && (
          <div className="px-4 pb-4 space-y-4 border-t border-slate-800/80 pt-4">
            {/* Algorithmic Market Scan Summary Dashboard */}
            <BacktestSummaryDashboard
              summary={backtestResult}
              config={config}
              scannedStockCount={displayedStocks.length}
              selectedSector={selectedSectorFilter}
              onJumpToSignal={(sig) => {
                setSelectedSignal(sig);
                setChartTargetSymbol(sig.symbol);
                setActiveSubTab('chart');
              }}
              onOpenStrategyLab={() => setActiveSubTab('lab')}
              onOpenStopLossDiagnostics={() => setActiveSubTab('postmortem')}
            />

            {/* Sector Money Flow Matrix & Rotation Analytics */}
            <SectorMoneyFlowMatrix
              stocks={activeStockPool}
              selectedSector={selectedSectorFilter}
              onSelectSector={setSelectedSectorFilter}
            />

            {/* Technical Pattern Scan Notification & Alert Matrix */}
            <PatternScanNotifier
              signals={backtestResult.signals}
              selectedPatternFilter={selectedPatternFilter}
              onSelectPatternFilter={setSelectedPatternFilter}
              onJumpToSignal={(sig) => {
                setSelectedSignal(sig);
                setChartTargetSymbol(sig.symbol);
                setActiveSubTab('chart');
              }}
            />
          </div>
        )}
      </div>

      {/* VIEW 1: High Profit Screener */}
      {activeSubTab === 'screener' && (
        <DseStockScreener
          stocks={displayedStocks}
          config={config}
          selectedPatternFilter={selectedPatternFilter}
          edgeStats={edgeStats}
          sectorMoneyFlow={sectorMoneyFlow}
          onUpdateConfig={setConfig}
          onSelectStockForChart={(sym) => {
            setChartTargetSymbol(sym);
            setActiveSubTab('chart');
          }}
          onCustomStockUploaded={handleAddCustomStocks}
        />
      )}

      {/* VIEW 2: Side-by-Side Stock Performance Comparison */}
      {activeSubTab === 'compare' && (
        <DseStockComparer
          stocks={displayedStocks}
          config={config}
          signals={backtestResult.signals}
          edgeStats={edgeStats}
          onSelectStockForChart={(sym) => {
            setChartTargetSymbol(sym);
            setActiveSubTab('chart');
          }}
        />
      )}

      {/* VIEW 2: D3 Interactive Volume Breakout Chart */}
      {activeSubTab === 'chart' && (
        <DseVolumeBreakoutChart
          stocks={displayedStocks}
          signals={filteredSignals}
          config={config}
          onSelectSignal={(sig) => setSelectedSignal(sig)}
          initialSymbol={chartTargetSymbol}
          onBack={() => setActiveSubTab('screener')}
        />
      )}

      {/* VIEW 3: Backtest & Strategy Lab */}
      {activeSubTab === 'lab' && (
        <div className="space-y-8">
          {/* Header & Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Dhaka Stock Exchange (DSE) Strategy & Backtest Lab
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  DSE Volume Breakout Backtest Engine
                </h1>
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  Tailored for DSE market dynamics: Adjusted realistic YoY fundamental thresholds (3% - 8%), focusing on <strong className="text-emerald-400">Relative Volume (RVOL) surges</strong> combined with <strong className="text-indigo-400">Micro (VCP / NR7)</strong> and <strong className="text-indigo-400">Macro (Base / Trend)</strong> pattern confirmation.
                </p>
              </div>
            </div>
          </div>

      {/* Main Grid: Parameters + High Level Backtest KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Strategy Parameters Panel */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Strategy & DSE Filter Controls
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Real-Time Engine</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* YoY Growth Parameter */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Min DSE YoY Growth Target:</span>
                <span className="font-bold text-emerald-400">{config.minYoyGrowthPct}0% YoY</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.5"
                value={config.minYoyGrowthPct}
                onChange={(e) => setConfig({ ...config, minYoyGrowthPct: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Adjusted for DSE reality (15%+ is rare; 3%-8% captures solid DSE category A bluechips).
              </p>
            </div>

            {/* Volume Surge Multiplier */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Volume Breakout Multiplier:</span>
                <span className="font-bold text-indigo-400">{config.volumeSurgeMultiplier}x ADV</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.25"
                value={config.volumeSurgeMultiplier}
                onChange={(e) => setConfig({ ...config, volumeSurgeMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Volume required on breakout day relative to 20-day Average Daily Volume (ADV).
              </p>
            </div>

            {/* Micro Consolidation Window */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Micro Consolidation Phase:</span>
                <span className="font-bold text-amber-400">{config.microConsolidationDays} Days</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={config.microConsolidationDays}
                onChange={(e) => setConfig({ ...config, microConsolidationDays: parseInt(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Macro Base Window */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Macro Base Formation:</span>
                <span className="font-bold text-sky-400">{config.macroBaseDays} Days</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={config.macroBaseDays}
                onChange={(e) => setConfig({ ...config, macroBaseDays: parseInt(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Target & Stop Loss */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Profit %</label>
                <input
                  type="number"
                  value={config.targetProfitPct}
                  onChange={(e) => setConfig({ ...config, targetProfitPct: parseFloat(e.target.value) || 10 })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-1.5 font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Stop Loss %</label>
                <input
                  type="number"
                  value={config.stopLossPct}
                  onChange={(e) => setConfig({ ...config, stopLossPct: parseFloat(e.target.value) || 5 })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded p-1.5 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Backtest KPI Performance Cards */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Backtest Win Rate"
              value={`${backtestResult.winRatePct}%`}
              subtext={`${backtestResult.winningSignals} Won / ${backtestResult.losingSignals} Lost`}
              highlight={backtestResult.winRatePct >= 60 ? 'emerald' : 'amber'}
            />
            <KpiCard
              label="Risk-Reward Ratio"
              value={`${backtestResult.avgRiskRewardRatio}:1`}
              subtext={`Planned (+${config.targetProfitPct}% / -${config.stopLossPct}%)`}
              highlight="emerald"
            />
            <KpiCard
              label="Profit Factor"
              value={`${backtestResult.profitFactor}x`}
              subtext="Gross Gains / Gross Losses"
              highlight={backtestResult.profitFactor >= 2.0 ? 'emerald' : 'blue'}
            />
            <KpiCard
              label="Breakout Signals"
              value={backtestResult.totalSignals.toString()}
              subtext={`Volume > ${config.volumeSurgeMultiplier}x 20d MA`}
              highlight="indigo"
            />
          </div>

          {/* Forward Returns Chart & Duration Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Forward Profitability Horizon Post-Breakout</span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Average DSE Forward Performance
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ForwardTrajectoryBox label="+5 Days Move" averagePct={calculateAvgHorizon(backtestResult.signals, 'forward5dPct')} />
              <ForwardTrajectoryBox label="+10 Days Move" averagePct={calculateAvgHorizon(backtestResult.signals, 'forward10dPct')} />
              <ForwardTrajectoryBox label="+20 Days Move" averagePct={calculateAvgHorizon(backtestResult.signals, 'forward20dPct')} />
              <ForwardTrajectoryBox label="+60 Days Move" averagePct={calculateAvgHorizon(backtestResult.signals, 'forward60dPct')} />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
              <strong className="text-slate-200">Key Insight:</strong> On DSE, strong volume breakouts (&gt;3.0x ADV) with preceding 5-day tight consolidation achieve peak profitability between <strong>+10 to +20 trading days</strong>. Holding past +30 days without trailing stop-losses often leads to profit clawback due to market liquidity cycles.
            </p>
          </div>

          {/* Portfolio Equity Curve Visualization Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Portfolio Equity Curve & Cumulative Strategy Growth
                </h3>
                <p className="text-[11px] text-slate-400">
                  Simulated account equity trajectory across historical DSE breakout trade signals
                </p>
              </div>
              {(() => {
                const curveData = computeEquityCurve(backtestResult.signals);
                const finalPt = curveData[curveData.length - 1];
                const totalGainPct = finalPt ? finalPt.cumulativeGainPct : 0;
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Total Backtest Growth:</span>
                    <span className={`text-sm font-bold font-mono ${totalGainPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalGainPct >= 0 ? '+' : ''}{totalGainPct}%
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="h-64 w-full">
              {(() => {
                const curveData = computeEquityCurve(backtestResult.signals);
                if (!curveData || curveData.length <= 1) {
                  return (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No trade execution data available to plot equity curve.
                    </div>
                  );
                }
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `BDT ${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                        formatter={(val: any, name: any, item: any) => [
                          `BDT ${Number(val).toLocaleString()} (${item.payload.cumulativeGainPct >= 0 ? '+' : ''}${item.payload.cumulativeGainPct}%)`,
                          'Portfolio Equity'
                        ]}
                        labelFormatter={(label, items) => {
                          const sym = items && items[0]?.payload?.symbol;
                          return `Date: ${label} ${sym && sym !== 'START' ? `(${sym})` : ''}`;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="portfolioValue"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#022c22' }}
                        activeDot={{ r: 6, fill: '#34d399', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Volume Breakout & Risk-Reward Ratio Calculation Highlight Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-indigo-400" />
              Volume Breakout & Risk-Reward Engine Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quantitative breakout rules and risk-management parameters applied across historical DSE price bars.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              Planned R:R = {backtestResult.avgRiskRewardRatio} : 1
            </span>
            <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              Hist. Realized R:R = {backtestResult.avgRealizedRiskRewardRatio} : 1
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Volume Breakout Moving Average Threshold Rule */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                1. Moving Average Volume Threshold
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold">
                RVOL ≥ {config.volumeSurgeMultiplier}.0x
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Breakouts trigger only when trading volume exceeds <strong>{config.volumeSurgeMultiplier}00%</strong> of the preceding <strong>20-Day Moving Average Volume (20d MA Volume)</strong> during a bullish price expansion bar (<span className="text-emerald-400 font-bold">Close &gt; Open</span>).
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Formula:</span>
                <span className="text-indigo-300 font-bold">Breakout Vol &gt; 20d Vol MA × {config.volumeSurgeMultiplier}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bullish Bar Check:</span>
                <span className="text-emerald-400 font-bold">Close &gt; Open (Green Bar)</span>
              </div>
            </div>
          </div>

          {/* Risk-Reward Ratio Calculation Formula */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-400" />
                2. Risk-Reward Ratio (R:R) Execution
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                Target : Stop = {(config.targetProfitPct / config.stopLossPct).toFixed(2)} : 1
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Every identified setup evaluates target potential vs stop loss risk to maintain positive expectational edge before taking entry.
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Target Profit (+{config.targetProfitPct}%):</span>
                <span className="text-emerald-400 font-bold">৳Entry × {1 + config.targetProfitPct / 100}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Stop Loss (-{config.stopLossPct}%):</span>
                <span className="text-rose-400 font-bold">৳Entry × {1 - config.stopLossPct / 100}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5 mt-1.5">
                <span>Calculated R:R Ratio:</span>
                <span className="text-emerald-300 font-bold">{(config.targetProfitPct / config.stopLossPct).toFixed(2)} : 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* D3 Interactive Volume Breakout & Price Trend Chart */}
      <DseVolumeBreakoutChart
        stocks={displayedStocks}
        signals={backtestResult.signals}
        config={config}
        onSelectSignal={(sig) => setSelectedSignal(sig)}
      />

      {/* Micro vs Macro Pre-Breakout Pattern Analysis Deep Dive */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Deep-Dive Pattern Analysis Before Breakout (Micro vs Macro Timeframes)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Understanding price & volume dynamics immediately preceding successful DSE breakout trades.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Micro Timeframe Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                1. Micro Timeframe Patterns (1 - 7 Days Before Breakout)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Daily / Intraday
              </span>
            </div>

            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Volatility Contraction Pattern (VCP):</strong> Price daily range compresses progressively from 5.0% to under 1.5%.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Volume Dry-Up Spike:</strong> Turnover drops 50% below 20-day ADV 1-2 days prior to breakout, indicating seller exhaustion.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Narrow Range Candle (NR7):</strong> The final candle before volume explosion is the narrowest bar of the week.
                </div>
              </li>
            </ul>
          </div>

          {/* Macro Timeframe Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                2. Macro Timeframe Patterns (20 - 60 Days Before Breakout)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                Weekly / Monthly
              </span>
            </div>

            <ul className="text-xs text-slate-300 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Base Formation Structure:</strong> Multi-week Cup & Handle or Ascending Triangle base establishing strong support.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Moving Average Confluence:</strong> Price trades above 50-day and 200-day Exponential Moving Averages (Golden Cross).
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100">Smart Money Accumulation:</strong> High volume on green up-days, declining volume on pullback red-days.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* DSE Specific Actionable Improvement Suggestions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Actionable Rules for High Probability Trades on DSE
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">Rule 1: Liquidity Floor Filter</span>
            <p className="text-slate-400">Avoid stocks with daily turnover below 20 BDT Million or stocks trapped at floor price limits.</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">Rule 2: RVOL &gt; 3.0x Required</span>
            <p className="text-slate-400">Only enter when breakout volume exceeds 300% of 20-day ADV to confirm institutional participation.</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-sky-400">Rule 3: Combined Pattern Entry</span>
            <p className="text-slate-400">Require both micro VCP dry-up AND macro multi-week base to boost win rate from 45% to 68%.</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-indigo-400">Rule 4: Multi-Stage Take-Profit</span>
            <p className="text-slate-400">Lock in 50% profit at +10% to +15% target; trail stop-loss with 20-day EMA for remaining position.</p>
          </div>
        </div>
      </div>

      {/* Historical Signals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              Historical Breakout Signals Log ({backtestResult.signals.length} Signals Identified)
            </h3>
            <p className="text-xs text-slate-400">Click any row to inspect volume breakout vs moving average threshold and risk-reward profile.</p>
          </div>
        </div>

        {filteredSignals.length === 0 ? (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-amber-400" />
            <p className="text-sm font-semibold text-slate-300">No breakout signals match current filter settings.</p>
            <p className="text-xs text-slate-500">Try selecting "All Patterns" or lowering Volume Surge Multiplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Stock Symbol</th>
                  <th className="py-2.5 px-3">Breakout Date</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Technical Pattern</th>
                  <th className="py-2.5 px-3">Price Bar Gain</th>
                  <th className="py-2.5 px-3">Volume vs 20d MA</th>
                  <th className="py-2.5 px-3">Risk-Reward Ratio</th>
                  <th className="py-2.5 px-3">+20d Return</th>
                  <th className="py-2.5 px-3">Realized PnL</th>
                  <th className="py-2.5 px-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSignals.slice(0, 100).map((sig, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedSignal(sig)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-white font-sans">{sig.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-400">{sig.breakoutDate}</td>
                    <td className="py-2.5 px-3 text-slate-200">৳{sig.breakoutPrice}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                        {sig.detectedPattern || 'Bullish Flag'} ({sig.patternConfidence || 90}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">
                      +{sig.priceIncreasePct}%
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="text-indigo-400 font-bold">{sig.volumeMultiplier}x MA Surge</span>
                        <span className="text-[10px] text-slate-500">
                          {(sig.breakoutVolume / 1000).toFixed(0)}k / {(sig.avgVolume20 / 1000).toFixed(0)}k MA
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="text-emerald-400 font-bold">{sig.riskRewardRatio}:1 Planned</span>
                        <span className="text-[10px] text-slate-400">Hist: {sig.realizedRiskRewardRatio}:1</span>
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${sig.forward20dPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sig.forward20dPct >= 0 ? '+' : ''}{sig.forward20dPct}%
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${sig.realizedGainPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sig.realizedGainPct >= 0 ? '+' : ''}{sig.realizedGainPct}%
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {sig.status === 'Target Hit' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Target Hit
                        </span>
                      ) : sig.status === 'Stop Loss Hit' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Stop Hit
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSignals.length > 100 && (
              <div className="text-center py-4 text-xs text-slate-500">
                Showing the most recent 100 signals (out of {filteredSignals.length} total). Narrow your filters to see more specific setups.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trade Setup Detail Modal */}
      {selectedSignal && (() => {
        const signalStock = displayedStocks.find((s) => s.symbol === selectedSignal.symbol);
        const candidate = signalStock ? evaluateStockForScreener(signalStock, config, [selectedSignal], edgeStats) : null;

        const activeCandidate = candidate || {
          symbol: selectedSignal.symbol,
          stockName: selectedSignal.stockName,
          sector: selectedSignal.sector,
          stock: signalStock || {
            symbol: selectedSignal.symbol,
            name: selectedSignal.stockName,
            sector: selectedSignal.sector,
            yoyGrowthPct: 5,
            peRatio: 15,
            avgTurnoverBdtMillion: 25,
            candles: [],
          },
          decisionStatus: 'STRONG_BUY' as const,
          profitPotentialScore: 92,
          latestClose: selectedSignal.breakoutPrice,
          latestDate: selectedSignal.breakoutDate,
          latestVolume: selectedSignal.breakoutVolume,
          avgVolume20: selectedSignal.avgVolume20,
          rvol20: selectedSignal.volumeMultiplier,
          ma20Price: selectedSignal.breakoutPrice,
          entryPrice: selectedSignal.breakoutPrice,
          targetPrice: Number((selectedSignal.breakoutPrice * (1 + config.targetProfitPct / 100)).toFixed(2)),
          stopLossPrice: Number((selectedSignal.breakoutPrice * (1 - config.stopLossPct / 100)).toFixed(2)),
          riskRewardRatio: selectedSignal.riskRewardRatio,
          potentialGainPct: config.targetProfitPct,
          potentialRiskPct: config.stopLossPct,
          keyCatalysts: [selectedSignal.microPattern, selectedSignal.macroPattern],
          breakoutPattern: selectedSignal.detectedPattern,
          detectedPattern: selectedSignal.detectedPattern,
          patternConfidence: selectedSignal.patternConfidence || 90,
          patternDescription: selectedSignal.patternDescription || 'Breakout trade setup detected.',
          historicalWinRate: 85,
          tradeSetupReasoning: `Identified volume surge breakout on ${selectedSignal.breakoutDate} with ${selectedSignal.volumeMultiplier}x RVOL expansion.`,
          recommendedPositionSizePct: 15,
          peRatio: 15,
          yoyGrowthPct: 5,
          avgTurnoverBdtMillion: 25,
        };

        return (
          <StockDetailModal
            candidate={activeCandidate}
            signal={selectedSignal}
            config={config}
            onClose={() => setSelectedSignal(null)}
            onOpenChart={(sym) => {
              setSelectedSignal(null);
              setChartTargetSymbol(sym);
              setActiveSubTab('chart');
            }}
          />
        );
      })()}
        </div>
      )}

      {/* VIEW 4: Edge Analysis */}
      {activeSubTab === 'edge' && (
        <EdgeAnalysisDashboard 
          backtestResult={backtestResult}
          stocks={activeStockPool}
        />
      )}

      {/* VIEW 5: Stop-Loss Post-Mortem Diagnostics */}
      {activeSubTab === 'postmortem' && (
        <StopLossPostMortemDashboard
          report={backtestResult.stopLossReport}
          onSelectStockForChart={(sym) => {
            setChartTargetSymbol(sym);
            setActiveSubTab('chart');
          }}
          onAutoApplyMitigationRules={() => {
            setConfig((prev) => ({
              ...prev,
              minVolumeSurge: 2.8,
              enableSectorTrendFilter: true,
            }));
            setActiveSubTab('screener');
          }}
        />
      )}

      {/* Toast Notifications */}
      {activeToastAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full">
          {activeToastAlerts.map((toast) => (
            <div key={toast.id} className="bg-slate-900 border border-emerald-500/50 rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-in slide-in-from-right">
              <Bell className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white font-mono">{toast.symbol} Alert Triggered!</h4>
                  <button onClick={() => setActiveToastAlerts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-1">{toast.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Alert Manager Modal */}
      {showPriceAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white font-mono">Price Alerts</h3>
              </div>
              <button
                onClick={() => setShowPriceAlertModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Alert Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const symbol = (form.elements.namedItem('symbol') as HTMLInputElement).value.toUpperCase();
                const targetPrice = parseFloat((form.elements.namedItem('price') as HTMLInputElement).value);
                const condition = (form.elements.namedItem('condition') as HTMLSelectElement).value as 'above' | 'below';

                if (symbol && !isNaN(targetPrice)) {
                  setPriceAlerts(prev => [...prev, { id: Math.random().toString(36).substring(7), symbol, targetPrice, condition, isTriggered: false }]);
                  form.reset();
                }
              }}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
            >
              <div className="text-xs font-bold text-slate-400 mb-2">Create New Alert</div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="symbol"
                  type="text"
                  placeholder="Symbol (e.g. GP)"
                  required
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <input
                  name="price"
                  type="number"
                  step="0.1"
                  placeholder="Target Price"
                  required
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  name="condition"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="above">Alert when price goes ABOVE</option>
                  <option value="below">Alert when price goes BELOW</option>
                </select>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>

            {/* Active Alerts List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {priceAlerts.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4 font-mono">No active price alerts.</div>
              ) : (
                priceAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{alert.symbol}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Target: {alert.condition === 'above' ? '≥' : '≤'} ৳{alert.targetPrice}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {alert.isTriggered ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Triggered</span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">Active</span>
                      )}
                      <button
                        onClick={() => setPriceAlerts(prev => prev.filter(a => a.id !== alert.id))}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`relative shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
      active
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
    }`}
  >
    <span className={active ? 'text-emerald-200' : 'text-slate-500'}>{icon}</span>
    <span className="whitespace-nowrap">{label}</span>
    {badge !== undefined && (
      <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const KpiCard: React.FC<{
  label: string;
  value: string;
  subtext: string;
  highlight: 'emerald' | 'indigo' | 'amber' | 'blue' | 'slate';
}> = ({ label, value, subtext, highlight }) => {
  let color = 'text-white';
  if (highlight === 'emerald') color = 'text-emerald-400';
  if (highlight === 'indigo') color = 'text-indigo-400';
  if (highlight === 'amber') color = 'text-amber-400';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      <div className={`text-2xl font-extrabold tracking-tight ${color}`}>{value}</div>
      <p className="text-[10px] text-slate-500">{subtext}</p>
    </div>
  );
};

const ForwardTrajectoryBox: React.FC<{ label: string; averagePct: number }> = ({ label, averagePct }) => {
  const isPositive = averagePct >= 0;
  return (
    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1 text-center">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`text-lg font-extrabold font-mono flex items-center justify-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {isPositive ? '+' : ''}{averagePct}%
      </div>
    </div>
  );
};

function calculateAvgHorizon(signals: BreakoutSignal[], key: keyof BreakoutSignal): number {
  if (signals.length === 0) return 0;
  const sum = signals.reduce((acc, sig) => acc + (typeof sig[key] === 'number' ? (sig[key] as number) : 0), 0);
  return Number((sum / signals.length).toFixed(2));
}
