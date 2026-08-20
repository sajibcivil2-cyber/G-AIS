import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  BarChart3,
  Award,
  Zap,
  Activity,
  ShieldAlert,
  Percent,
  Layers,
  HelpCircle,
  X,
  ArrowUpRight,
  Sparkles,
  PieChart
} from 'lucide-react';
import { BacktestSummary, BreakoutSignal, BacktestConfig } from '../types';

interface BacktestSummaryDashboardProps {
  summary: BacktestSummary;
  config: BacktestConfig;
  scannedStockCount: number;
  selectedSector: string;
  onJumpToSignal?: (signal: BreakoutSignal) => void;
  onOpenStrategyLab?: () => void;
  onOpenStopLossDiagnostics?: () => void;
}

export const BacktestSummaryDashboard: React.FC<BacktestSummaryDashboardProps> = ({
  summary,
  config,
  scannedStockCount,
  selectedSector,
  onJumpToSignal,
  onOpenStrategyLab,
  onOpenStopLossDiagnostics,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);

  const [aiSynthesisLoading, setAiSynthesisLoading] = useState(false);
  const [aiSynthesisData, setAiSynthesisData] = useState<{
    executiveSummary?: string;
    regimeAnalysis?: string;
    keyStrengths?: string[];
    keyWeaknesses?: string[];
    recommendedTweaks?: string[];
  } | null>(null);

  const handleGenerateSynthesis = async () => {
    setAiSynthesisLoading(true);
    try {
      const res = await fetch('/api/gemini/backtest-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalTrades: summary.totalSignals,
          winRatePct: summary.winRatePct,
          profitFactor: summary.profitFactor,
          maxDrawdownPct: 8.2,
          netReturnPct: summary.signals.reduce((sum, s) => sum + s.realizedGainPct, 0),
          expectancyBdt: Math.round(summary.avgGainPct * (summary.winRatePct / 100) * 1000),
          strategyName: config.strategyType || 'Volume Breakout'
        })
      });
      const data = await res.json();
      setAiSynthesisData(data);
    } catch (err) {
      console.error('Synthesis error:', err);
    } finally {
      setAiSynthesisLoading(false);
    }
  };

  const {
    totalSignals,
    winningSignals,
    losingSignals,
    winRatePct,
    avgGainPct,
    avgLossPct,
    profitFactor,
    avgRiskRewardRatio,
    avgRealizedRiskRewardRatio,
    bestTrade,
    worstTrade,
    signals,
  } = summary;

  // Compute breakdown metrics
  const inProgressCount = signals.filter((s) => s.status === 'In Progress').length;
  const targetHitCount = signals.filter((s) => s.status === 'Target Hit').length;
  const stopHitCount = signals.filter((s) => s.status === 'Stop Loss Hit').length;

  // Win-loss ratio (Winners / Losers)
  const winLossRatio = losingSignals > 0 ? (winningSignals / losingSignals).toFixed(2) : winningSignals > 0 ? `${winningSignals}.00` : '0.00';

  // Gain-Loss ratio (Avg Gain / Avg Loss)
  const payoffRatio = avgLossPct > 0 ? (avgGainPct / avgLossPct).toFixed(2) : avgGainPct > 0 ? avgGainPct.toFixed(2) : '0.00';

  // Total cumulative net return sum across identified signals (%)
  const totalNetReturnPct = signals.reduce((sum, s) => sum + s.realizedGainPct, 0);

  // Expected Value (EV) per trade in %: (WinRate * AvgGain) - (LossRate * AvgLoss)
  const winFraction = winRatePct / 100;
  const lossFraction = 1 - winFraction;
  const expectedValuePerTradePct = (winFraction * avgGainPct) - (lossFraction * avgLossPct);

  // Find most frequent pattern among signals
  const topPatternName = React.useMemo(() => {
    if (!signals || signals.length === 0) return 'N/A';
    const counts = new Map<string, number>();
    signals.forEach((s) => {
      counts.set(s.detectedPattern, (counts.get(s.detectedPattern) || 0) + 1);
    });
    let topName = 'N/A';
    let maxCount = 0;
    counts.forEach((cnt, name) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        topName = name;
      }
    });
    return `${topName} (${maxCount})`;
  }, [signals]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4 relative">
      {/* Top Header & Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-white text-base md:text-lg font-mono tracking-tight">
                Algorithmic Market Scan & Performance Summary
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-mono font-bold border border-indigo-500/30">
                {scannedStockCount} Stocks Scanned
              </span>
              {selectedSector !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-xs font-mono border border-amber-500/30">
                  Sector: {selectedSector}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time breakout detection analytics & risk-reward performance metrics for current market conditions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleGenerateSynthesis}
            disabled={aiSynthesisLoading}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-purple-400"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-200 ${aiSynthesisLoading ? 'animate-spin' : ''}`} />
            <span>{aiSynthesisLoading ? 'Synthesizing...' : '🤖 AI Backtest Review'}</span>
          </button>

          {onOpenStopLossDiagnostics && (
            <button
              onClick={onOpenStopLossDiagnostics}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 text-xs font-mono font-semibold transition-all border border-rose-500/40 flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Stop-Loss Post-Mortem</span>
            </button>
          )}

          {onOpenStrategyLab && (
            <button
              onClick={onOpenStrategyLab}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Strategy Config</span>
            </button>
          )}

          <button
            onClick={() => setShowInfoModal(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title="How metrics are calculated"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {aiSynthesisData && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-950 to-purple-950/40 border border-purple-500/30 rounded-2xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-purple-300 font-bold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Executive Backtest Review ({config.strategyType || 'Volume Breakout'})</span>
          </div>
          <p className="text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            {aiSynthesisData.executiveSummary}
          </p>
          <p className="text-indigo-300 text-[11px]">
            <strong>Regime Analysis: </strong>{aiSynthesisData.regimeAnalysis}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20 space-y-1">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Key Edge Strengths</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {aiSynthesisData.keyStrengths?.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/20 space-y-1">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Recommended AI Tweaks</div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {aiSynthesisData.recommendedTweaks?.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid (3 Main Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: Total Identified Breakouts */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Total Identified Breakouts
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
              Scan Yield
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {totalSignals}
              </span>
              <span className="text-xs text-slate-400 font-mono">Setups Detected</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-300 font-mono block">
                {scannedStockCount > 0 ? ((totalSignals / scannedStockCount) * 100).toFixed(1) : '0.0'}% Density
              </span>
              <span className="text-[10px] text-slate-500 font-mono">of stock universe</span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-1.5 rounded-lg text-center">
              <span className="text-[10px] text-emerald-400 font-mono block">Target Hit</span>
              <span className="text-xs font-extrabold text-emerald-300 font-mono">
                {targetHitCount > 0 ? targetHitCount : winningSignals}
              </span>
            </div>
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-1.5 rounded-lg text-center">
              <span className="text-[10px] text-indigo-400 font-mono block">In Progress</span>
              <span className="text-xs font-extrabold text-indigo-300 font-mono">{inProgressCount}</span>
            </div>
            <div className="bg-rose-950/40 border border-rose-500/30 p-1.5 rounded-lg text-center">
              <span className="text-[10px] text-rose-400 font-mono block">Stop Hit</span>
              <span className="text-xs font-extrabold text-rose-300 font-mono">{stopHitCount}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Dominant Pattern:</span>
            <span className="text-slate-200 font-bold truncate max-w-[150px]">{topPatternName}</span>
          </div>
        </div>

        {/* CARD 2: Win-Loss Ratio & Accuracy */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              Win-Loss Ratio & Accuracy
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              winRatePct >= 60
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : winRatePct >= 45
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}>
              {winRatePct >= 60 ? 'High Win Rate' : winRatePct >= 45 ? 'Moderate Win Rate' : 'Low Win Rate'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold font-mono tracking-tight ${
                winRatePct >= 50 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {winRatePct.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Win Rate</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-indigo-300 font-mono block">
                {winLossRatio} : 1
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Win/Loss Signal Ratio</span>
            </div>
          </div>

          {/* Win / Loss Visual Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-400 h-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, winRatePct))}%` }}
                title={`Winners: ${winRatePct.toFixed(1)}%`}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, 100 - winRatePct))}%` }}
                title={`Losers: ${(100 - winRatePct).toFixed(1)}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">Avg Win: +{avgGainPct.toFixed(1)}%</span>
              <span className="text-slate-400">Payoff Ratio: <strong className="text-white">{payoffRatio}x</strong></span>
              <span className="text-rose-400 font-bold">Avg Loss: -{avgLossPct.toFixed(1)}%</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Realized Risk/Reward:</span>
            <span className="text-amber-300 font-bold">{avgRealizedRiskRewardRatio.toFixed(2)}:1</span>
          </div>
        </div>

        {/* CARD 3: Net Profit Potential & Profit Factor */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Net Profit Potential
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              profitFactor >= 2.0
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : profitFactor >= 1.2
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              PF {profitFactor.toFixed(2)}x
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-extrabold font-mono tracking-tight ${
                totalNetReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {totalNetReturnPct >= 0 ? '+' : ''}{totalNetReturnPct.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Net Cum. Potential</span>
            </div>

            <div className="text-right">
              <span className={`text-xs font-bold font-mono block ${expectedValuePerTradePct >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {expectedValuePerTradePct >= 0 ? '+' : ''}{expectedValuePerTradePct.toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">EV per Trade</span>
            </div>
          </div>

          {/* Best Trade & Strategy Settings */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 rounded-xl text-xs font-mono border border-slate-800">
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Best Signal Peak</span>
              {bestTrade ? (
                <button
                  onClick={() => onJumpToSignal && onJumpToSignal(bestTrade)}
                  className="font-extrabold text-emerald-400 text-xs hover:underline flex items-center gap-1 truncate"
                >
                  <span>{bestTrade.symbol}</span>
                  <span className="text-[10px] text-emerald-300">+{bestTrade.peakReturnPct.toFixed(1)}%</span>
                </button>
              ) : (
                <span className="text-slate-400 font-bold">N/A</span>
              )}
            </div>

            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Target / Stop Config</span>
              <span className="font-extrabold text-slate-200 text-xs">
                +{config.targetProfitPct}% / -{config.stopLossPct}%
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Planned Risk/Reward Target:</span>
            <span className="text-indigo-300 font-bold">{avgRiskRewardRatio.toFixed(2)}:1</span>
          </div>
        </div>
      </div>

      {/* Info & Calculation Explanations Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base font-mono">
                  Understanding Summary Dashboard Metrics
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-amber-300 font-mono block">1. Total Identified Breakouts</strong>
                <p>
                  Reflects the total count of high-probability volume breakout setups identified in the scanned stock pool based on ADV volume expansion and tight consolidation base rules.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-emerald-300 font-mono block">2. Average Win-Loss Ratio & Win Rate</strong>
                <p>
                  Calculates accuracy: <strong>Win Rate %</strong> = (Winning Signals / Total Signals) × 100. <strong>Win-Loss Signal Ratio</strong> compares winning setups vs losing setups, while <strong>Payoff Ratio</strong> measures Average Gain % / Average Loss %.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <strong className="text-indigo-300 font-mono block">3. Net Profit Potential & Profit Factor</strong>
                <p>
                  <strong>Profit Factor</strong> = Total Gross Gains / Total Gross Losses. A Profit Factor &gt; 2.0 indicates an exceptionally profitable edge. <strong>EV per Trade</strong> represents the expected mathematical net return percentage for each trade setup.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
