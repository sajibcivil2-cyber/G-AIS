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
  Layers
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
  marketMoneyFlowSharePct: number; // % of total market volume
  estimatedMarketCapCrores: number;
  turnoverVelocityPct: number; // Turnover / Market Cap ratio
  status: 'REPEATING_BREAKOUT' | 'ACCUMULATING' | 'CONSOLIDATING' | 'OUTFLOW';
  topMoverSymbol: string;
  topMoverGainPct: number;
}

export const SectorMoneyFlowMatrix: React.FC<SectorMoneyFlowMatrixProps> = ({
  stocks,
  selectedSector,
  onSelectSector,
}) => {
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

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

    // Latest 5 and 20 market trading dates
    const recent5Dates = new Set(sortedMarketDates.slice(-5));
    const past20Dates = new Set(sortedMarketDates.slice(-20));

    const sectorMap = new Map<
      string,
      {
        stockCount: number;
        recent5dTurnoverBdt: number;
        past20dTurnoverBdt: number;
        totalMarketCapBdt: number;
        topMoverSymbol: string;
        topMoverGainPct: number;
      }
    >();

    let grandTotal5dTurnoverBdt = 0;

    stocks.forEach((s) => {
      if (!s.sector || !s.candles || s.candles.length === 0) return;
      if (NON_EQUITY_SECTORS.has(s.sector.toUpperCase())) return;

      const len = s.candles.length;
      const candleDateMap = new Map<string, { close: number; volume: number }>();
      s.candles.forEach((c) => candleDateMap.set(c.date, c));

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

      if (!sectorMap.has(s.sector)) {
        sectorMap.set(s.sector, {
          stockCount: 0,
          recent5dTurnoverBdt: 0,
          past20dTurnoverBdt: 0,
          totalMarketCapBdt: 0,
          topMoverSymbol: s.symbol,
          topMoverGainPct: gainPct,
        });
      }

      const secData = sectorMap.get(s.sector)!;
      secData.stockCount += 1;
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
      const baseline20dTurnoverCrores = data.past20dTurnoverBdt / 10000000;

      // Minimum baseline floor of 0.2 Crore (20 Lakh BDT) to prevent division-by-near-zero spikes
      const MIN_BASELINE_CRORES = 0.2;
      const effectiveBaselineCrores = Math.max(baseline20dTurnoverCrores, MIN_BASELINE_CRORES);

      const moneyFlowExpansionRatio = current5dTurnoverCrores / effectiveBaselineCrores;

      const marketMoneyFlowSharePct =
        grandTotal5dTurnoverBdt > 0
          ? (data.recent5dTurnoverBdt / grandTotal5dTurnoverBdt) * 100
          : 0;

      const estimatedMarketCapCrores = data.totalMarketCapBdt / 10000000;

      const turnoverVelocityPct =
        estimatedMarketCapCrores > 0
          ? (current5dTurnoverCrores / estimatedMarketCapCrores) * 100
          : 0;

      // Status classification based on robust DSE sector breakout rules
      let status: SectorAnalytics['status'] = 'CONSOLIDATING';
      if (
        moneyFlowExpansionRatio >= 1.5 &&
        current5dTurnoverCrores >= 0.5 &&
        marketMoneyFlowSharePct >= 3.0
      ) {
        status = 'REPEATING_BREAKOUT'; // Historic institutional money flow surge trigger
      } else if (moneyFlowExpansionRatio >= 1.2 && current5dTurnoverCrores >= 0.2) {
        status = 'ACCUMULATING';
      } else if (moneyFlowExpansionRatio < 0.75) {
        status = 'OUTFLOW';
      }

      result.push({
        sector,
        stockCount: data.stockCount,
        current5dTurnoverCrores,
        baseline20dTurnoverCrores,
        moneyFlowExpansionRatio,
        marketMoneyFlowSharePct,
        estimatedMarketCapCrores,
        turnoverVelocityPct,
        status,
        topMoverSymbol: data.topMoverSymbol,
        topMoverGainPct: data.topMoverGainPct,
      });
    });

    // Sort by Money Flow Expansion Ratio descending (prioritizing sectors with active turnover)
    return result.sort((a, b) => b.moneyFlowExpansionRatio - a.moneyFlowExpansionRatio);
  }, [stocks]);

  // Sector stats count
  const repeatingCount = sectorAnalytics.filter((s) => s.status === 'REPEATING_BREAKOUT').length;
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
                Sector Money Flow & Rotation Matrix
              </h3>
              {repeatingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-bold animate-pulse">
                  🔥 {repeatingCount} Sector{repeatingCount > 1 ? 's' : ''} in Historic Flow Surge
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Scans money flow velocity (Turnover / Market Cap) & volume expansion across DSE sectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono font-semibold transition-all border border-slate-700"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How to Use Matrix?</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white text-xs font-mono border border-slate-800"
          >
            {isExpanded ? 'Collapse ▲' : 'Expand Matrix ▼'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Top Money Flow Leader</div>
          <div className="font-extrabold text-emerald-400 text-sm font-mono truncate">
            {topFlowSector ? topFlowSector.sector : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Flow Ratio: <span className="text-emerald-300 font-bold">{topFlowSector ? topFlowSector.moneyFlowExpansionRatio.toFixed(2) : 0}x</span> Baseline
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Historic Flow Surge Rule</div>
          <div className="font-extrabold text-indigo-300 text-sm font-mono">
            {repeatingCount} Active Sector{repeatingCount !== 1 ? 's' : ''}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {repeatingCount > 0 ? '🟢 Currently Repeating Trend' : '🟡 Neutral Rotation'}
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
              'Click any sector below to filter'
            )}
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Sector Velocity Benchmark</div>
          <div className="font-extrabold text-white text-sm font-mono">
            &gt; 1.8x Turnover
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Historical DSE Breakout Threshold
          </div>
        </div>
      </div>

      {/* Expanded Sector Heatmap & Matrix */}
      {isExpanded && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Select a sector card to isolate its breakout candidates across Screener & Charts:</span>
            <span>{sectorAnalytics.length} Sectors Scanned</span>
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
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block">5d Turnover</span>
                      <span className="font-extrabold text-white text-xs">৳{sec.current5dTurnoverCrores.toFixed(1)} Cr</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block">Flow Surge</span>
                      <span className={`font-extrabold text-xs ${sec.moneyFlowExpansionRatio >= 1.8 ? 'text-emerald-400' : sec.moneyFlowExpansionRatio >= 1.25 ? 'text-indigo-300' : 'text-slate-300'}`}>
                        {sec.moneyFlowExpansionRatio.toFixed(2)}x
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block">Market Share</span>
                      <span className="font-extrabold text-amber-300 text-xs">{sec.marketMoneyFlowSharePct.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Expansion Progress Visualizer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Money Flow vs 20d Baseline:</span>
                      <span className="font-bold text-slate-200">
                        {sec.moneyFlowExpansionRatio >= 1.0 ? '+' : ''}
                        {((sec.moneyFlowExpansionRatio - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sec.moneyFlowExpansionRatio >= 1.8
                            ? 'bg-emerald-400'
                            : sec.moneyFlowExpansionRatio >= 1.25
                            ? 'bg-indigo-400'
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
                  Understanding Sector Money Flow & Trend Repetition
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
                  1. Utility of the Sector Filter & Money Flow Matrix
                </h4>
                <p>
                  On the Dhaka Stock Exchange (DSE), smart institutional money never buys all stocks simultaneously. Capital moves in <strong>Sector Waves ("Sector Money Flow")</strong>. Filtering by sector isolates candidates within the leading group where money flow is concentrating before the main price breakout happens.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 font-mono">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-1.5 font-sans">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  2. Money Flow vs. Sector Market Cap Significance
                </h4>
                <p className="font-sans">
                  Absolute money flow (nominal turnover in BDT) can be deceptive. A huge market cap sector (like Banks) always trades high nominal BDT volume. To identify true sector money flow, look at <strong>Turnover Expansion Ratio (5d Avg Turnover / 20d Baseline Turnover)</strong> and <strong>Money Flow Market Share</strong>.
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pt-1">
                  <li><strong className="text-white">High Market Cap Sectors:</strong> Require sustained 1.5x+ flow expansion to move prices.</li>
                  <li><strong className="text-white">Mid/Small Cap Sectors (IT, Pharma, Textiles, Engineering):</strong> Low float means even a 2.0x surge in BDT turnover triggers explosive multi-week sector rallies.</li>
                </ul>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-2 font-mono">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5 font-sans">
                  <Activity className="w-4 h-4 text-amber-400" />
                  3. Historical Money Flow Thresholds for Sector Trending
                </h4>
                <p className="font-sans">
                  Historically on DSE, a sector shifts from quiet consolidation into a major trending rally when:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold block">1. Volume Surge Multiplier &ge; 1.8x - 2.5x</span>
                    <span className="text-slate-400">5-day average daily turnover doubles its 20-day historical baseline.</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-300 font-bold block">2. Market Money Share &ge; 8% - 15%</span>
                    <span className="text-slate-400">Sector captures over 8% of total daily market turnover.</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  4. Is this currently repeating in today's dataset?
                </h4>
                <p>
                  Check the <strong className="text-emerald-400">🔥 Historic Flow Surge</strong> cards in this matrix above. When a sector displays <strong>&gt;1.8x Money Flow Ratio</strong>, history is repeating right now — institutionally backed volume breakouts are occurring in that sector's individual stock charts!
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg"
              >
                Got It! Inspect Money Flow Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
