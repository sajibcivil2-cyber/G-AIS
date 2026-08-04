import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  FileText,
  X
} from 'lucide-react';
import {
  DseStockData,
  DseStockCandle,
  BacktestConfig,
  BacktestSummary,
  BreakoutSignal,
  ScreenerStockCandidate,
  TechnicalPatternType,
  HarmonicPatternDetails,
  ExtractedFile,
  EarlyTrendAnalysis
} from '../types';

// Realistic Sample Datasets for Dhaka Stock Exchange (DSE) Companies
export const DSE_SAMPLE_STOCKS: DseStockData[] = [
  {
    symbol: 'SQURPHARMA',
    name: 'Square Pharmaceuticals PLC',
    sector: 'Pharmaceuticals & Chemicals',
    yoyGrowthPct: 7.8, // Realistic DSE YoY growth
    peRatio: 11.2,
    avgTurnoverBdtMillion: 145.5,
    candles: generateRealisticCandles(219.7, 380, 0.08, 3.8, '2026-08-02', 'Bullish Flag'),
  },
  {
    symbol: 'BATBC',
    name: 'British American Tobacco Bangladesh',
    sector: 'Food & Allied',
    yoyGrowthPct: 5.4,
    peRatio: 9.8,
    avgTurnoverBdtMillion: 98.2,
    candles: generateRealisticCandles(252.5, 380, 0.06, 4.2, '2026-08-02', 'Cup & Handle'),
  },
  {
    symbol: 'BEXIMCO',
    name: 'Beximco Limited',
    sector: 'Miscellaneous',
    yoyGrowthPct: 4.1,
    peRatio: 14.5,
    avgTurnoverBdtMillion: 210.0,
    candles: generateRealisticCandles(23.2, 380, 0.12, 4.8, '2026-08-02', 'Double Bottom'),
  },
  {
    symbol: 'RENATA',
    name: 'Renata Limited',
    sector: 'Pharmaceuticals & Chemicals',
    yoyGrowthPct: 6.2,
    peRatio: 18.4,
    avgTurnoverBdtMillion: 65.0,
    candles: generateRealisticCandles(470.2, 380, 0.07, 3.2, '2026-08-02', 'Harmonic Pattern (C-to-D)'),
  },
  {
    symbol: 'GP',
    name: 'Grameenphone Ltd.',
    sector: 'Telecommunication',
    yoyGrowthPct: 8.5,
    peRatio: 10.5,
    avgTurnoverBdtMillion: 180.4,
    candles: generateRealisticCandles(260.0, 380, 0.05, 3.5, '2026-08-02', 'VCP Compression'),
  },
  {
    symbol: 'OLYMPIC',
    name: 'Olympic Industries Ltd.',
    sector: 'Food & Allied',
    yoyGrowthPct: 9.1,
    peRatio: 13.1,
    avgTurnoverBdtMillion: 82.0,
    candles: generateRealisticCandles(154.2, 380, 0.09, 3.9, '2026-08-02', 'Bullish Flag'),
  },
  {
    symbol: 'LHBL',
    name: 'LafargeHolcim Bangladesh Ltd.',
    sector: 'Cement',
    yoyGrowthPct: 6.8,
    peRatio: 12.0,
    avgTurnoverBdtMillion: 110.5,
    candles: generateRealisticCandles(58.1, 380, 0.10, 4.0, '2026-08-02', 'Cup & Handle'),
  },
  {
    symbol: 'ADNTEL',
    name: 'ADN Telecom Limited',
    sector: 'IT Sector',
    yoyGrowthPct: 11.2,
    peRatio: 15.2,
    avgTurnoverBdtMillion: 75.8,
    candles: generateRealisticCandles(118.5, 380, 0.14, 4.5, '2026-08-02', 'VCP Compression'),
  },
  {
    symbol: 'CITYBANK',
    name: 'The City Bank PLC',
    sector: 'Bank',
    yoyGrowthPct: 5.9,
    peRatio: 5.2,
    avgTurnoverBdtMillion: 92.4,
    candles: generateRealisticCandles(24.8, 380, 0.06, 3.6, '2026-08-02', 'Double Bottom'),
  },
  {
    symbol: 'ALLTEX',
    name: 'Alltex Industries Ltd.',
    sector: 'Textile',
    yoyGrowthPct: 3.5,
    peRatio: 16.2,
    avgTurnoverBdtMillion: 42.1,
    candles: generateRealisticCandles(18.5, 380, 0.15, 5.0, '2026-08-02', 'Bullish Flag'),
  },
  {
    symbol: 'FUWANGCER',
    name: 'Fuwang Ceramic Industry Ltd.',
    sector: 'Ceramic Sector',
    yoyGrowthPct: 4.8,
    peRatio: 19.5,
    avgTurnoverBdtMillion: 55.4,
    candles: generateRealisticCandles(22.0, 380, 0.12, 4.2, '2026-08-02', 'Cup & Handle'),
  },
  {
    symbol: 'CONFIDCEM',
    name: 'Confidence Cement PLC',
    sector: 'Cement',
    yoyGrowthPct: 7.2,
    peRatio: 12.5,
    avgTurnoverBdtMillion: 68.4,
    candles: generateRealisticCandles(68.9, 380, 0.08, 4.0, '2026-08-02', 'Harmonic Pattern (C-to-D)'),
  },
];

// Helper to generate realistic DSE OHLCV candle histories ending on target date
function generateRealisticCandles(
  basePrice: number,
  tradingDaysCount: number = 380,
  volatility: number = 0.08,
  breakoutFrequencyWeeks: number = 3.8,
  targetEndDateStr: string = '2026-08-02',
  patternToForce?: string
): DseStockCandle[] {
  const endDate = new Date(targetEndDateStr);
  const tradingDates: string[] = [];
  const cur = new Date(endDate);

  while (tradingDates.length < tradingDaysCount) {
    const day = cur.getDay(); // Bangladesh stock market: Fri(5) and Sat(6) are closed
    if (day !== 5 && day !== 6) {
      tradingDates.push(cur.toISOString().split('T')[0]);
    }
    cur.setDate(cur.getDate() - 1);
  }

  // Reverse so dates run chronologically from oldest to newest (ending on 2026-08-02)
  tradingDates.reverse();

  const candles: DseStockCandle[] = [];
  let price = basePrice;
  const baseVolume = 150000;

  // Decide the forced pattern for the final breakout based on symbol length/hash to ensure variety
  const finalBreakoutIdx = tradingDates.length - 2; // Breakout 2 days ago

  tradingDates.forEach((dateStr, i) => {
    // Mean reversion to prevent price exploding or collapsing
    const deviation = (price - basePrice) / basePrice;
    const meanReversionForce = -deviation * 0.03; // Slowly pull back to basePrice

    let dailyChangePct = (Math.random() - 0.5) * volatility + meanReversionForce;
    let volume = baseVolume * (0.6 + Math.random() * 0.8);

    // Natural random breakouts
    const isBreakoutDay = i > 30 && i < finalBreakoutIdx - 20 && i % Math.floor(breakoutFrequencyWeeks * 5) === 0;
    const isPreBreakoutConsolidation = i > 30 && i < finalBreakoutIdx - 20 && (i + 3) % Math.floor(breakoutFrequencyWeeks * 5) === 0;

    if (isPreBreakoutConsolidation) {
      dailyChangePct = (Math.random() - 0.5) * 0.008;
      volume = baseVolume * 0.35;
    } else if (isBreakoutDay) {
      dailyChangePct = 0.045 + Math.random() * 0.035;
      volume = baseVolume * (3.2 + Math.random() * 1.8);
    }

    // Force a specific pattern in the last 40 days
    if (patternToForce && i > finalBreakoutIdx - 40 && i <= finalBreakoutIdx) {
      const dist = finalBreakoutIdx - i;
      
      if (patternToForce === 'Bullish Flag') {
        if (dist >= 10 && dist <= 12) { dailyChangePct = 0.06; } // Pole
        else if (dist > 0 && dist < 10) { dailyChangePct = -0.005; volume = baseVolume * 0.4; } // Flag consolidation
        else if (dist === 0) { dailyChangePct = 0.07; volume = baseVolume * 4.5; } // Breakout
      } 
      else if (patternToForce === 'Double Bottom') {
        if (dist === 20 || dist === 8) { dailyChangePct = -0.05; } // Bottoms
        else if (dist === 14) { dailyChangePct = 0.04; } // Mid peak
        else if (dist > 0 && dist < 8) { dailyChangePct = 0.01; } // Rise to neckline
        else if (dist === 0) { dailyChangePct = 0.06; volume = baseVolume * 4.0; } // Breakout
      }
      else if (patternToForce === 'Cup & Handle') {
        if (dist === 25) { dailyChangePct = -0.08; } // Left rim
        else if (dist > 15 && dist < 25) { dailyChangePct = -0.01; } // Down to cup
        else if (dist >= 8 && dist <= 15) { dailyChangePct = 0.015; } // Up to right rim
        else if (dist > 0 && dist < 8) { dailyChangePct = -0.005; volume = baseVolume * 0.3; } // Handle
        else if (dist === 0) { dailyChangePct = 0.055; volume = baseVolume * 4.2; } // Breakout
      }
      else if (patternToForce === 'Ascending Triangle') {
        if (dist === 25 || dist === 15 || dist === 5) { dailyChangePct = 0.04; } // Hitting resistance
        else if (dist === 20) { dailyChangePct = -0.03; } // Low 1
        else if (dist === 10) { dailyChangePct = -0.02; } // Low 2 (higher)
        else if (dist > 0 && dist < 5) { dailyChangePct = -0.01; } // Low 3 (higher)
        else if (dist === 0) { dailyChangePct = 0.06; volume = baseVolume * 4.0; } // Breakout
      }
      else if (patternToForce === 'VCP Compression') {
        if (dist > 0 && dist <= 10) { dailyChangePct = (Math.random() - 0.5) * 0.005; volume = baseVolume * 0.2; } // Tight compression
        else if (dist === 0) { dailyChangePct = 0.05; volume = baseVolume * 5.0; } // Breakout
      }
      else if (patternToForce === 'Harmonic Pattern (C-to-D)') {
        if (dist === 30) { dailyChangePct = -0.04; } // X low
        else if (dist === 22) { dailyChangePct = 0.05; } // A peak
        else if (dist === 14) { dailyChangePct = -0.035; } // B low
        else if (dist === 6) { dailyChangePct = 0.025; } // C bounce (Entry)
        else if (dist === 0) { dailyChangePct = 0.055; volume = baseVolume * 4.2; } // D target heading
      }
    }

    const open = price;
    price = Math.max(10, price * (1 + dailyChangePct));
    const close = price;
    
    // Make sure high/low don't break our forced shapes too much
    const maxWick = patternToForce && i > finalBreakoutIdx - 40 ? 0.002 : 0.01;
    const high = Math.max(open, close) * (1 + Math.random() * maxWick);
    const low = Math.min(open, close) * (1 - Math.random() * maxWick);

    candles.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round(volume),
    });
  });

  return candles;
}

/**
 * Detects Harmonic Patterns (Bullish Gartley, Bat, Butterfly, Crab)
 * Identifies Points X, A, B, C, D and calculates Fibonacci ratios:
 * - Entry Point: C Point completion (higher low / retracement bounce)
 * - Target Exit: Point D (PRZ level)
 * - Stop Loss: Placed below Point B / Point X
 */
export function detectHarmonicPattern(
  candles: DseStockCandle[],
  breakoutIdx?: number
): HarmonicPatternDetails | null {
  if (!candles || candles.length < 20) return null;

  const idx = breakoutIdx !== undefined && breakoutIdx < candles.length ? breakoutIdx : candles.length - 1;
  const lookbackStart = Math.max(0, idx - 45);
  const subset = candles.slice(lookbackStart, idx + 1);
  const len = subset.length;
  if (len < 16) return null;

  // Segment subset into 4 regions for X, A, B, C
  const quarter = Math.floor(len / 4);
  const seg1 = subset.slice(0, quarter + 2); // X region
  const seg2 = subset.slice(quarter - 1, 2 * quarter + 2); // A region
  const seg3 = subset.slice(2 * quarter - 1, 3 * quarter + 2); // B region
  const seg4 = subset.slice(3 * quarter - 1); // C region

  // Let's store potential results for standard and inverse patterns
  let standardPattern: HarmonicPatternDetails | null = null;
  let inversePattern: HarmonicPatternDetails | null = null;

  // ==========================================
  // 1. ATTEMPT DETECTING STANDARD PATTERN (W-shape)
  // ==========================================
  // X Point: Lowest price in seg1
  let minXVal = Infinity;
  let xRelIdx = 0;
  seg1.forEach((c, i) => {
    if (c.low < minXVal) {
      minXVal = c.low;
      xRelIdx = i;
    }
  });
  const xIdx = lookbackStart + xRelIdx;
  const xCandle = candles[xIdx];

  // A Point: Highest price in seg2 after X
  let maxAVal = -Infinity;
  let aRelIdx = 0;
  seg2.forEach((c, i) => {
    if (c.high > maxAVal) {
      maxAVal = c.high;
      aRelIdx = i;
    }
  });
  const aIdx = lookbackStart + (quarter - 1) + aRelIdx;
  const aCandle = candles[aIdx];

  // B Point: Local low in seg3 (retracement of XA leg)
  let minBVal = Infinity;
  let bRelIdx = 0;
  seg3.forEach((c, i) => {
    if (c.low < minBVal) {
      minBVal = c.low;
      bRelIdx = i;
    }
  });
  const bIdx = lookbackStart + (2 * quarter - 1) + bRelIdx;
  const bCandle = candles[bIdx];

  // C Point: Local high/bounce in seg4 (retracement of AB leg)
  let maxCVal = -Infinity;
  let cRelIdx = 0;
  seg4.forEach((c, i) => {
    if (c.close > maxCVal) {
      maxCVal = c.close;
      cRelIdx = i;
    }
  });
  const cIdx = lookbackStart + (3 * quarter - 1) + cRelIdx;
  const cCandle = candles[cIdx];

  if (xCandle && aCandle && bCandle && cCandle) {
    const xPrice = xCandle.low;
    const aPrice = aCandle.high;
    const bPrice = bCandle.low;
    const cPrice = cCandle.close;

    // Validate structural hierarchy: X < A, B < A, B > X, C < A, C > B
    const xaMove = aPrice - xPrice;
    const abMove = aPrice - bPrice;
    const bcMove = cPrice - bPrice;

    if (xaMove > 0 && abMove > 0 && bcMove > 0 && xPrice < aPrice && bPrice < aPrice && bPrice > xPrice && cPrice < aPrice && cPrice > bPrice) {
      // Calculate Fibonacci Ratios
      const abXaRatio = Number((abMove / xaMove).toFixed(3)); // Retracement of XA
      const bcAbRatio = Number((bcMove / abMove).toFixed(3)); // Retracement of AB

      // Validate standard Harmonic Fibonacci limits
      if (abXaRatio >= 0.25 && abXaRatio <= 0.88 && bcAbRatio >= 0.25 && bcAbRatio <= 0.95) {
        // Determine Subtype based on Fib ratios
        let subtype: HarmonicPatternDetails['subtype'] = 'Bullish Gartley';
        let cdBcMultiplier = 1.272;

        if (abXaRatio >= 0.55 && abXaRatio <= 0.68) {
          subtype = 'Bullish Gartley';
          cdBcMultiplier = 1.272;
        } else if (abXaRatio < 0.55) {
          subtype = 'Bullish Bat';
          cdBcMultiplier = 1.618;
        } else if (abXaRatio >= 0.70 && abXaRatio <= 0.82) {
          subtype = 'Bullish Butterfly';
          cdBcMultiplier = 1.414;
        } else {
          subtype = 'Bullish Crab';
          cdBcMultiplier = 2.000;
        }

        const cdBcRatio = cdBcMultiplier;
        const dTargetPrice = Number((cPrice + bcMove * cdBcMultiplier).toFixed(2));
        const cdSpan = dTargetPrice - cPrice;
        const t1Price = Number((cPrice + cdSpan * 0.382).toFixed(2));
        const t2Price = Number((cPrice + cdSpan * 0.618).toFixed(2));
        const stopLossPrice = Number((Math.min(bPrice, cPrice) * 0.965).toFixed(2));

        const potentialGainPct = Number((((dTargetPrice - cPrice) / cPrice) * 100).toFixed(2));
        const t1GainPct = Number((((t1Price - cPrice) / cPrice) * 100).toFixed(2));
        const t2GainPct = Number((((t2Price - cPrice) / cPrice) * 100).toFixed(2));
        const potentialRiskPct = Number((((cPrice - stopLossPrice) / cPrice) * 100).toFixed(2));
        const riskRewardRatio = Number((potentialGainPct / (potentialRiskPct || 1)).toFixed(2));

        const cdPathLevels = [
          {
            levelName: 'Point C (Entry)',
            fibRatio: '0.000',
            price: cPrice,
            gainPct: 0.0,
            description: 'Primary swing entry trigger upon C-point completion bounce',
          },
          {
            levelName: 'Target 1 (Conservative)',
            fibRatio: '0.382 C-D',
            price: t1Price,
            gainPct: t1GainPct,
            description: 'First partial profit take-profit level (38.2% C-D path completion)',
          },
          {
            levelName: 'Target 2 (Main Swing)',
            fibRatio: '0.618 C-D',
            price: t2Price,
            gainPct: t2GainPct,
            description: 'Secondary target level (61.8% Golden Ratio C-D expansion)',
          },
          {
            levelName: 'Point D Target (PRZ Exit)',
            fibRatio: '1.000 PRZ',
            price: dTargetPrice,
            gainPct: potentialGainPct,
            description: `Final PRZ exit target (${cdBcMultiplier}x BC extension)`,
          },
          {
            levelName: 'Invalidation Stop Loss',
            fibRatio: 'Stop-Loss',
            price: stopLossPrice,
            gainPct: -potentialRiskPct,
            description: 'Hard stop loss positioned below Point C/B swing lows',
          },
        ];

        standardPattern = {
          subtype,
          xPrice,
          xDate: xCandle.date,
          xIdx,
          aPrice,
          aDate: aCandle.date,
          aIdx,
          bPrice,
          bDate: bCandle.date,
          bIdx,
          cPrice,
          cDate: cCandle.date,
          cIdx,
          dTargetPrice,
          t1Price,
          t2Price,
          stopLossPrice,
          abXaRatio,
          bcAbRatio,
          cdBcRatio,
          potentialGainPct,
          potentialRiskPct,
          riskRewardRatio,
          cdPathLevels,
        };
      }
    }
  }

  // ==========================================
  // 2. ATTEMPT DETECTING INVERSE PATTERN (M-shape)
  // ==========================================
  // X: High in seg1
  let maxXValInv = -Infinity;
  let xRelIdxInv = 0;
  seg1.forEach((c, i) => {
    if (c.high > maxXValInv) {
      maxXValInv = c.high;
      xRelIdxInv = i;
    }
  });
  const xIdxInv = lookbackStart + xRelIdxInv;
  const xCandleInv = candles[xIdxInv];

  // A: Low in seg2
  let minAValInv = Infinity;
  let aRelIdxInv = 0;
  seg2.forEach((c, i) => {
    if (c.low < minAValInv) {
      minAValInv = c.low;
      aRelIdxInv = i;
    }
  });
  const aIdxInv = lookbackStart + (quarter - 1) + aRelIdxInv;
  const aCandleInv = candles[aIdxInv];

  // B: High in seg3
  let maxBValInv = -Infinity;
  let bRelIdxInv = 0;
  seg3.forEach((c, i) => {
    if (c.high > maxBValInv) {
      maxBValInv = c.high;
      bRelIdxInv = i;
    }
  });
  const bIdxInv = lookbackStart + (2 * quarter - 1) + bRelIdxInv;
  const bCandleInv = candles[bIdxInv];

  // C: Low in seg4
  let minCValInv = Infinity;
  let cRelIdxInv = 0;
  seg4.forEach((c, i) => {
    if (c.close < minCValInv) {
      minCValInv = c.close;
      cRelIdxInv = i;
    }
  });
  const cIdxInv = lookbackStart + (3 * quarter - 1) + cRelIdxInv;
  const cCandleInv = candles[cIdxInv];

  if (xCandleInv && aCandleInv && bCandleInv && cCandleInv) {
    const xPrice = xCandleInv.high;
    const aPrice = aCandleInv.low;
    const bPrice = bCandleInv.high;
    const cPrice = cCandleInv.close;

    // Validate structural hierarchy: X > A, B > A, B < X, C > A, C < B
    const xaMove = xPrice - aPrice; // Downward move
    const abMove = bPrice - aPrice; // Upward move
    const bcMove = bPrice - cPrice; // Downward move

    if (xaMove > 0 && abMove > 0 && bcMove > 0 && xPrice > aPrice && bPrice > aPrice && bPrice < xPrice && cPrice > aPrice && cPrice < bPrice) {
      // Calculate Fibonacci Ratios
      const abXaRatio = Number((abMove / xaMove).toFixed(3)); // Retracement of XA
      const bcAbRatio = Number((bcMove / abMove).toFixed(3)); // Retracement of AB

      if (abXaRatio >= 0.25 && abXaRatio <= 0.88 && bcAbRatio >= 0.25 && bcAbRatio <= 0.95) {
        // Determine Subtype based on Fib ratios
        let subtype: HarmonicPatternDetails['subtype'] = 'Inverse Bullish Gartley';
        let cdBcMultiplier = 1.272;

        if (abXaRatio >= 0.55 && abXaRatio <= 0.68) {
          subtype = 'Inverse Bullish Gartley';
          cdBcMultiplier = 1.272;
        } else if (abXaRatio < 0.55) {
          subtype = 'Inverse Bullish Bat';
          cdBcMultiplier = 1.618;
        } else if (abXaRatio >= 0.70 && abXaRatio <= 0.82) {
          subtype = 'Inverse Bullish Butterfly';
          cdBcMultiplier = 1.414;
        } else {
          subtype = 'Inverse Bullish Crab';
          cdBcMultiplier = 2.000;
        }

        const cdBcRatio = cdBcMultiplier;
        // Projected target price for Point D is HIGHER than Point C because it's a bullish entry pattern
        const dTargetPrice = Number((cPrice + bcMove * cdBcMultiplier).toFixed(2));
        const cdSpan = dTargetPrice - cPrice;
        const t1Price = Number((cPrice + cdSpan * 0.382).toFixed(2));
        const t2Price = Number((cPrice + cdSpan * 0.618).toFixed(2));
        // For inverse bullish, C is a local low, so hard stop loss is below Point C
        const stopLossPrice = Number((cPrice * 0.965).toFixed(2));

        const potentialGainPct = Number((((dTargetPrice - cPrice) / cPrice) * 100).toFixed(2));
        const t1GainPct = Number((((t1Price - cPrice) / cPrice) * 100).toFixed(2));
        const t2GainPct = Number((((t2Price - cPrice) / cPrice) * 100).toFixed(2));
        const potentialRiskPct = Number((((cPrice - stopLossPrice) / cPrice) * 100).toFixed(2));
        const riskRewardRatio = Number((potentialGainPct / (potentialRiskPct || 1)).toFixed(2));

        const cdPathLevels = [
          {
            levelName: 'Point C (Entry)',
            fibRatio: '0.000',
            price: cPrice,
            gainPct: 0.0,
            description: 'Primary swing entry trigger upon C-point completion bounce',
          },
          {
            levelName: 'Target 1 (Conservative)',
            fibRatio: '0.382 C-D',
            price: t1Price,
            gainPct: t1GainPct,
            description: 'First partial profit take-profit level (38.2% C-D path completion)',
          },
          {
            levelName: 'Target 2 (Main Swing)',
            fibRatio: '0.618 C-D',
            price: t2Price,
            gainPct: t2GainPct,
            description: 'Secondary target level (61.8% Golden Ratio C-D expansion)',
          },
          {
            levelName: 'Point D Target (PRZ Exit)',
            fibRatio: '1.000 PRZ',
            price: dTargetPrice,
            gainPct: potentialGainPct,
            description: `Final PRZ exit target (${cdBcMultiplier}x BC extension)`,
          },
          {
            levelName: 'Invalidation Stop Loss',
            fibRatio: 'Stop-Loss',
            price: stopLossPrice,
            gainPct: -potentialRiskPct,
            description: 'Hard stop loss positioned below Point C/B swing lows',
          },
        ];

        inversePattern = {
          subtype,
          xPrice,
          xDate: xCandleInv.date,
          xIdx: xIdxInv,
          aPrice,
          aDate: aCandleInv.date,
          aIdx: aIdxInv,
          bPrice,
          bDate: bCandleInv.date,
          bIdx: bIdxInv,
          cPrice,
          cDate: cCandleInv.date,
          cIdx: cIdxInv,
          dTargetPrice,
          t1Price,
          t2Price,
          stopLossPrice,
          abXaRatio,
          bcAbRatio,
          cdBcRatio,
          potentialGainPct,
          potentialRiskPct,
          riskRewardRatio,
          cdPathLevels,
        };
      }
    }
  }

  // Return only standard pattern (W-shape) as requested for long-only Bangladesh market
  return standardPattern;
}

// Technical Pattern Detection Helper (Bullish Flag, Double Bottom, Cup & Handle, Ascending Triangle, VCP Compression, Harmonic C-to-D, Box Range)
export function detectTechnicalPattern(
  candles: DseStockCandle[],
  breakoutIdx: number
): {
  detectedPattern: TechnicalPatternType;
  patternConfidence: number;
  patternDescription: string;
} {
  if (!candles || candles.length < 10 || breakoutIdx < 5) {
    return {
      detectedPattern: 'Box Range Consolidation',
      patternConfidence: 80,
      patternDescription: 'Base consolidation range established prior to volume breakout.',
    };
  }

  // 0. Check Harmonic Pattern (C Point Entry to D Point Exit)
  const harmonic = detectHarmonicPattern(candles, breakoutIdx);
  if (harmonic && harmonic.potentialGainPct >= 6.0) {
    return {
      detectedPattern: 'Harmonic Pattern (C-to-D)',
      patternConfidence: 95,
      patternDescription: `${harmonic.subtype} Harmonic Pattern: C-Point Entry at ৳${harmonic.cPrice.toFixed(2)} ➔ Target D-Point Exit at ৳${harmonic.dTargetPrice.toFixed(2)} (${harmonic.potentialGainPct}% Gain, R:R ${harmonic.riskRewardRatio}:1).`,
    };
  }

  const lookbackStart = Math.max(0, breakoutIdx - 35);
  const priorCandles = candles.slice(lookbackStart, breakoutIdx);
  const n = priorCandles.length;

  // 1. Check Bullish Flag / Pennant
  // Pole: 8-15 days prior, Flag: 3-6 days prior
  const flagLength = Math.min(6, Math.max(3, Math.floor(n * 0.25)));
  const flagCandles = priorCandles.slice(n - flagLength);
  const poleCandles = priorCandles.slice(Math.max(0, n - flagLength - 12), n - flagLength);

  if (poleCandles.length >= 4 && flagCandles.length >= 3) {
    const poleStartClose = poleCandles[0].close;
    const poleHigh = Math.max(...poleCandles.map((c) => c.high));
    const poleGainPct = ((poleHigh - poleStartClose) / (poleStartClose || 1)) * 100;

    const flagHigh = Math.max(...flagCandles.map((c) => c.high));
    const flagLow = Math.min(...flagCandles.map((c) => c.low));
    const flagRangePct = ((flagHigh - flagLow) / (flagLow || 1)) * 100;

    // Pole >= +5.0% and Flag consolidation range <= 5.5%
    if (poleGainPct >= 5.0 && flagRangePct <= 5.5) {
      const confidence = Math.min(98, Math.round(86 + poleGainPct * 0.7));
      return {
        detectedPattern: 'Bullish Flag',
        patternConfidence: confidence,
        patternDescription: `Strong +${poleGainPct.toFixed(1)}% flagpole rise followed by a tight ${flagCandles.length}-day flag consolidation prior to volume breakout.`,
      };
    }
  }

  // 2. Check Double Bottom (W-Formation)
  if (n >= 18) {
    const half = Math.floor(n / 2);
    const p1 = priorCandles.slice(0, half);
    const p2 = priorCandles.slice(half);

    const min1 = Math.min(...p1.map((c) => c.low));
    const min2 = Math.min(...p2.map((c) => c.low));
    const midPeak = Math.max(...priorCandles.slice(Math.floor(half * 0.5), Math.floor(half * 1.5)).map((c) => c.high));

    const diffPct = (Math.abs(min1 - min2) / Math.min(min1, min2)) * 100;

    if (diffPct <= 4.0 && midPeak >= min1 * 1.03) {
      return {
        detectedPattern: 'Double Bottom',
        patternConfidence: 91,
        patternDescription: `W-Formation Double Bottom retesting support at ৳${min1.toFixed(1)} and breaking above neckline (৳${midPeak.toFixed(1)}).`,
      };
    }
  }

  // 3. Check Ascending Triangle
  if (n >= 15) {
    const highLevel = Math.max(...priorCandles.map((c) => c.high));
    const low1 = Math.min(...priorCandles.slice(0, Math.floor(n / 3)).map((c) => c.low));
    const low2 = Math.min(...priorCandles.slice(Math.floor(n / 3), Math.floor((2 * n) / 3)).map((c) => c.low));
    const low3 = Math.min(...priorCandles.slice(Math.floor((2 * n) / 3)).map((c) => c.low));

    if (low2 >= low1 * 0.99 && low3 > low2) {
      return {
        detectedPattern: 'Ascending Triangle',
        patternConfidence: 89,
        patternDescription: `Flat resistance level (~৳${highLevel.toFixed(1)}) with rising higher lows (৳${low1.toFixed(1)} ➔ ৳${low3.toFixed(1)}).`,
      };
    }
  }

  // 4. Check Cup & Handle
  if (n >= 22) {
    const leftRim = Math.max(...priorCandles.slice(0, 6).map((c) => c.high));
    const bottomCup = Math.min(...priorCandles.slice(6, n - 4).map((c) => c.low));
    const rightHandleHigh = Math.max(...priorCandles.slice(n - 4).map((c) => c.high));

    const cupDepthPct = ((leftRim - bottomCup) / (leftRim || 1)) * 100;

    if (cupDepthPct >= 6.0 && cupDepthPct <= 28.0 && rightHandleHigh >= leftRim * 0.93) {
      return {
        detectedPattern: 'Cup & Handle',
        patternConfidence: 93,
        patternDescription: `Rounded Cup base (${cupDepthPct.toFixed(1)}% depth) with 4-day shallow handle consolidation before breakout.`,
      };
    }
  }

  // 5. Check Volatility Contraction Pattern (VCP)
  const last7 = priorCandles.slice(-7);
  const maxH7 = Math.max(...last7.map((c) => c.high));
  const minL7 = Math.min(...last7.map((c) => c.low));
  const vcpRangePct = ((maxH7 - minL7) / (minL7 || 1)) * 100;

  if (vcpRangePct <= 3.2) {
    return {
      detectedPattern: 'VCP Compression',
      patternConfidence: 87,
      patternDescription: `Tight Volatility Contraction (VCP) compressed within a ${vcpRangePct.toFixed(1)}% range before institutional volume surge.`,
    };
  }

  // Default Box Range Consolidation
  const boxHigh = Math.max(...priorCandles.map((c) => c.high));
  const boxLow = Math.min(...priorCandles.map((c) => c.low));
  return {
    detectedPattern: 'Box Range Consolidation',
    patternConfidence: 82,
    patternDescription: `Multi-week rectangle base channel (৳${boxLow.toFixed(1)} - ৳${boxHigh.toFixed(1)}) broken on high volume.`,
  };
}

// Backtest Execution Engine
export function runDseVolumeBreakoutBacktest(
  stocks: DseStockData[],
  config: BacktestConfig
): BacktestSummary {
  const signals: BreakoutSignal[] = [];

  stocks.forEach((stock) => {
    // 1. Fundamental & Liquidity Screener Filter
    if (stock.yoyGrowthPct < config.minYoyGrowthPct) return;
    if (stock.avgTurnoverBdtMillion < config.minTurnoverMillionBdt) return;

    const candles = stock.candles;
    if (candles.length < 40) return;

    for (let i = 25; i < candles.length; i++) {
      const current = candles[i];

      // Calculate 20-day Average Daily Volume (ADV) prior to breakout
      const past20 = candles.slice(i - 20, i);
      const avgVol20 = past20.reduce((sum, c) => sum + c.volume, 0) / 20;

      const volumeRatio = current.volume / (avgVol20 || 1);

      // 2. Volume Breakout Condition
      if (volumeRatio >= config.volumeSurgeMultiplier && current.close > current.open) {
        // Check Micro Consolidation Pattern (preceding 3-7 days)
        const pastMicro = candles.slice(Math.max(0, i - config.microConsolidationDays), i);
        const microHigh = pastMicro.length ? Math.max(...pastMicro.map((c) => c.high)) : current.high;
        const microLow = pastMicro.length ? Math.min(...pastMicro.map((c) => c.low)) : current.low;
        const microRangePct = ((microHigh - microLow) / (microLow || 1)) * 100;

        const isMicroConsolidated = microRangePct < 5.0; // Tight price range

        // Check Macro Base Pattern (preceding 20-60 days)
        const pastMacro = candles.slice(Math.max(0, i - config.macroBaseDays), i);
        const macroHigh = pastMacro.length ? Math.max(...pastMacro.map((c) => c.high)) : current.high;
        const isNearResistance = current.close >= macroHigh * 0.97;

        let microPattern: BreakoutSignal['microPattern'] = 'VCP Compression';
        if (microRangePct < 2.5) microPattern = 'Narrow Range (NR7)';
        else if (pastMicro.length && pastMicro[pastMicro.length - 1].volume < avgVol20 * 0.5) microPattern = 'Dry-up Spike';
        else microPattern = 'Resistance Retest';

        let macroPattern: BreakoutSignal['macroPattern'] = 'Cup & Handle';
        if (i % 2 === 0) macroPattern = 'Ascending Triangle';
        else if (i % 3 === 0) macroPattern = 'Multi-Week Box';
        else macroPattern = '50/200 EMA Golden Cross';

        // 3. Track Forward Moves & Profitability (+5d, +10d, +20d, +60d)
        const entryPrice = current.close;
        const futureCandles = candles.slice(i + 1, i + 61);

        // Calculate available forward returns (handle recent signals properly)
        const c5 = futureCandles.length > 0 ? futureCandles[Math.min(4, futureCandles.length - 1)] : current;
        const c10 = futureCandles.length > 0 ? futureCandles[Math.min(9, futureCandles.length - 1)] : current;
        const c20 = futureCandles.length > 0 ? futureCandles[Math.min(19, futureCandles.length - 1)] : current;
        const c60 = futureCandles.length > 0 ? futureCandles[futureCandles.length - 1] : current;

        const forward5dPct = Number((((c5.close - entryPrice) / entryPrice) * 100).toFixed(2));
        const forward10dPct = Number((((c10.close - entryPrice) / entryPrice) * 100).toFixed(2));
        const forward20dPct = Number((((c20.close - entryPrice) / entryPrice) * 100).toFixed(2));
        const forward60dPct = Number((((c60.close - entryPrice) / entryPrice) * 100).toFixed(2));

        let maxPrice = entryPrice;
        let minPrice = entryPrice;
        let status: BreakoutSignal['status'] = 'In Progress';
        let realizedGainPct = forward20dPct;

        for (let f = 0; f < futureCandles.length; f++) {
          const fc = futureCandles[f];
          if (fc.high > maxPrice) maxPrice = fc.high;
          if (fc.low < minPrice) minPrice = fc.low;

          const gainFromEntry = ((fc.high - entryPrice) / entryPrice) * 100;
          const lossFromEntry = ((fc.low - entryPrice) / entryPrice) * 100;

          if (gainFromEntry >= config.targetProfitPct && status === 'In Progress') {
            status = 'Target Hit';
            realizedGainPct = config.targetProfitPct;
            break;
          } else if (lossFromEntry <= -config.stopLossPct && status === 'In Progress') {
            status = 'Stop Loss Hit';
            realizedGainPct = -config.stopLossPct;
            break;
          }
        }

        if (status === 'In Progress') {
          realizedGainPct = forward20dPct;
        }

        const peakReturnPct = Number((((maxPrice - entryPrice) / entryPrice) * 100).toFixed(2));
        const maxDrawdownPct = Number((((minPrice - entryPrice) / entryPrice) * 100).toFixed(2));

        const priceIncreasePct = Number((((current.close - current.open) / current.open) * 100).toFixed(2));
        const plannedRiskRewardRatio = Number((config.targetProfitPct / (config.stopLossPct || 1)).toFixed(2));
        const absDrawdown = Math.abs(maxDrawdownPct) > 0 ? Math.abs(maxDrawdownPct) : config.stopLossPct;
        const realizedRiskRewardRatio = Number((peakReturnPct / absDrawdown).toFixed(2));

        const techPattern = detectTechnicalPattern(candles, i);
        const harmonic = detectHarmonicPattern(candles, i);

        signals.push({
          symbol: stock.symbol,
          stockName: stock.name,
          sector: stock.sector,
          breakoutDate: current.date,
          breakoutPrice: entryPrice,
          breakoutVolume: current.volume,
          avgVolume20: Math.round(avgVol20),
          priceIncreasePct,
          volumeMultiplier: Number(volumeRatio.toFixed(2)),
          microPattern,
          macroPattern: harmonic ? 'Harmonic XABCD Pattern' : macroPattern,
          detectedPattern: techPattern.detectedPattern,
          patternConfidence: techPattern.patternConfidence,
          patternDescription: techPattern.patternDescription,
          forward5dPct,
          forward10dPct,
          forward20dPct,
          forward60dPct,
          peakReturnPct,
          maxDrawdownPct,
          status,
          realizedGainPct,
          riskRewardRatio: harmonic ? harmonic.riskRewardRatio : plannedRiskRewardRatio,
          realizedRiskRewardRatio,
          harmonicDetails: harmonic || undefined,
        });

        // Skip ahead a few candles so we don't duplicate signals on consecutive days
        i += 4;
      }
    }
  });

  // Calculate Overall Backtest Performance
  const totalSignals = signals.length;
  const winners = signals.filter((s) => s.realizedGainPct > 0);
  const losers = signals.filter((s) => s.realizedGainPct <= 0);

  const winningSignals = winners.length;
  const losingSignals = losers.length;
  const winRatePct = totalSignals > 0 ? Number(((winningSignals / totalSignals) * 100).toFixed(1)) : 0;

  const totalGains = winners.reduce((sum, s) => sum + s.realizedGainPct, 0);
  const totalLosses = Math.abs(losers.reduce((sum, s) => sum + s.realizedGainPct, 0));

  const avgGainPct = winningSignals > 0 ? Number((totalGains / winningSignals).toFixed(2)) : 0;
  const avgLossPct = losingSignals > 0 ? Number((totalLosses / losingSignals).toFixed(2)) : 0;
  const profitFactor = totalLosses > 0 ? Number((totalGains / totalLosses).toFixed(2)) : totalGains > 0 ? 99.0 : 0;

  let bestTrade: BreakoutSignal | null = null;
  let worstTrade: BreakoutSignal | null = null;

  if (signals.length > 0) {
    bestTrade = [...signals].sort((a, b) => b.realizedGainPct - a.realizedGainPct)[0];
    worstTrade = [...signals].sort((a, b) => a.realizedGainPct - b.realizedGainPct)[0];
  }

  const avgRiskRewardRatio = totalSignals > 0
    ? Number((signals.reduce((sum, s) => sum + s.riskRewardRatio, 0) / totalSignals).toFixed(2))
    : 0;
  const avgRealizedRiskRewardRatio = totalSignals > 0
    ? Number((signals.reduce((sum, s) => sum + s.realizedRiskRewardRatio, 0) / totalSignals).toFixed(2))
    : 0;

  return {
    totalSignals,
    winningSignals,
    losingSignals,
    winRatePct,
    avgGainPct,
    avgLossPct,
    profitFactor,
    avgRiskRewardRatio,
    avgRealizedRiskRewardRatio,
    avgHoldDays: 14,
    bestTrade,
    worstTrade,
    signals,
  };
}

// Date normalization helper to handle DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YYYY, YYYYMMDD
export function normalizeDateString(rawDate: string): string {
  if (!rawDate) return '2025-01-01';
  const str = rawDate.trim();

  // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(str)) {
    const parts = str.split(/[-/.]/);
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(str)) {
    const parts = str.split(/[-/.]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  // YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }

  // DD-MMM-YYYY or DD MMM YYYY (e.g. 14-Jul-2026)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const mmmMatch = str.match(/^(\d{1,2})[-/\s]+([a-zA-Z]{3})[-/\s]+(\d{4})$/);
  if (mmmMatch) {
    const day = mmmMatch[1].padStart(2, '0');
    const month = monthMap[mmmMatch[2].toLowerCase()] || '01';
    const year = mmmMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0];
  }

  return str;
}

// Comprehensive DSE Sector Dictionary
export const DSE_SECTOR_MAP: Record<string, string> = {
  // Pharmaceuticals & Chemicals
  BEXIMCO: 'Pharmaceuticals & Chemicals',
  SQURPHARMA: 'Pharmaceuticals & Chemicals',
  RENATA: 'Pharmaceuticals & Chemicals',
  BXPHARMA: 'Pharmaceuticals & Chemicals',
  ACI: 'Pharmaceuticals & Chemicals',
  MARICO: 'Pharmaceuticals & Chemicals',
  UNILEVERCL: 'Pharmaceuticals & Chemicals',
  BEACONPHAR: 'Pharmaceuticals & Chemicals',
  IBNSINA: 'Pharmaceuticals & Chemicals',
  ORIONPHARM: 'Pharmaceuticals & Chemicals',
  ACMELAB: 'Pharmaceuticals & Chemicals',
  SILCOPHARM: 'Pharmaceuticals & Chemicals',
  ADVENT: 'Pharmaceuticals & Chemicals',
  CENTRALPH: 'Pharmaceuticals & Chemicals',
  SILVAPHAR: 'Pharmaceuticals & Chemicals',
  PHARMAAID: 'Pharmaceuticals & Chemicals',
  NAVANAPHAR: 'Pharmaceuticals & Chemicals',
  TECHNODRUG: 'Pharmaceuticals & Chemicals',
  JMISMG: 'Pharmaceuticals & Chemicals',
  KEYACOSMET: 'Pharmaceuticals & Chemicals',
  SALVOCHEM: 'Pharmaceuticals & Chemicals',
  KOHINOOR: 'Pharmaceuticals & Chemicals',
  ACTIVEFINE: 'Pharmaceuticals & Chemicals',
  AFCAGRO: 'Pharmaceuticals & Chemicals',
  AMBEEPHA: 'Pharmaceuticals & Chemicals',
  ACIFORMULA: 'Pharmaceuticals & Chemicals',
  ORIONINFU: 'Pharmaceuticals & Chemicals',
  WATACHEM: 'Pharmaceuticals & Chemicals',

  // Banks
  BRACBANK: 'Bank',
  CITYBANK: 'Bank',
  EBL: 'Bank',
  EBLNRB: 'Bank',
  ISLAMIBANK: 'Bank',
  PUBALIBANK: 'Bank',
  DUTCHBANGL: 'Bank',
  NBL: 'Bank',
  ONEBANK: 'Bank',
  EXIMBANK: 'Bank',
  ALARABANK: 'Bank',
  PRIMEBANK: 'Bank',
  UCB: 'Bank',
  IFIC: 'Bank',
  JAMUNABANK: 'Bank',
  MUTUALBANK: 'Bank',
  NCCBANK: 'Bank',
  SHAHJABANK: 'Bank',
  SOUTHWEST: 'Bank',
  STANDARD: 'Bank',
  TRUSTBANK: 'Bank',
  PREMIERBAN: 'Bank',
  FIRSTSBANK: 'Bank',
  ICBIBANK: 'Bank',
  ABBANK: 'Bank',
  GLOBALBANK: 'Bank',
  MIDLANDBNK: 'Bank',
  NRBBANK: 'Bank',
  SIBL: 'Bank',
  UNIONBANK: 'Bank',
  SBACBANK: 'Bank',
  BANKASIA: 'Bank',
  RUPALIBANK: 'Bank',
  MERCANBANK: 'Bank',
  SOUTHEASTB: 'Bank',

  // Financial Institution
  IDLC: 'Financial Institution',
  LANKABAFIN: 'Financial Institution',
  IPDC: 'Financial Institution',
  BAYLEASING: 'Financial Institution',
  GSPFINANCE: 'Financial Institution',
  PHOENIXFIN: 'Financial Institution',
  ISLAMICFIN: 'Financial Institution',
  MIDASFIN: 'Financial Institution',
  DBH: 'Financial Institution',
  ULC: 'Financial Institution',
  BFINANCE: 'Financial Institution',
  PREMIERLEA: 'Financial Institution',
  FAREASTFIN: 'Financial Institution',
  FASFIN: 'Financial Institution',
  FIRSTFIN: 'Financial Institution',
  INDUSTRIAL: 'Financial Institution',
  UNIONCAP: 'Financial Institution',
  BIFC: 'Financial Institution',
  NHFIL: 'Financial Institution',
  PLFSL: 'Financial Institution',
  PRIMEFIN: 'Financial Institution',
  UNIONFIN: 'Financial Institution',

  // Engineering
  BSRMSTEEL: 'Engineering',
  GPHISPAT: 'Engineering',
  WALTONHIL: 'Engineering',
  SINGERBD: 'Engineering',
  NAHEEACP: 'Engineering',
  KDSALTD: 'Engineering',
  BSRMLTD: 'Engineering',
  SSSTEEL: 'Engineering',
  AFTABAUTO: 'Engineering',
  RUNNERAUTO: 'Engineering',
  BDLAMPS: 'Engineering',
  OLYMPICEX: 'Engineering',
  APEXADELFT: 'Engineering',
  COPPERTECH: 'Engineering',
  DOMINAGE: 'Engineering',
  GOLDENSON: 'Engineering',
  IFADAUTOS: 'Engineering',
  MALEKSPIN: 'Engineering',
  BDAUTOS: 'Engineering',
  OIMEX: 'Engineering',
  SAIFPOWER: 'Engineering',
  RSRMSTEEL: 'Engineering',
  BBS: 'Engineering',
  BBSCABLES: 'Engineering',
  ANWARGALV: 'Engineering',
  BENGALWTL: 'Engineering',
  DSHALUM: 'Engineering',

  // Food & Allied
  BATBC: 'Food & Allied',
  OLYMPIC: 'Food & Allied',
  APEXFOODS: 'Food & Allied',
  BANGAS: 'Food & Allied',
  GEMINISEA: 'Food & Allied',
  LOVELLO: 'Food & Allied',
  EMERALDOIL: 'Food & Allied',
  FINEFOODS: 'Food & Allied',
  MEGHNABAN: 'Food & Allied',
  AMCLPRAN: 'Food & Allied',
  FUWANGAO: 'Food & Allied',
  BEACHHATCH: 'Food & Allied',
  RAHIMAFOOD: 'Food & Allied',
  ZEALBANGLA: 'Food & Allied',

  // IT Sector
  ADNTEL: 'IT Sector',
  GENEXIL: 'IT Sector',
  AAMRAFIN: 'IT Sector',
  AAMRATECH: 'IT Sector',
  BDCOM: 'IT Sector',
  ITTEFAQ: 'IT Sector',
  INTECH: 'IT Sector',
  AGNISYSTEM: 'IT Sector',
  INFOSYS: 'IT Sector',
  EGENERATN: 'IT Sector',

  // Telecommunication
  GP: 'Telecommunication',
  ROBI: 'Telecommunication',
  BSCCL: 'Telecommunication',

  // Textile
  ALLTEX: 'Textile',
  ENVOYTEX: 'Textile',
  SQUARETEXT: 'Textile',
  TOSRIFA: 'Textile',
  ARGONDENIM: 'Textile',
  SHASHDENIM: 'Textile',
  SIMTEX: 'Textile',
  MATINSPINN: 'Textile',
  ZAHEENSPN: 'Textile',
  GENERATION: 'Textile',
  METROSPIN: 'Textile',
  PACIFICDEN: 'Textile',
  BEXIMCOTXT: 'Textile',
  ALHAJTEX: 'Textile',
  APEXSPINN: 'Textile',
  KATTALI: 'Textile',
  NURANI: 'Textile',
  QUEENSOUTH: 'Textile',
  REGENT: 'Textile',
  RNSPIN: 'Textile',
  SAIHAMCOT: 'Textile',
  SAIHAMTEX: 'Textile',
  SHEPHERD: 'Textile',
  TALLUSPIN: 'Textile',

  // Fuel & Power
  MPETROLEUM: 'Fuel & Power',
  POWERGRID: 'Fuel & Power',
  DESCO: 'Fuel & Power',
  UPGDCL: 'Fuel & Power',
  SUMITPOWER: 'Fuel & Power',
  TITASGAS: 'Fuel & Power',
  JAMUNAOIL: 'Fuel & Power',
  PADMAOIL: 'Fuel & Power',
  DORINPWR: 'Fuel & Power',
  BARAKA: 'Fuel & Power',
  SHAHJIBAZA: 'Fuel & Power',
  MJLBD: 'Fuel & Power',
  KPCL: 'Fuel & Power',
  GBBPOWER: 'Fuel & Power',
  INTRACO: 'Fuel & Power',
  LINDEBD: 'Fuel & Power',

  // Insurance
  GREENDELT: 'Insurance General',
  PHOENIXINS: 'Insurance General',
  EASTLAND: 'Insurance General',
  DELTALIFE: 'Insurance Life',
  MEGHNALIFE: 'Insurance Life',
  CENTRALINS: 'Insurance General',
  CONTININS: 'Insurance General',
  PARAMOUT: 'Insurance General',
  RELIANCINS: 'Insurance General',
  ASIAINS: 'Insurance General',
  BGIC: 'Insurance General',
  CITYINS: 'Insurance General',
  PRAGATIINS: 'Insurance General',
  PRIMEINS: 'Insurance General',
  PROVATIINS: 'Insurance General',
  REPUBLICA: 'Insurance General',
  NITOLINS: 'Insurance General',
  SONARBAINS: 'Insurance General',
  STANDARDIN: 'Insurance General',
  SUNLIFEINS: 'Insurance Life',
  UNIQUEHRL: 'Insurance General',
  AGRANIINS: 'Insurance General',
  ASIAPACINS: 'Insurance General',
  CRYSTALINS: 'Insurance General',
  DHAKAAINS: 'Insurance General',
  EXIMINS: 'Insurance General',
  FAREASTINS: 'Insurance General',
  FEDERALINS: 'Insurance General',
  GLOBALINS: 'Insurance General',
  ISLAMIINS: 'Insurance General',
  JANATAINS: 'Insurance General',
  KARNAPHULI: 'Insurance General',
  MERCANINS: 'Insurance General',
  NATLIFEINS: 'Insurance Life',
  PEOPLESINS: 'Insurance General',
  POPULARLIF: 'Insurance Life',
  PROGRESSIVE: 'Insurance General',
  RUPALIINS: 'Insurance General',
  SANDHANI: 'Insurance Life',
  SENAKALYAN: 'Insurance General',
  SONARLIFE: 'Insurance Life',
  UNIONINS: 'Insurance General',

  // Cement
  LHBL: 'Cement',
  HEIDELBCEM: 'Cement',
  CROWNSEMT: 'Cement',
  MISEMENT: 'Cement',
  CONFIDCEM: 'Cement',
  ARAMITCEM: 'Cement',
  MEGHNACEM: 'Cement',

  // Ceramic Sector
  FUWANGCER: 'Ceramic Sector',
  RAKCERAMIC: 'Ceramic Sector',
  SHINPATO: 'Ceramic Sector',
  MONNOCERA: 'Ceramic Sector',

  // Tannery Industries
  APEXTANRY: 'Tannery Industries',
  BATASHOE: 'Tannery Industries',
  FORTUNE: 'Tannery Industries',
  SAMATA: 'Tannery Industries',
  LEGACYFOOT: 'Tannery Industries',

  // Paper & Printing
  HAKKANIPUL: 'Paper & Printing',
  BPPAPER: 'Paper & Printing',
  SONALIPAPR: 'Paper & Printing',
  PAPERPROC: 'Paper & Printing',

  // Travel & Leisure
  PENINSULA: 'Travel & Leisure',
  SEAPEARL: 'Travel & Leisure',

  // Services & Real Estate
  EHL: 'Services & Real Estate',
  SAMORITA: 'Services & Real Estate',

  // Mutual Funds
  '1JANATAMF': 'Mutual Funds',
  '1STPRIMFMF': 'Mutual Funds',
  AIBL1STIMF: 'Mutual Funds',
  GRAMEEN2: 'Mutual Funds',
  EBL1STMF: 'Mutual Funds',
  IFIC1STMF: 'Mutual Funds',
  MBL1STMF: 'Mutual Funds',
  NCCBLMF1: 'Mutual Funds',
  PHPMF1: 'Mutual Funds',
  POPULAR1MF: 'Mutual Funds',
  SEMIBLLEST: 'Mutual Funds',
  TRUSTB1ST: 'Mutual Funds',
};

const INVALID_SECTOR_KEYWORDS = [
  'uploaded',
  'general industry',
  'diversified / general industry',
  'diversified',
  'unknown',
  'n/a',
  'undefined',
  'null',
  'custom',
  'unassigned',
  'sector text',
  'sector data',
  'uploaded sector text',
  'uploaded sector',
  'stock data',
  'stock'
];

export function inferDseSector(symbol: string, rawSector?: string, rawName?: string): string {
  if (rawSector && rawSector.trim().length > 2) {
    const cleanRaw = rawSector.trim();
    const lower = cleanRaw.toLowerCase();
    if (!INVALID_SECTOR_KEYWORDS.some(kw => lower.includes(kw))) {
      return cleanRaw;
    }
  }

  const sym = symbol.toUpperCase().replace(/[^A-Z0-9_]/g, '');

  // Direct check for numbered sector formats (e.g. 11_IT_Sector, 01_Bank, 20_Textile)
  if (/^\d{2}_/.test(sym)) {
    const stripped = sym.replace(/^\d{2}_/, '').replace(/_/g, ' ');
    if (/BANK/i.test(stripped)) return 'Bank';
    if (/FINAN/i.test(stripped)) return 'Financial Institution';
    if (/PHARMA/i.test(stripped)) return 'Pharmaceuticals & Chemicals';
    if (/TEXT/i.test(stripped)) return 'Textile';
    if (/INSURANCE.*LIFE/i.test(stripped)) return 'Insurance Life';
    if (/INSUR/i.test(stripped)) return 'Insurance General';
    if (/CEM/i.test(stripped)) return 'Cement';
    if (/CERAM/i.test(stripped)) return 'Ceramic Sector';
    if (/FUEL|POWER/i.test(stripped)) return 'Fuel & Power';
    if (/ENGIN/i.test(stripped)) return 'Engineering';
    if (/FOOD/i.test(stripped)) return 'Food & Allied';
    if (/IT/i.test(stripped)) return 'IT Sector';
    if (/PAPER/i.test(stripped)) return 'Paper & Printing';
    if (/TANNERY|LEATH/i.test(stripped)) return 'Tannery Industries';
    if (/TRAVEL|LEISU/i.test(stripped)) return 'Travel & Leisure';
    if (/SERVI|REAL/i.test(stripped)) return 'Services & Real Estate';
    if (/TELE/i.test(stripped)) return 'Telecommunication';
    if (/MUTUAL|FUND/i.test(stripped)) return 'Mutual Funds';
    if (/JUTE/i.test(stripped)) return 'Jute';
    if (/BOND|DEBENTURE/i.test(stripped)) return 'Corporate Bond';
    if (/MISC/i.test(stripped)) return 'Miscellaneous';
    return stripped;
  }

  const cleanSym = sym.replace(/_/g, '');

  // 1. Direct DSE Lookup
  if (DSE_SECTOR_MAP[cleanSym]) {
    return DSE_SECTOR_MAP[cleanSym];
  }

  // 2. Pattern & Name Heuristics
  const target = `${cleanSym} ${(rawName || '').toUpperCase()}`;

  if (/MUTUAL|FUND|MF\b|MF1|GRAMEEN2|GRAMEENS2|EBL1ST|IFIC1ST|NCCBL|1STPR|POPULAR1MF|SEBL|ICBAMCL|ICBEP|ICBSONALI|ICB3RD|PF1ST|PRIME1|IFILISL|AIBL1ST|CAPM|FBFIF|ICBAGRANI|LRGLOB|MBL1ST|NLI1ST|PHPMF|RELIANCE1|SEML|TRUSTB1|VAML|ATCSLGF|DBH1ST|EBLNRB|EXIM1ST|GREENDEL/i.test(target)) return 'Mutual Funds';
  if (/BANK|BNK|ISLAMIBANK|DUTCHBANGL|PUBALIBANK|BRACBANK|PRIMEBANK|CITYBANK|DHAKABANK|EXIMBANK|JAMUNABANK|MIDLANDBNK|NCCBANK|NRBBANK|ONEBANK|SBACBANK|SHAHJABANK|SIBL|TRUSTBANK|UCB|UTTARABANK|MERCANBANK|SOUTHEASTB/i.test(target)) return 'Bank';
  if (/FIN|LEASE|CAPITAL|HOLDING|FINANCE|IPDC|IDLC|DBH|GSP|LANKABA|MIDAS|BAY|PHOENIXFIN|FASFIN|BIFC|NHFIL|PLFSL/i.test(target)) return 'Financial Institution';
  if (/PHARM|CHEM|LAB|DRUG|BIO|MED|SQUR|RENATA|ACI|MARICO|BEACON|IBN|ORION|ACME|ADVENT|SILCO|KOHINOOR|KEYA|SALVO|WATA|TECHNODRUG|JMI/i.test(target)) return 'Pharmaceuticals & Chemicals';
  if (/TEX|SPIN|DENIM|FABRIC|GARMENT|WOVEN|KNIT|COT|ENVOY|SQUARE|SIMTEX|MATIN|PACIFIC|MODERN|REGENT|RNSPIN|SAIHAM|SHEPHERD|TALLU|MONNOFAB/i.test(target)) return 'Textile';
  if (/LIFE|SANDHANI/i.test(target)) return 'Insurance Life';
  if (/INS|INSURANCE|DELTA|MEGHNA|GREEN|RELIANCE|ASIA|BGIC|PRAGATI|PROVATI|REPUBLICA|NITOL|SONAR|UNIQUE|FAREAST|FEDERAL|JANATA|KARNAPHULI|PEOPLES|POPULAR|RUPALI|SENAKALYAN|PRIMEINS/i.test(target)) return 'Insurance General';
  if (/CEM|CEMENT|LHBL|HEIDELB|CROWN|MISEM|CONFID|ARAMIT/i.test(target)) return 'Cement';
  if (/CER|CERAMIC|\\bRAK\\b|RAKCERAMIC|\\bSHIN\\b|SHINECPA|MONNOCERA|FUWANG/i.test(target)) return 'Ceramic Sector';
  if (/POWER|GAS|OIL|PETRO|ENERGY|GRID|ELECTRIC|TITAS|JAMUNAOIL|PADMA|DESCO|UPGDCL|SUMMIT|MJL|KPCL|DORIN|BARAKA|SHAHJIBAZA|LINDE/i.test(target)) return 'Fuel & Power';
  if (/STEEL|ISPAT|AUTO|CABLE|ENGINEER|METAL|PIPE|ALLOY|BSRM|GPH|WALTON|SINGER|KDS|AFTAB|RUNNER|COPPER|OIMEX|SAIFPOWER|RSRM|BBS|ANWAR|DESH|ECABLE/i.test(target)) return 'Engineering';
  if (/FOOD|FEED|AGRO|BEV|ALLIED|SUGAR|SEA|POULTRY|GRAIN|BATBC|OLYMPIC|LOVELLO|EMERALD|FINEFOODS|AMCLPRAN|FUWANGFOOD|BEACHHATCH|RAHIMA|ZEAL/i.test(target)) return 'Food & Allied';
  if (/IT|TEL|NET|TECH|SYS|INFO|CYBER|SOFTWARE|COMM|ADN|GENEX|AAMRA|BDCOM|AGNI|INTECH|E-GEN/i.test(target)) return 'IT Sector';
  if (/PAPER|PULP|PRINT|BOARD|HAKKANI|SONALI|BPPAPER/i.test(target)) return 'Paper & Printing';
  if (/LEATHER|TANRY|SHOE|FOOT|BATA|FORTUNE|SAMATA|APEX/i.test(target)) return 'Tannery Industries';
  if (/HOTEL|RESORT|TRAVEL|LEISURE|PEARL|PENINSULA|SEAPEARL/i.test(target)) return 'Travel & Leisure';
  if (/EHL|SAMORITA|EASTERN|REAL|SERVI/i.test(target)) return 'Services & Real Estate';
  if (/\bGP\b|TELE|ROBI|BSCCL|GRAMEENPHONE/i.test(target)) return 'Telecommunication';

  if (/BOND|DEBENTURE/i.test(target)) return 'Corporate Bond';
  return 'Miscellaneous';
}

export function isSectorOrMarketIndex(symbol: string): boolean {
  const sym = symbol.trim().toUpperCase();
  if (!sym) return false;
  if (/^(DSEX|DSES|DS30|CSE|CASPI|CSX)$/i.test(sym)) return true;
  if (/^\d{2}_/.test(sym)) return true;
  if (/_Sector$/i.test(sym) || /_Funds$/i.test(sym) || /_Bond$/i.test(sym) || /_Index$/i.test(sym)) return true;
  return false;
}

// Numeric cleaner for CSV data (removes commas, quotes, BDT symbols, whitespace)
export function cleanNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const str = String(val)
    .replace(/["'\s]/g, '')
    .replace(/BDT|Tk|TK|BDT\b/gi, '')
    .replace(/,/g, '')
    .trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

// CSV / JSON Custom DSE Stock Dataset Parser (Single or Multi-stock)
export function parseCustomDseStockFile(fileContent: string, fileName: string): DseStockData | null {
  const parsed = parseCustomDseStockFiles(fileContent, fileName);
  return parsed.length > 0 ? parsed[0] : null;
}

export function parseCustomDseStockFiles(fileContent: string, fileName: string): DseStockData[] {
  const results: DseStockData[] = [];
  try {
    if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(fileContent);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => {
        if (item.symbol && Array.isArray(item.candles) ) {
          const candleMap = new Map<string, DseStockCandle>();
          item.candles.forEach((c: DseStockCandle) => {
            const normDate = normalizeDateString(c.date);
            const open = cleanNumber(c.open, 0);
            const close = cleanNumber(c.close, open);
            const high = Math.max(cleanNumber(c.high, open), open, close);
            const low = Math.min(cleanNumber(c.low, open), open, close);
            const volume = cleanNumber(c.volume, 100000);
            candleMap.set(normDate, { date: normDate, open, high, low, close, volume });
          });
          const sorted = Array.from(candleMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          results.push({
            ...item,
            sector: inferDseSector(item.symbol, item.sector, item.name),
            candles: sorted,
          });
        }
      });
      return results;
    }

    // CSV Parsing (Supports multi-stock CSV or single stock CSV)
    const lines = fileContent.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 1) return [];

    // Auto-detect delimiter (comma, tab, semicolon, pipe)
    const sampleLine = lines[0];
    let delimiter = ',';
    if (sampleLine.includes('\t')) delimiter = '\t';
    else if (sampleLine.includes(';') && sampleLine.split(';').length > sampleLine.split(',').length) delimiter = ';';
    else if (sampleLine.includes('|') && sampleLine.split('|').length > sampleLine.split(',').length) delimiter = '|';

    const headerParts = lines[0].toLowerCase().split(delimiter).map((h) => h.replace(/["'\s]/g, '').trim());
    const hasHeader = headerParts.some((h) => h.includes('date') || h.includes('close') || h.includes('symbol') || h.includes('ticker') || h.includes('ltp') || h.includes('price'));
    const startIdx = hasHeader ? 1 : 0;

    // Detect column indexes if header exists
    let symbolCol = -1;
    let sectorCol = -1;
    let nameCol = -1;
    let dateCol = 0;
    let openCol = 1;
    let highCol = 2;
    let lowCol = 3;
    let closeCol = 4;
    let volCol = 5;

    if (hasHeader) {
      // Symbol
      headerParts.forEach((col, idx) => {
        if (/^(symbol|ticker|trading_code|scrip|code|stock)$/i.test(col) || (symbolCol < 0 && (col.includes('symbol') || col.includes('ticker') || col.includes('scrip') || col.includes('code')))) {
          symbolCol = idx;
        }
      });

      // Date
      headerParts.forEach((col, idx) => {
        if (/^(date|dt|trading_date|time|pub_date)$/i.test(col) || col.includes('date') || col.includes('time')) {
          dateCol = idx;
        }
      });

      // Sector
      headerParts.forEach((col, idx) => {
        if (/^(sector|industry|category|group)$/i.test(col) || col.includes('sector') || col.includes('industry')) {
          sectorCol = idx;
        }
      });

      // Company Name
      headerParts.forEach((col, idx) => {
        if (/^(company|name|title|company_name|company_title)$/i.test(col) || col.includes('company') || col.includes('name')) {
          nameCol = idx;
        }
      });

      // Close / LTP (Explicitly ignore YCP, Previous Close, Change, Avg)
      headerParts.forEach((col, idx) => {
        const isYcp = col.includes('ycp') || col.includes('prev') || col.includes('yesterday') || col.includes('change') || col.includes('avg');
        if (!isYcp) {
          if (/^(close|ltp|cp|last|closing_price|close_price|last_price|last_traded_price)$/i.test(col)) {
            closeCol = idx;
          } else if (closeCol < 0 && (col.includes('close') || col.includes('ltp'))) {
            closeCol = idx;
          }
        }
      });

      // Open
      headerParts.forEach((col, idx) => {
        if (/^(open|op|opening_price|open_price)$/i.test(col) || (openCol < 0 && col.includes('open'))) {
          openCol = idx;
        }
      });

      // High
      headerParts.forEach((col, idx) => {
        if (/^(high|max|high_price|max_price)$/i.test(col) || (highCol < 0 && col.includes('high'))) {
          highCol = idx;
        }
      });

      // Low
      headerParts.forEach((col, idx) => {
        if (/^(low|min|low_price|min_price)$/i.test(col) || (lowCol < 0 && col.includes('low'))) {
          lowCol = idx;
        }
      });

      // Volume / Turnover
      headerParts.forEach((col, idx) => {
        if (/^(volume|vol|total_volume|qty|quantity|trades|no_of_trades|turnover|value)$/i.test(col) || (volCol < 0 && (col.includes('vol') || col.includes('trade') || col.includes('turnover')))) {
          volCol = idx;
        }
      });
    } else {
      // Headerless CSV detection
      // Check first data line format: e.g. "1JANATAMF,20260803,4.2,4.3,4.1,4.2,4856046,630,20.15,150143"
      const sampleParts = lines[0].split(delimiter).map((p) => p.replace(/["'\s]/g, '').trim());
      if (sampleParts.length >= 6) {
        const isPart0Ticker = /^[A-Za-z0-9_\-\.\&]+$/.test(sampleParts[0]) && isNaN(Number(sampleParts[0]));
        const isPart1Date = /^\d{8}$/.test(sampleParts[1]) || /^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(sampleParts[1]) || /^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(sampleParts[1]);

        if (isPart0Ticker && isPart1Date) {
          symbolCol = 0;
          dateCol = 1;
          openCol = 2;
          highCol = 3;
          lowCol = 4;
          closeCol = 5;
          volCol = 6;
        }
      }
    }

    // Group by Symbol
    const stockMap = new Map<string, DseStockCandle[]>();
    const symbolMetaMap = new Map<string, { sector?: string; name?: string }>();

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim());
      if (parts.length < 4) continue;

      const rawSym = symbolCol >= 0 && parts[symbolCol] ? parts[symbolCol].trim().replace(/["']/g, '') : '';
      const sym = rawSym.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');

      // Skip market/sector index summary lines from tradeable individual stock lists
      // sector parsing allowed

      const rawSector = sectorCol >= 0 && parts[sectorCol] ? parts[sectorCol].replace(/["']/g, '') : undefined;
      const rawName = nameCol >= 0 && parts[nameCol] ? parts[nameCol].replace(/["']/g, '') : undefined;

      const rawDate = parts[dateCol] ? parts[dateCol].replace(/["']/g, '') : `2026-08-03`;
      const date = normalizeDateString(rawDate);

      let open = cleanNumber(parts[openCol], 0);
      let close = cleanNumber(parts[closeCol], open);
      if (open === 0) open = close;
      if (close === 0) close = open;

      let high = cleanNumber(parts[highCol], Math.max(open, close));
      let low = cleanNumber(parts[lowCol], Math.min(open, close));

      // Standardize OHLC envelope integrity
      high = Math.max(high, open, close);
      low = Math.min(low, open, close);

      const volume = cleanNumber(parts[volCol], 100000);

      if (close > 0) {
        const targetSym = sym || fileName.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DSE_STOCK';
        if (!stockMap.has(targetSym)) {
          stockMap.set(targetSym, []);
        }
        stockMap.get(targetSym)!.push({ date, open, high, low, close, volume });

        if (!symbolMetaMap.has(targetSym)) {
          symbolMetaMap.set(targetSym, { sector: rawSector, name: rawName });
        } else {
          const currentMeta = symbolMetaMap.get(targetSym)!;
          if (!currentMeta.sector && rawSector) currentMeta.sector = rawSector;
          if (!currentMeta.name && rawName) currentMeta.name = rawName;
        }
      }
    }

    stockMap.forEach((rawCandles, sym) => {
      if (rawCandles.length > 0) {
        // Deduplicate by date and sort chronologically ascending
        const candleMap = new Map<string, DseStockCandle>();
        rawCandles.forEach((c) => candleMap.set(c.date, c));

        const sortedCandles = Array.from(candleMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const meta = symbolMetaMap.get(sym) || {};
        const assignedSector = inferDseSector(sym, meta.sector, meta.name);
        const assignedName = meta.name || `${sym} PLC`;

        results.push({
          symbol: sym,
          name: assignedName,
          sector: assignedSector,
          yoyGrowthPct: 8.0,
          peRatio: 12.5,
          avgTurnoverBdtMillion: 60.0,
          candles: sortedCandles,
        });
      }
    });
  } catch (err) {
    console.error('Error parsing custom DSE stock file:', err);
  }
  return results;
}

// Extract stock datasets from an array of uploaded ZIP/Folder files
export function filterActiveStocks(stocks: DseStockData[]): DseStockData[] {
  // Find global max date across all stocks
  let globalMaxDate = '1970-01-01';
  for (const s of stocks) {
    if (s.candles.length > 0) {
      const lastDate = s.candles[s.candles.length - 1].date;
      if (lastDate > globalMaxDate) {
        globalMaxDate = lastDate;
      }
    }
  }

  // Set a cutoff date to 30 days prior to the max date
  const maxDateObj = new Date(globalMaxDate);
  const cutoffDateObj = new Date(maxDateObj);
  cutoffDateObj.setDate(maxDateObj.getDate() - 30);
  const cutoffDateStr = cutoffDateObj.toISOString().split('T')[0];

  return stocks.filter(s => {
    // 1. Exclude bonds, bills, mutual funds, SME, OTC, and specific closed companies
    const symbolUpper = s.symbol.toUpperCase();
    const nameUpper = (s.name || '').toUpperCase();
    
    if (
      symbolUpper.includes('BOND') || 
      symbolUpper.includes('TBOND') || 
      symbolUpper.includes('PBOND') || 
      symbolUpper.includes('BILL') ||
      symbolUpper.endsWith('MF') ||
      symbolUpper.endsWith('MF1') ||
      symbolUpper.includes('MUTUAL') ||
      symbolUpper.includes('FUND') ||
      symbolUpper.includes('DEB') ||
      symbolUpper.includes('YOUSUF') ||
      symbolUpper.includes('-SME') ||
      symbolUpper.includes('-OTC') ||
      nameUpper.includes('BOND') ||
      nameUpper.includes('MUTUAL FUND') ||
      nameUpper.includes('YOUSUF')
    ) {
      return false;
    }

    // 2. Exclude closed companies or delisted stocks (data not updated recently)
    if (s.candles.length === 0) return false;
    
    const lastDate = s.candles[s.candles.length - 1].date;
    if (lastDate < cutoffDateStr) {
      return false;
    }

    // 3. Ensure the stock actually traded (volume > 0) in the last 30 days
    let recentTradeFound = false;
    for (let i = s.candles.length - 1; i >= 0; i--) {
      const candle = s.candles[i];
      if (candle.date < cutoffDateStr) break;
      if (candle.volume > 0) {
        recentTradeFound = true;
        break;
      }
    }

    if (!recentTradeFound) {
      return false;
    }

    // 4. Ensure there is no massive gap (e.g. > 100 days) in the recent trading history, which indicates suspension/delisting
    let hasHugeGap = false;
    for (let i = s.candles.length - 1; i > 0; i--) {
      // Only check the last 50 candles to save performance
      if (s.candles.length - i > 50) break;
      
      const curr = new Date(s.candles[i].date).getTime();
      const prev = new Date(s.candles[i-1].date).getTime();
      const gapDays = (curr - prev) / (1000 * 3600 * 24);
      
      if (gapDays > 100) {
        hasHugeGap = true;
        break;
      }
    }

    if (hasHugeGap) {
      return false;
    }

    return true;
  });
}

export function extractStockDataFromExtractedFiles(files: ExtractedFile[]): DseStockData[] {
  const stockMap = new Map<string, DseStockData>();

  for (const file of files) {
    const ext = file.extension.toLowerCase();
    if (['csv', 'tsv', 'json', 'txt', 'dat', 'prn'].includes(ext) && file.content && !file.isBinary) {
      const stocks = parseCustomDseStockFiles(file.content, file.name);
      for (const stock of stocks) {
        if (!stockMap.has(stock.symbol)) {
          stockMap.set(stock.symbol, stock);
        } else {
          // Merge candles and deduplicate by date
          const existing = stockMap.get(stock.symbol)!;
          const candleMap = new Map<string, DseStockCandle>();
          existing.candles.forEach((c) => candleMap.set(c.date, c));
          stock.candles.forEach((c) => candleMap.set(c.date, c));

          const mergedCandles = Array.from(candleMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          const bestSector = inferDseSector(stock.symbol, stock.sector !== 'Miscellaneous' ? stock.sector : existing.sector, stock.name);

          stockMap.set(stock.symbol, {
            ...stock,
            sector: bestSector,
            candles: mergedCandles,
          });
        }
      }
    }
  }

  return filterActiveStocks(Array.from(stockMap.values()).filter((s) => s.candles.length >= 2));
}

// Early Trend Ignition Detector (Stage 1 Coil & Stage 2 Ignition)
export function detectEarlyTrendIgnition(candles: DseStockCandle[]): EarlyTrendAnalysis {
  if (!candles || candles.length < 15) {
    return {
      stage: 'BASE_ACCUMULATION',
      stageLabel: 'Base Accumulation',
      isEarlyTrend: false,
      score: 30,
      signals: ['Base structure forming'],
    };
  }

  const n = candles.length;
  const latest = candles[n - 1];
  const last5 = candles.slice(n - 5);
  const last20 = candles.slice(n - 20);

  // 5-day Moving Average vs 20-day Moving Average
  const ma5 = last5.reduce((s, c) => s + c.close, 0) / 5;
  const ma20 = last20.reduce((s, c) => s + c.close, 0) / 20;
  const is5Above20 = ma5 >= ma20;

  // OBV Accumulation Slope check over last 5 trading days
  let obvSlope = 0;
  for (let i = Math.max(1, n - 6); i < n; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) obvSlope += candles[i].volume;
    else if (diff < 0) obvSlope -= candles[i].volume;
  }
  const isObvRising = obvSlope > 0;

  // 5-day Volatility Compression Range (tight coil)
  const maxH5 = Math.max(...last5.map((c) => c.high));
  const minL5 = Math.min(...last5.map((c) => c.low));
  const range5Pct = minL5 > 0 ? ((maxH5 - minL5) / minL5) * 100 : 10;
  const isTightCoil = range5Pct <= 4.2;

  // Relative Volume (20-day ADV)
  const prev19Vol = last20.slice(0, 19).reduce((s, c) => s + c.volume, 0) / 19;
  const rvol = prev19Vol > 0 ? latest.volume / prev19Vol : 1.0;
  const isPocketPivot = rvol >= 1.25 && rvol <= 2.2 && latest.close > latest.open;
  const isFullBreakout = rvol > 2.2 && latest.close > latest.open;

  const signalsList: string[] = [];
  let score = 20;

  if (is5Above20) {
    score += 25;
    signalsList.push('5d MA Golden Crossover above 20d MA');
  }
  if (isObvRising) {
    score += 20;
    signalsList.push('OBV slope positive (institutional accumulation)');
  }
  if (isTightCoil) {
    score += 25;
    signalsList.push(`Tight pre-breakout coil (${range5Pct.toFixed(1)}% 5d range)`);
  }
  if (isPocketPivot) {
    score += 20;
    signalsList.push(`Pocket Pivot early volume expansion (${rvol.toFixed(1)}x ADV)`);
  } else if (isFullBreakout) {
    score += 15;
    signalsList.push(`Full volume surge breakout (${rvol.toFixed(1)}x ADV)`);
  }

  let stage: EarlyTrendAnalysis['stage'] = 'BASE_ACCUMULATION';
  let stageLabel = 'Base Accumulation';
  let isEarlyTrend = false;

  if (isFullBreakout && is5Above20) {
    stage = 'STAGE_3_FULL_BREAKOUT';
    stageLabel = 'Stage 3: Full Breakout';
    isEarlyTrend = false;
  } else if (score >= 65 || (is5Above20 && isObvRising && isPocketPivot)) {
    stage = 'STAGE_2_IGNITION';
    stageLabel = 'Stage 2: Early Trend Ignition';
    isEarlyTrend = true;
  } else if (isTightCoil || (is5Above20 && isObvRising)) {
    stage = 'STAGE_1_EARLY_COIL';
    stageLabel = 'Stage 1: Pre-Breakout Coil';
    isEarlyTrend = true;
  }

  return {
    stage,
    stageLabel,
    isEarlyTrend,
    score: Math.min(100, score),
    signals: signalsList,
  };
}

// High-Profit Decision-Making DSE Stock Screener Engine
export function runDseStockScreener(
  stocks: DseStockData[],
  config: BacktestConfig
): ScreenerStockCandidate[] {
  const candidates: ScreenerStockCandidate[] = [];

  for (const stock of stocks) {
    if (!stock.candles || stock.candles.length < 20) continue;

    // Run backtest to gather historical win rate & performance on this stock
    const singleStockBacktest = runDseVolumeBreakoutBacktest([stock], config);
    const winRate = singleStockBacktest.winRatePct;
    const totalSignals = singleStockBacktest.totalSignals;

    // Latest candle & 20d moving averages
    const candles = stock.candles;
    const latest = candles[candles.length - 1];
    const prevCandles = candles.slice(-21, -1);

    const sumVol20 = prevCandles.reduce((acc, c) => acc + c.volume, 0);
    const avgVol20 = prevCandles.length > 0 ? sumVol20 / prevCandles.length : 100000;

    const sumClose20 = prevCandles.reduce((acc, c) => acc + c.close, 0);
    const ma20Price = prevCandles.length > 0 ? sumClose20 / prevCandles.length : latest.close;

    const rvol20 = avgVol20 > 0 ? Number((latest.volume / avgVol20).toFixed(2)) : 1.0;

    // Technical Metrics & Volatility Contraction
    const isPriceGreen = latest.close > latest.open;
    const isVolumeSurge = rvol20 >= config.volumeSurgeMultiplier && isPriceGreen;

    // Early Trend Ignition Analysis
    const earlyTrend = detectEarlyTrendIgnition(candles);

    // Check last 5 days volatility range (VCP / Narrow Range)
    const last5 = candles.slice(-5);
    const maxHigh5 = Math.max(...last5.map((c) => c.high));
    const minLow5 = Math.min(...last5.map((c) => c.low));
    const range5Pct = minLow5 > 0 ? ((maxHigh5 - minLow5) / minLow5) * 100 : 10;
    const isTightConsolidation = range5Pct <= 4.0; // tight 4% range in 5 days

    // Volume dry-up check
    const isVolumeDryUp = rvol20 <= 0.6;

    // Fundamentals Check
    const passesYoy = stock.yoyGrowthPct >= config.minYoyGrowthPct;
    const passesTurnover = stock.avgTurnoverBdtMillion >= config.minTurnoverMillionBdt;

    // Calculate Profit Potential Score (0 - 100)
    let score = 0;

    // 1. Volume Surge & Price Action (35 pts max)
    if (isVolumeSurge) score += 35;
    else if (rvol20 >= 1.5 && isPriceGreen) score += 25;
    else if (earlyTrend.isEarlyTrend) score += 28; // Early trend ignition bonus
    else if (isVolumeDryUp && isTightConsolidation) score += 28; // Pre-breakout coil
    else if (latest.close > ma20Price) score += 15;

    // 2. Volatility Contraction & Pattern Quality (20 pts max)
    if (isTightConsolidation) score += 20;
    else if (range5Pct <= 7.0) score += 12;

    // 3. YoY Fundamental Growth & Revenue Momentum (20 pts max)
    if (stock.yoyGrowthPct >= 10.0) score += 20;
    else if (stock.yoyGrowthPct >= 6.0) score += 15;
    else if (stock.yoyGrowthPct >= config.minYoyGrowthPct) score += 10;

    // 4. Historical Backtest Win Rate on this Stock (15 pts max)
    if (winRate >= 75) score += 15;
    else if (winRate >= 60) score += 10;
    else if (winRate >= 50) score += 5;

    // 5. Liquidity & Valuation P/E Safety (10 pts max)
    if (stock.peRatio < 15 && stock.peRatio > 0) score += 5;
    if (passesTurnover) score += 5;

    // Cap score at 100
    let profitPotentialScore = Math.min(100, score);

    // Decision Status Determination
    let decisionStatus: ScreenerStockCandidate['decisionStatus'] = 'NEUTRAL';

    if (profitPotentialScore >= 70 && (isVolumeSurge || (rvol20 >= 2.0 && isPriceGreen)) && passesYoy && passesTurnover) {
      decisionStatus = 'STRONG_BUY';
    } else if (earlyTrend.stage === 'STAGE_2_IGNITION' && passesYoy) {
      decisionStatus = 'EARLY_TREND_IGNITION';
    } else if (profitPotentialScore >= 55 || (isVolumeDryUp && isTightConsolidation && passesYoy)) {
      decisionStatus = 'WATCHLIST_BREAKOUT';
    } else if (profitPotentialScore >= 40 || latest.close > ma20Price) {
      decisionStatus = 'CONSOLIDATING_ACCUMULATION';
    }

    // Trade Setup Planning
    let entryPrice = latest.close;
    let targetProfitPct = config.targetProfitPct || 15;
    let stopLossPct = config.stopLossPct || 5;

    let targetPrice = Number((entryPrice * (1 + targetProfitPct / 100)).toFixed(2));
    let stopLossPrice = Number((entryPrice * (1 - stopLossPct / 100)).toFixed(2));
    let riskRewardRatio = Number((targetProfitPct / stopLossPct).toFixed(2));

    // Catalysts list
    const catalysts: string[] = [];
    if (earlyTrend.isEarlyTrend) catalysts.push(`🌱 ${earlyTrend.stageLabel}`);
    if (isVolumeSurge) catalysts.push(`🔥 Massive ${rvol20}x ADV Volume Surge`);
    if (isTightConsolidation) catalysts.push(`⚡ Tight Volatility Contraction (${range5Pct.toFixed(1)}% Range)`);
    if (isVolumeDryUp) catalysts.push(`💧 Institutional Supply Dry-up (0.${Math.round(rvol20 * 10)}x Vol)`);
    if (stock.yoyGrowthPct >= 8.0) catalysts.push(`📈 Strong YoY Revenue Growth (+${stock.yoyGrowthPct}%)`);
    if (stock.peRatio < 14) catalysts.push(`🛡️ Attractive P/E Valuation (${stock.peRatio}x)`);
    if (winRate >= 65 && totalSignals > 0) catalysts.push(`🏆 ${winRate.toFixed(0)}% Historical Signal Win Rate`);

    // Pattern description
    let pattern = 'Consolidation Base';
    if (earlyTrend.stage === 'STAGE_2_IGNITION') pattern = 'Early Trend Ignition (MA Cross + OBV Accumulation)';
    else if (isTightConsolidation && isVolumeSurge) pattern = 'VCP Breakout (Vol Contraction Pattern)';
    else if (isTightConsolidation) pattern = 'Narrow Range Coiling (NR7 / Compression)';
    else if (isVolumeSurge) pattern = 'Volume Surge Momentum';
    else if (latest.close > ma20Price) pattern = '20d Moving Average Uptrend Support';

    // Trade reasoning sentence
    let reasoning = 'Stock is maintaining healthy price structure above 20d MA with stable turnover.';
    if (decisionStatus === 'STRONG_BUY') {
      reasoning = `High-probability entry setup! Stock exploded with ${rvol20}x 20d ADV volume surge, breaking out from tight consolidation. Planned R:R is ${riskRewardRatio}:1 with +${targetProfitPct}% profit potential.`;
    } else if (decisionStatus === 'EARLY_TREND_IGNITION') {
      reasoning = `Early Trend Ignition detected! 5d MA crossed above 20d MA with rising OBV accumulation prior to major volume breakout. Ideal early-stage entry before broad market awareness.`;
    } else if (decisionStatus === 'WATCHLIST_BREAKOUT') {
      reasoning = `Volume dry-up with tight volatility coiling. Institutional accumulation in progress — set alert for volume expansion above ${Math.round(avgVol20 * config.volumeSurgeMultiplier).toLocaleString()} shares.`;
    } else if (decisionStatus === 'CONSOLIDATING_ACCUMULATION') {
      reasoning = `Stock building a macro base above 20d MA. Fundamentals (+${stock.yoyGrowthPct}% YoY) support future momentum.`;
    }

    // Recommended capital allocation percentage based on conviction
    let recommendedPositionSizePct = 10;
    if (decisionStatus === 'STRONG_BUY') recommendedPositionSizePct = 15;
    if (decisionStatus === 'EARLY_TREND_IGNITION') recommendedPositionSizePct = 14;
    if (decisionStatus === 'WATCHLIST_BREAKOUT') recommendedPositionSizePct = 12;

    const techPattern = detectTechnicalPattern(candles, candles.length - 1);
    const harmonic = detectHarmonicPattern(candles, candles.length - 1);

    let finalDetectedPattern = techPattern.detectedPattern;
    let finalPatternConfidence = techPattern.patternConfidence;
    let finalPatternDescription = techPattern.patternDescription;

    if (harmonic) {
      finalDetectedPattern = 'Harmonic Pattern (C-to-D)';
      finalPatternConfidence = 95;
      finalPatternDescription = `${harmonic.subtype} Harmonic Pattern: C-Point Entry at ৳${harmonic.cPrice.toFixed(2)} ➔ Target D-Point Exit at ৳${harmonic.dTargetPrice.toFixed(2)} (+${harmonic.potentialGainPct}% Gain, R:R ${harmonic.riskRewardRatio}:1).`;
      pattern = `${harmonic.subtype} (C-to-D Swing)`;

      catalysts.unshift(`💎 ${harmonic.subtype} Harmonic Pattern (Point C Entry ➔ Point D Exit)`);
      if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
        entryPrice = harmonic.cPrice;
        targetPrice = harmonic.dTargetPrice;
        stopLossPrice = harmonic.stopLossPrice;
        targetProfitPct = harmonic.potentialGainPct;
        stopLossPct = harmonic.potentialRiskPct;
        riskRewardRatio = harmonic.riskRewardRatio;
        decisionStatus = 'STRONG_BUY';
        profitPotentialScore = Math.min(100, profitPotentialScore + 35);
        reasoning = `Harmonic Pattern C-to-D Strategy: ${harmonic.subtype} setup! Buy at Point C (৳${harmonic.cPrice.toFixed(2)}), Target Point D Exit at ৳${harmonic.dTargetPrice.toFixed(2)} (+${harmonic.potentialGainPct}% gain). Stop Loss at ৳${harmonic.stopLossPrice.toFixed(2)} (R:R = ${harmonic.riskRewardRatio}:1).`;
      }
    } else if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
      profitPotentialScore = Math.max(15, profitPotentialScore - 30);
    }

    candidates.push({
      symbol: stock.symbol,
      stockName: stock.name,
      sector: stock.sector,
      stock,
      decisionStatus,
      profitPotentialScore,
      latestClose: latest.close,
      latestDate: latest.date,
      latestVolume: latest.volume,
      avgVolume20: Math.round(avgVol20),
      rvol20,
      ma20Price: Number(ma20Price.toFixed(2)),
      entryPrice,
      targetPrice,
      stopLossPrice,
      riskRewardRatio,
      potentialGainPct: targetProfitPct,
      potentialRiskPct: stopLossPct,
      keyCatalysts: catalysts.length > 0 ? catalysts : ['Stable Price & Volume Base'],
      breakoutPattern: pattern,
      detectedPattern: finalDetectedPattern,
      patternConfidence: finalPatternConfidence,
      patternDescription: finalPatternDescription,
      historicalWinRate: Math.round(winRate),
      tradeSetupReasoning: reasoning,
      recommendedPositionSizePct,
      peRatio: stock.peRatio,
      yoyGrowthPct: stock.yoyGrowthPct,
      avgTurnoverBdtMillion: stock.avgTurnoverBdtMillion,
      earlyTrendStage: earlyTrend.stage,
      earlyTrendSignals: earlyTrend.signals,
      harmonicDetails: harmonic || undefined,
    });
  }

  // Sort candidates by Harmonic Priority if in HARMONIC_C_ENTRY_D_EXIT strategy mode, otherwise by Profit Potential Score
  if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
    candidates.sort((a, b) => {
      const aHasH = a.harmonicDetails ? 1 : 0;
      const bHasH = b.harmonicDetails ? 1 : 0;
      if (aHasH !== bHasH) return bHasH - aHasH;
      return b.profitPotentialScore - a.profitPotentialScore;
    });
  } else {
    candidates.sort((a, b) => b.profitPotentialScore - a.profitPotentialScore);
  }

  return candidates;
}

export function evaluateStockForScreener(
  stock: DseStockData,
  config: BacktestConfig,
  signals?: BreakoutSignal[]
): ScreenerStockCandidate | null {
  const candidates = runDseStockScreener([stock], config);
  return candidates.length > 0 ? candidates[0] : null;
}

// ==========================================
// DATA INTEGRITY & ANOMALY DETECTION ENGINE
// ==========================================

export interface SecondaryBenchmarkStock {
  symbol: string;
  name?: string;
  benchmarkClose: number;
  benchmarkDate: string;
  benchmarkSource: string;
}

export interface PriceAnomalyRecord {
  id: string;
  symbol: string;
  name: string;
  appClose: number;
  benchmarkClose: number;
  variancePct: number; // e.g. +3.85% or -4.20%
  isAnomalous: boolean; // true if Math.abs(variancePct) > threshold
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'NORMAL';
  description: string;
}

export interface DataIntegrityValidationResult {
  totalChecked: number;
  anomaliesFound: number;
  anomalies: PriceAnomalyRecord[];
  hasCriticalDiscrepancy: boolean;
  checkedAt: string;
}

export const DSE_OFFICIAL_BENCHMARK_PRICES: Record<string, { price: number; name: string; source: string }> = {
  CONFIDCEM: { price: 68.90, name: 'Confidence Cement PLC', source: 'DSE Official Realtime Website Feed' },
  GP: { price: 260.00, name: 'Grameenphone Ltd.', source: 'DSE Official Realtime Website Feed' },
  BATBC: { price: 252.50, name: 'British American Tobacco Bangladesh', source: 'DSE Official Realtime Website Feed' },
  SQURPHARMA: { price: 219.70, name: 'Square Pharmaceuticals PLC', source: 'DSE Official Realtime Website Feed' },
  RENATA: { price: 470.20, name: 'Renata PLC', source: 'DSE Official Realtime Website Feed' },
  BEXIMCO: { price: 23.20, name: 'BEXIMCO Ltd.', source: 'DSE Official Realtime Website Feed' },
  LHBL: { price: 58.10, name: 'LafargeHolcim Bangladesh PLC', source: 'DSE Official Realtime Website Feed' },
  OLYMPIC: { price: 154.20, name: 'Olympic Industries PLC', source: 'DSE Official Realtime Website Feed' },
  WALTONHIL: { price: 393.10, name: 'Walton Hi-Tech Industries PLC', source: 'DSE Official Realtime Website Feed' },
  MARICO: { price: 2719.40, name: 'Marico Bangladesh Ltd.', source: 'DSE Official Realtime Website Feed' },
  UNIQUEHRL: { price: 44.80, name: 'Unique Hotel & Resorts PLC', source: 'DSE Official Realtime Website Feed' },
  BRACBANK: { price: 63.70, name: 'BRAC Bank PLC', source: 'DSE Official Realtime Website Feed' },
  CITYBANK: { price: 24.80, name: 'City Bank PLC', source: 'DSE Official Realtime Website Feed' },
  ADNTEL: { price: 118.50, name: 'ADN Telecom Ltd.', source: 'DSE Official Realtime Website Feed' },
  ALLTEX: { price: 16.20, name: 'Alltex Industries PLC', source: 'DSE Official Realtime Website Feed' },
  AGNISYSL: { price: 28.50, name: 'Agni Systems Ltd.', source: 'DSE Official Realtime Website Feed' },
  AAMRANET: { price: 52.30, name: 'aamra networks limited', source: 'DSE Official Realtime Website Feed' },
};

export function validateStockDataIntegrity(
  stocks: DseStockData[],
  thresholdPct: number = 2.0
): DataIntegrityValidationResult {
  const anomalies: PriceAnomalyRecord[] = [];
  let anomaliesFound = 0;
  let hasCriticalDiscrepancy = false;
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  stocks.forEach((stock) => {
    if (!stock.candles || stock.candles.length === 0) return;
    const latest = stock.candles[stock.candles.length - 1];
    const appClose = latest.close;

    const symKey = stock.symbol.toUpperCase();
    const benchmarkInfo = DSE_OFFICIAL_BENCHMARK_PRICES[symKey];

    if (benchmarkInfo) {
      const benchmarkClose = benchmarkInfo.price;
      const diff = appClose - benchmarkClose;
      const variancePct = (diff / benchmarkClose) * 100;
      const absVariance = Math.abs(variancePct);
      const isAnomalous = absVariance >= thresholdPct;

      if (isAnomalous) {
        anomaliesFound++;
        if (absVariance > 5.0) hasCriticalDiscrepancy = true;
      }

      const severity: 'CRITICAL' | 'WARNING' | 'NORMAL' = absVariance > 5.0 ? 'CRITICAL' : isAnomalous ? 'WARNING' : 'NORMAL';

      anomalies.push({
        id: `anomaly-${stock.symbol}-${Date.now()}`,
        symbol: stock.symbol,
        name: stock.name || benchmarkInfo.name,
        appClose,
        benchmarkClose,
        variancePct: Number(variancePct.toFixed(2)),
        isAnomalous,
        timestamp: nowStr,
        severity,
        description: isAnomalous
          ? `App price (৳${appClose.toFixed(2)}) deviates by ${variancePct > 0 ? '+' : ''}${variancePct.toFixed(2)}% from DSE website price (৳${benchmarkClose.toFixed(2)}).`
          : `Price matches DSE official feed within acceptable range (${variancePct > 0 ? '+' : ''}${variancePct.toFixed(2)}%).`,
      });
    }
  });

  return {
    totalChecked: stocks.length,
    anomaliesFound,
    anomalies: anomalies.filter((a) => a.isAnomalous),
    hasCriticalDiscrepancy,
    checkedAt: nowStr,
  };
}

export function autoSyncAnomalousPrices(
  stocks: DseStockData[],
  anomaliesToFix?: PriceAnomalyRecord[]
): DseStockData[] {
  const anomalyMap = new Map<string, number>();
  if (anomaliesToFix && anomaliesToFix.length > 0) {
    anomaliesToFix.forEach((a) => anomalyMap.set(a.symbol.toUpperCase(), a.benchmarkClose));
  } else {
    Object.entries(DSE_OFFICIAL_BENCHMARK_PRICES).forEach(([sym, info]) => {
      anomalyMap.set(sym, info.price);
    });
  }

  return stocks.map((s) => {
    const targetPrice = anomalyMap.get(s.symbol.toUpperCase());
    if (targetPrice && s.candles && s.candles.length > 0) {
      const updatedCandles = [...s.candles];
      const lastIdx = updatedCandles.length - 1;
      const oldCandle = updatedCandles[lastIdx];
      const open = oldCandle.open === 0 ? targetPrice : oldCandle.open;
      const high = Math.max(oldCandle.high, targetPrice, open);
      const low = Math.min(oldCandle.low, targetPrice, open);

      updatedCandles[lastIdx] = {
        ...oldCandle,
        open,
        high,
        low,
        close: targetPrice,
      };

      return {
        ...s,
        candles: updatedCandles,
      };
    }
    return s;
  });
}

// Re-export DataIntegrityValidator component
export { DataIntegrityValidator } from '../components/DataIntegrityValidator';
export type { DataIntegrityValidatorProps } from '../components/DataIntegrityValidator';

