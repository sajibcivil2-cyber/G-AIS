import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart,
  Zap,
  Flame,
  HelpCircle,
  X,
  ChevronRight,
  Filter,
  Activity,
  Layers,
  Sparkles,
  ArrowUpDown,
  TrendingDown
} from 'lucide-react';
import { DseStockData } from '../types';

interface SectorMoneyFlowMatrixProps {
  stocks: DseStockData[];
  selectedSector: string;
  onSelectSector: (sector: string) => void;
}

export interface SectorAnalytics {
  sector: string;
  stockCount: number;
  current5dTurnoverCrores: number; // In BDT Crores (1 Crore = 10 Million BDT)
  baseline20dTurnoverCrores: number;
  moneyFlowExpansionRatio: number; // e.g. 2.15x
  marketMoneyFlowSharePct: number; // % of total market volume (5d)
  pastMarketSharePct: number; // % of total market volume (20d baseline)
  marketShareDelta: number; // Shift in market share (% points) vs baseline
  estimatedMarketCapCrores: number;
  turnoverVelocityPct: number;
  velocity3dPct: number; // Turnover / Market Cap ratio
  status: 'REPEATING_BREAKOUT' | 'ACCUMULATING' | 'CONSOLIDATING' | 'OUTFLOW';
  topMoverSymbol: string;
  topMoverGainPct: number;
}

export type SectorSortOption = 'EXPANSION' | 'MARKET_SHARE_DELTA' | 'TURNOVER' | 'TOP_MOVER';

export const SectorMoneyFlowMatrix: React.FC<SectorMoneyFlowMatrixProps> = ({
  stocks,
  selectedSector,
  onSelectSector,
}) => {
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<SectorSortOption>('EXPANSION');

  const [aiSectorLoading, setAiSectorLoading] = useState(false);
  const [aiSectorData, setAiSectorData] = useState<{
    narrativeTitle?: string;
    capitalRotationSummary?: string;
    dominantSectors?: string[];
    laggingSectors?: string[];
    marketBreadthWarning?: string;
  } | null>(null);

  const handleGenerateSectorNarrative = async () => {
    setAiSectorLoading(true);
    try {
      const stats = sectorAnalytics.slice(0, 8).map(s => ({
        sector: s.sector,
        totalTurnoverBdt: s.current5dTurnoverCrores * 10,
        marketSharePct: s.marketMoneyFlowSharePct,
        avgChangePct: s.topMoverGainPct,
        momentumScore: Math.round(s.moneyFlowExpansionRatio * 50)
      }));
      const res = await fetch('/api/gemini/sector-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectorStats: stats })
      });
      const data = await res.json();
      setAiSectorData(data);
    } catch (err) {
      console.error('Sector narrative error:', err);
    } finally {
      setAiSectorLoading(false);
    }
  };

  // Compute detailed sector analytics & money flow dynamics
  const sectorAnalytics = useMemo(() => {
    if (!stocks || stocks.length === 0) return [];

    const NON_EQUITY_SECTORS = new Set([
      'MUTUAL FUNDS',
      'MUTUAL FUND',
      'CORPORATE BOND',
      'TREASURY BOND',
      'BONDS',
      'DEBENTURES',
      'GOVT TREASURY BOND'
    ]);

    // 1. Gather all unique market trading dates across all valid stocks
    const allDatesSet = new Set<string>();
    stocks.forEach((s) => {
      if (!s.sector || NON_EQUITY_SECTORS.has(s.sector.toUpperCase())) return;
      (s.candles || []).forEach((c) => {
        if (c && c.date) allDatesSet.add(c.date);
      });
    });

    const sortedMarketDates = Array.from(allDatesSet).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    if (sortedMarketDates.length === 0) return [];

    // Latest 3, 5 and 20 market trading dates
    const recent3Dates = new Set(sortedMarketDates.slice(-3));
    const recent5Dates = new Set(sortedMarketDates.slice(-5));
    const past20Dates = new Set(sortedMarketDates.slice(-20));

    const sectorMap = new Map<
      string,
      {
        stockCount: number;
        recent3dTurnoverBdt: number;
        recent5dTurnoverBdt: number;
        past20dTurnoverBdt: number;
        totalMarketCapBdt: number;
        topMoverSymbol: string;
        topMoverGainPct: number;
      }
    >();

    let grandTotal5dTurnoverBdt = 0;
    let grandTotal20dTurnoverBdt = 0;

    stocks.forEach((s) => {
      if (!s.sector || !s.candles || s.candles.length === 0) return;
      if (NON_EQUITY_SECTORS.has(s.sector.toUpperCase())) return;

      const len = s.candles.length;
      const candleDateMap = new Map<string, { close: number; volume: number }>();
      s.candles.forEach((c) => candleDateMap.set(c.date, c));

      // Calculate turnover over the global recent 3 market dates
      let total3dVolBdt = 0;
      let daysFound3d = 0;
      recent3Dates.forEach((d) => {
        const c = candleDateMap.get(d);
        if (c) {
          total3dVolBdt += c.close * c.volume;
          daysFound3d++;
        }
      });
      const avg3dDailyBdt = total3dVolBdt / Math.max(1, daysFound3d || recent3Dates.size);

      // Calculate turnover over the global recent 5 market dates
      let total5dVolBdt = 0;
      let daysFound5d = 0;
      recent5Dates.forEach((d) => {
        const c = candleDateMap.get(d);
        if (c) {
          total5dVolBdt += c.close * c.volume;
          daysFound5d++;
        }
      });
      const avg5dDailyBdt = total5dVolBdt / Math.max(1, daysFound5d || recent5Dates.size);

      // Calculate turnover over the global past 20 market dates
      let total20dVolBdt = 0;
      let daysFound20d = 0;
      past20Dates.forEach((d) => {
        const c = candleDateMap.get(d);
        if (c) {
          total20dVolBdt += c.close * c.volume;
          daysFound20d++;
        }
      });
      const avg20dDailyBdt = total20dVolBdt / Math.max(1, daysFound20d || past20Dates.size);

      // Estimate market cap from last close & turnover factor
      const lastClose = s.candles[len - 1].close;
      const estimatedShares = Math.max(80000000, (s.avgTurnoverBdtMillion * 1000000) / (lastClose * 0.02 || 1));
      const estCapBdt = lastClose * estimatedShares;

      // Calculate recent price gain (last candle vs 5 trading candles ago)
      const price5dAgo = len >= 5 ? s.candles[len - 5].close : s.candles[0].close;
      const gainPct = price5dAgo > 0 ? ((lastClose - price5dAgo) / price5dAgo) * 100 : 0;

      grandTotal5dTurnoverBdt += avg5dDailyBdt;
      grandTotal20dTurnoverBdt += avg20dDailyBdt;

      if (!sectorMap.has(s.sector)) {
        sectorMap.set(s.sector, {
          stockCount: 0,
          recent3dTurnoverBdt: 0,
          recent5dTurnoverBdt: 0,
          past20dTurnoverBdt: 0,
          totalMarketCapBdt: 0,
          topMoverSymbol: s.symbol,
          topMoverGainPct: gainPct,
        });
      }

      const secData = sectorMap.get(s.sector)!;
      secData.stockCount += 1;
      secData.recent3dTurnoverBdt += avg3dDailyBdt;
      secData.recent5dTurnoverBdt += avg5dDailyBdt;
      secData.past20dTurnoverBdt += avg20dDailyBdt;
      secData.totalMarketCapBdt += estCapBdt;

      if (gainPct > secData.topMoverGainPct) {
        secData.topMoverSymbol = s.symbol;
        secData.topMoverGainPct = gainPct;
      }
    });

    const result: SectorAnalytics[] = [];

    sectorMap.forEach((data, sector) => {
      // 1 BDT Crore = 10,000,000 BDT
      const current5dTurnoverCrores = data.recent5dTurnoverBdt / 10000000;
      const current3dTurnoverCrores = data.recent3dTurnoverBdt / 10000000;
      const baseline20dTurnoverCrores = data.past20dTurnoverBdt / 10000000;

      // Minimum baseline floor of 0.2 Crore (20 Lakh BDT) to prevent division-by-near-zero spikes
      const MIN_BASELINE_CRORES = 0.2;
      const effectiveBaselineCrores = Math.max(baseline20dTurnoverCrores, MIN_BASELINE_CRORES);

      const moneyFlowExpansionRatio = current5dTurnoverCrores / effectiveBaselineCrores;

      const marketMoneyFlowSharePct =
        grandTotal5dTurnoverBdt > 0
          ? (data.recent5dTurnoverBdt / grandTotal5dTurnoverBdt) * 100
          : 0;

      const pastMarketSharePct =
        grandTotal20dTurnoverBdt > 0
          ? (data.past20dTurnoverBdt / grandTotal20dTurnoverBdt) * 100
          : 0;

      const marketShareDelta = marketMoneyFlowSharePct - pastMarketSharePct;

      const estimatedMarketCapCrores = data.totalMarketCapBdt / 10000000;

      const velocity3dPct = estimatedMarketCapCrores > 0 ? (current3dTurnoverCrores / estimatedMarketCapCrores) * 100 : 0;
      const turnoverVelocityPct =
        estimatedMarketCapCrores > 0
          ? (current5dTurnoverCrores / estimatedMarketCapCrores) * 100
          : 0;

      // Status classification based on robust DSE sector relative rotation rules
      let status: SectorAnalytics['status'] = 'CONSOLIDATING';
      if (
        moneyFlowExpansionRatio >= 1.25 &&
        current5dTurnoverCrores >= 0.1
      ) {
        status = 'REPEATING_BREAKOUT'; // Historic institutional money flow surge trigger
      } else if (moneyFlowExpansionRatio >= 1.10 && current5dTurnoverCrores >= 0.05) {
        status = 'ACCUMULATING';
      } else if (moneyFlowExpansionRatio < 0.80) {
        status = 'OUTFLOW';
      }

      result.push({
        sector,
        stockCount: data.stockCount,
        current5dTurnoverCrores,
        baseline20dTurnoverCrores,
        moneyFlowExpansionRatio,
        marketMoneyFlowSharePct,
        pastMarketSharePct,
        marketShareDelta,
        estimatedMarketCapCrores,
        turnoverVelocityPct,
        velocity3dPct,
        status,
        topMoverSymbol: data.topMoverSymbol,
        topMoverGainPct: data.topMoverGainPct,
      });
    });

    // Dynamic sorting based on active sort option
    return result.sort((a, b) => {
      if (sortBy === 'EXPANSION') {
        return b.moneyFlowExpansionRatio - a.moneyFlowExpansionRatio;
      } else if (sortBy === 'MARKET_SHARE_DELTA') {
        return b.marketShareDelta - a.marketShareDelta;
      } else if (sortBy === 'TURNOVER') {
        return b.current5dTurnoverCrores - a.current5dTurnoverCrores;
      } else if (sortBy === 'TOP_MOVER') {
        return b.topMoverGainPct - a.topMoverGainPct;
      }
      return b.moneyFlowExpansionRatio - a.moneyFlowExpansionRatio;
    });
  }, [stocks, sortBy]);

  // Sector stats count
  const repeatingCount = sectorAnalytics.filter((s) => s.status === 'REPEATING_BREAKOUT').length;
  const accumulatingCount = sectorAnalytics.filter((s) => s.status === 'ACCUMULATING').length;
  const topFlowSector = sectorAnalytics[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm font-mono tracking-tight">
                Sector Relative Money Flow & Rotation Matrix
              </h3>
              {repeatingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-bold animate-pulse">
                  🔥 {repeatingCount} Sector{repeatingCount > 1 ? 's' : ''} in Relative Flow Surge
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Measures relative volume expansion vs. 20-day historical baseline and cross-market share migration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateSectorNarrative}
            disabled={aiSectorLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-md border border-purple-400 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-200 ${aiSectorLoading ? 'animate-spin' : ''}`} />
            <span>{aiSectorLoading ? 'Analyzing Rotation...' : '🤖 AI Sector Narrative'}</span>
          </button>

          <button
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono font-semibold transition-all border border-slate-700"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why Relative Flow?</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white text-xs font-mono border border-slate-800"
          >
            {isExpanded ? 'Collapse ▲' : 'Expand Matrix ▼'}
          </button>
        </div>
      </div>

      {aiSectorData && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-purple-950/40 border border-purple-500/30 rounded-2xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{aiSectorData.narrativeTitle || 'DSE Macro Sector Rotation Narrative'}</span>
          </div>
          <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            {aiSectorData.capitalRotationSummary}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20 space-y-1">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Dominant Capital Inflow Sectors</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {aiSectorData.dominantSectors?.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/20 space-y-1">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Lagging Sectors & Breadth Warning</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {aiSectorData.laggingSectors?.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
              <p className="text-rose-400 text-[10px] pt-1">{aiSectorData.marketBreadthWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Top Relative Surge Leader</div>
          <div className="font-extrabold text-emerald-400 text-sm font-mono truncate">
            {topFlowSector ? topFlowSector.sector : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Flow Surge: <span className="text-emerald-300 font-bold">{topFlowSector ? topFlowSector.moneyFlowExpansionRatio.toFixed(2) : 0}x</span> Baseline
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Institutional Flow Regimes</div>
          <div className="font-extrabold text-indigo-300 text-sm font-mono">
            {repeatingCount} Surging • {accumulatingCount} Early
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {repeatingCount > 0 ? '🟢 Active Sector Breakouts' : '🟡 Neutral Rotation'}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Active Sector Filter</div>
          <div className="font-extrabold text-amber-300 text-sm font-mono truncate">
            {selectedSector === 'ALL' ? 'All Market Sectors' : selectedSector}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {selectedSector !== 'ALL' ? (
              <button
                onClick={() => onSelectSector('ALL')}
                className="text-indigo-400 hover:underline font-bold"
              >
                Reset Filter (Show All)
              </button>
            ) : (
              'Click any card below to filter'
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Relative Surge Threshold</div>
          <div className="font-extrabold text-emerald-400 text-sm font-mono">
            &ge; 1.25x (+25% vs Baseline)
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Institutional Entry Confirmation
          </div>
        </div>
      </div>

      {/* Expanded Sector Heatmap & Matrix */}
      {isExpanded && (
        <div className="space-y-3 pt-2">
          {/* Sorting & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rank Sectors By:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSortBy('EXPANSION')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  sortBy === 'EXPANSION'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🌊 Relative Flow Surge (Ratio)
              </button>
              <button
                onClick={() => setSortBy('MARKET_SHARE_DELTA')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  sortBy === 'MARKET_SHARE_DELTA'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🔄 Market Share Migration (Δ%)
              </button>
              <button
                onClick={() => setSortBy('TURNOVER')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  sortBy === 'TURNOVER'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ৳ 5d Turnover (BDT Cr)
              </button>
              <button
                onClick={() => setSortBy('TOP_MOVER')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  sortBy === 'TOP_MOVER'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                📈 Top Stock Gain %
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectorAnalytics.map((sec) => {
              const isSelected = selectedSector === sec.sector;
              const isRepeating = sec.status === 'REPEATING_BREAKOUT';
              const isAccumulating = sec.status === 'ACCUMULATING';

              let statusBadgeClass = 'bg-slate-800 text-slate-400 border-slate-700';
              let statusText = 'Consolidating';

              if (isRepeating) {
                statusBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
                statusText = '🔥 Historic Flow Surge';
              } else if (isAccumulating) {
                statusBadgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
                statusText = '⚡ Volume Accumulating';
              } else if (sec.status === 'OUTFLOW') {
                statusBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                statusText = '🔻 Volume Outflow';
              }

              const flowDeltaPct = (sec.moneyFlowExpansionRatio - 1) * 100;
              const isMarketShareGainer = sec.marketShareDelta >= 0.5;
              const isMarketShareLoser = sec.marketShareDelta <= -0.5;

              return (
                <div
                  key={sec.sector}
                  onClick={() => onSelectSector(isSelected ? 'ALL' : sec.sector)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 shadow-lg ring-2 ring-indigo-500/50'
                      : isRepeating
                      ? 'bg-gradient-to-b from-slate-950 via-slate-950 to-emerald-950/30 border-emerald-500/40 hover:border-emerald-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs font-mono line-clamp-1">{sec.sector}</h4>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {sec.stockCount} Stock{sec.stockCount > 1 ? 's' : ''} • Top Mover: <span className="text-white font-bold">{sec.topMoverSymbol}</span> ({sec.topMoverGainPct >= 0 ? '+' : ''}{sec.topMoverGainPct.toFixed(1)}%)
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${statusBadgeClass}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-900/80 p-2 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block" title="5-Day Average Turnover vs 20-Day Baseline">5d Turnover</span>
                      <span className="font-extrabold text-white text-[11px]">৳{sec.current5dTurnoverCrores.toFixed(1)} Cr</span>
                      <span className="text-[8px] text-slate-400 block font-normal">base: ৳{sec.baseline20dTurnoverCrores.toFixed(1)}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block" title="Relative Expansion Ratio vs 20-Day Baseline">Relative Surge</span>
                      <span className={`font-extrabold text-[11px] ${sec.moneyFlowExpansionRatio >= 1.25 ? 'text-emerald-400' : sec.moneyFlowExpansionRatio >= 1.10 ? 'text-indigo-300' : sec.moneyFlowExpansionRatio < 0.8 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {sec.moneyFlowExpansionRatio.toFixed(2)}x
                      </span>
                      <span className={`text-[8px] block font-bold ${flowDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {flowDeltaPct >= 0 ? '+' : ''}{flowDeltaPct.toFixed(0)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block" title="Share of Total Market Turnover (5d)">Market Share</span>
                      <span className="font-extrabold text-amber-300 text-[11px]">{sec.marketMoneyFlowSharePct.toFixed(1)}%</span>
                      <span className={`text-[8px] block font-bold ${isMarketShareGainer ? 'text-emerald-400' : isMarketShareLoser ? 'text-rose-400' : 'text-slate-400'}`}>
                        {sec.marketShareDelta >= 0 ? '▲+' : '▼'}{sec.marketShareDelta.toFixed(1)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block" title="3-Day Velocity (Turnover / Market Cap)">3d Velocity</span>
                      <span className="font-extrabold text-blue-300 text-[11px]">{sec.velocity3dPct.toFixed(2)}%</span>
                      <span className="text-[8px] text-slate-400 block">cap-weighted</span>
                    </div>
                  </div>

                  {/* Relative Expansion Meter with 1.0x Baseline Marker */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Flow vs 20d Baseline (1.0x = Baseline):</span>
                      <span className={`font-bold ${flowDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {flowDeltaPct >= 0 ? '+' : ''}{flowDeltaPct.toFixed(0)}% vs Baseline
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                      {/* 1.0x baseline reference line (at 33.3% of scale) */}
                      <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-slate-400/50 z-10" title="1.0x Baseline" />
                      {/* 1.25x breakout threshold line (at 41.6% of scale) */}
                      <div className="absolute top-0 bottom-0 left-[41.6%] w-0.5 bg-emerald-400/40 z-10" title="1.25x Surge Threshold" />
                      
                      <div
                        className={`h-full rounded-full transition-all ${
                          sec.moneyFlowExpansionRatio >= 1.25
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : sec.moneyFlowExpansionRatio >= 1.10
                            ? 'bg-indigo-400'
                            : sec.moneyFlowExpansionRatio < 0.8
                            ? 'bg-rose-500'
                            : 'bg-slate-600'
                        }`}
                        style={{
                          width: `${Math.min(100, (sec.moneyFlowExpansionRatio / 3) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Explanation & Utility Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base font-mono">
                  Why Relative Sector Flow Beats Nominal BDT Turnover
                </h3>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 font-sans leading-relaxed">
              <div className="bg-indigo-950/40 border border-indigo-500/30 p-3.5 rounded-xl space-y-2">
                <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  1. The "Nominal BDT Trap" on the DSE
                </h4>
                <p>
                  Large-cap sectors like <strong>Banks</strong> or <strong>Pharma</strong> trade hundreds of Crores simply due to massive share float. If Bank turnover is ৳60 Crore today but its 20-day baseline is ৳90 Crore, money is actually <strong>draining out (-33%)</strong>. Conversely, if <strong>IT or Engineering</strong> jumps from ৳3 Cr to ৳9 Cr, it has experienced a <strong>3.0x (+200%) institutional capital flood</strong>. The biggest swing gains happen in the 3.0x relative surge!
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 font-mono">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-1.5 font-sans">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  2. The Two Relative Rotation Dimensions We Track
                </h4>
                <div className="space-y-2 font-sans pt-1">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold block">Axis A: Self-Relative Expansion Ratio</span>
                    <span className="text-slate-400 text-[11px]">
                      <code>Current 5d Avg Daily Turnover / 20d Baseline Turnover</code>. A score of &ge;1.25x (+25%) confirms institutional accumulation.
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-300 font-bold block">Axis B: Market Share Shift (Migration Δ)</span>
                    <span className="text-slate-400 text-[11px]">
                      Tracks what percentage of total DSE market turnover this sector captures now vs its 20-day average. A positive shift (e.g. ▲+3.5%) proves macro capital is actively migrating into this sector.
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 font-mono">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5 font-sans">
                  <Activity className="w-4 h-4 text-amber-400" />
                  3. Classification Badges & Rules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold block">🔥 Historic Flow Surge (&ge;1.25x)</span>
                    <span className="text-slate-400">Institutional wave active. Individual breakout patterns have maximum follow-through probability.</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-indigo-500/30">
                    <span className="text-indigo-300 font-bold block">⚡ Volume Accumulating (1.10x - 1.24x)</span>
                    <span className="text-slate-400">Stealth accumulation before public breakout. Ideal for early Stage-2 entries.</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-bold block">⚖️ Consolidating (0.80x - 1.09x)</span>
                    <span className="text-slate-400">Standard background volume. Trades rely strictly on stock-specific technicals.</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-rose-500/30">
                    <span className="text-rose-400 font-bold block">🔻 Volume Outflow (&lt;0.80x)</span>
                    <span className="text-slate-400">Capital is draining to other sectors. Screener penalizes setups to avoid fakeouts.</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  4. How to Use this with the Screener
                </h4>
                <p>
                  Click any sector card in this matrix to instantly filter the entire stock universe and screener to that sector. When trading breakout setups, prioritize stocks whose sectors display <strong>🔥 Historic Flow Surge</strong> with a positive market share delta.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                Got It! Inspect Relative Flow Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
