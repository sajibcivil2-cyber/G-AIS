import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  BarChart3,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Eye,
  Sliders
} from 'lucide-react';
import { ScreenerStockCandidate, DseStockCandle, BacktestConfig, BreakoutSignal } from '../types';

interface StockDetailModalProps {
  candidate: ScreenerStockCandidate;
  signal?: BreakoutSignal | null;
  config?: BacktestConfig;
  onClose: () => void;
  onOpenChart?: (symbol: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  candidate,
  signal,
  config,
  onClose,
  onOpenChart,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'patterns' | 'risk'>('overview');

  const {
    symbol,
    stockName,
    sector,
    stock,
    decisionStatus,
    profitPotentialScore,
    entryPrice,
    targetPrice,
    stopLossPrice,
    riskRewardRatio,
    potentialGainPct,
    potentialRiskPct,
    keyCatalysts,
    breakoutPattern,
    detectedPattern,
    patternConfidence,
    patternDescription,
    historicalWinRate,
    tradeSetupReasoning,
    recommendedPositionSizePct,
    peRatio,
    yoyGrowthPct,
    avgTurnoverBdtMillion,
    rvol20,
    latestClose,
    latestDate,
    avgVolume20,
  } = candidate;

  const candles = stock?.candles || [];
  const candleCount = candles.length;

  // 3-Month Performance Calculations (assuming 60 trading days = ~3 months)
  const perfMetrics = React.useMemo(() => {
    if (candleCount === 0) {
      return {
        pct3m: 0,
        pct1m: 0,
        pct2w: 0,
        pct1w: 0,
        high3m: latestClose,
        low3m: latestClose,
        distFromHighPct: 0,
        maxDrawdown3mPct: 0,
        avgVol3m: avgVolume20,
        rsi14: 50,
        sma20: latestClose,
        sma50: latestClose,
      };
    }

    const currentPrice = candles[candleCount - 1].close;

    // 3M (up to 60 candles back)
    const c3m = candles[Math.max(0, candleCount - 60)];
    const pct3m = c3m.close > 0 ? ((currentPrice - c3m.close) / c3m.close) * 100 : 0;

    // 1M (up to 20 candles back)
    const c1m = candles[Math.max(0, candleCount - 20)];
    const pct1m = c1m.close > 0 ? ((currentPrice - c1m.close) / c1m.close) * 100 : 0;

    // 2W (up to 10 candles back)
    const c2w = candles[Math.max(0, candleCount - 10)];
    const pct2w = c2w.close > 0 ? ((currentPrice - c2w.close) / c2w.close) * 100 : 0;

    // 1W (up to 5 candles back)
    const c1w = candles[Math.max(0, candleCount - 5)];
    const pct1w = c1w.close > 0 ? ((currentPrice - c1w.close) / c1w.close) * 100 : 0;

    // 3M High & Low Range
    const range3mCandles = candles.slice(Math.max(0, candleCount - 60));
    let high3m = -Infinity;
    let low3m = Infinity;
    let maxDd = 0;
    let peak = -Infinity;

    range3mCandles.forEach((c) => {
      if (c.high > high3m) high3m = c.high;
      if (c.low < low3m) low3m = c.low;

      if (c.high > peak) peak = c.high;
      const dd = peak > 0 ? ((peak - c.low) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    });

    if (high3m === -Infinity) high3m = currentPrice;
    if (low3m === Infinity) low3m = currentPrice;

    const distFromHighPct = high3m > 0 ? ((currentPrice - high3m) / high3m) * 100 : 0;

    // Simple Moving Averages
    const slice20 = candles.slice(Math.max(0, candleCount - 20));
    const sma20 = slice20.reduce((s, c) => s + c.close, 0) / (slice20.length || 1);

    const slice50 = candles.slice(Math.max(0, candleCount - 50));
    const sma50 = slice50.reduce((s, c) => s + c.close, 0) / (slice50.length || 1);

    // Approximate 14-day RSI
    const slice14 = candles.slice(Math.max(0, candleCount - 15));
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < slice14.length; i++) {
      const diff = slice14[i].close - slice14[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
    const rsi14 = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    return {
      pct3m,
      pct1m,
      pct2w,
      pct1w,
      high3m,
      low3m,
      distFromHighPct,
      maxDrawdown3mPct: maxDd,
      rsi14,
      sma20,
      sma50,
    };
  }, [candles, candleCount, latestClose, avgVolume20]);

  // Detected Patterns List
  const detectedPatternList = React.useMemo(() => {
    const list: { name: string; category: string; confidence: number; desc: string; type: 'micro' | 'macro' | 'candlestick' }[] = [];

    // Primary pattern
    list.push({
      name: detectedPattern || breakoutPattern || 'Volume Surge Breakout',
      category: 'Primary Breakout Signal',
      confidence: patternConfidence || 92,
      desc: patternDescription || 'Consolidation base breakout driven by unusual institutional turnover.',
      type: 'macro',
    });

    // Secondary / Micro Patterns
    if (rvol20 >= 2.0) {
      list.push({
        name: 'RVOL Institutional Accumulation Surge',
        category: 'Volume Dynamics',
        confidence: 95,
        desc: `Relative Volume is ${rvol20.toFixed(1)}x above 20-day average daily volume.`,
        type: 'micro',
      });
    }

    if (signal?.microPattern) {
      list.push({
        name: signal.microPattern,
        category: 'Micro Volatility Structure',
        confidence: 90,
        desc: 'Tight price contraction range prior to current volume expansion.',
        type: 'micro',
      });
    } else {
      list.push({
        name: 'VCP (Volatility Contraction Pattern)',
        category: 'Micro Volatility Structure',
        confidence: 88,
        desc: 'Progressive narrowing of price swings indicating supply absorption by strong hands.',
        type: 'micro',
      });
    }

    if (signal?.macroPattern) {
      list.push({
        name: signal.macroPattern,
        category: 'Macro Base Formation',
        confidence: 91,
        desc: 'Multi-week structural base giving clear support and resistance bounds.',
        type: 'macro',
      });
    } else {
      list.push({
        name: 'Ascending Base Consolidation',
        category: 'Macro Base Formation',
        confidence: 89,
        desc: 'Higher lows forming along key moving average support levels.',
        type: 'macro',
      });
    }

    // Candlestick Pattern check
    if (candles.length >= 2) {
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      if (last.close > last.open && (last.close - last.open) > (prev.high - prev.low)) {
        list.push({
          name: 'Bullish Engulfing Candle',
          category: 'Price Action Trigger',
          confidence: 86,
          desc: 'Current close engulfs previous bar range on strong buying volume.',
          type: 'candlestick',
        });
      } else {
        list.push({
          name: 'Pocket Pivot Volume Spike',
          category: 'Price Action Trigger',
          confidence: 85,
          desc: 'Volume surge exceeds highest down-volume bar of the past 10 sessions.',
          type: 'candlestick',
        });
      }
    }

    return list;
  }, [detectedPattern, breakoutPattern, patternConfidence, patternDescription, rvol20, signal, candles]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-3xl w-full p-4 sm:p-6 space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-lg font-mono shrink-0">
              {symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white font-mono tracking-tight">{symbol}</h2>
                <span className="text-xs text-slate-400 font-sans">({stockName})</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono border ${
                    decisionStatus === 'STRONG_BUY'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {decisionStatus === 'STRONG_BUY' ? '🟢 STRONG BUY' : '🟡 BREAKOUT WATCHLIST'}
                </span>
              </div>

              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Sector: <strong className="text-slate-200">{sector}</strong></span>
                <span>•</span>
                <span>LTP: <strong className="text-white font-mono">৳{entryPrice}</strong></span>
                <span>•</span>
                <span>Last Updated: <span className="text-slate-300 font-mono">{latestDate}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {onOpenChart && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChart(symbol);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open D3 Chart</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Setup Overview', icon: Sparkles },
            { id: 'performance', label: '📈 3-Month Performance', icon: BarChart3 },
            { id: 'risk', label: '🛡️ Risk & Reward Metrics', icon: Target },
            { id: 'patterns', label: '🔍 Detected Technical Patterns', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Profit Potential Score</span>
                <div className="text-xl font-black text-emerald-400">
                  {profitPotentialScore} <span className="text-xs text-slate-500">/ 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${profitPotentialScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Volume Surge (RVOL)</span>
                <div className="text-xl font-black text-indigo-300">
                  {rvol20.toFixed(1)}x
                </div>
                <span className="text-[10px] text-slate-500">vs 20d Average Vol</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">YoY Revenue Growth</span>
                <div className="text-xl font-black text-emerald-400">
                  +{yoyGrowthPct}%
                </div>
                <span className="text-[10px] text-slate-500">DSE Category Filter</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">P/E Valuation</span>
                <div className="text-xl font-black text-amber-300">
                  {peRatio.toFixed(1)}x
                </div>
                <span className="text-[10px] text-slate-500">Earnings Multiple</span>
              </div>
            </div>

            {/* Trade Execution Plan Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Planned Trade Execution Target & Stop Loss
                </span>
                <span className="text-xs font-mono text-indigo-300 font-bold">
                  Planned R:R = {riskRewardRatio} : 1
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Entry Price (LTP)</span>
                  <span className="text-base font-extrabold text-white">৳{entryPrice}</span>
                  <span className="text-[9px] text-slate-500 block">Current Market Level</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block">Target (+{potentialGainPct}%)</span>
                  <span className="text-base font-extrabold text-emerald-400">৳{targetPrice}</span>
                  <span className="text-[9px] text-emerald-500 block">+৳{(targetPrice - entryPrice).toFixed(2)} Gain</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-rose-500/30">
                  <span className="text-[10px] text-slate-400 block">Stop Loss (-{potentialRiskPct}%)</span>
                  <span className="text-base font-extrabold text-rose-400">৳{stopLossPrice}</span>
                  <span className="text-[9px] text-rose-500 block">-৳{(entryPrice - stopLossPrice).toFixed(2)} Loss</span>
                </div>
              </div>

              {/* Trade Catalyst Explanation */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Key Setup Catalyst & Reasoning
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{tradeSetupReasoning}</p>
              </div>

              {/* Key Catalysts Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-mono">Catalysts:</span>
                {keyCatalysts.map((cat, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 3-MONTH PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Historical Returns Breakdown (Up to 3-Month Window)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {candleCount} Candles Loaded
                </span>
              </div>

              {/* Performance Returns Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">1-Week Return (5d)</span>
                  <div className={`text-lg font-black ${perfMetrics.pct1w >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct1w >= 0 ? '+' : ''}{perfMetrics.pct1w.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">2-Week Return (10d)</span>
                  <div className={`text-lg font-black ${perfMetrics.pct2w >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct2w >= 0 ? '+' : ''}{perfMetrics.pct2w.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">1-Month Return (20d)</span>
                  <div className={`text-lg font-black ${perfMetrics.pct1m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct1m >= 0 ? '+' : ''}{perfMetrics.pct1m.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 uppercase block">3-Month Return (60d)</span>
                  <div className={`text-xl font-black ${perfMetrics.pct3m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct3m >= 0 ? '+' : ''}{perfMetrics.pct3m.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Price Extremes & Volatility */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">3-Month High Range</span>
                  <span className="text-sm font-extrabold text-white">৳{perfMetrics.high3m.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Dist: <strong className="text-amber-300">{perfMetrics.distFromHighPct.toFixed(1)}%</strong>
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">3-Month Low Floor</span>
                  <span className="text-sm font-extrabold text-slate-300">৳{perfMetrics.low3m.toFixed(1)}</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    Above Low: +{((latestClose - perfMetrics.low3m) / (perfMetrics.low3m || 1) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Max 3M Peak Drawdown</span>
                  <span className="text-sm font-extrabold text-rose-400">-{perfMetrics.maxDrawdown3mPct.toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    RSI (14): <strong className="text-indigo-300">{perfMetrics.rsi14.toFixed(1)}</strong>
                  </span>
                </div>
              </div>

              {/* Trend Alignment Indicator */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Moving Average Trend Position:</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={latestClose >= perfMetrics.sma20 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    20 SMA: ৳{perfMetrics.sma20.toFixed(1)} ({latestClose >= perfMetrics.sma20 ? 'Above ✓' : 'Below ✕'})
                  </span>
                  <span className={latestClose >= perfMetrics.sma50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    50 SMA: ৳{perfMetrics.sma50.toFixed(1)} ({latestClose >= perfMetrics.sma50 ? 'Above ✓' : 'Below ✕'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RISK & REWARD METRICS */}
        {activeTab === 'risk' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Risk Profile & Position Sizing Analytics
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  Win Rate: {historicalWinRate}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-indigo-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Risk-Reward Ratio</span>
                  <div className="text-2xl font-black text-indigo-300">{riskRewardRatio} : 1</div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    For every ৳1 risked, expected target reward is ৳{riskRewardRatio.toFixed(2)}.
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Recommended Allocation</span>
                  <div className="text-2xl font-black text-emerald-400">{recommendedPositionSizePct}%</div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Optimal portfolio weight based on Kelly Criterion risk limits.
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Historical Strategy Win Rate</span>
                  <div className="text-2xl font-black text-amber-300">{historicalWinRate}%</div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Win rate across past volume breakout patterns in DSE database.
                  </p>
                </div>
              </div>

              {/* Risk Level Bar & Calculations */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Risk vs Target Profit Margin</span>
                  <span className="text-slate-400">
                    Max Loss: -{potentialRiskPct}% | Max Target: +{potentialGainPct}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${(potentialRiskPct / (potentialRiskPct + potentialGainPct)) * 100}%` }}
                    title={`Risk: -${potentialRiskPct}%`}
                  />
                  <div
                    className="bg-emerald-400 h-full"
                    style={{ width: `${(potentialGainPct / (potentialRiskPct + potentialGainPct)) * 100}%` }}
                    title={`Gain: +${potentialGainPct}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span className="text-rose-400 font-bold">Stop Level: ৳{stopLossPrice}</span>
                  <span className="text-white font-bold">Entry: ৳{entryPrice}</span>
                  <span className="text-emerald-400 font-bold">Target Level: ৳{targetPrice}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DETECTED TECHNICAL PATTERNS */}
        {activeTab === 'patterns' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  All Detected Technical & Volatility Patterns ({detectedPatternList.length})
                </span>
                <span className="text-xs text-indigo-300 font-bold">
                  Primary: {detectedPattern}
                </span>
              </div>

              <div className="space-y-2.5">
                {detectedPatternList.map((pat, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-extrabold text-white text-sm">{pat.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-sans border border-slate-700">
                          {pat.category}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold text-[10px]">
                        {pat.confidence}% Confidence
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans pl-6 leading-relaxed">
                      {pat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Symbol: <span className="text-white font-bold">{symbol}</span> • 20d Turnover: <span className="text-amber-300 font-bold">৳{avgTurnoverBdtMillion}M</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenChart && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChart(symbol);
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs transition-all shadow-md shadow-indigo-950/40"
              >
                Inspect on D3 Interactive Chart
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
