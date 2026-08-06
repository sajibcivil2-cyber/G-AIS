import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  Layers,
  Filter,
  CheckCircle2,
  Target,
  Zap,
  BarChart2,
  BookOpen,
  ArrowDownRight,
  HelpCircle,
  Info,
  ChevronRight,
  Sparkles,
  Activity
} from 'lucide-react';
import { StopLossPostMortemReport, StopLossFailurePattern, BreakoutSignal } from '../types';

interface StopLossPostMortemDashboardProps {
  report?: StopLossPostMortemReport;
  onSelectStockForChart?: (symbol: string) => void;
  onAutoApplyMitigationRules?: () => void;
}

export const StopLossPostMortemDashboard: React.FC<StopLossPostMortemDashboardProps> = ({
  report,
  onSelectStockForChart,
  onAutoApplyMitigationRules,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [activePatternModal, setActivePatternModal] = useState<StopLossFailurePattern | null>(null);
  const [appliedToast, setAppliedToast] = useState(false);

  const handleApplyRules = () => {
    if (onAutoApplyMitigationRules) {
      onAutoApplyMitigationRules();
      setAppliedToast(true);
      setTimeout(() => setAppliedToast(false), 4000);
    }
  };

  if (!report || report.totalStopLossHits === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">No Stop-Loss Triggers Identified</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            All historical volume breakouts in this backtest scenario met target profit goals or are actively progressing. Run backtests across broader historical datasets or adjust stop-loss sensitivity to perform diagnostics.
          </p>
        </div>
      </div>
    );
  }

  const filteredPatterns = selectedCategoryFilter === 'ALL'
    ? report.failurePatterns
    : report.failurePatterns.filter(p => p.category === selectedCategoryFilter);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              Failed Breakout Post-Mortem & Repetition Diagnostics
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Stop-Loss Pattern Diagnostics & Failure Analysis
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Quantitative post-mortem analysis of historically failed DSE volume breakouts. Uncovering the exact repeating market mechanisms — <strong className="text-rose-400">Volume Exhaustion</strong>, <strong className="text-amber-400">Overbought Chasing</strong>, <strong className="text-indigo-400">Loose Base Whipsaws</strong>, and <strong className="text-cyan-400">Overhead Supply Traps</strong> — that triggered stop-loss exits.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            {onAutoApplyMitigationRules && (
              <button
                onClick={handleApplyRules}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all border border-emerald-400"
              >
                <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>⚡ 1-Click Auto-Apply All Mitigation Rules</span>
              </button>
            )}

            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Stop-Loss Hits</div>
              <div className="text-lg font-black text-rose-400">{report.totalStopLossHits} Trades ({report.totalStopLossPct}%)</div>
            </div>
          </div>
        </div>

        {appliedToast && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-xl text-emerald-300 text-xs font-bold font-mono flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Success! Post-Mortem Mitigation Rules automatically applied to Screener filters and Backtest engine parameters!</span>
          </div>
        )}
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stop Losses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Failed Breakouts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{report.totalStopLossHits}</div>
          <div className="text-[11px] text-rose-400 font-mono font-medium">
            {report.totalStopLossPct}% of total signals hit stop-loss
          </div>
        </div>

        {/* Avg Loss % */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Average Stop Loss Depth</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">-{report.avgLossPct}%</div>
          <div className="text-[11px] text-slate-500 font-mono">
            Controlled by strict risk-management threshold
          </div>
        </div>

        {/* Top Failure Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Primary Failure Trigger</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {report.failurePatterns[0]?.name || 'Volume Exhaustion'}
          </div>
          <div className="text-[11px] text-indigo-400 font-mono font-medium">
            Accounts for {report.failurePatterns[0]?.percentage || 0}% of all stop losses
          </div>
        </div>

        {/* Worst Trade Record */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Max Drawdown Trigger</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-sm font-bold text-rose-300 font-mono truncate">
            {report.worstStopLossTrade ? `${report.worstStopLossTrade.symbol} (${report.worstStopLossTrade.realizedGainPct}%)` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate">
            {report.worstStopLossTrade ? `Date: ${report.worstStopLossTrade.breakoutDate}` : 'No trade'}
          </div>
        </div>
      </div>

      {/* Key Diagnostic Takeaways */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/40 border border-rose-500/30 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          Executive Takeaways & Strategic Lessons from Historical Stop Losses
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {report.keyTakeaways.map((takeaway, idx) => (
            <div key={idx} className="flex items-start gap-2.5 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-slate-300 leading-relaxed">
              <span className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-300 text-[10px] font-black font-mono flex items-center justify-center shrink-0 mt-0.5">
                0{idx + 1}
              </span>
              <span>{takeaway}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter & Pattern List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Filter Failure Patterns by Category:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'Volume Exhaustion', 'Extended Overbought', 'Overhead Resistance', 'Wide Volatile Base', 'Market Sector Drag'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                  selectedCategoryFilter === cat
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Pattern Cards */}
        <div className="grid grid-cols-1 gap-4">
          {filteredPatterns.map((pat) => (
            <div
              key={pat.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold font-mono uppercase">
                      {pat.category}
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      {pat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {pat.repetitionReasoning}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono">
                    <div className="text-base font-black text-rose-400">{pat.count} Signals</div>
                    <div className="text-[10px] text-slate-500">{pat.percentage}% of Stop Losses</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-amber-400">
                    Avg -{pat.avgLossPct}%
                  </div>
                </div>
              </div>

              {/* Quantitative Indicators & Mitigation Rule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Key Indicators */}
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    Repeating Quantitative Indicators:
                  </div>
                  <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                    {pat.keyIndicators.map((ind, i) => (
                      <li key={i}>{ind}</li>
                    ))}
                  </ul>
                </div>

                {/* Mitigation Strategy */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Actionable System Mitigation Rule:
                  </div>
                  <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                    {pat.mitigationRule}
                  </p>
                </div>
              </div>

              {/* Affected Tickers */}
              {pat.affectedSymbols.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                    Frequently Affected Tickers:
                  </span>
                  {pat.affectedSymbols.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => onSelectStockForChart && onSelectStockForChart(sym)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold font-mono transition-colors flex items-center gap-1"
                    >
                      <span>{sym}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sector & Pattern Failure Breakdown Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Failure Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              Stop-Loss Hits by DSE Industry Sector
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold">Concentration Breakdown</span>
          </div>

          <div className="space-y-3 text-xs">
            {report.sectorFailureBreakdown.map((sec) => (
              <div key={sec.sector} className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-300 font-medium">{sec.sector}</span>
                  <span className="text-rose-400 font-bold">{sec.count} hits ({sec.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, sec.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Failure Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Stop-Loss Hits by Technical Pattern Setup
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold">Pattern Vulnerability</span>
          </div>

          <div className="space-y-3 text-xs">
            {report.patternFailureBreakdown.map((pat) => (
              <div key={pat.pattern} className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-300 font-medium">{pat.pattern}</span>
                  <span className="text-amber-400 font-bold">{pat.count} hits ({pat.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.min(100, pat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
