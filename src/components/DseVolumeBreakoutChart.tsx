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
  Filter
} from 'lucide-react';
import { DseStockData, DseStockCandle, BacktestConfig, BreakoutSignal } from '../types';

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
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Chart Style: 'candlestick' | 'area'
  const [chartType, setChartType] = useState<'candlestick' | 'area'>('candlestick');

  // Subpanel & Overlay Toggles
  const [showBBands, setShowBBands] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showRsi, setShowRsi] = useState<boolean>(true);
  const [showObv, setShowObv] = useState<boolean>(true);
  const [showSignals, setShowSignals] = useState<boolean>(true); // Default ON for recent 7-day pattern setups

  // Hover state
  const [hoveredData, setHoveredData] = useState<ProcessedCandle | null>(null);

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

  // Draw Clean D3 Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || processedCandles.length === 0) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = container.clientWidth || 800;
    const height = 580;
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

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

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

    // Last 7 Trading Days Pattern Markers (Clean, non-cluttered badge indicators)
    if (showSignals && allProcessedCandles.length > 0) {
      const recent7CutoffIndex = Math.max(0, allProcessedCandles.length - 7);
      const recent7Dates = new Set(allProcessedCandles.slice(recent7CutoffIndex).map((c) => c.date));

      processedCandles.forEach((d) => {
        // Only render pattern markers for dates within the LAST 7 TRADING DAYS
        if (!recent7Dates.has(d.date)) return;
        if (!d.isVolumeBreakout && !d.signal) return;

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
          .style('cursor', 'pointer');

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
  }, [processedCandles, chartType, showBBands, showVolume, showRsi, showObv, showSignals]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      setSelectedSymbol((prev) => prev);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      {/* Chart Control Toolbar: Timeframes & Indicator Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        {/* Timeframe Selection Pills */}
        <div className="flex items-center gap-1">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono transition-colors ${
                timeframe === tf ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Overlay & Subpanel Indicator Toggles */}
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

          {/* Breakout Signals */}
          <button
            onClick={() => setShowSignals(!showSignals)}
            className={`px-2.5 py-1 rounded-lg border transition-colors ${
              showSignals ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {showSignals ? '7-Day Patterns: ON' : '7-Day Patterns: OFF'}
          </button>
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
      <div ref={containerRef} className="w-full relative min-h-[580px] bg-slate-950 rounded-xl border border-slate-800/80 p-2 overflow-hidden shadow-inner">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      </div>
    </div>
  );
};
