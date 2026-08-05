import React, { useState, useMemo } from 'react';
import {
  Scale,
  ArrowLeftRight,
  TrendingUp,
  Zap,
  Target,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  Award,
  Calendar,
  Sparkles,
  Info,
  Maximize2,
  Eye,
  Activity,
  Layers,
  FileText
} from 'lucide-react';
import { PatternEdgeStat, DseStockData, DseStockCandle, BacktestConfig, BreakoutSignal, ScreenerStockCandidate } from '../types';
import { evaluateStockForScreener } from '../utils/dseBacktestEngine';
import { StockDetailModal } from './StockDetailModal';

interface DseStockComparerProps {
  stocks: DseStockData[];
  config: BacktestConfig;
  signals: BreakoutSignal[];
  edgeStats?: PatternEdgeStat[];
  onSelectStockForChart?: (symbol: string) => void;
}

export const DseStockComparer: React.FC<DseStockComparerProps> = ({
  stocks,
  config,
  signals,
  edgeStats,
  onSelectStockForChart,
}) => {
  // Evaluated screener candidates map for detailed comparison
  const screenerMap = useMemo(() => {
    const map = new Map<string, ScreenerStockCandidate>();
    stocks.forEach((st) => {
      const candidate = evaluateStockForScreener(st, config, signals, edgeStats);
      if (candidate) {
        map.set(st.symbol, candidate);
      }
    });
    return map;
  }, [stocks, config, signals]);

  // Available stock symbols
  const stockSymbols = useMemo(() => stocks.map((s) => s.symbol), [stocks]);

  // Selected Stock A and Stock B state
  const [symbolA, setSymbolA] = useState<string>(() => stockSymbols[0] || 'SQURPHARMA');
  const [symbolB, setSymbolB] = useState<string>(() => stockSymbols[1] || 'OLYMPIC');

  // Active Stock Data objects
  const stockA = useMemo(() => stocks.find((s) => s.symbol === symbolA) || stocks[0], [stocks, symbolA]);
  const stockB = useMemo(() => stocks.find((s) => s.symbol === symbolB) || stocks[1] || stocks[0], [stocks, symbolB]);

  const [modalCandidate, setModalCandidate] = useState<ScreenerStockCandidate | null>(null);

  // Active Candidate Evaluations
  const candA = useMemo(() => screenerMap.get(symbolA) || null, [screenerMap, symbolA]);
  const candB = useMemo(() => screenerMap.get(symbolB) || null, [screenerMap, symbolB]);

  // Signals specific to Stock A and Stock B
  const signalsA = useMemo(() => signals.filter((s) => s.symbol === symbolA), [signals, symbolA]);
  const signalsB = useMemo(() => signals.filter((s) => s.symbol === symbolB), [signals, symbolB]);

  // Handle Swap Stock A and Stock B
  const handleSwap = () => {
    setSymbolA(symbolB);
    setSymbolB(symbolA);
  };

  // Quick Preset Handlers
  const handleSelectTopTwo = () => {
    if (stockSymbols.length >= 2) {
      setSymbolA(stockSymbols[0]);
      setSymbolB(stockSymbols[1]);
    }
  };

  // Determine key advantages for Stock A vs Stock B
  const advantages = useMemo(() => {
    const list: { winner: 'A' | 'B' | 'TIE'; text: string; category: string }[] = [];
    if (!candA || !candB) return list;

    // 1. Profit Potential Score
    if (candA.profitPotentialScore > candB.profitPotentialScore) {
      list.push({
        winner: 'A',
        category: 'Profit Potential',
        text: `${candA.symbol} has a higher Profit Potential Score (${candA.profitPotentialScore}% vs ${candB.profitPotentialScore}%).`,
      });
    } else if (candB.profitPotentialScore > candA.profitPotentialScore) {
      list.push({
        winner: 'B',
        category: 'Profit Potential',
        text: `${candB.symbol} has a higher Profit Potential Score (${candB.profitPotentialScore}% vs ${candA.profitPotentialScore}%).`,
      });
    }

    // 2. Relative Volume Surge (RVOL)
    if (candA.rvol20 > candB.rvol20) {
      list.push({
        winner: 'A',
        category: 'Volume Momentum',
        text: `${candA.symbol} demonstrates stronger volume surge (${candA.rvol20}x vs ${candB.rvol20}x 20d ADV).`,
      });
    } else if (candB.rvol20 > candA.rvol20) {
      list.push({
        winner: 'B',
        category: 'Volume Momentum',
        text: `${candB.symbol} demonstrates stronger volume surge (${candB.rvol20}x vs ${candA.rvol20}x 20d ADV).`,
      });
    }

    // 3. Risk Protection (Stop Loss %)
    if (candA.potentialRiskPct < candB.potentialRiskPct) {
      list.push({
        winner: 'A',
        category: 'Risk Protection',
        text: `${candA.symbol} features a tighter stop-loss risk (-${candA.potentialRiskPct}% vs -${candB.potentialRiskPct}%).`,
      });
    } else if (candB.potentialRiskPct < candA.potentialRiskPct) {
      list.push({
        winner: 'B',
        category: 'Risk Protection',
        text: `${candB.symbol} features a tighter stop-loss risk (-${candB.potentialRiskPct}% vs -${candA.potentialRiskPct}%).`,
      });
    }

    // 4. Fundamental Growth (YoY EPS)
    if (candA.yoyGrowthPct > candB.yoyGrowthPct) {
      list.push({
        winner: 'A',
        category: 'Fundamentals',
        text: `${candA.symbol} delivers higher YoY EPS fundamental growth (+${candA.yoyGrowthPct}% vs +${candB.yoyGrowthPct}%).`,
      });
    } else if (candB.yoyGrowthPct > candA.yoyGrowthPct) {
      list.push({
        winner: 'B',
        category: 'Fundamentals',
        text: `${candB.symbol} delivers higher YoY EPS fundamental growth (+${candB.yoyGrowthPct}% vs +${candA.yoyGrowthPct}%).`,
      });
    }

    // 5. Valuation P/E Ratio
    if (candA.peRatio < candB.peRatio) {
      list.push({
        winner: 'A',
        category: 'Valuation',
        text: `${candA.symbol} trades at a more attractive P/E ratio (${candA.peRatio}x vs ${candB.peRatio}x).`,
      });
    } else if (candB.peRatio < candA.peRatio) {
      list.push({
        winner: 'B',
        category: 'Valuation',
        text: `${candB.symbol} trades at a more attractive P/E ratio (${candB.peRatio}x vs ${candA.peRatio}x).`,
      });
    }

    return list;
  }, [candA, candB]);

  // Render Mini Candlestick + Volume SVG Chart for split view
  const renderMiniChart = (stock: DseStockData, cand: ScreenerStockCandidate | null, themeColor: 'cyan' | 'purple') => {
    if (!stock || !stock.candles || stock.candles.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-slate-500 text-xs italic">
          No candle data available for {stock?.symbol}
        </div>
      );
    }

    const candles = stock.candles.slice(-40); // Last 40 trading days for clean comparison view
    const prices = candles.map((c) => [c.open, c.high, c.low, c.close]).flat();
    const minPrice = Math.min(...prices) * 0.98;
    const maxPrice = Math.max(...prices) * 1.02;
    const maxVol = Math.max(...candles.map((c) => c.volume)) || 1;

    const width = 500;
    const height = 220;
    const padding = { top: 15, right: 15, bottom: 25, left: 40 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xScale = (i: number) => padding.left + (i / (candles.length - 1 || 1)) * chartW;
    const yScale = (p: number) => padding.top + chartH - ((p - minPrice) / (maxPrice - minPrice || 1)) * chartH;
    const vScale = (v: number) => (v / maxVol) * (chartH * 0.35);

    const isCyan = themeColor === 'cyan';
    const mainStroke = isCyan ? '#06b6d4' : '#a855f7';
    const upColor = '#10b981';
    const downColor = '#f43f5e';

    return (
      <div className="w-full relative bg-slate-950/80 rounded-xl border border-slate-800/80 p-2 overflow-hidden shadow-inner">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio, idx) => {
            const pVal = minPrice + ratio * (maxPrice - minPrice);
            const y = yScale(pVal);
            return (
              <g key={idx}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding.left - 5} y={y + 3} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="monospace">
                  ৳{pVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* 20-Day SMA Trendline */}
          {(() => {
            const pathPoints = candles
              .map((c, i) => {
                if (i < 5) return null;
                const slice = candles.slice(Math.max(0, i - 19), i + 1);
                const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / slice.length;
                return `${xScale(i)},${yScale(avg)}`;
              })
              .filter(Boolean);

            if (pathPoints.length > 1) {
              return (
                <path
                  d={`M ${pathPoints.join(' L ')}`}
                  fill="none"
                  stroke={mainStroke}
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity="0.8"
                />
              );
            }
            return null;
          })()}

          {/* Candlesticks & Volume Bars */}
          {candles.map((c, i) => {
            const x = xScale(i);
            const isUp = c.close >= c.open;
            const candleColor = isUp ? upColor : downColor;

            const yHigh = yScale(c.high);
            const yLow = yScale(c.low);
            const yOpen = yScale(c.open);
            const yClose = yScale(c.close);

            const candleTop = Math.min(yOpen, yClose);
            const candleHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
            const candleWidth = Math.max(chartW / candles.length - 2, 3);

            const vH = vScale(c.volume);
            const vY = height - padding.bottom - vH;

            return (
              <g key={i} className="hover:opacity-80 transition-opacity">
                {/* Volume Bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={vY}
                  width={candleWidth}
                  height={vH}
                  fill={candleColor}
                  opacity="0.25"
                  rx="1"
                />
                {/* Candle Wick */}
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1" />
                {/* Candle Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={candleTop}
                  width={candleWidth}
                  height={candleHeight}
                  fill={candleColor}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Breakout Signal Highlight Line if present */}
          {cand && (
            <g>
              {/* Target Line */}
              <line
                x1={padding.left}
                y1={yScale(cand.targetPrice)}
                x2={width - padding.right}
                y2={yScale(cand.targetPrice)}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text x={width - padding.right - 2} y={yScale(cand.targetPrice) - 3} textAnchor="end" fill="#10b981" fontSize="8" fontFamily="monospace" fontWeight="bold">
                Target ৳{cand.targetPrice}
              </text>

              {/* Stop Loss Line */}
              <line
                x1={padding.left}
                y1={yScale(cand.stopLossPrice)}
                x2={width - padding.right}
                y2={yScale(cand.stopLossPrice)}
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text x={width - padding.right - 2} y={yScale(cand.stopLossPrice) + 8} textAnchor="end" fill="#f43f5e" fontSize="8" fontFamily="monospace" fontWeight="bold">
                SL ৳{cand.stopLossPrice}
              </text>
            </g>
          )}
        </svg>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1 pt-1 border-t border-slate-800/80">
          <span>Range: {candles[0]?.date} - {candles[candles.length - 1]?.date}</span>
          <span className="text-slate-300">LTP: <strong className="text-white">৳{candles[candles.length - 1]?.close}</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls & Stock Selection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Side-by-Side Stock Performance Comparison</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/30">
                  REAL-TIME COMPARATOR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare technical patterns, risk-reward parameters, volume surges, and price trends head-to-head.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleSelectTopTwo}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Compare Top #1 vs #2</span>
            </button>

            <button
              onClick={handleSwap}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-300 text-xs font-bold font-mono border border-indigo-500/40 flex items-center gap-1.5 transition-colors"
              title="Swap Stock A and Stock B positions"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Swap A ⇆ B</span>
            </button>
          </div>
        </div>

        {/* Stock Selector Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stock A Selector */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Select Stock A (Primary Focus)
              </label>
              {candA && (
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  Score: {candA.profitPotentialScore}%
                </span>
              )}
            </div>
            <select
              value={symbolA}
              onChange={(e) => setSymbolA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-cyan-400"
            >
              {stockSymbols.map((sym) => {
                const cand = screenerMap.get(sym);
                return (
                  <option key={`a-${sym}`} value={sym}>
                    {sym} - {cand ? `${cand.stockName} (${cand.profitPotentialScore}% Score)` : sym}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stock B Selector */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                Select Stock B (Benchmark Comparison)
              </label>
              {candB && (
                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30">
                  Score: {candB.profitPotentialScore}%
                </span>
              )}
            </div>
            <select
              value={symbolB}
              onChange={(e) => setSymbolB(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-purple-400"
            >
              {stockSymbols.map((sym) => {
                const cand = screenerMap.get(sym);
                return (
                  <option key={`b-${sym}`} value={sym}>
                    {sym} - {cand ? `${cand.stockName} (${cand.profitPotentialScore}% Score)` : sym}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Advantage & Key Superiority Highlights Banner */}
      {advantages.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Key Performance Superiority & Trade Advantage Highlights
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {advantages.map((adv, idx) => {
              const isA = adv.winner === 'A';
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs font-mono leading-snug ${
                    isA
                      ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                      : 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                  }`}
                >
                  <Award className={`w-4 h-4 shrink-0 mt-0.5 ${isA ? 'text-cyan-400' : 'text-purple-400'}`} />
                  <div>
                    <span className="font-extrabold uppercase text-[10px] block opacity-75">
                      {adv.category} • Winner: {isA ? symbolA : symbolB}
                    </span>
                    <span>{adv.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split-Screen Interactive Candlestick Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Stock A */}
        <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl p-5 shadow-xl space-y-4 relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-extrabold font-mono text-[10px]">
                  STOCK A
                </span>
                <h3 className="text-lg font-black text-white font-mono">{stockA.symbol}</h3>
                <span className="text-xs text-slate-400">({stockA.name})</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sector: <span className="text-slate-200">{stockA.sector}</span> • YoY Growth: <span className="text-emerald-400 font-mono">+{stockA.yoyGrowthPct}%</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {candA && (
                <button
                  onClick={() => setModalCandidate(candA)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold font-mono text-[11px] border border-indigo-500/40 flex items-center gap-1 transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5" /> 3M Details
                </button>
              )}
              {onSelectStockForChart && (
                <button
                  onClick={() => onSelectStockForChart(stockA.symbol)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 font-bold font-mono text-[11px] border border-cyan-500/40 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Full D3 Chart
                </button>
              )}
            </div>
          </div>

          {/* SVG Mini Chart */}
          {renderMiniChart(stockA, candA, 'cyan')}

          {/* Core Metrics Quick Cards */}
          {candA && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Entry Price</span>
                <strong className="text-white text-sm">৳{candA.entryPrice}</strong>
              </div>
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 block">Target Price</span>
                <strong className="text-emerald-300 text-sm">৳{candA.targetPrice}</strong>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 block">Stop Loss</span>
                <strong className="text-rose-300 text-sm">৳{candA.stopLossPrice}</strong>
              </div>
              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                <span className="text-[10px] text-indigo-400 block">Risk:Reward</span>
                <strong className="text-indigo-300 text-sm">{candA.riskRewardRatio} : 1</strong>
              </div>
            </div>
          )}
        </div>

        {/* Panel B: Stock B */}
        <div className="bg-slate-900 border-2 border-purple-500/40 rounded-2xl p-5 shadow-xl space-y-4 relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold font-mono text-[10px]">
                  STOCK B
                </span>
                <h3 className="text-lg font-black text-white font-mono">{stockB.symbol}</h3>
                <span className="text-xs text-slate-400">({stockB.name})</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sector: <span className="text-slate-200">{stockB.sector}</span> • YoY Growth: <span className="text-emerald-400 font-mono">+{stockB.yoyGrowthPct}%</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {candB && (
                <button
                  onClick={() => setModalCandidate(candB)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold font-mono text-[11px] border border-indigo-500/40 flex items-center gap-1 transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5" /> 3M Details
                </button>
              )}
              {onSelectStockForChart && (
                <button
                  onClick={() => onSelectStockForChart(stockB.symbol)}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 font-bold font-mono text-[11px] border border-purple-500/40 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Full D3 Chart
                </button>
              )}
            </div>
          </div>

          {/* SVG Mini Chart */}
          {renderMiniChart(stockB, candB, 'purple')}

          {/* Core Metrics Quick Cards */}
          {candB && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Entry Price</span>
                <strong className="text-white text-sm">৳{candB.entryPrice}</strong>
              </div>
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 block">Target Price</span>
                <strong className="text-emerald-300 text-sm">৳{candB.targetPrice}</strong>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 block">Stop Loss</span>
                <strong className="text-rose-300 text-sm">৳{candB.stopLossPrice}</strong>
              </div>
              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
                <span className="text-[10px] text-indigo-400 block">Risk:Reward</span>
                <strong className="text-indigo-300 text-sm">{candB.riskRewardRatio} : 1</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Head-to-Head Detailed Parameter Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              Head-to-Head Technical & Fundamental Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Green highlights indicate superior parameter
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Comparison Metric</th>
                <th className="p-3 text-cyan-400 w-2/5">Stock A: {symbolA}</th>
                <th className="p-3 text-purple-400 w-2/5">Stock B: {symbolB}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {/* Decision Signal */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Decision Status</td>
                <td className="p-3 font-bold">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    candA?.decisionStatus === 'STRONG_BUY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {candA?.decisionStatus || 'NEUTRAL'}
                  </span>
                </td>
                <td className="p-3 font-bold">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    candB?.decisionStatus === 'STRONG_BUY' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {candB?.decisionStatus || 'NEUTRAL'}
                  </span>
                </td>
              </tr>

              {/* Profit Potential Score */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Profit Potential Score</td>
                <td className={`p-3 font-bold text-base ${candA && candB && candA.profitPotentialScore >= candB.profitPotentialScore ? 'text-emerald-400 font-black' : 'text-slate-300'}`}>
                  {candA?.profitPotentialScore ?? 'N/A'}%
                </td>
                <td className={`p-3 font-bold text-base ${candA && candB && candB.profitPotentialScore >= candA.profitPotentialScore ? 'text-emerald-400 font-black' : 'text-slate-300'}`}>
                  {candB?.profitPotentialScore ?? 'N/A'}%
                </td>
              </tr>

              {/* Current Price (LTP) */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Last Traded Price (LTP)</td>
                <td className="p-3 font-extrabold text-white">৳{candA?.latestClose ?? stockA?.candles?.[stockA.candles.length - 1]?.close}</td>
                <td className="p-3 font-extrabold text-white">৳{candB?.latestClose ?? stockB?.candles?.[stockB.candles.length - 1]?.close}</td>
              </tr>

              {/* RVOL Volume Surge */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Relative Volume Surge (RVOL)</td>
                <td className={`p-3 font-extrabold ${candA && candB && candA.rvol20 >= candB.rvol20 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {candA?.rvol20 ?? '1.0'}x 20d ADV
                </td>
                <td className={`p-3 font-extrabold ${candA && candB && candB.rvol20 >= candA.rvol20 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {candB?.rvol20 ?? '1.0'}x 20d ADV
                </td>
              </tr>

              {/* Technical Pattern */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Technical Chart Pattern</td>
                <td className="p-3 font-bold text-amber-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> {candA?.breakoutPattern || 'Consolidation'}
                </td>
                <td className="p-3 font-bold text-amber-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> {candB?.breakoutPattern || 'Consolidation'}
                </td>
              </tr>

              {/* Potential Profit Gain % */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Potential Profit (+%)</td>
                <td className={`p-3 font-bold ${candA && candB && candA.potentialGainPct >= candB.potentialGainPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                  +{candA?.potentialGainPct ?? config.targetProfitPct}% (৳{candA?.targetPrice})
                </td>
                <td className={`p-3 font-bold ${candA && candB && candB.potentialGainPct >= candA.potentialGainPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                  +{candB?.potentialGainPct ?? config.targetProfitPct}% (৳{candB?.targetPrice})
                </td>
              </tr>

              {/* Risk Protection (Stop Loss %) */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Risk Limit (Stop Loss -%)</td>
                <td className={`p-3 font-bold ${candA && candB && candA.potentialRiskPct <= candB.potentialRiskPct ? 'text-emerald-400' : 'text-rose-400'}`}>
                  -{candA?.potentialRiskPct ?? config.stopLossPct}% (৳{candA?.stopLossPrice})
                </td>
                <td className={`p-3 font-bold ${candA && candB && candB.potentialRiskPct <= candA.potentialRiskPct ? 'text-emerald-400' : 'text-rose-400'}`}>
                  -{candB?.potentialRiskPct ?? config.stopLossPct}% (৳{candB?.stopLossPrice})
                </td>
              </tr>

              {/* Risk Reward Ratio */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Risk-Reward Ratio</td>
                <td className={`p-3 font-bold ${candA && candB && candA.riskRewardRatio >= candB.riskRewardRatio ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {candA?.riskRewardRatio ?? '3.0'} : 1
                </td>
                <td className={`p-3 font-bold ${candA && candB && candB.riskRewardRatio >= candA.riskRewardRatio ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {candB?.riskRewardRatio ?? '3.0'} : 1
                </td>
              </tr>

              {/* Historical Backtest Win Rate */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Historical Signal Win Rate</td>
                <td className={`p-3 font-bold ${candA && candB && candA.historicalWinRate >= candB.historicalWinRate ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {candA?.historicalWinRate ?? 80}%
                </td>
                <td className={`p-3 font-bold ${candA && candB && candB.historicalWinRate >= candA.historicalWinRate ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {candB?.historicalWinRate ?? 80}%
                </td>
              </tr>

              {/* YoY Growth Pct */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">YoY EPS Fundamental Growth</td>
                <td className={`p-3 font-bold ${stockA.yoyGrowthPct >= stockB.yoyGrowthPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                  +{stockA.yoyGrowthPct}%
                </td>
                <td className={`p-3 font-bold ${stockB.yoyGrowthPct >= stockA.yoyGrowthPct ? 'text-emerald-400' : 'text-slate-300'}`}>
                  +{stockB.yoyGrowthPct}%
                </td>
              </tr>

              {/* Valuation P/E Ratio */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">P/E Ratio Valuation</td>
                <td className={`p-3 font-bold ${stockA.peRatio <= stockB.peRatio ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {stockA.peRatio}x
                </td>
                <td className={`p-3 font-bold ${stockB.peRatio <= stockA.peRatio ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {stockB.peRatio}x
                </td>
              </tr>

              {/* Recommended Position Size */}
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-semibold text-slate-400">Portfolio Allocation %</td>
                <td className="p-3 font-extrabold text-indigo-300">{candA?.recommendedPositionSizePct ?? 10}% Portfolio</td>
                <td className="p-3 font-extrabold text-indigo-300">{candB?.recommendedPositionSizePct ?? 10}% Portfolio</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Deep Analysis Modal */}
      {modalCandidate && (
        <StockDetailModal
          candidate={modalCandidate}
          config={config}
          onClose={() => setModalCandidate(null)}
          onOpenChart={onSelectStockForChart}
        />
      )}
    </div>
  );
};
