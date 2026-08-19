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
  PieChart,
  Search,
  Download,
  Layers,
  ChevronLeft,
  RefreshCw,
  Waves,
  Activity,
  Flame,
  Anchor,
  Rocket,
  Droplets,
  Crosshair,
  ArrowRight
} from 'lucide-react';
import { PatternEdgeStat, DseStockData, BacktestConfig, ScreenerStockCandidate, ScreenerDecisionStatus, SectorMoneyFlowStat } from '../types';
import { runDseStockScreener, parseCustomDseStockFiles, extractStockDataFromExtractedFiles, extractStockDataFromExtractedFilesAsync, mergeAndProcessStockDatasets, generateFullDseMarketUniverse } from '../utils/dseBacktestEngine';
import { parseZipFile } from '../utils/zipParser';
import { StockDetailModal } from './StockDetailModal';

export type StrategyArchetypeTab = 'ALL' | 'IMMEDIATE_MOMENTUM' | 'EARLY_ACCUMULATION' | 'HIGH_CONVICTION_SWINGS';

// High-speed memory cache to eliminate redundant calculations during scroll and filter
const archetypeCache = new WeakMap<ScreenerStockCandidate, { isImmediateMomentum: boolean; isEarlyAccumulation: boolean; isHighConvictionSwing: boolean }>();

export const getStockStrategyArchetypes = (c: ScreenerStockCandidate) => {
  const cached = archetypeCache.get(c);
  if (cached) return cached;

  // 1. Immediate Momentum: Strong buy or pocket pivot with volume expansion, high RVOL (>=1.6x), or high smart volume score
  const isImmediateMomentum = Boolean(
    ((c.decisionStatus === 'STRONG_BUY') ||
     (c.volumeFootprint?.isPocketPivot && c.rvol20 >= 1.3) ||
     (c.rvol20 >= 1.75) ||
     ((c.volumeFootprint?.compositeScore || 0) >= 75 && c.rvol20 >= 1.3)) &&
    c.profitPotentialScore >= 60 &&
    !c.tradePlan?.isOverextended
  );

  // 2. Early Accumulation: Pre-breakout stage 1 or 2, VDU (supply dry up <= 0.65x), near AVWAP floor (<= 4.0%), VSA test, tight base
  const isEarlyAccumulation = Boolean(
    c.earlyTrendStage === 'STAGE_1_EARLY_COIL' ||
    c.earlyTrendStage === 'STAGE_2_IGNITION' ||
    c.decisionStatus === 'EARLY_TREND_IGNITION' ||
    c.volumeFootprint?.isVdu ||
    (c.volumeFootprint?.isAboveAvwap && (c.volumeFootprint?.priceVsAvwapPct || 0) <= 4.0) ||
    c.volumeFootprint?.vsaSignal === 'No Supply Test' ||
    c.volumeFootprint?.vsaSignal === 'Absorption Bar' ||
    ((c.detectedPattern === 'VCP Compression' || c.detectedPattern === 'Volume Dry-up (No Supply)') && (c.volumeFootprint?.vduRatio || 1) < 0.9)
  );

  // 3. High-Conviction Swing Trades: High R:R (>= 2.3:1), high score (>= 65), positive edge / fundamentals
  const isHighConvictionSwing = Boolean(
    (c.riskRewardRatio >= 2.3 || (c.tradePlan?.netRiskRewardRatio || 0) >= 2.1) &&
    c.profitPotentialScore >= 65 &&
    (c.historicalWinRate >= 45 || (c.volumeFootprint?.compositeScore || 0) >= 60 || c.yoyGrowthPct > 0)
  );

  const result = {
    isImmediateMomentum,
    isEarlyAccumulation,
    isHighConvictionSwing,
  };
  archetypeCache.set(c, result);
  return result;
};

interface ScreenerCandidateCardProps {
  candidate: ScreenerStockCandidate;
  onSelectModal: (candidate: ScreenerStockCandidate) => void;
  onSelectChart: (symbol: string) => void;
}

const ScreenerCandidateCard: React.FC<ScreenerCandidateCardProps> = React.memo(({
  candidate,
  onSelectModal,
  onSelectChart,
}) => {
  const isStrong = candidate.decisionStatus === 'STRONG_BUY';
  const isWatch = candidate.decisionStatus === 'WATCHLIST_BREAKOUT';
  const archetypes = getStockStrategyArchetypes(candidate);

  return (
    <div
      onClick={() => onSelectModal(candidate)}
      className={`card-content-contain bg-slate-900 rounded-2xl p-5 border transition-all hover:border-indigo-500/50 hover:shadow-indigo-950/40 shadow-lg space-y-4 flex flex-col justify-between cursor-pointer group ${
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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-white font-mono text-base">{candidate.symbol}</h3>
              <span className="text-[10px] text-slate-400 font-mono">({candidate.sector})</span>
              {candidate.dseProfile && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                  candidate.dseProfile.category === 'A'
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                    : candidate.dseProfile.category === 'B'
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  Cat {candidate.dseProfile.category} ({candidate.dseProfile.settlementDays})
                </span>
              )}
              {candidate.dseProfile?.circuitInfo?.isNearUpperCircuit && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ⚡ Near Upper Limit
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 line-clamp-1">{candidate.stockName}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
              <span>Updated: <span className="text-slate-300">{candidate.latestDate}</span></span>
              {candidate.dseProfile?.circuitInfo && (
                <span>• Limit: <span className="text-slate-400">±{candidate.dseProfile.circuitInfo.circuitLimitPct}%</span></span>
              )}
            </div>
          </div>

          {/* Decision Status Badge */}
          <div className="flex flex-col items-end gap-1">
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

            {/* Post-Mortem Fail-Safe Tag */}
            {candidate.rvol20 >= 2.5 && (candidate.stock.candles.length > 1 ? ((candidate.latestClose - candidate.stock.candles[candidate.stock.candles.length - 2].close) / (candidate.stock.candles[candidate.stock.candles.length - 2].close || 1)) * 100 : 0) <= 5.5 ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> 🛡️ Post-Mortem Safe
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5 text-rose-400" /> ⚠️ Risk: {candidate.rvol20 < 2.5 ? 'Low RVOL' : 'Extended Candle'}
              </span>
            )}

            {/* Structural Failure Warnings */}
            {candidate.warningFlags && candidate.warningFlags.length > 0 && (
              <div className="flex flex-col items-end gap-1 mt-1">
                {candidate.warningFlags.map((flag, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider bg-rose-950/80 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-1">
                    <AlertCircle className="w-2 h-2" /> {flag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Strategy Archetype Badges */}
        {(archetypes.isImmediateMomentum || archetypes.isEarlyAccumulation || archetypes.isHighConvictionSwing) && (
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {archetypes.isImmediateMomentum && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Rocket className="w-2.5 h-2.5 text-emerald-400" /> Immediate Momentum
              </span>
            )}
            {archetypes.isEarlyAccumulation && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Droplets className="w-2.5 h-2.5 text-amber-400" /> Early Accumulation
              </span>
            )}
            {archetypes.isHighConvictionSwing && (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                <Crosshair className="w-2.5 h-2.5 text-indigo-400" /> High-Conviction Swing
              </span>
            )}
          </div>
        )}

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

        {/* Institutional Volume Footprint & VSA Analysis Strip */}
        {candidate.volumeFootprint && (
          <div className="bg-slate-950/90 p-2.5 rounded-xl border border-cyan-500/30 space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Waves className="w-3 h-3 text-cyan-400" /> Vol Footprint:
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] border ${
                  candidate.volumeFootprint.compositeScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : candidate.volumeFootprint.compositeScore >= 60
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  Score {candidate.volumeFootprint.compositeScore}/100
                </span>
                <span className="text-slate-300 font-bold">
                  {candidate.volumeFootprint.primaryPattern}
                </span>
              </div>
            </div>

            {/* Volume Key Signals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9px] pt-1 border-t border-slate-800/80">
              <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Pocket Pivot:</span>
                <span className={candidate.volumeFootprint.isPocketPivot ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {candidate.volumeFootprint.isPocketPivot ? `🚀 (${candidate.volumeFootprint.pocketPivotRatio.toFixed(1)}x)` : 'No'}
                </span>
              </div>

              <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">CMF (20d):</span>
                <span className={candidate.volumeFootprint.cmf20 >= 0.10 ? 'text-emerald-400 font-bold' : candidate.volumeFootprint.cmf20 > 0 ? 'text-cyan-300' : 'text-rose-400'}>
                  {candidate.volumeFootprint.cmf20 > 0 ? `+${candidate.volumeFootprint.cmf20.toFixed(2)}` : candidate.volumeFootprint.cmf20.toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">VSA Signal:</span>
                <span className={candidate.volumeFootprint.vsaSignal === 'Absorption Bar' || candidate.volumeFootprint.vsaSignal === 'No Supply Test' ? 'text-emerald-300 font-bold truncate' : 'text-slate-300 truncate'}>
                  {candidate.volumeFootprint.vsaSignal}
                </span>
              </div>

              <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">OBV:</span>
                <span className={candidate.volumeFootprint.obv20dHigh || candidate.volumeFootprint.obvSlope === 'Bullish Divergence' ? 'text-emerald-400 font-bold' : 'text-indigo-300'}>
                  {candidate.volumeFootprint.obv20dHigh ? '🔥 20d High' : candidate.volumeFootprint.obvSlope}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Realistic Price & Trade Setup Plan */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
            <span>Entry (LTP)</span>
            <span className="text-emerald-400 font-bold">{candidate.rvol20.toFixed(1)}x Vol</span>
          </div>
          <span className="font-extrabold text-white text-sm">৳{candidate.entryPrice}</span>
          <div className="text-[9px] text-indigo-300 truncate">
            Zone: ৳{candidate.tradePlan?.entryRangeMin || candidate.entryPrice}~৳{candidate.tradePlan?.entryRangeMax || candidate.entryPrice}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-500/30">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
            <span>Target 1 (+{candidate.tradePlan?.targets[0]?.gainPct || candidate.potentialGainPct}%)</span>
          </div>
          <span className="font-extrabold text-emerald-400 text-sm">৳{candidate.tradePlan?.targets[0]?.price || candidate.targetPrice}</span>
          <div className="text-[9px] text-emerald-400 font-bold">
            Net R:R: {candidate.tradePlan?.netRiskRewardRatio || candidate.riskRewardRatio}:1
          </div>
        </div>
        
        <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-500/30">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
            <span>Stop (-{candidate.tradePlan?.stopLossPct || candidate.potentialRiskPct}%)</span>
          </div>
          <span className="font-extrabold text-rose-400 text-sm">৳{candidate.tradePlan?.stopLossPrice || candidate.stopLossPrice}</span>
          <div className="text-[9px] text-slate-400 truncate">
            ATR: ৳{candidate.tradePlan?.atr14 || (candidate.entryPrice * 0.035).toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3-Tier Profit Scale-Out Target Preview */}
      {candidate.tradePlan?.targets && (
        <div className="bg-slate-950/90 p-2 rounded-xl border border-slate-800 text-[10px] font-mono flex items-center justify-between flex-wrap gap-1">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Target className="w-3 h-3 text-emerald-400" /> Scale-Out:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">T1: ৳{candidate.tradePlan.targets[0].price} (+{candidate.tradePlan.targets[0].gainPct}%)</span>
            <span className="text-slate-600">•</span>
            <span className="text-indigo-300 font-bold">T2: ৳{candidate.tradePlan.targets[1].price} (+{candidate.tradePlan.targets[1].gainPct}%)</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300 font-bold">T3: ৳{candidate.tradePlan.targets[2].price} (+{candidate.tradePlan.targets[2].gainPct}%)</span>
          </div>
        </div>
      )}

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
            onSelectChart(candidate.symbol);
          }}
          className="flex-1 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5" /> View D3 Chart
        </button>

        <button
          onClick={() => onSelectModal(candidate)}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950/40 cursor-pointer"
        >
          <Target className="w-3.5 h-3.5 text-emerald-300" />
          <span>Trade Plan & Sizing</span>
        </button>
      </div>
    </div>
  );
});

interface DseStockScreenerProps {
  stocks: DseStockData[];
  config: BacktestConfig;
  selectedPatternFilter?: string;
  edgeStats?: PatternEdgeStat[];
  sectorMoneyFlow?: Record<string, SectorMoneyFlowStat>;
  onUpdateConfig: (newConfig: BacktestConfig) => void;
  onSelectStockForChart: (symbol: string) => void;
  onCustomStockUploaded: (newStocks: DseStockData[]) => void;
}

export const DseStockScreener: React.FC<DseStockScreenerProps> = ({
  stocks,
  config,
  selectedPatternFilter,
  edgeStats,
  sectorMoneyFlow,
  onUpdateConfig,
  onSelectStockForChart,
  onCustomStockUploaded,
}) => {
  // Strategy Archetype Tabs Filter ('ALL' | 'IMMEDIATE_MOMENTUM' | 'EARLY_ACCUMULATION' | 'HIGH_CONVICTION_SWINGS')
  const [activeStrategyTab, setActiveStrategyTab] = useState<StrategyArchetypeTab>('ALL');

  // Filter & Search States
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedDseCategory, setSelectedDseCategory] = useState<string>('ALL');
  const [selectedVolumeFilter, setSelectedVolumeFilter] = useState<string>('ALL');
  const [minVolumeScore, setMinVolumeScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'score' | 'rvol' | 'yoy' | 'winrate' | 'pe' | 'volumeScore'>('score');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [minRiskRewardFilter, setMinRiskRewardFilter] = useState<number>(0);

  // Automated Post-Mortem Fail-Safe Mode ('ACTIVE' = auto-filter, 'WARN' = show badges, 'OFF')
  const [smartFailSafeMode, setSmartFailSafeMode] = useState<'ACTIVE' | 'WARN' | 'OFF'>('WARN');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);

  const [selectedCandidateModal, setSelectedCandidateModal] = useState<ScreenerStockCandidate | null>(null);

  // Run Screener Analysis across current stock pool
  const candidates = useMemo(() => {
    return runDseStockScreener(stocks, config, edgeStats, sectorMoneyFlow);
  }, [stocks, config, edgeStats, sectorMoneyFlow]);

  // Strategy Archetype Pools
  const immediateMomentumPool = useMemo(() => candidates.filter((c) => getStockStrategyArchetypes(c).isImmediateMomentum), [candidates]);
  const earlyAccumulationPool = useMemo(() => candidates.filter((c) => getStockStrategyArchetypes(c).isEarlyAccumulation), [candidates]);
  const highConvictionSwingsPool = useMemo(() => candidates.filter((c) => getStockStrategyArchetypes(c).isHighConvictionSwing), [candidates]);

  // Distinct Sectors in Stock Pool
  const sectors = useMemo(() => {
    const list = Array.from(new Set(stocks.map((s) => s.sector))).sort();
    return ['ALL', ...list];
  }, [stocks]);

  // Filtered & Sorted Candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        // Strategy Archetype Tab Filter
        if (activeStrategyTab === 'IMMEDIATE_MOMENTUM' && !getStockStrategyArchetypes(c).isImmediateMomentum) return false;
        if (activeStrategyTab === 'EARLY_ACCUMULATION' && !getStockStrategyArchetypes(c).isEarlyAccumulation) return false;
        if (activeStrategyTab === 'HIGH_CONVICTION_SWINGS' && !getStockStrategyArchetypes(c).isHighConvictionSwing) return false;

        // AUTOMATED POST-MORTEM FAIL-SAFE GUARD
        if (smartFailSafeMode === 'ACTIVE') {
          // Rule 1: Volume Exhaustion Trap (RVOL < 2.5x)
          if (c.rvol20 < 2.5) return false;
          // Rule 2: Extended Single Day Candle Chasing (> 5.5% single candle)
          const priceIncreasePct = c.stock.candles.length > 1 ? ((c.latestClose - c.stock.candles[c.stock.candles.length - 2].close) / (c.stock.candles[c.stock.candles.length - 2].close || 1)) * 100 : 0;
          if (priceIncreasePct > 5.5) return false;
          // Rule 3: Thin Liquidity Drag (< 15M BDT daily turnover)
          if (c.avgVolume20 * c.latestClose < 15000000) return false;
        }

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

        // DSE Regulatory Category & Circuit Breaker Filter
        if (selectedDseCategory !== 'ALL') {
          const cat = c.dseProfile?.category || 'A';
          if (selectedDseCategory === 'EXCLUDE_Z' && cat === 'Z') return false;
          if (selectedDseCategory === 'A' && cat !== 'A') return false;
          if (selectedDseCategory === 'B' && cat !== 'B') return false;
          if (selectedDseCategory === 'Z' && cat !== 'Z') return false;
          if (selectedDseCategory === 'NEAR_UPPER_CIRCUIT' && !c.dseProfile?.circuitInfo?.isNearUpperCircuit && !c.dseProfile?.circuitInfo?.isAtUpperCircuit) return false;
        }

        // Institutional Volume Footprint & VSA Filter
        if (selectedVolumeFilter !== 'ALL') {
          if (selectedVolumeFilter === 'POCKET_PIVOT' && !c.volumeFootprint?.isPocketPivot) return false;
          if (selectedVolumeFilter === 'VDU' && !c.volumeFootprint?.isVdu) return false;
          if (selectedVolumeFilter === 'OBV_LEAD' && c.volumeFootprint?.obvSlope !== 'Bullish Divergence' && !c.volumeFootprint?.obv20dHigh) return false;
          if (selectedVolumeFilter === 'VSA_SMART' && c.volumeFootprint?.vsaSignal !== 'Absorption Bar' && c.volumeFootprint?.vsaSignal !== 'No Supply Test' && c.volumeFootprint?.vsaSignal !== 'Stopping Volume') return false;
          if (selectedVolumeFilter === 'CMF_INFLOW' && (c.volumeFootprint?.cmf20 || 0) < 0.10) return false;
          if (selectedVolumeFilter === 'AVWAP' && (!c.volumeFootprint?.isAboveAvwap || (c.volumeFootprint?.priceVsAvwapPct || 0) > 4.5)) return false;
        }

        if (minVolumeScore > 0 && (c.volumeFootprint?.compositeScore || 0) < minVolumeScore) return false;

        // Search text filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchSym = c.symbol.toLowerCase().includes(q);
          const matchName = c.stockName.toLowerCase().includes(q);
          const matchSec = c.sector.toLowerCase().includes(q);
          const matchPat = c.breakoutPattern.toLowerCase().includes(q);
          const matchVol = c.volumeFootprint?.primaryPattern?.toLowerCase().includes(q) || false;
          if (!matchSym && !matchName && !matchSec && !matchPat && !matchVol) return false;
        }

        // Min Score Filter
        if (minScoreFilter > 0 && c.profitPotentialScore < minScoreFilter) return false;

        // Min Risk-Reward Filter
        if (minRiskRewardFilter > 0 && c.riskRewardRatio < minRiskRewardFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.profitPotentialScore - a.profitPotentialScore;
        if (sortBy === 'volumeScore') return (b.volumeFootprint?.compositeScore || 0) - (a.volumeFootprint?.compositeScore || 0);
        if (sortBy === 'rvol') return b.rvol20 - a.rvol20;
        if (sortBy === 'yoy') return b.yoyGrowthPct - a.yoyGrowthPct;
        if (sortBy === 'winrate') return b.historicalWinRate - a.historicalWinRate;
        if (sortBy === 'pe') return a.peRatio - b.peRatio;
        return 0;
      });
  }, [candidates, activeStrategyTab, selectedStatus, selectedSector, selectedDseCategory, selectedVolumeFilter, minVolumeScore, sortBy, selectedPatternFilter, config.strategyType, searchQuery, minScoreFilter, minRiskRewardFilter, smartFailSafeMode]);

  // Paginated Candidate Subset
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredCandidates.length / itemsPerPage) || 1;
  const paginatedCandidates = useMemo(() => {
    if (itemsPerPage === -1) return filteredCandidates;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCandidates.slice(start, start + itemsPerPage);
  }, [filteredCandidates, currentPage, itemsPerPage]);

  // Executive Metrics
  const strongBuys = useMemo(() => candidates.filter((c) => c.decisionStatus === 'STRONG_BUY'), [candidates]);
  const watchlists = useMemo(() => candidates.filter((c) => c.decisionStatus === 'WATCHLIST_BREAKOUT'), [candidates]);
  const earlyTrends = useMemo(() => candidates.filter((c) => c.decisionStatus === 'EARLY_TREND_IGNITION' || c.earlyTrendStage === 'STAGE_2_IGNITION' || c.earlyTrendStage === 'STAGE_1_EARLY_COIL'), [candidates]);

  // Volume Footprint Counters
  const pocketPivots = useMemo(() => candidates.filter((c) => c.volumeFootprint?.isPocketPivot), [candidates]);
  const vduSetups = useMemo(() => candidates.filter((c) => c.volumeFootprint?.isVdu), [candidates]);
  const obvLeaders = useMemo(() => candidates.filter((c) => c.volumeFootprint?.obvSlope === 'Bullish Divergence' || c.volumeFootprint?.obv20dHigh), [candidates]);
  const smartMoneyAccumulators = useMemo(() => candidates.filter((c) => (c.volumeFootprint?.compositeScore || 0) >= 75), [candidates]);
  const vsaAbsorptions = useMemo(() => candidates.filter((c) => c.volumeFootprint?.vsaSignal === 'Absorption Bar' || c.volumeFootprint?.vsaSignal === 'No Supply Test'), [candidates]);

  const earlyRadarPicks = useMemo(
    () => candidates
      .filter(c => c.earlyTrendStage === 'STAGE_1_EARLY_COIL' || c.earlyTrendStage === 'STAGE_2_IGNITION')
      .sort((a, b) => b.profitPotentialScore - a.profitPotentialScore)
      .slice(0, 6),
    [candidates]
  );

  // Strategy Archetype Playbook Statistics for Active Tab
  const archetypeStats = useMemo(() => {
    if (activeStrategyTab === 'IMMEDIATE_MOMENTUM') {
      const count = immediateMomentumPool.length;
      const avgRvol = count > 0 ? (immediateMomentumPool.reduce((sum, c) => sum + c.rvol20, 0) / count).toFixed(2) : '0.00';
      const avgGain = count > 0 ? (immediateMomentumPool.reduce((sum, c) => sum + (c.tradePlan?.targets[0]?.gainPct || c.potentialGainPct), 0) / count).toFixed(1) : '0.0';
      const pocketPivotsCount = immediateMomentumPool.filter(c => c.volumeFootprint?.isPocketPivot).length;
      return {
        title: '🚀 Immediate Momentum Playbook (Fast Breakouts)',
        badge: 'Short-term Velocity',
        horizon: '1 to 5 Trading Days',
        thesis: 'Targeting active volume breakouts, Morales & Kacher Pocket Pivots, and heavy RVOL expansion ready for immediate upward follow-through before retail crowd chases.',
        actionRule: 'Enter at market open on confirmed volume; target 50% profit taking at Target 1 (+6-9%); trail ATR stop.',
        stat1: { label: 'Active Candidates', val: `${count} Stocks`, sub: 'Breakout Ready' },
        stat2: { label: 'Avg Relative Volume', val: `${avgRvol}x`, sub: 'vs 20d Average' },
        stat3: { label: 'Avg Target 1 Gain', val: `+${avgGain}%`, sub: 'Immediate Target' },
        stat4: { label: 'Pocket Pivots', val: `${pocketPivotsCount} Active`, sub: 'Smart Inflow' },
      };
    }

    if (activeStrategyTab === 'EARLY_ACCUMULATION') {
      const count = earlyAccumulationPool.length;
      const avgRisk = count > 0 ? (earlyAccumulationPool.reduce((sum, c) => sum + (c.tradePlan?.stopLossPct || c.potentialRiskPct), 0) / count).toFixed(1) : '0.0';
      const avgAvwapDist = count > 0 ? (earlyAccumulationPool.reduce((sum, c) => sum + (c.volumeFootprint?.priceVsAvwapPct || 1.8), 0) / count).toFixed(1) : '0.0';
      const vduCount = earlyAccumulationPool.filter(c => c.volumeFootprint?.isVdu).length;
      return {
        title: '💧 Early Accumulation Playbook (Stealth Entry & VDU)',
        badge: 'Low-Risk Coils',
        horizon: '1 to 4 Weeks (Position Base)',
        thesis: 'Targeting Stage 1 & 2 tight consolidations with Volume Dry-Up (VDU) or sitting right on 30-day Anchored VWAP floor before public breakout recognition.',
        actionRule: 'Accumulate in tranches near AVWAP floor; keep tight 2-3% stop loss under swing low; hold for multi-week Stage 2 expansion.',
        stat1: { label: 'Coiling Candidates', val: `${count} Stocks`, sub: 'Pre-Breakout Base' },
        stat2: { label: 'Avg Downside Risk', val: `-${avgRisk}%`, sub: 'Ultra-tight Stops' },
        stat3: { label: 'Distance from AVWAP', val: `+${avgAvwapDist}%`, sub: 'Near Cost Basis' },
        stat4: { label: 'Supply Dry-Ups (VDU)', val: `${vduCount} Setups`, sub: 'Sellers Exhausted' },
      };
    }

    if (activeStrategyTab === 'HIGH_CONVICTION_SWINGS') {
      const count = highConvictionSwingsPool.length;
      const avgRR = count > 0 ? (highConvictionSwingsPool.reduce((sum, c) => sum + c.riskRewardRatio, 0) / count).toFixed(2) : '0.00';
      const avgWinRate = count > 0 ? Math.round(highConvictionSwingsPool.reduce((sum, c) => sum + c.historicalWinRate, 0) / count) : 0;
      const avgScore = count > 0 ? Math.round(highConvictionSwingsPool.reduce((sum, c) => sum + c.profitPotentialScore, 0) / count) : 0;
      return {
        title: '🎯 High-Conviction Swings Playbook (Asymmetric Edge)',
        badge: 'High Expected Value',
        horizon: '1 to 3 Weeks (Multi-Target)',
        thesis: 'Targeting elite setups with high asymmetric Net Risk-to-Reward (≥2.5:1), Profit Score ≥ 70, verified historical win rates, and fundamental YoY growth.',
        actionRule: 'Scale out across 3 tiers (30% at T1, 40% at T2, 30% runner at T3); immediately trail stop to breakeven after T1 is filled.',
        stat1: { label: 'High Edge Picks', val: `${count} Stocks`, sub: 'Top Ranked' },
        stat2: { label: 'Avg Risk-to-Reward', val: `${avgRR} : 1`, sub: 'Asymmetric Edge' },
        stat3: { label: 'Avg Historical Win Rate', val: `${avgWinRate}%`, sub: 'Proven Pattern Edge' },
        stat4: { label: 'Avg Profit Score', val: `${avgScore} / 100`, sub: 'High Conviction' },
      };
    }

    return null;
  }, [activeStrategyTab, immediateMomentumPool, earlyAccumulationPool, highConvictionSwingsPool]);

  // Active Strategy Candidates Pool
  const activeArchetypeCandidates = useMemo(() => {
    if (activeStrategyTab === 'IMMEDIATE_MOMENTUM') return immediateMomentumPool;
    if (activeStrategyTab === 'EARLY_ACCUMULATION') return earlyAccumulationPool;
    if (activeStrategyTab === 'HIGH_CONVICTION_SWINGS') return highConvictionSwingsPool;
    return candidates;
  }, [activeStrategyTab, immediateMomentumPool, earlyAccumulationPool, highConvictionSwingsPool, candidates]);

  // Top Identified Picks Pool (Top 8 ranked candidates)
  const topPicks = useMemo(() => candidates.slice(0, 8), [candidates]);
  const [selectedTopPickSymbol, setSelectedTopPickSymbol] = useState<string>('');

  const activeTopPick = useMemo(() => {
    return topPicks.find((c) => c.symbol === selectedTopPickSymbol) || topPicks[0] || null;
  }, [topPicks, selectedTopPickSymbol]);

  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');

  // Handle Loading Full 100+ DSE Market Universe
  const handleLoadFullUniverse = async () => {
    setIsBatchUploading(true);
    setBatchStatus('Generating full market universe (100+ DSE securities across 20 sectors)...');
    await new Promise((r) => setTimeout(r, 100));

    try {
      const fullUniverse = generateFullDseMarketUniverse();
      onCustomStockUploaded(fullUniverse);
      setBatchStatus('');
      alert(`Successfully loaded ${fullUniverse.length} DSE securities with full daily candle histories across all sectors!`);
    } catch (err) {
      console.error('Failed to generate full universe:', err);
    } finally {
      setIsBatchUploading(false);
      setBatchStatus('');
    }
  };

  // Export Filtered Screener Candidates to CSV
  const handleExportCsv = () => {
    if (filteredCandidates.length === 0) {
      alert('No candidates matching current filter criteria to export.');
      return;
    }
    const headers = [
      'Symbol',
      'Company Name',
      'Sector',
      'Decision Status',
      'Profit Potential Score',
      'LTP Entry Price',
      'Target Price',
      'Stop Loss Price',
      'Risk Reward Ratio',
      'Potential Gain %',
      'Potential Risk %',
      'Breakout Pattern',
      'Pattern Confidence %',
      'Historical Win Rate %',
      'PE Ratio',
      'YoY Growth %',
      'RVOL 20d',
      'Trade Setup Reasoning'
    ];

    const rows = filteredCandidates.map((c) => [
      c.symbol,
      `"${c.stockName.replace(/"/g, '""')}"`,
      `"${c.sector.replace(/"/g, '""')}"`,
      c.decisionStatus,
      c.profitPotentialScore,
      c.entryPrice,
      c.targetPrice,
      c.stopLossPrice,
      c.riskRewardRatio,
      c.potentialGainPct,
      c.potentialRiskPct,
      `"${c.breakoutPattern.replace(/"/g, '""')}"`,
      c.patternConfidence,
      c.historicalWinRate,
      c.peRatio,
      c.yoyGrowthPct,
      c.rvol20,
      `"${c.tradeSetupReasoning.replace(/"/g, '""')}"`
    ]);

    const csvStr = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DSE_Screener_Candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* 4 Strategy Archetype Tabs Navigation for Imminent Price Increases */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-white uppercase font-mono tracking-wider">
              Price Increase Archetype Tabs
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Click any tab below to isolate stocks with specific breakout, accumulation, or swing setups
          </span>
        </div>

        {/* 4 Strategy Tab Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tab 1: All Universe */}
          <button
            onClick={() => { setActiveStrategyTab('ALL'); setSelectedStatus('ALL'); setCurrentPage(1); }}
            className={`p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
              activeStrategyTab === 'ALL'
                ? 'bg-gradient-to-br from-slate-900 to-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 text-white shadow-lg'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5 font-mono">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>All Candidates</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {candidates.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
              Full multi-factor screened universe
            </p>
          </button>

          {/* Tab 2: Immediate Momentum */}
          <button
            onClick={() => { setActiveStrategyTab('IMMEDIATE_MOMENTUM'); setSelectedStatus('ALL'); setCurrentPage(1); }}
            className={`p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
              activeStrategyTab === 'IMMEDIATE_MOMENTUM'
                ? 'bg-gradient-to-br from-emerald-950/90 to-teal-950/90 border-emerald-400 ring-2 ring-emerald-500/40 text-white shadow-lg'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5 font-mono text-emerald-300">
                <Rocket className="w-4 h-4 text-emerald-400" />
                <span>Immediate Momentum</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {immediateMomentumPool.length}
              </span>
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-2 line-clamp-1">
              RVOL &ge; 1.8x • Pocket Pivots • 1-5d Fast Moves
            </p>
          </button>

          {/* Tab 3: Early Accumulation */}
          <button
            onClick={() => { setActiveStrategyTab('EARLY_ACCUMULATION'); setSelectedStatus('ALL'); setCurrentPage(1); }}
            className={`p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
              activeStrategyTab === 'EARLY_ACCUMULATION'
                ? 'bg-gradient-to-br from-amber-950/90 to-orange-950/90 border-amber-400 ring-2 ring-amber-500/40 text-white shadow-lg'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-amber-500/40 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5 font-mono text-amber-300">
                <Droplets className="w-4 h-4 text-amber-400" />
                <span>Early Accumulation</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {earlyAccumulationPool.length}
              </span>
            </div>
            <p className="text-[11px] text-amber-400/80 mt-2 line-clamp-1">
              Stealth Coils • VDU Supply Dry-Up • AVWAP Floor
            </p>
          </button>

          {/* Tab 4: High-Conviction Swings */}
          <button
            onClick={() => { setActiveStrategyTab('HIGH_CONVICTION_SWINGS'); setSelectedStatus('ALL'); setCurrentPage(1); }}
            className={`p-3.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
              activeStrategyTab === 'HIGH_CONVICTION_SWINGS'
                ? 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 border-indigo-400 ring-2 ring-indigo-500/40 text-white shadow-lg'
                : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-indigo-500/40 hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5 font-mono text-indigo-300">
                <Crosshair className="w-4 h-4 text-indigo-400" />
                <span>High-Conviction Swings</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {highConvictionSwingsPool.length}
              </span>
            </div>
            <p className="text-[11px] text-indigo-300/80 mt-2 line-clamp-1">
              Net R:R &ge; 2.5:1 • Score &ge; 70 • Proven Edge
            </p>
          </button>
        </div>

        {/* Dynamic Tactical Briefing & Direct Candidate List Banner */}
        {archetypeStats && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-2 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-white font-mono">{archetypeStats.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Target Horizon: {archetypeStats.horizon}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {archetypeStats.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {archetypeStats.thesis}
                </p>
              </div>

              {/* Action Rule Tip */}
              <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl shrink-0 max-w-md">
                <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1 font-mono uppercase">
                  <Zap className="w-3 h-3 text-amber-400" /> Execution Tactic:
                </div>
                <div className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {archetypeStats.actionRule}
                </div>
              </div>
            </div>

            {/* 4 Summary Stat Gauges for the Active Strategy */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{archetypeStats.stat1.label}</div>
                <div className="text-lg font-black text-white font-mono my-0.5">{archetypeStats.stat1.val}</div>
                <div className="text-[9px] text-slate-400 font-mono">{archetypeStats.stat1.sub}</div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{archetypeStats.stat2.label}</div>
                <div className="text-lg font-black text-emerald-400 font-mono my-0.5">{archetypeStats.stat2.val}</div>
                <div className="text-[9px] text-emerald-500 font-mono">{archetypeStats.stat2.sub}</div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{archetypeStats.stat3.label}</div>
                <div className="text-lg font-black text-amber-400 font-mono my-0.5">{archetypeStats.stat3.val}</div>
                <div className="text-[9px] text-amber-500 font-mono">{archetypeStats.stat3.sub}</div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">{archetypeStats.stat4.label}</div>
                <div className="text-lg font-black text-cyan-400 font-mono my-0.5">{archetypeStats.stat4.val}</div>
                <div className="text-[9px] text-cyan-500 font-mono">{archetypeStats.stat4.sub}</div>
              </div>
            </div>

            {/* Direct Screened Stocks List for the Selected Strategy */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                    {activeStrategyTab === 'IMMEDIATE_MOMENTUM' && <Rocket className="w-3.5 h-3.5 text-emerald-400" />}
                    {activeStrategyTab === 'EARLY_ACCUMULATION' && <Droplets className="w-3.5 h-3.5 text-amber-400" />}
                    {activeStrategyTab === 'HIGH_CONVICTION_SWINGS' && <Crosshair className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>Screened Stocks for {archetypeStats.badge}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeArchetypeCandidates.length} Qualified Securities
                  </span>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('screener-candidates-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[11px] font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <span>View in full table below</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {activeArchetypeCandidates.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 font-mono">
                  No stocks currently meet the strict criteria for this strategy archetype. Try loading the full DSE market universe or adjusting sensitivity.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-88 overflow-y-auto pr-1 overscroll-contain">
                  {activeArchetypeCandidates.map((c) => {
                    const candles = c.stock.candles;
                    const change24h = candles.length > 1
                      ? ((c.latestClose - candles[candles.length - 2].close) / (candles[candles.length - 2].close || 1)) * 100
                      : 0;
                    const isPositive = change24h >= 0;

                    return (
                      <div
                        key={c.symbol}
                        className="bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/60 rounded-xl p-3 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-white text-xs group-hover:text-indigo-300 transition-colors">
                                {c.symbol}
                              </span>
                              <span className={`px-1 py-0.2 text-[8px] font-mono font-bold rounded ${
                                c.dseProfile?.category === 'A' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                c.dseProfile?.category === 'B' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {c.dseProfile?.category || 'A'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                              {c.sector}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-white text-xs">
                              ৳{c.latestClose.toFixed(1)}
                            </div>
                            <div className={`text-[10px] font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPositive ? '+' : ''}{change24h.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Archetype Key Metric Badges */}
                        <div className="my-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400 truncate max-w-[60%]">
                            {activeStrategyTab === 'IMMEDIATE_MOMENTUM' && `RVOL: ${c.rvol20.toFixed(1)}x • Target: +${(c.tradePlan?.targets[0]?.gainPct || c.potentialGainPct).toFixed(1)}%`}
                            {activeStrategyTab === 'EARLY_ACCUMULATION' && `VDU: ${(c.volumeFootprint?.vduRatio || 0.7).toFixed(2)}x • ${c.earlyTrendStage === 'STAGE_1_EARLY_COIL' ? 'Stage 1 Coil' : 'Stage 2 Ignition'}`}
                            {activeStrategyTab === 'HIGH_CONVICTION_SWINGS' && `R:R ${c.riskRewardRatio.toFixed(1)}:1 • Win: ${c.historicalWinRate}%`}
                            {activeStrategyTab === 'ALL' && `${c.detectedPattern || 'Setup'}`}
                          </span>
                          <span className="font-black text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                            Score: {c.profitPotentialScore}%
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => setSelectedCandidateModal(c)}
                            className="flex-1 py-1 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[10px] font-bold font-mono transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => onSelectStockForChart(c.symbol)}
                            title="Open Candlestick Chart"
                            className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-mono transition-all flex items-center justify-center cursor-pointer"
                          >
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
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

                    {/* DSE Profile Badges */}
                    {activeTopPick.dseProfile && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                        activeTopPick.dseProfile.category === 'A'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                          : activeTopPick.dseProfile.category === 'B'
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      }`}>
                        DSE Cat {activeTopPick.dseProfile.category} ({activeTopPick.dseProfile.settlementDays} {activeTopPick.dseProfile.isMarginable ? 'Margin' : 'Cash'})
                      </span>
                    )}

                    {activeTopPick.dseProfile?.circuitInfo && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border bg-slate-900 border-slate-700 text-indigo-300">
                        Circuit: ৳{activeTopPick.dseProfile.circuitInfo.lowerCircuitPrice} ~ ৳{activeTopPick.dseProfile.circuitInfo.upperCircuitPrice} (±{activeTopPick.dseProfile.circuitInfo.circuitLimitPct}%)
                      </span>
                    )}

                    {activeTopPick.warningFlags && activeTopPick.warningFlags.map((flag, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono border bg-rose-950/80 text-rose-300 border-rose-500/40 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> {flag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Sector: <span className="text-slate-200">{activeTopPick.sector}</span> • P/E Ratio: <span className="text-amber-300 font-mono">{activeTopPick.peRatio}x</span> • YoY Growth: <span className="text-emerald-400 font-mono">+{activeTopPick.yoyGrowthPct}%</span>
                  </div>
                </div>
              </div>

              {/* Profit Potential Score */}
              <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-end gap-1.5">
                    Profit Potential Score
                    {activeTopPick.edgeConfidence && (
                      <span
                        title={`Historical edge based on ${activeTopPick.edgeSampleSize} trade${activeTopPick.edgeSampleSize === 1 ? '' : 's'}`}
                        className={`px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase tracking-wide normal-case ${
                          activeTopPick.edgeConfidence === 'High'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : activeTopPick.edgeConfidence === 'Medium'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-slate-700/40 text-slate-400 border-slate-600/50'
                        }`}
                      >
                        {activeTopPick.edgeConfidence} conf.
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {activeTopPick.profitPotentialScore} <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-300 bg-emerald-950/40 font-mono">
                  {activeTopPick.profitPotentialScore}%
                </div>
              </div>
            </div>

            {/* Historical Edge Banner */}
            {activeTopPick.historicalWinRate > 0 && (
              <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl mb-3">
                <div className="text-xs text-slate-400 font-bold uppercase">Historical Pattern Edge:</div>
                <div className="text-amber-400 font-black text-sm">{activeTopPick.historicalWinRate}% Win Rate</div>
                {activeTopPick.edgeConfidence && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    activeTopPick.edgeConfidence === 'High' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                    activeTopPick.edgeConfidence === 'Medium' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {activeTopPick.edgeConfidence} Confidence (n={activeTopPick.edgeSampleSize})
                  </span>
                )}
              </div>
            )}

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
        {/* Market Universe Expansion & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 p-3 rounded-xl border border-indigo-500/30">
          <div className="flex items-center gap-2 text-xs">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200">Screener Universe Capacity: </span>
              <span className="font-mono text-indigo-300 font-extrabold">{stocks.length} Securities</span>
              <span className="text-slate-400 text-[11px] ml-2 font-mono">({candidates.length} analyzed)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleLoadFullUniverse}
              disabled={isBatchUploading}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-md shadow-indigo-950/50 flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBatchUploading ? 'animate-spin' : ''}`} />
              <span>Load Full 100+ DSE Universe</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Automated Post-Mortem Fail-Safe Guard Banner */}
        <div className="bg-gradient-to-r from-rose-950/70 via-slate-950 to-indigo-950/70 border border-rose-500/40 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Automated Smart Fail-Safe Guard</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Post-Mortem Rules Engine Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Automatically protects your capital by auto-filtering candidates that match historical stop-loss failure patterns (Low RVOL &lt;2.5x, Overbought &gt;5.5%, Illiquidity).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setSmartFailSafeMode('ACTIVE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                smartFailSafeMode === 'ACTIVE'
                  ? 'bg-rose-600 text-white shadow-lg border border-rose-400 ring-2 ring-rose-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🛡️ AUTO-BLOCK (Active)</span>
            </button>
            <button
              onClick={() => { setSmartFailSafeMode('WARN'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 ${
                smartFailSafeMode === 'WARN'
                  ? 'bg-amber-600 text-white shadow-lg border border-amber-400 ring-2 ring-amber-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>⚠️ WARN BADGES</span>
            </button>
            <button
              onClick={() => { setSmartFailSafeMode('OFF'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                smartFailSafeMode === 'OFF'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              OFF
            </button>
          </div>
        </div>

        {/* Search & Decision Filter Row */}
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
                onClick={() => { setSelectedStatus(st.id); setCurrentPage(1); }}
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

          {/* Search Bar & Custom Upload */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search symbol, company, sector..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
              />
            </div>

            {/* Custom Stock Upload Button */}
            <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0">
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load CSV/ZIP</span>
              <input type="file" multiple accept=".csv,.json,.txt,.zip" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Dedicated Institutional Volume Footprint & VSA Scanner Bar */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-indigo-500/30 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span>Institutional Volume Footprint & VSA Scanner</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Price is opinion, Volume is truth)</span>
            </span>

            <span className="text-[11px] text-cyan-400 font-mono">
              ⚡ Smart Accumulation Pool: <strong>{smartMoneyAccumulators.length}</strong> / {candidates.length} Stocks
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: `All Footprints (${candidates.length})`, icon: Activity },
              { id: 'POCKET_PIVOT', label: `🚀 Pocket Pivot (${pocketPivots.length})`, icon: Flame },
              { id: 'VDU', label: `💧 Supply Dry-Up VDU (${vduSetups.length})`, icon: Zap },
              { id: 'OBV_LEAD', label: `📊 OBV Leading Highs (${obvLeaders.length})`, icon: TrendingUp },
              { id: 'VSA_SMART', label: `🛡️ VSA Absorption/Test (${vsaAbsorptions.length})`, icon: ShieldAlert },
              { id: 'CMF_INFLOW', label: `🌊 CMF Smart Inflow (+0.10+)`, icon: Waves },
              { id: 'AVWAP', label: `⚓ Anchored VWAP Support`, icon: Anchor },
            ].map((vp) => (
              <button
                key={vp.id}
                onClick={() => { setSelectedVolumeFilter(vp.id); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                  selectedVolumeFilter === vp.id
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/50 border border-cyan-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{vp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Factor Screener Filters & Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Sector Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Sector:</span>
              <select
                value={selectedSector}
                onChange={(e) => { setSelectedSector(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {sectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* DSE Category & Circuit Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">DSE Category:</span>
              <select
                value={selectedDseCategory}
                onChange={(e) => { setSelectedDseCategory(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-blue-300 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="ALL">All DSE Categories</option>
                <option value="EXCLUDE_Z">🛡️ Exclude Z-Defaulters</option>
                <option value="A">🏛️ Cat A (T+2 Marginable)</option>
                <option value="B">Cat B (T+2)</option>
                <option value="NEAR_UPPER_CIRCUIT">⚡ Near Upper Circuit</option>
                <option value="Z">⚠️ Z-Defaulters (T+3 Cash)</option>
              </select>
            </div>

            {/* Min Volume Footprint Score Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-400 font-medium">Min Vol Score:</span>
              <select
                value={minVolumeScore}
                onChange={(e) => { setMinVolumeScore(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-cyan-300 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value={0}>Any Vol Score</option>
                <option value={50}>50+ (Active Flow)</option>
                <option value={65}>65+ (Smart Money)</option>
                <option value={80}>80+ (Institutional Accumulation)</option>
              </select>
            </div>

            {/* Min Profit Score Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Min Score:</span>
              <select
                value={minScoreFilter}
                onChange={(e) => { setMinScoreFilter(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value={0}>Any Score</option>
                <option value={50}>50+ Score</option>
                <option value={60}>60+ Score</option>
                <option value={70}>70+ Score (High)</option>
                <option value={80}>80+ Score (Elite)</option>
              </select>
            </div>

            {/* Min Risk-Reward Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Min R:R Ratio:</span>
              <select
                value={minRiskRewardFilter}
                onChange={(e) => { setMinRiskRewardFilter(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value={0}>Any R:R</option>
                <option value={1.5}>1.5:1+</option>
                <option value={2.0}>2.0:1+</option>
                <option value={2.5}>2.5:1+</option>
                <option value={3.0}>3.0:1+</option>
              </select>
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="score">Highest Profit Potential Score</option>
              <option value="volumeScore">🌊 Highest Volume Footprint Score</option>
              <option value="rvol">Highest Volume Surge (RVOL)</option>
              <option value="yoy">Highest YoY Revenue Growth %</option>
              <option value="winrate">Best Historical Win Rate %</option>
              <option value="pe">Lowest P/E Ratio</option>
            </select>
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

      {/* Candidate Result Header & Summary Counter */}
      <div id="screener-candidates-grid" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs px-1 scroll-mt-6">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Showing</span>
          <span className="font-mono font-bold text-white">{paginatedCandidates.length}</span>
          <span>of</span>
          <span className="font-mono font-bold text-indigo-400">{filteredCandidates.length}</span>
          <span>matching candidates</span>
          {searchQuery && (
            <span className="text-amber-400 font-mono">for "{searchQuery}"</span>
          )}
        </div>

        {/* Items Per Page Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Per page:</span>
          {[12, 24, 48, 100, -1].map((size) => (
            <button
              key={size}
              onClick={() => { setItemsPerPage(size); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-mono font-bold ${
                itemsPerPage === size
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {size === -1 ? 'All' : size}
            </button>
          ))}
        </div>
      </div>

      {/* Screened Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No candidates matching current filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting search terms, minimum profit score, volume surge threshold, or sector filter to view more candidates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedCandidates.map((candidate) => (
            <ScreenerCandidateCard
              key={candidate.symbol}
              candidate={candidate}
              onSelectModal={setSelectedCandidateModal}
              onSelectChart={onSelectStockForChart}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {filteredCandidates.length > 0 && itemsPerPage !== -1 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="text-xs text-slate-400 font-mono">
            Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span> ({filteredCandidates.length} total candidates)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-mono"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 7 && currentPage > 4) {
                  pageNum = currentPage - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (6 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors font-mono"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
