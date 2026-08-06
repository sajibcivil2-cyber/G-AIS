import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Zap,
  Info,
  Maximize2,
  Eye,
  Sliders,
  Layers,
  Activity,
  Award,
  CheckCircle2,
  Filter,
  Clock
} from 'lucide-react';
import { DseStockData, DseStockCandle, BacktestConfig, BreakoutSignal } from '../types';
import { detectHarmonicPattern } from '../utils/dseBacktestEngine';

interface DseVolumeBreakoutChartProps {
  stocks: DseStockData[];
  signals: BreakoutSignal[];
  config: BacktestConfig;
  onSelectSignal?: (signal: BreakoutSignal) => void;
  initialSymbol?: string;
  onBack?: () => void;
}

interface ProcessedCandle extends DseStockCandle {
  ma20Price: number | null;
  ma20Volume: number | null;
  volumeThreshold: number | null;
  isVolumeBreakout: boolean;
  rvol: number;
  signal: BreakoutSignal | null;
  rsi: number | null;
  obv: number;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
}

/**
 * Calculates 14-period RSI (Relative Strength Index)
 */
function computeRsi(candles: DseStockCandle[], period = 14): (number | null)[] {
  const n = candles.length;
  const rsiValues: (number | null)[] = Array(n).fill(null);
  if (n <= period) return rsiValues;

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiValues[period] = Number((100 - 100 / (1 + rs)).toFixed(1));

  for (let i = period + 1; i < n; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsiValues[i] = 100;
    } else {
      const currentRs = avgGain / avgLoss;
      rsiValues[i] = Number((100 - 100 / (1 + currentRs)).toFixed(1));
    }
  }

  return rsiValues;
}

/**
 * Calculates On-Balance Volume (OBV)
 */
function computeObv(candles: DseStockCandle[]): number[] {
  const obvValues: number[] = [];
  let currentObv = 0;

  candles.forEach((c, i) => {
    if (i === 0) {
      obvValues.push(0);
      return;
    }
    const prevClose = candles[i - 1].close;
    if (c.close > prevClose) {
      currentObv += c.volume;
    } else if (c.close < prevClose) {
      currentObv -= c.volume;
    }
    obvValues.push(currentObv);
  });

  return obvValues;
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
function computeBollingerBands(candles: DseStockCandle[], period = 20, multiplier = 2): {
  bbUpper: (number | null)[];
  bbMiddle: (number | null)[];
  bbLower: (number | null)[];
} {
  const n = candles.length;
  const bbUpper: (number | null)[] = Array(n).fill(null);
  const bbMiddle: (number | null)[] = Array(n).fill(null);
  const bbLower: (number | null)[] = Array(n).fill(null);

  for (let i = period - 1; i < n; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
    const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    bbMiddle[i] = Number(mean.toFixed(2));
    bbUpper[i] = Number((mean + multiplier * stdDev).toFixed(2));
    bbLower[i] = Number((mean - multiplier * stdDev).toFixed(2));
  }

  return { bbUpper, bbMiddle, bbLower };
}

export const DseVolumeBreakoutChart: React.FC<DseVolumeBreakoutChartProps> = ({
  stocks,
  signals,
  config,
  onSelectSignal,
  initialSymbol,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Stock Symbol
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    return initialSymbol || signals[0]?.symbol || stocks[0]?.symbol || 'SQURPHARMA';
  });

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  // Timeframe Filter: '1M' | '3M' | '6M' | '1Y' | 'ALL'
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');

  // Pattern Marker Filter Controls
  const [showSignals, setShowSignals] = useState<boolean>(true); // Master Toggle for Pattern Markers
  const [selectedPatternFilter, setSelectedPatternFilter] = useState<string>('ALL'); // 'ALL' | 'Bullish Flag' | 'Double Bottom' | 'Cup & Handle' | 'Ascending Triangle' | 'VCP Compression' | 'Volume Surge'
  const [showAllWindowMarkers, setShowAllWindowMarkers] = useState<boolean>(false); // false = recent 7 days, true = full range window

  // Chart Style: 'candlestick' | 'area'
  const [chartType, setChartType] = useState<'candlestick' | 'area'>('candlestick');

  // Subpanel & Overlay Toggles
  const [showBBands, setShowBBands] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showRsi, setShowRsi] = useState<boolean>(true);
  const [showObv, setShowObv] = useState<boolean>(true);
  const [showHarmonics, setShowHarmonics] = useState<boolean>(false); // False by default to reduce clutter on load
  const [showFibLevels, setShowFibLevels] = useState<boolean>(false);

  // Hover state
  const [hoveredData, setHoveredData] = useState<ProcessedCandle | null>(null);

  // Responsive dimensions state
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 580,
  });

  // Track container resize dynamically with a ResizeObserver to avoid horizontal compression on timeframe toggle
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({ width, height: 580 });
      }
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Active Stock Data
  const currentStock = useMemo(() => {
    return stocks.find((s) => s.symbol === selectedSymbol) || stocks[0];
  }, [stocks, selectedSymbol]);

  // Stock Signals
  const stockSignals = useMemo(() => {
    return signals.filter((s) => s.symbol === selectedSymbol);
  }, [signals, selectedSymbol]);

  // Process all candles with indicators
  const allProcessedCandles = useMemo<ProcessedCandle[]>(() => {
    if (!currentStock || !currentStock.candles) return [];

    const candles = currentStock.candles;
    const rsiList = computeRsi(candles);
    const obvList = computeObv(candles);
    const { bbUpper, bbMiddle, bbLower } = computeBollingerBands(candles);

    return candles.map((c, idx) => {
      let ma20Price: number | null = null;
      let ma20Volume: number | null = null;
      let volumeThreshold: number | null = null;

      if (idx >= 19) {
        const slice = candles.slice(idx - 19, idx + 1);
        const sumPrice = slice.reduce((acc, item) => acc + item.close, 0);
        const sumVol = slice.reduce((acc, item) => acc + item.volume, 0);
        ma20Price = sumPrice / 20;
        ma20Volume = sumVol / 20;
        volumeThreshold = ma20Volume * config.volumeSurgeMultiplier;
      }

      const rvol = ma20Volume && ma20Volume > 0 ? c.volume / ma20Volume : 1.0;
      const isPriceGreen = c.close > c.open;
      const isVolumeBreakout = !!volumeThreshold && c.volume >= volumeThreshold && isPriceGreen;
      const matchedSignal = stockSignals.find((sig) => sig.breakoutDate === c.date) || null;

      return {
        ...c,
        ma20Price,
        ma20Volume,
        volumeThreshold,
        isVolumeBreakout,
        rvol: Number(rvol.toFixed(2)),
        signal: matchedSignal,
        rsi: rsiList[idx],
        obv: obvList[idx],
        bbUpper: bbUpper[idx],
        bbMiddle: bbMiddle[idx],
        bbLower: bbLower[idx],
      };
    });
  }, [currentStock, stockSignals, config.volumeSurgeMultiplier]);

  // Filtered Candles according to selected Timeframe
  const processedCandles = useMemo(() => {
    if (allProcessedCandles.length === 0) return [];
    let count = allProcessedCandles.length;

    if (timeframe === '1M') count = 22;
    else if (timeframe === '3M') count = 65;
    else if (timeframe === '6M') count = 130;
    else if (timeframe === '1Y') count = 250;

    return allProcessedCandles.slice(-Math.min(count, allProcessedCandles.length));
  }, [allProcessedCandles, timeframe]);

  // Total Breakouts on this filtered timeframe
  const totalStockBreakouts = useMemo(() => {
    return processedCandles.filter((c) => c.isVolumeBreakout).length;
  }, [processedCandles]);

  // Calculate dynamic width based on number of candles to prevent horizontal compression!
  const finalChartWidth = useMemo(() => {
    const minBarWidth = 10;
    const margin = { left: 55, right: 60 };
    const requiredWidth = processedCandles.length * minBarWidth + margin.left + margin.right;
    return Math.max(dimensions.width, requiredWidth);
  }, [processedCandles.length, dimensions.width]);

  // Auto-scroll to the latest data on the far right
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [processedCandles.length, timeframe]);

  if (!currentStock) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 font-mono text-sm">
        No stock data found or pool is empty. Please select a different sector or upload a valid DSE dataset.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl text-slate-200">
      {/* Top Bar: Stock Selector & Fundamental Quick Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white font-mono">{currentStock.symbol}</h2>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                  {currentStock.sector}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentStock.name}</p>
            </div>
          </div>
        </div>

        {/* Stock Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">Stock:</span>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
          >
            {stocks.map((st) => (
              <option key={st.symbol} value={st.symbol}>
                {st.symbol} — {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Control Toolbar: Range Selector & Pattern Marker Filtering */}
      <div className="flex flex-col gap-3 bg-slate-950/90 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Timeframe Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Range:
            </span>
            <div className="flex items-center gap-1">
              {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold font-mono transition-all ${
                    timeframe === tf
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            {processedCandles.length > 0 && (
              <span className="hidden md:inline-block text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800">
                {timeframe === '1M' && '1 Month (22 Trading Days)'}
                {timeframe === '3M' && '3 Months (65 Trading Days)'}
                {timeframe === '6M' && '6 Months (130 Trading Days)'}
                {timeframe === '1Y' && '1 Year (250 Trading Days)'}
                {timeframe === 'ALL' && 'Full Historical Data'}
                {' • '}
                <span className="text-emerald-400 font-bold">
                  {processedCandles[0]?.date} ➔ {processedCandles[processedCandles.length - 1]?.date}
                </span>
              </span>
            )}
          </div>

          {/* Indicator & Subpanel Toggles */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Chart Mode */}
            <button
              onClick={() => setChartType(chartType === 'candlestick' ? 'area' : 'candlestick')}
              className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                chartType === 'candlestick' ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{chartType === 'candlestick' ? 'Candles' : 'Area Line'}</span>
            </button>

            {/* Bollinger Bands */}
            <button
              onClick={() => setShowBBands(!showBBands)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                showBBands ? 'bg-sky-950/80 text-sky-300 border-sky-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              BBands
            </button>

            {/* Volume */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                showVolume ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Volume
            </button>

            {/* RSI */}
            <button
              onClick={() => setShowRsi(!showRsi)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                showRsi ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              RSI (14)
            </button>

            {/* OBV */}
            <button
              onClick={() => setShowObv(!showObv)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                showObv ? 'bg-purple-950/80 text-purple-300 border-purple-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              OBV
            </button>

            {/* Harmonics */}
            <button
              onClick={() => setShowHarmonics(!showHarmonics)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                showHarmonics ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Harmonics (Bullish W)
            </button>

            {/* Fib Levels */}
            <button
              onClick={() => setShowFibLevels(!showFibLevels)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                showFibLevels ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Fib Levels
            </button>
          </div>
        </div>

        {/* Pattern Marker Control Bar (Hide/Show & Filter Individual Patterns) */}
        <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Master Toggle */}
            <button
              onClick={() => setShowSignals(!showSignals)}
              className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition-colors ${
                showSignals
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pattern Markers: {showSignals ? 'ON' : 'OFF'}</span>
            </button>

            {showSignals && (
              <>
                {/* Specific Pattern Chips */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                  {[
                    { id: 'ALL', label: 'All Markers', icon: '✨' },
                    { id: 'Bullish Flag', label: 'Flag', icon: '🚩' },
                    { id: 'Double Bottom', label: 'W-Bottom', icon: 'Ⓦ' },
                    { id: 'Cup & Handle', label: 'Cup', icon: '🍵' },
                    { id: 'Ascending Triangle', label: 'Triangle', icon: '🔺' },
                    { id: 'VCP Compression', label: 'VCP Coil', icon: '⚡' },
                    { id: 'Harmonic Pattern (C-to-D)', label: 'Harmonic C-to-D', icon: '💎' },
                    { id: 'Harmonic Pattern (D-Reversal)', label: 'Harmonic D-Reversal', icon: '🎯' },
                    { id: 'Volume Surge', label: 'Vol Surge', icon: '⚡' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatternFilter(p.id)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
                        selectedPatternFilter === p.id
                          ? 'bg-indigo-600 text-white shadow border border-indigo-400'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* Scope Switcher: Recent 7 Days vs Full Timeframe */}
                <button
                  onClick={() => setShowAllWindowMarkers(!showAllWindowMarkers)}
                  className={`px-2.5 py-1 rounded-lg border transition-colors ${
                    showAllWindowMarkers
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                  title="Toggle between showing markers for recent 7 days only vs entire selected timeframe window"
                >
                  Scope: {showAllWindowMarkers ? `Full ${timeframe} Window` : 'Recent 7 Days'}
                </button>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            {totalStockBreakouts} breakout signal{totalStockBreakouts === 1 ? '' : 's'} identified in active {timeframe} window
          </div>
        </div>
      </div>

      {/* Hover Info Header Readout */}
      <div className="min-h-[28px] bg-slate-950 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs font-mono">
        {hoveredData ? (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-slate-400">Date: <strong className="text-white">{hoveredData.date}</strong></span>
            <span className="text-slate-400">O: <strong className="text-white">৳{hoveredData.open}</strong></span>
            <span className="text-slate-400">H: <strong className="text-white">৳{hoveredData.high}</strong></span>
            <span className="text-slate-400">L: <strong className="text-white">৳{hoveredData.low}</strong></span>
            <span className="text-slate-400">C: <strong className={hoveredData.close >= hoveredData.open ? 'text-emerald-400' : 'text-rose-400'}>৳{hoveredData.close}</strong></span>
            <span className="text-slate-400">Vol: <strong className="text-white">{hoveredData.volume.toLocaleString()}</strong></span>
            {hoveredData.rsi !== null && (
              <span className="text-slate-400">RSI: <strong className="text-amber-400">{hoveredData.rsi}</strong></span>
            )}
          </div>
        ) : (
          <div className="text-slate-500 text-[11px]">
            Hover over candlesticks to inspect price action, volume, RSI & OBV values.
          </div>
        )}
      </div>

      {/* Main D3 SVG Container */}
      <div ref={containerRef} className="w-full relative min-h-[580px] bg-slate-950 rounded-xl border border-slate-800/80 p-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent shadow-inner">
        <D3ChartCanvas
          processedCandles={processedCandles}
          allProcessedCandles={allProcessedCandles}
          chartType={chartType}
          showBBands={showBBands}
          showVolume={showVolume}
          showRsi={showRsi}
          showObv={showObv}
          showSignals={showSignals}
          selectedPatternFilter={selectedPatternFilter}
          showAllWindowMarkers={showAllWindowMarkers}
          showHarmonics={showHarmonics}
          showFibLevels={showFibLevels}
          dimensions={dimensions}
          onSelectSignal={onSelectSignal}
          setHoveredData={setHoveredData}
          currentStock={currentStock}
          timeframe={timeframe}
          finalChartWidth={finalChartWidth}
        />
      </div>
    </div>
  );
};

interface D3ChartCanvasProps {
  processedCandles: ProcessedCandle[];
  allProcessedCandles: ProcessedCandle[];
  chartType: 'candlestick' | 'area';
  showBBands: boolean;
  showVolume: boolean;
  showRsi: boolean;
  showObv: boolean;
  showSignals: boolean;
  selectedPatternFilter: string;
  showAllWindowMarkers: boolean;
  showHarmonics: boolean;
  showFibLevels: boolean;
  dimensions: { width: number; height: number };
  onSelectSignal?: (signal: BreakoutSignal) => void;
  setHoveredData: (data: ProcessedCandle | null) => void;
  currentStock: DseStockData;
  timeframe: string;
  finalChartWidth: number;
}

const D3ChartCanvas: React.FC<D3ChartCanvasProps> = React.memo(({
  processedCandles,
  allProcessedCandles,
  chartType,
  showBBands,
  showVolume,
  showRsi,
  showObv,
  showSignals,
  selectedPatternFilter,
  showAllWindowMarkers,
  showHarmonics,
  showFibLevels,
  dimensions,
  onSelectSignal,
  setHoveredData,
  currentStock,
  timeframe,
  finalChartWidth,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || processedCandles.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = finalChartWidth; // Use finalChartWidth for drawing to prevent compression!
    const height = dimensions.height;
    const margin = { top: 25, right: 60, bottom: 30, left: 55 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calculate subpanel height distribution based on enabled toggles
    let activeSubPanels = 0;
    if (showVolume) activeSubPanels++;
    if (showRsi) activeSubPanels++;
    if (showObv) activeSubPanels++;

    const subPanelHeight = activeSubPanels > 0 ? Math.min(85, (chartHeight * 0.38) / activeSubPanels) : 0;
    const gap = 12;

    const priceHeight = chartHeight - activeSubPanels * (subPanelHeight + gap);

    let currentYOffset = priceHeight + gap;

    const volumeTop = showVolume ? currentYOffset : 0;
    if (showVolume) currentYOffset += subPanelHeight + gap;

    const rsiTop = showRsi ? currentYOffset : 0;
    if (showRsi) currentYOffset += subPanelHeight + gap;

    const obvTop = showObv ? currentYOffset : 0;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const dates = processedCandles.map((d) => d.date);
    const xScale = d3.scaleBand<string>().domain(dates).range([0, chartWidth]).padding(0.25);

    // Price Y Scale
    const minPrice = d3.min(processedCandles, (d: ProcessedCandle) => d.low) ?? 10;
    const maxPrice = d3.max(processedCandles, (d: ProcessedCandle) => d.high) ?? 100;
    const pPadding = (maxPrice - minPrice) * 0.08;

    const yScalePrice = d3
      .scaleLinear()
      .domain([minPrice - pPadding, maxPrice + pPadding])
      .range([priceHeight, 0]);

    // Volume Y Scale
    const maxVol = d3.max(processedCandles, (d: ProcessedCandle) => d.volume) ?? 100000;
    const yScaleVolume = d3
      .scaleLinear()
      .domain([0, maxVol * 1.15])
      .range([volumeTop + subPanelHeight, volumeTop]);

    // RSI Y Scale (0 to 100)
    const yScaleRsi = d3
      .scaleLinear()
      .domain([0, 100])
      .range([rsiTop + subPanelHeight, rsiTop]);

    // OBV Y Scale
    const minObv = d3.min(processedCandles, (d: ProcessedCandle) => d.obv) ?? 0;
    const maxObv = d3.max(processedCandles, (d: ProcessedCandle) => d.obv) ?? 100;
    const obvPad = (maxObv - minObv) * 0.1 || 10;
    const yScaleObv = d3
      .scaleLinear()
      .domain([minObv - obvPad, maxObv + obvPad])
      .range([obvTop + subPanelHeight, obvTop]);

    // --- GRID LINES ---
    const priceTicks = yScalePrice.ticks(5);
    priceTicks.forEach((tick) => {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', yScalePrice(tick))
        .attr('y2', yScalePrice(tick))
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3,3');
    });

    // --- AXES ---
    const step = Math.ceil(dates.length / 7);
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(dates.filter((_, i) => i % step === 0))
      .tickFormat((d) => {
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
        return d;
      });

    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .attr('color', '#475569')
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Left Price Axis
    const yAxisPrice = d3.axisLeft(yScalePrice).ticks(5).tickFormat((d) => `৳${d}`);
    g.append('g')
      .call(yAxisPrice)
      .attr('color', '#334155')
      .selectAll('text')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Panel Separators
    if (showVolume) {
      g.append('line').attr('x1', 0).attr('x2', chartWidth).attr('y1', volumeTop - gap / 2).attr('y2', volumeTop - gap / 2).attr('stroke', '#334155').attr('stroke-width', 1);
    }
    if (showRsi) {
      g.append('line').attr('x1', 0).attr('x2', chartWidth).attr('y1', rsiTop - gap / 2).attr('y2', rsiTop - gap / 2).attr('stroke', '#334155').attr('stroke-width', 1);
    }
    if (showObv) {
      g.append('line').attr('x1', 0).attr('x2', chartWidth).attr('y1', obvTop - gap / 2).attr('y2', obvTop - gap / 2).attr('stroke', '#334155').attr('stroke-width', 1);
    }

    // --- MAIN PRICE PANE DRAWING ---
    const bandwidth = xScale.bandwidth();

    // 1. Bollinger Bands Overlay
    if (showBBands) {
      const validBb = processedCandles.filter((d) => d.bbUpper !== null && d.bbLower !== null);
      if (validBb.length > 0) {
        const bbArea = d3
          .area<ProcessedCandle>()
          .x((d) => (xScale(d.date) || 0) + bandwidth / 2)
          .y0((d) => yScalePrice(d.bbLower as number))
          .y1((d) => yScalePrice(d.bbUpper as number))
          .curve(d3.curveMonotoneX);

        g.append('path')
          .datum(validBb)
          .attr('fill', '#38bdf8')
          .attr('fill-opacity', 0.06)
          .attr('d', bbArea);

        // Upper & Lower Band lines
        const bbUpperLine = d3.line<ProcessedCandle>().x((d) => (xScale(d.date) || 0) + bandwidth / 2).y((d) => yScalePrice(d.bbUpper as number)).curve(d3.curveMonotoneX);
        const bbLowerLine = d3.line<ProcessedCandle>().x((d) => (xScale(d.date) || 0) + bandwidth / 2).y((d) => yScalePrice(d.bbLower as number)).curve(d3.curveMonotoneX);

        g.append('path').datum(validBb).attr('fill', 'none').attr('stroke', '#0284c7').attr('stroke-width', 1).attr('stroke-dasharray', '2,2').attr('opacity', 0.6).attr('d', bbUpperLine);
        g.append('path').datum(validBb).attr('fill', 'none').attr('stroke', '#0284c7').attr('stroke-width', 1).attr('stroke-dasharray', '2,2').attr('opacity', 0.6).attr('d', bbLowerLine);
      }
    }

    // 20-Day Price Moving Average Line
    const validMa20 = processedCandles.filter((d) => d.ma20Price !== null);
    if (validMa20.length > 0) {
      const maLine = d3
        .line<ProcessedCandle>()
        .x((d) => (xScale(d.date) || 0) + bandwidth / 2)
        .y((d) => yScalePrice(d.ma20Price as number))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(validMa20).attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 1.5).attr('d', maLine);
    }

    // 2. Candlesticks vs Line/Area Mode
    if (chartType === 'candlestick') {
      // Draw Japanese Candlesticks
      processedCandles.forEach((c) => {
        const x = (xScale(c.date) || 0) + bandwidth / 2;
        const isUp = c.close >= c.open;
        const color = isUp ? '#10b981' : '#f43f5e';

        const yHigh = yScalePrice(c.high);
        const yLow = yScalePrice(c.low);
        const yOpen = yScalePrice(c.open);
        const yClose = yScalePrice(c.close);

        const candleTop = Math.min(yOpen, yClose);
        const candleHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
        const candleWidth = Math.max(bandwidth, 2);

        // High-Low Wick
        g.append('line').attr('x1', x).attr('y1', yHigh).attr('x2', x).attr('y2', yLow).attr('stroke', color).attr('stroke-width', 1.2);

        // Body
        g.append('rect')
          .attr('x', x - candleWidth / 2)
          .attr('y', candleTop)
          .attr('width', candleWidth)
          .attr('height', candleHeight)
          .attr('fill', color)
          .attr('rx', 1);
      });
    } else {
      // Line + Area Mode
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient').attr('id', 'price-area-grad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      gradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.25);
      gradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

      const priceArea = d3
        .area<ProcessedCandle>()
        .x((d) => (xScale(d.date) || 0) + bandwidth / 2)
        .y0(priceHeight)
        .y1((d) => yScalePrice(d.close))
        .curve(d3.curveMonotoneX);

      const priceLine = d3
        .line<ProcessedCandle>()
        .x((d) => (xScale(d.date) || 0) + bandwidth / 2)
        .y((d) => yScalePrice(d.close))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(processedCandles).attr('fill', 'url(#price-area-grad)').attr('d', priceArea);
      g.append('path').datum(processedCandles).attr('fill', 'none').attr('stroke', '#10b981').attr('stroke-width', 2).attr('d', priceLine);
    }

    // Key Price Level Annotations (High / Low / LTP)
    const latestCandle = processedCandles[processedCandles.length - 1];
    if (latestCandle) {
      const yLtp = yScalePrice(latestCandle.close);
      g.append('line').attr('x1', 0).attr('x2', chartWidth).attr('y1', yLtp).attr('y2', yLtp).attr('stroke', '#10b981').attr('stroke-dasharray', '2,2').attr('opacity', 0.7);
      g.append('rect').attr('x', chartWidth).attr('y', yLtp - 9).attr('width', 55).attr('height', 18).attr('fill', '#10b981').attr('rx', 3);
      g.append('text').attr('x', chartWidth + 27).attr('y', yLtp + 3).attr('text-anchor', 'middle').attr('fill', '#ffffff').attr('font-size', '9.5px').attr('font-weight', 'bold').attr('font-family', 'monospace').text(`৳${latestCandle.close}`);
    }

    // --- FIBONACCI RETRACEMENT LEVELS ---
    if (showFibLevels && processedCandles && processedCandles.length > 0) {
      const highs = processedCandles.map((c) => c.high);
      const lows = processedCandles.map((c) => c.low);
      const swingHigh = Math.max(...highs);
      const swingLow = Math.min(...lows);
      const diff = swingHigh - swingLow;

      if (diff > 0) {
        const fibLevels = [
          { pct: 0.0, label: '0.0% (Low)', color: '#64748b' },
          { pct: 0.236, label: '23.6%', color: '#38bdf8' },
          { pct: 0.382, label: '38.2%', color: '#f59e0b' },
          { pct: 0.500, label: '50.0%', color: '#10b981' },
          { pct: 0.618, label: '61.8%', color: '#a855f7' },
          { pct: 0.786, label: '78.6%', color: '#ec4899' },
          { pct: 1.000, label: '100.0% (High)', color: '#ef4444' },
        ];

        fibLevels.forEach((level) => {
          const priceVal = swingLow + diff * level.pct;
          const yFib = yScalePrice(priceVal);

          if (yFib >= 0 && yFib <= priceHeight) {
            g.append('line')
              .attr('x1', 0)
              .attr('y1', yFib)
              .attr('x2', chartWidth)
              .attr('y2', yFib)
              .attr('stroke', level.color)
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '3,3')
              .attr('opacity', 0.6);

            const labelGroup = g.append('g')
              .attr('transform', `translate(${chartWidth - 95}, ${yFib - 8})`);

            labelGroup.append('rect')
              .attr('width', 90)
              .attr('height', 16)
              .attr('fill', '#020617')
              .attr('stroke', level.color)
              .attr('stroke-width', 0.5)
              .attr('rx', 3)
              .attr('opacity', 0.9);

            labelGroup.append('text')
              .attr('x', 45)
              .attr('y', 11)
              .attr('text-anchor', 'middle')
              .attr('fill', '#f1f5f9')
              .attr('font-size', '8px')
              .attr('font-weight', 'bold')
              .attr('font-family', 'monospace')
              .text(`${level.label}: ৳${priceVal.toFixed(1)}`);
          }
        });
      }
    }

    // --- HARMONIC PATTERN (C-to-D) OVERLAY & FIBONACCI RETRACEMENT LEVELS ---
    if (showHarmonics && currentStock && currentStock.candles && currentStock.candles.length > 0) {
      const harmonic = detectHarmonicPattern(currentStock.candles, currentStock.candles.length - 1);
      if (harmonic) {
        // Find visible X coordinate helper
        const getXCoord = (dateStr: string) => {
          const idxInProcessed = dates.indexOf(dateStr);
          if (idxInProcessed !== -1) {
            return xScale(dateStr)! + xScale.bandwidth() / 2;
          }
          // If not in processed window, estimate using index of the date
          const idxInAll = currentStock.candles.findIndex((c) => c.date === dateStr);
          const visibleStartIdx = currentStock.candles.findIndex((c) => c.date === dates[0]);
          if (idxInAll !== -1 && visibleStartIdx !== -1) {
            const diff = idxInAll - visibleStartIdx;
            const widthPerBar = chartWidth / dates.length;
            return diff * widthPerBar;
          }
          return null;
        };

        const xCoordX = getXCoord(harmonic.xDate);
        const xCoordA = getXCoord(harmonic.aDate);
        const xCoordB = getXCoord(harmonic.bDate);
        const xCoordC = getXCoord(harmonic.cDate);
        const xCoordD = harmonic.dDate ? getXCoord(harmonic.dDate) : null;

        const yCoordX = yScalePrice(harmonic.xPrice);
        const yCoordA = yScalePrice(harmonic.aPrice);
        const yCoordB = yScalePrice(harmonic.bPrice);
        const yCoordC = yScalePrice(harmonic.cPrice);
        const yCoordD = harmonic.dPrice !== undefined ? yScalePrice(harmonic.dPrice) : null;

        // Define Points Array
        const hPoints = [
          { name: 'X', x: xCoordX, y: yCoordX, price: harmonic.xPrice },
          { name: 'A', x: xCoordA, y: yCoordA, price: harmonic.aPrice },
          { name: 'B', x: xCoordB, y: yCoordB, price: harmonic.bPrice },
          { name: 'C', x: xCoordC, y: yCoordC, price: harmonic.cPrice },
        ];
        if (xCoordD !== null && yCoordD !== null) {
          hPoints.push({ name: 'D', x: xCoordD, y: yCoordD, price: harmonic.dPrice! });
        }

        // Draw solid X-A-B-C-D pattern skeleton
        // First draw completed legs (X-A, A-B, B-C)
        const lineGenerator = d3.line<{ x: number; y: number }>()
          .x((d) => d.x)
          .y((d) => d.y);

        const validPoints = hPoints.filter((p) => p.x !== null) as Array<{ name: string; x: number; y: number; price: number }>;

        if (validPoints.length >= 2) {
          // Draw XA, AB, BC paths with glowing indigo line
          g.append('path')
            .datum(validPoints)
            .attr('fill', 'rgba(99, 102, 241, 0.05)')
            .attr('stroke', '#6366f1')
            .attr('stroke-width', 2)
            .attr('stroke-linejoin', 'round')
            .attr('opacity', 0.8)
            .attr('d', lineGenerator);

          // Draw individual triangle shading for visual harmonic geometry (X-A-B and B-C-D)
          if (xCoordX !== null && xCoordA !== null && xCoordB !== null) {
            g.append('polygon')
              .attr('points', `${xCoordX},${yCoordX} ${xCoordA},${yCoordA} ${xCoordB},${yCoordB}`)
              .attr('fill', 'rgba(99, 102, 241, 0.1)')
              .attr('stroke', '#6366f1')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,2')
              .attr('opacity', 0.6);
          }
          if (xCoordB !== null && xCoordC !== null && xCoordD !== null) {
            g.append('polygon')
              .attr('points', `${xCoordB},${yCoordB} ${xCoordC},${yCoordC} ${xCoordD},${yCoordD}`)
              .attr('fill', 'rgba(99, 102, 241, 0.1)')
              .attr('stroke', '#6366f1')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,2')
              .attr('opacity', 0.6);
          }
        }

        const lastPointCoord = xCoordD !== null ? xCoordD : xCoordC;
        if (lastPointCoord !== null) {
          // Draw a clean horizontal target line for the main price target
          const yTargetD = yScalePrice(harmonic.dTargetPrice);
          if (yTargetD >= 0 && yTargetD <= priceHeight) {
            g.append('line')
              .attr('x1', lastPointCoord)
              .attr('y1', yTargetD)
              .attr('x2', chartWidth)
              .attr('y2', yTargetD)
              .attr('stroke', '#ec4899')
              .attr('stroke-width', 1.5)
              .attr('stroke-dasharray', '3,3')
              .attr('opacity', 0.85);

            // Clean, simplified Target Label Badge on the right
            const labelGroup = g.append('g')
              .attr('transform', `translate(${chartWidth - 85}, ${yTargetD - 9})`);

            labelGroup.append('rect')
              .attr('width', 80)
              .attr('height', 18)
              .attr('fill', '#0f172a')
              .attr('stroke', '#ec4899')
              .attr('stroke-width', 1)
              .attr('rx', 4)
              .attr('opacity', 0.95);

            labelGroup.append('text')
              .attr('x', 40)
              .attr('y', 12)
              .attr('text-anchor', 'middle')
              .attr('fill', '#fdf2f8')
              .attr('font-size', '9.5px')
              .attr('font-weight', 'bold')
              .attr('font-family', 'monospace')
              .text(`D: ৳${harmonic.dTargetPrice.toFixed(1)}`);
          }
        }

        // Draw node circles & text labels for X, A, B, C
        validPoints.forEach((p) => {
          g.append('circle')
            .attr('cx', p.x)
            .attr('cy', p.y)
            .attr('r', 5.5)
            .attr('fill', p.name === 'C' ? '#10b981' : '#4f46e5') // Green for entry C, Purple/blue for others
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1.5);

          g.append('text')
            .attr('x', p.x)
            .attr('y', p.y - 9)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ffffff')
            .attr('font-size', '9.5px')
            .attr('font-weight', 'extrabold')
            .text(p.name);

          // Small subtitle with price below C node
          if (p.name === 'C') {
            g.append('text')
              .attr('x', p.x)
              .attr('y', p.y + 16)
              .attr('text-anchor', 'middle')
              .attr('fill', '#10b981')
              .attr('font-size', '8px')
              .attr('font-weight', 'bold')
              .text(`C Buy: ৳${p.price.toFixed(1)}`);
          }
        });
      }
    }

    // Pattern Markers (Clean, customizable badge indicators)
    if (showSignals && allProcessedCandles.length > 0) {
      const recent7CutoffIndex = Math.max(0, allProcessedCandles.length - 7);
      const recent7Dates = new Set(allProcessedCandles.slice(recent7CutoffIndex).map((c) => c.date));

      processedCandles.forEach((d) => {
        // Date scope filter: recent 7 days vs full timeframe window
        if (!showAllWindowMarkers && !recent7Dates.has(d.date)) return;
        if (!d.isVolumeBreakout && !d.signal) return;

        // Individual Pattern Filter Check
        if (selectedPatternFilter !== 'ALL') {
          if (selectedPatternFilter === 'Volume Surge') {
            if (!d.isVolumeBreakout) return;
          } else {
            if (d.signal?.detectedPattern !== selectedPatternFilter) return;
          }
        }

        const cx = (xScale(d.date) || 0) + bandwidth / 2;
        const yLow = yScalePrice(d.low);

        // Pattern Label & Icon
        let label = 'Vol Surge';
        let icon = '⚡';
        let badgeColor = '#10b981';

        if (d.signal?.detectedPattern) {
          const p = d.signal.detectedPattern;
          if (p === 'Bullish Flag') { label = 'Bullish Flag'; icon = '🚩'; badgeColor = '#10b981'; }
          else if (p === 'Double Bottom') { label = 'W-Bottom'; icon = 'Ⓦ'; badgeColor = '#f59e0b'; }
          else if (p === 'Cup & Handle') { label = 'Cup & Handle'; icon = '🍵'; badgeColor = '#6366f1'; }
          else if (p === 'Ascending Triangle') { label = 'Asc. Triangle'; icon = '🔺'; badgeColor = '#38bdf8'; }
          else if (p === 'VCP Compression') { label = 'VCP Coil'; icon = '⚡'; badgeColor = '#a855f7'; }
          else if (p === 'Harmonic Pattern (C-to-D)') { label = 'Harmonic C➔D'; icon = '💎'; badgeColor = '#ec4899'; }
        }

        const stemLength = 26;
        const markerY = yLow + stemLength;

        // Dashed stem line connecting candle low wick to marker badge
        g.append('line')
          .attr('x1', cx)
          .attr('x2', cx)
          .attr('y1', yLow + 3)
          .attr('y2', markerY - 9)
          .attr('stroke', badgeColor)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2,2')
          .attr('opacity', 0.85);

        // Arrowhead pointing up at candle low
        const arrow = d3.symbol().type(d3.symbolTriangle).size(24);
        g.append('path')
          .attr('d', arrow)
          .attr('transform', `translate(${cx}, ${yLow + 4}) rotate(0)`)
          .attr('fill', badgeColor);

        // Badge pill
        const pillText = `${icon}`;
        const pillWidth = 24;
        const pillHeight = 24;

        const markerGroup = g.append('g')
          .attr('transform', `translate(${cx - pillWidth / 2}, ${markerY - pillHeight / 2})`)
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.stopPropagation();
            if (d.signal && onSelectSignal) {
              onSelectSignal(d.signal);
            }
          });

        markerGroup.append('circle')
          .attr('cx', pillWidth / 2)
          .attr('cy', pillHeight / 2)
          .attr('r', pillWidth / 2)
          .attr('fill', '#090d16')
          .attr('stroke', badgeColor)
          .attr('stroke-width', 1.5);

        markerGroup.append('text')
          .attr('x', pillWidth / 2)
          .attr('y', pillHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text(pillText);

        markerGroup.append('title').text(`${label} (${d.date}): Entry ৳${d.close}, RVOL ${d.rvol}x`);
      });
    }

    // --- SUBPANEL 1: VOLUME PANE ---
    if (showVolume) {
      g.append('text').attr('x', 4).attr('y', volumeTop + 12).attr('fill', '#64748b').attr('font-size', '9px').attr('font-weight', 'bold').attr('font-family', 'monospace').text('VOLUME');

      processedCandles.forEach((c) => {
        const x = xScale(c.date) || 0;
        const isUp = c.close >= c.open;
        const color = isUp ? '#10b981' : '#f43f5e';
        const vH = volumeTop + subPanelHeight - yScaleVolume(c.volume);

        g.append('rect')
          .attr('x', x)
          .attr('y', yScaleVolume(c.volume))
          .attr('width', Math.max(bandwidth, 1.5))
          .attr('height', vH)
          .attr('fill', color)
          .attr('opacity', c.isVolumeBreakout ? 1.0 : 0.6)
          .attr('rx', 1);
      });

      // Volume 20d MA line
      const validVolMa = processedCandles.filter((d) => d.ma20Volume !== null);
      if (validVolMa.length > 0) {
        const vMaLine = d3.line<ProcessedCandle>().x((d) => (xScale(d.date) || 0) + bandwidth / 2).y((d) => yScaleVolume(d.ma20Volume as number)).curve(d3.curveMonotoneX);
        g.append('path').datum(validVolMa).attr('fill', 'none').attr('stroke', '#a855f7').attr('stroke-width', 1.2).attr('d', vMaLine);
      }
    }

    // --- SUBPANEL 2: RSI PANE ---
    if (showRsi) {
      g.append('text').attr('x', 4).attr('y', rsiTop + 12).attr('fill', '#10b981').attr('font-size', '9px').attr('font-weight', 'bold').attr('font-family', 'monospace').text('RSI (14)');

      // 70 and 30 thresholds
      [70, 30].forEach((level) => {
        const yL = yScaleRsi(level);
        g.append('line').attr('x1', 0).attr('x2', chartWidth).attr('y1', yL).attr('y2', yL).attr('stroke', '#334155').attr('stroke-dasharray', '2,2');
        g.append('text').attr('x', chartWidth + 4).attr('y', yL + 3).attr('fill', '#64748b').attr('font-size', '8px').attr('font-family', 'monospace').text(`${level}`);
      });

      const validRsi = processedCandles.filter((d) => d.rsi !== null);
      if (validRsi.length > 0) {
        const rsiLine = d3.line<ProcessedCandle>().x((d) => (xScale(d.date) || 0) + bandwidth / 2).y((d) => yScaleRsi(d.rsi as number)).curve(d3.curveMonotoneX);
        g.append('path').datum(validRsi).attr('fill', 'none').attr('stroke', '#eab308').attr('stroke-width', 1.5).attr('d', rsiLine);
      }
    }

    // --- SUBPANEL 3: OBV PANE ---
    if (showObv) {
      g.append('text').attr('x', 4).attr('y', obvTop + 12).attr('fill', '#38bdf8').attr('font-size', '9px').attr('font-weight', 'bold').attr('font-family', 'monospace').text('OBV (ON BALANCE VOLUME)');

      const obvLine = d3.line<ProcessedCandle>().x((d) => (xScale(d.date) || 0) + bandwidth / 2).y((d) => yScaleObv(d.obv)).curve(d3.curveMonotoneX);
      g.append('path').datum(processedCandles).attr('fill', 'none').attr('stroke', '#10b981').attr('stroke-width', 1.5).attr('d', obvLine);
    }

    // --- INTERACTIVE CROSSHAIR OVERLAY ---
    const overlay = g.append('rect').attr('width', chartWidth).attr('height', chartHeight).attr('fill', 'transparent').style('cursor', 'crosshair');

    const focusLineX = g.append('line').attr('y1', 0).attr('y2', chartHeight).attr('stroke', '#64748b').attr('stroke-dasharray', '2,2').style('opacity', 0);
    const focusLineY = g.append('line').attr('x1', 0).attr('x2', chartWidth).attr('stroke', '#64748b').attr('stroke-dasharray', '2,2').style('opacity', 0);

    overlay
      .on('mousemove', (event) => {
        const [mouseX, mouseY] = d3.pointer(event);
        const eachBand = xScale.step();
        const index = Math.floor(mouseX / eachBand);
        const clampedIndex = Math.max(0, Math.min(processedCandles.length - 1, index));
        const d = processedCandles[clampedIndex];

        if (d) {
          const cx = (xScale(d.date) || 0) + bandwidth / 2;
          focusLineX.attr('x1', cx).attr('x2', cx).style('opacity', 1);
          focusLineY.attr('y1', mouseY).attr('y2', mouseY).style('opacity', 1);
          setHoveredData(d);
        }
      })
      .on('mouseleave', () => {
        focusLineX.style('opacity', 0);
        focusLineY.style('opacity', 0);
        setHoveredData(null);
      });
  }, [
    processedCandles,
    chartType,
    showBBands,
    showVolume,
    showRsi,
    showObv,
    showSignals,
    selectedPatternFilter,
    showAllWindowMarkers,
    showHarmonics,
    showFibLevels,
    dimensions.width,
    dimensions.height,
  ]);

  return <svg ref={svgRef} className="h-full overflow-visible" style={{ width: finalChartWidth }} />;
});

D3ChartCanvas.displayName = 'D3ChartCanvas';
