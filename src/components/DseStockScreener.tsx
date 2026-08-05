import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Target,
  BarChart3,
  Award,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Sliders,
  DollarSign,
  ChevronRight,
  PieChart
} from 'lucide-react';
import { PatternEdgeStat, DseStockData, BacktestConfig, ScreenerStockCandidate, ScreenerDecisionStatus } from '../types';
import { runDseStockScreener, parseCustomDseStockFiles, extractStockDataFromExtractedFiles, extractStockDataFromExtractedFilesAsync, mergeAndProcessStockDatasets } from '../utils/dseBacktestEngine';
import { parseZipFile } from '../utils/zipParser';
import { StockDetailModal } from './StockDetailModal';

interface DseStockScreenerProps {
  stocks: DseStockData[];
  config: BacktestConfig;
  selectedPatternFilter?: string;
  edgeStats?: PatternEdgeStat[];
  onUpdateConfig: (newConfig: BacktestConfig) => void;
  onSelectStockForChart: (symbol: string) => void;
  onCustomStockUploaded: (newStocks: DseStockData[]) => void;
}

export const DseStockScreener: React.FC<DseStockScreenerProps> = ({
  stocks,
  config,
  selectedPatternFilter,
  edgeStats,
  onUpdateConfig,
  onSelectStockForChart,
  onCustomStockUploaded,
}) => {
  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'rvol' | 'yoy' | 'winrate' | 'pe'>('score');
  const [selectedCandidateModal, setSelectedCandidateModal] = useState<ScreenerStockCandidate | null>(null);

  // Run Screener Analysis across current stock pool
  const candidates = useMemo(() => {
    return runDseStockScreener(stocks, config, edgeStats);
  }, [stocks, config, edgeStats]);

  // Distinct Sectors in Stock Pool
  const sectors = useMemo(() => {
    const list = Array.from(new Set(stocks.map((s) => s.sector)));
    return ['ALL', ...list];
  }, [stocks]);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
          if (!c.harmonicDetails) return false;
        }
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === 'EARLY_TREND_IGNITION') {
            if (c.decisionStatus !== 'EARLY_TREND_IGNITION' && c.earlyTrendStage !== 'STAGE_2_IGNITION' && c.earlyTrendStage !== 'STAGE_1_EARLY_COIL') return false;
          } else if (c.decisionStatus !== selectedStatus) {
            return false;
          }
        }
        if (selectedSector !== 'ALL' && c.sector !== selectedSector) return false;
        if (selectedPatternFilter && selectedPatternFilter !== 'ALL' && c.detectedPattern !== selectedPatternFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.profitPotentialScore - a.profitPotentialScore;
        if (sortBy === 'rvol') return b.rvol20 - a.rvol20;
        if (sortBy === 'yoy') return b.yoyGrowthPct - a.yoyGrowthPct;
        if (sortBy === 'winrate') return b.historicalWinRate - a.historicalWinRate;
        if (sortBy === 'pe') return a.peRatio - b.peRatio;
        return 0;
      });
  }, [candidates, selectedStatus, selectedSector, sortBy, selectedPatternFilter, config.strategyType]);

  // Executive Metrics
  const strongBuys = candidates.filter((c) => c.decisionStatus === 'STRONG_BUY');
  const watchlists = candidates.filter((c) => c.decisionStatus === 'WATCHLIST_BREAKOUT');
  const earlyTrends = candidates.filter((c) => c.decisionStatus === 'EARLY_TREND_IGNITION' || c.earlyTrendStage === 'STAGE_2_IGNITION' || c.earlyTrendStage === 'STAGE_1_EARLY_COIL');

  const earlyRadarPicks = useMemo(
  () => candidates
    .filter(c => c.earlyTrendStage === 'STAGE_1_EARLY_COIL' || c.earlyTrendStage === 'STAGE_2_IGNITION')
    .sort((a, b) => b.profitPotentialScore - a.profitPotentialScore)
    .slice(0, 6),
  [candidates]
);

  // Top Identified Picks Pool (Top 8 ranked candidates)
  const topPicks = useMemo(() => candidates.slice(0, 8), [candidates]);
  const [selectedTopPickSymbol, setSelectedTopPickSymbol] = useState<string>('');

  const activeTopPick = useMemo(() => {
    return topPicks.find((c) => c.symbol === selectedTopPickSymbol) || topPicks[0] || null;
  }, [topPicks, selectedTopPickSymbol]);

  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');

  // Handle custom stock dataset upload directly in screener (Supports selecting multiple files at once)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray: File[] = Array.from(files);
    setIsBatchUploading(true);
    setBatchStatus(`Preparing to extract ${filesArray.length} file(s)...`);

    try {
      const allParsedStocks: DseStockData[] = [];
      const processedNames: string[] = [];

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setBatchStatus(`Processing file ${i + 1} of ${filesArray.length}: ${file.name}`);

        // Yield to event loop every 2 files so UI stays responsive
        if (i % 2 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }

        if (file.name.toLowerCase().endsWith('.zip')) {
          try {
            const extracted = await parseZipFile(file, (processed, total) => {
              setBatchStatus(`Extracting ZIP ${file.name} (${processed}/${total} files)...`);
            });
            const zipStocks = await extractStockDataFromExtractedFilesAsync(extracted, (p, t) => {
              setBatchStatus(`Parsing extracted dataset (${p}/${t})...`);
            });
            allParsedStocks.push(...zipStocks);
            processedNames.push(file.name);
          } catch (err) {
            console.error(`Error reading ZIP file ${file.name}:`, err);
          }
        } else {
          try {
            const content = await file.text();
            if (content) {
              const parsed = parseCustomDseStockFiles(content, file.name);
              allParsedStocks.push(...parsed);
              processedNames.push(file.name);
            }
          } catch (err) {
            console.error(`Error reading file ${file.name}:`, err);
          }
        }
      }

      setBatchStatus('Validating and merging stock pools...');
      await new Promise((r) => setTimeout(r, 0));

      const mergedStocks = mergeAndProcessStockDatasets(allParsedStocks);

      if (mergedStocks.length > 0) {
        onCustomStockUploaded(mergedStocks);
        const fileCountMsg = filesArray.length === 1
          ? `"${filesArray[0].name}"`
          : `${filesArray.length} files (${processedNames.slice(0, 3).join(', ')}${filesArray.length > 3 ? '...' : ''})`;
        alert(`Successfully loaded ${mergedStocks.length} unique stock dataset(s) from ${fileCountMsg}!`);
      } else {
        alert('Could not parse valid stock candles from the selected CSV/JSON file(s). Ensure CSV includes Date, Open, High, Low, Close, Volume.');
      }
    } finally {
      setIsBatchUploading(false);
      setBatchStatus('');
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Upload Progress Overlay Modal */}
      {isBatchUploading && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Extracting & Processing Datasets</h3>
              <p className="text-xs text-indigo-300 font-mono animate-pulse">{batchStatus}</p>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-500 h-full animate-pulse w-full" />
            </div>
            <p className="text-[11px] text-slate-400">
              Non-blocking multi-file & ZIP parser active. Please wait...
            </p>
          </div>
        </div>
      )}

      {/* Top Banner: Decision-Making High Profit Picks Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> High-Profit Decision Screener
              </span>
              <span className="text-xs text-slate-400 font-mono">DSE Institutional Flow Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Actionable Stock Picks & Buy Signals
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automated high-conviction stock scanner filtering Dhaka Stock Exchange stocks by volume surge (RVOL &ge; {config.volumeSurgeMultiplier}x), volatility contraction (VCP), fundamental YoY growth, and risk-reward entry setups.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 text-center">
              <div className="text-[10px] text-slate-400 font-medium">Strong Buy Candidates</div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono my-0.5">
                {strongBuys.length}
              </div>
              <div className="text-[10px] text-emerald-500 font-mono">Entry Ready Now</div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 text-center">
              <div className="text-[10px] text-slate-400 font-medium">Breakout Imminent</div>
              <div className="text-2xl font-extrabold text-amber-300 font-mono my-0.5">
                {watchlists.length}
              </div>
              <div className="text-[10px] text-amber-400/80 font-mono">Volume Dry-up Coiling</div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-indigo-500/30 text-center col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-400 font-medium">Planned R:R Ratio</div>
              <div className="text-2xl font-extrabold text-indigo-300 font-mono my-0.5">
                {(config.targetProfitPct / config.stopLossPct).toFixed(1)} : 1
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                +{config.targetProfitPct}% / -{config.stopLossPct}%
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Early Radar Picks */}
      {earlyRadarPicks.length > 0 && (
        <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
          <div className="space-y-2.5 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono">
                  Early Radar Picks (Pre-Breakout / Stage 1 & 2)
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
              {earlyRadarPicks.map((pick) => (
                <button
                  key={pick.symbol}
                  onClick={() => setSelectedCandidateModal(pick)}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left flex flex-col justify-between h-full"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-black text-white text-xs font-mono">{pick.symbol}</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold font-mono">
                      {pick.profitPotentialScore}%
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-1.5 line-clamp-1">
                    {pick.earlyTrendStage === 'STAGE_1_EARLY_COIL' ? 'Stage 1 Coil' : pick.earlyTrendStage === 'STAGE_2_IGNITION' ? 'Stage 2 Ignition' : pick.earlyTrendStage}
                  </div>
                  <div className="flex justify-between items-end mt-3 border-t border-slate-800 pt-2">
                    <span className="text-xs font-bold text-slate-200">৳{pick.entryPrice}</span>
                    <span className="text-[9px] text-emerald-400">+{pick.potentialGainPct}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Identified Stocks Summary & Feature Card */}
      {activeTopPick && (
        <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
          {/* Summary List Bar of All Top Identified Picks */}
          <div className="space-y-2.5 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono">
                  Identified Top Decision Picks ({topPicks.length} Stocks Ranked)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono italic">
                Click any stock pill to inspect trade setup
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {topPicks.map((pick, idx) => {
                const isSelected = activeTopPick.symbol === pick.symbol;
                const isStrong = pick.decisionStatus === 'STRONG_BUY';

                return (
                  <button
                    key={pick.symbol}
                    onClick={() => setSelectedTopPickSymbol(pick.symbol)}
                    className={`p-2 rounded-xl text-left transition-all border font-mono ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/40 text-white shadow-lg'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-400">#{idx + 1}</span>
                      <span className={`text-[9px] font-bold ${isStrong ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {pick.profitPotentialScore}%
                      </span>
                    </div>
                    <div className="font-black text-xs text-slate-100 truncate mt-0.5">{pick.symbol}</div>
                    <div className="text-[9px] text-slate-400 truncate">৳{pick.entryPrice}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed View for Active Top Pick */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg font-mono">
                  #{topPicks.findIndex((p) => p.symbol === activeTopPick.symbol) + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white font-mono">{activeTopPick.symbol}</h2>
                    <span className="text-xs text-slate-400">({activeTopPick.stockName})</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1">Updated: {activeTopPick.latestDate}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                      activeTopPick.decisionStatus === 'STRONG_BUY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {activeTopPick.decisionStatus === 'STRONG_BUY' ? '🟢 STRONG BUY' : '🟡 WATCHLIST'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Sector: <span className="text-slate-200">{activeTopPick.sector}</span> • P/E Ratio: <span className="text-amber-300 font-mono">{activeTopPick.peRatio}x</span> • YoY Growth: <span className="text-emerald-400 font-mono">+{activeTopPick.yoyGrowthPct}%</span>
                  </div>
                </div>
              </div>

              {/* Profit Potential Score */}
              <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Profit Potential Score</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {activeTopPick.profitPotentialScore} <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-300 bg-emerald-950/40 font-mono">
                  {activeTopPick.profitPotentialScore}%
                </div>
              </div>
            </div>

            {/* Trade Execution Plan Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400">Entry Price (LTP)</span>
                <div className="font-extrabold text-white text-base font-mono">৳{activeTopPick.entryPrice}</div>
                <div className="text-[10px] text-emerald-400 font-mono">RVOL: {activeTopPick.rvol20}x 20d MA</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-slate-400">Target Profit (+{activeTopPick.potentialGainPct}%)</span>
                <div className="font-extrabold text-emerald-400 text-base font-mono">৳{activeTopPick.targetPrice}</div>
                <div className="text-[10px] text-emerald-500 font-mono">Potential Gain: +৳{(activeTopPick.targetPrice - activeTopPick.entryPrice).toFixed(2)}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30 space-y-1">
                <span className="text-[10px] text-slate-400">Stop Loss (-{activeTopPick.potentialRiskPct}%)</span>
                <div className="font-extrabold text-rose-400 text-base font-mono">৳{activeTopPick.stopLossPrice}</div>
                <div className="text-[10px] text-rose-500 font-mono">Risk: -৳{(activeTopPick.entryPrice - activeTopPick.stopLossPrice).toFixed(2)}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 space-y-1">
                <span className="text-[10px] text-slate-400">Risk-Reward & Allocation</span>
                <div className="font-extrabold text-indigo-300 text-base font-mono">{activeTopPick.riskRewardRatio} : 1</div>
                <div className="text-[10px] text-indigo-400 font-mono">Allocate: {activeTopPick.recommendedPositionSizePct}% Portfolio</div>
              </div>
            </div>

            {/* Reasoning & Catalysts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trade Catalyst & Pattern: {activeTopPick.breakoutPattern}</span>
                </div>
                <p className="text-slate-400 leading-snug">{activeTopPick.tradeSetupReasoning}</p>
              </div>

              <button
                onClick={() => onSelectStockForChart(activeTopPick.symbol)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 shrink-0 transition-colors"
              >
                <Eye className="w-4 h-4" /> Open D3 Interactive Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls & Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Decision Filter:
            </span>

            {[
              { id: 'ALL', label: `All Candidates (${candidates.length})` },
              { id: 'STRONG_BUY', label: `🟢 Strong Buy (${strongBuys.length})` },
              { id: 'EARLY_TREND_IGNITION', label: `🌱 Early Trend Ignition (${earlyTrends.length})` },
              { id: 'WATCHLIST_BREAKOUT', label: `🟡 Breakout Watchlist (${watchlists.length})` },
              { id: 'CONSOLIDATING_ACCUMULATION', label: `🔵 Consolidating` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStatus === st.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort & Sector Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sector Dropdown */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  Sector: {sec}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="score">Sort: Highest Profit Potential Score</option>
              <option value="rvol">Sort: Highest Volume Surge (RVOL)</option>
              <option value="yoy">Sort: Highest YoY Revenue Growth %</option>
              <option value="winrate">Sort: Best Historical Win Rate %</option>
              <option value="pe">Sort: Lowest P/E Ratio</option>
            </select>

            {/* Custom Stock Upload Button */}
            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Dataset / CSV / ZIP</span>
              <input type="file" multiple accept=".csv,.json,.txt,.zip" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Strategy Selection & Slider Control Panel */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          {/* Strategy Mode Toggle Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Active Strategy Engine:
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => onUpdateConfig({ ...config, strategyType: 'VOLUME_BREAKOUT' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  config.strategyType !== 'HARMONIC_C_ENTRY_D_EXIT'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>⚡ Volume Breakout</span>
              </button>

              <button
                onClick={() => onUpdateConfig({ ...config, strategyType: 'HARMONIC_C_ENTRY_D_EXIT' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT'
                    ? 'bg-pink-600 text-white shadow-md border border-pink-400'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>🎯 Harmonic Pattern (C-Entry ➔ D-Exit)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Volume Surge Requirement:</span>
                <span className="font-mono text-emerald-400 font-bold">{config.volumeSurgeMultiplier}x ADV</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.5"
                value={config.volumeSurgeMultiplier}
                onChange={(e) => onUpdateConfig({ ...config, volumeSurgeMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Target Profit % (Reward):</span>
                <span className="font-mono text-emerald-400 font-bold">+{config.targetProfitPct}%</span>
              </div>
              <input
                type="range"
                min="8"
                max="35"
                step="1"
                value={config.targetProfitPct}
                onChange={(e) => onUpdateConfig({ ...config, targetProfitPct: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 font-medium">
                <span>Stop Loss % (Risk):</span>
                <span className="font-mono text-rose-400 font-bold">-{config.stopLossPct}%</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={config.stopLossPct}
                onChange={(e) => onUpdateConfig({ ...config, stopLossPct: parseInt(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Screened Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCandidates.map((candidate) => {
          const isStrong = candidate.decisionStatus === 'STRONG_BUY';
          const isWatch = candidate.decisionStatus === 'WATCHLIST_BREAKOUT';

          const candles = candidate.stock.candles;
          let trendIcon = <Minus className="w-3.5 h-3.5" />;
          let trendColor = 'text-slate-400';
          let trendText = 'Neutral';

          if (candles && candles.length >= 8) {
            const last7 = candles.slice(-7);
            const prev7 = candles.slice(-8, -1);
            const sma7 = last7.reduce((sum, c) => sum + c.close, 0) / 7;
            const sma7Prev = prev7.reduce((sum, c) => sum + c.close, 0) / 7;

            if (sma7 > sma7Prev) {
              trendIcon = <TrendingUp className="w-3.5 h-3.5" />;
              trendColor = 'text-emerald-400';
              trendText = 'Up';
            } else if (sma7 < sma7Prev) {
              trendIcon = <TrendingDown className="w-3.5 h-3.5" />;
              trendColor = 'text-rose-400';
              trendText = 'Down';
            }
          }

          return (
            <div
              key={candidate.symbol}
              onClick={() => setSelectedCandidateModal(candidate)}
              className={`bg-slate-900 rounded-2xl p-5 border transition-all hover:border-indigo-500/50 hover:shadow-indigo-950/40 shadow-lg space-y-4 flex flex-col justify-between cursor-pointer group ${
                isStrong
                  ? 'border-emerald-500/50 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20'
                  : isWatch
                  ? 'border-amber-500/40'
                  : 'border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-white font-mono text-base">{candidate.symbol}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">({candidate.sector})</span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">{candidate.stockName}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">Updated: <span className="text-slate-300">{candidate.latestDate}</span></div>
                  </div>

                  {/* Decision Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono border shrink-0 ${
                      isStrong
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : isWatch
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isStrong ? '🟢 STRONG BUY' : isWatch ? '🟡 WATCHLIST' : '🔵 ACCUMULATE'}
                  </span>
                </div>

                {/* Profit Potential Bar */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Profit Potential Score:</span>
                    <span className={`font-bold ${isStrong ? 'text-emerald-400' : isWatch ? 'text-amber-300' : 'text-indigo-300'}`}>
                      {candidate.profitPotentialScore} / 100
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isStrong ? 'bg-emerald-500' : isWatch ? 'bg-amber-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${candidate.profitPotentialScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Price & Trade Setup Plan */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Entry Price</span>
                  <span className="font-extrabold text-white text-sm">৳{candidate.entryPrice}</span>
                  <div className="text-[9px] text-emerald-400">RVOL {candidate.rvol20}x</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-500 block">Target (+{candidate.potentialGainPct}%)</span>
                  <span className="font-extrabold text-emerald-400 text-sm">৳{candidate.targetPrice}</span>
                  <div className="text-[9px] text-slate-400">Risk: -{candidate.potentialRiskPct}%</div>
                </div>
                
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-500 block text-center mb-1">7d Trend</span>
                  <div className={`flex items-center gap-1 font-bold ${trendColor}`}>
                    {trendIcon}
                    <span>{trendText}</span>
                  </div>
                </div>
              </div>

              {/* Technical Pattern Badge */}
              {candidate.detectedPattern && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-indigo-500/30 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 font-medium">Scanned Technical Pattern:</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-[10px]">
                      {candidate.detectedPattern} ({candidate.patternConfidence || 90}%)
                    </span>
                  </div>
                  {candidate.patternDescription && (
                    <p className="text-[10px] text-slate-300 leading-tight font-mono">
                      {candidate.patternDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Catalysts Badges */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-medium">Key Trade Catalysts:</span>
                <div className="flex flex-wrap gap-1">
                  {candidate.keyCatalysts.map((cat, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reasoning Footer */}
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 italic border-t border-slate-800/80 pt-2">
                "{candidate.tradeSetupReasoning}"
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStockForChart(candidate.symbol);
                  }}
                  className="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> View D3 Chart
                </button>

                <button
                  onClick={() => setSelectedCandidateModal(candidate)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Deep Analysis Modal */}
      {selectedCandidateModal && (
        <StockDetailModal
          candidate={selectedCandidateModal}
          config={config}
          onClose={() => setSelectedCandidateModal(null)}
          onOpenChart={onSelectStockForChart}
        />
      )}
    </div>
  );
};
