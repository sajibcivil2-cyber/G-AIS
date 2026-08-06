import fs from 'fs';

let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');
const startMatch = "export function detectHarmonicPattern(";
const endMatch = "export function detectTechnicalPattern(";

const startIndex = content.indexOf(startMatch);
const endIndex = content.indexOf(endMatch);

const newFunction = `export function detectHarmonicPattern(
  candles: DseStockCandle[],
  breakoutIdx?: number
): HarmonicPatternDetails | null {
  if (!candles || candles.length < 25) return null;

  const idx = breakoutIdx !== undefined && breakoutIdx < candles.length ? breakoutIdx : candles.length - 1;
  const lookbackStart = Math.max(0, idx - 60);
  const subset = candles.slice(lookbackStart, idx + 1);
  const len = subset.length;
  if (len < 20) return null;

  // Let's divide into 5 segments to allow for X, A, B, C, D
  const segLength = Math.floor(len / 5);
  const seg1 = subset.slice(0, segLength + 2); // X region
  const seg2 = subset.slice(segLength - 1, 2 * segLength + 2); // A region
  const seg3 = subset.slice(2 * segLength - 1, 3 * segLength + 2); // B region
  const seg4 = subset.slice(3 * segLength - 1, 4 * segLength + 2); // C region
  const seg5 = subset.slice(4 * segLength - 1); // D region (or current)

  // Helper to find min/max
  const findMin = (arr: DseStockCandle[], offset: number) => {
    let min = Infinity, relIdx = 0;
    arr.forEach((c, i) => { if (c.low < min) { min = c.low; relIdx = i; } });
    return { val: min, idx: offset + relIdx, candle: arr[relIdx] };
  };
  const findMax = (arr: DseStockCandle[], offset: number) => {
    let max = -Infinity, relIdx = 0;
    arr.forEach((c, i) => { if (c.high > max) { max = c.high; relIdx = i; } });
    return { val: max, idx: offset + relIdx, candle: arr[relIdx] };
  };

  // ==========================================
  // 1. Bearish Harmonic (W-shape) - Trading C -> D
  // ==========================================
  // X(High), A(Low), B(High), C(Low)
  const xBear = findMax(seg1, lookbackStart);
  const aBear = findMin(seg2, lookbackStart + segLength - 1);
  const bBear = findMax(seg3, lookbackStart + 2 * segLength - 1);
  const cBear = findMin(subset.slice(3 * segLength - 1), lookbackStart + 3 * segLength - 1); // C can be anywhere in the last part

  if (xBear.idx < aBear.idx && aBear.idx < bBear.idx && bBear.idx < cBear.idx) {
    const xaMove = xBear.val - aBear.val;
    const abMove = bBear.val - aBear.val;
    const bcMove = bBear.val - cBear.val;

    if (xaMove > 0 && abMove > 0 && bcMove > 0 && bBear.val < xBear.val && cBear.val > aBear.val) {
      const abXaRatio = Number((abMove / xaMove).toFixed(3));
      const bcAbRatio = Number((bcMove / abMove).toFixed(3));

      if (abXaRatio >= 0.25 && abXaRatio <= 0.88 && bcAbRatio >= 0.25 && bcAbRatio <= 0.95) {
        let subtype = 'Bearish Gartley (C-D Trade)';
        let cdBcMultiplier = 1.272;

        if (abXaRatio >= 0.55 && abXaRatio <= 0.68) { subtype = 'Bearish Gartley'; cdBcMultiplier = 1.272; }
        else if (abXaRatio < 0.55) { subtype = 'Bearish Bat'; cdBcMultiplier = 1.618; }
        else if (abXaRatio >= 0.70 && abXaRatio <= 0.82) { subtype = 'Bearish Butterfly'; cdBcMultiplier = 1.414; }
        else { subtype = 'Bearish Crab'; cdBcMultiplier = 2.000; }

        const entryPrice = cBear.val;
        const dTargetPrice = Number((entryPrice + bcMove * cdBcMultiplier).toFixed(2));
        const cdSpan = dTargetPrice - entryPrice;
        const t1Price = Number((entryPrice + cdSpan * 0.382).toFixed(2));
        const t2Price = Number((entryPrice + cdSpan * 0.618).toFixed(2));
        const stopLossPrice = Number((Math.min(aBear.val, entryPrice) * 0.965).toFixed(2));

        const potentialGainPct = Number((((dTargetPrice - entryPrice) / entryPrice) * 100).toFixed(2));
        const t1GainPct = Number((((t1Price - entryPrice) / entryPrice) * 100).toFixed(2));
        const t2GainPct = Number((((t2Price - entryPrice) / entryPrice) * 100).toFixed(2));
        const potentialRiskPct = Number((((entryPrice - stopLossPrice) / entryPrice) * 100).toFixed(2));
        const riskRewardRatio = Number((potentialGainPct / (potentialRiskPct || 1)).toFixed(2));

        const cdPathLevels = [
          { levelName: 'Point C (Entry)', fibRatio: '0.000', price: entryPrice, gainPct: 0.0, description: 'Primary C-point completion bounce' },
          { levelName: 'Target 1', fibRatio: '0.382 C-D', price: t1Price, gainPct: t1GainPct, description: 'First partial profit' },
          { levelName: 'Target 2', fibRatio: '0.618 C-D', price: t2Price, gainPct: t2GainPct, description: 'Secondary target' },
          { levelName: 'Point D Target', fibRatio: '1.000 PRZ', price: dTargetPrice, gainPct: potentialGainPct, description: 'Final PRZ exit target' },
          { levelName: 'Stop Loss', fibRatio: 'Stop-Loss', price: stopLossPrice, gainPct: -potentialRiskPct, description: 'Hard stop loss' }
        ];

        return {
          subtype,
          patternType: 'BEARISH_C_TO_D',
          xPrice: xBear.val, xDate: xBear.candle.date, xIdx: xBear.idx,
          aPrice: aBear.val, aDate: aBear.candle.date, aIdx: aBear.idx,
          bPrice: bBear.val, bDate: bBear.candle.date, bIdx: bBear.idx,
          cPrice: cBear.val, cDate: cBear.candle.date, cIdx: cBear.idx,
          dTargetPrice, entryPrice, t1Price, t2Price, stopLossPrice,
          abXaRatio, bcAbRatio, cdBcRatio: cdBcMultiplier,
          potentialGainPct, potentialRiskPct, riskRewardRatio, cdPathLevels
        };
      }
    }
  }

  // ==========================================
  // 2. Bullish Harmonic (M-shape) - Trading D Reversal
  // ==========================================
  // X(Low), A(High), B(Low), C(High), D(Low)
  const xBull = findMin(seg1, lookbackStart);
  const aBull = findMax(seg2, lookbackStart + segLength - 1);
  const bBull = findMin(seg3, lookbackStart + 2 * segLength - 1);
  const cBull = findMax(seg4, lookbackStart + 3 * segLength - 1);
  const dbull = findMin(seg5, lookbackStart + 4 * segLength - 1);

  if (xBull.idx < aBull.idx && aBull.idx < bBull.idx && bBull.idx < cBull.idx && cBull.idx < dbull.idx) {
    const xaMove = aBull.val - xBull.val;
    const abMove = aBull.val - bBull.val;
    const bcMove = cBull.val - bBull.val;
    const cdMove = cBull.val - dbull.val;

    if (xaMove > 0 && abMove > 0 && bcMove > 0 && cdMove > 0 && bBull.val > xBull.val && cBull.val < aBull.val) {
      const abXaRatio = Number((abMove / xaMove).toFixed(3));
      const bcAbRatio = Number((bcMove / abMove).toFixed(3));
      const cdBcRatio = Number((cdMove / bcMove).toFixed(3));

      if (abXaRatio >= 0.25 && abXaRatio <= 0.88 && bcAbRatio >= 0.25 && bcAbRatio <= 0.95 && cdBcRatio >= 1.13) {
        let subtype = 'Bullish Gartley';
        if (abXaRatio < 0.55) subtype = 'Bullish Bat';
        else if (abXaRatio >= 0.70 && abXaRatio <= 0.82) subtype = 'Bullish Butterfly';
        else if (abXaRatio > 0.82) subtype = 'Bullish Crab';

        const entryPrice = dbull.val;
        const dTargetPrice = cBull.val; // First major target is C
        const cdSpan = cBull.val - dbull.val;
        const adSpan = aBull.val - dbull.val;
        const t1Price = Number((entryPrice + cdSpan * 0.382).toFixed(2));
        const t2Price = Number((entryPrice + adSpan * 0.618).toFixed(2));
        const stopLossPrice = Number((entryPrice * 0.965).toFixed(2));

        const potentialGainPct = Number((((dTargetPrice - entryPrice) / entryPrice) * 100).toFixed(2));
        const t1GainPct = Number((((t1Price - entryPrice) / entryPrice) * 100).toFixed(2));
        const t2GainPct = Number((((t2Price - entryPrice) / entryPrice) * 100).toFixed(2));
        const potentialRiskPct = Number((((entryPrice - stopLossPrice) / entryPrice) * 100).toFixed(2));
        const riskRewardRatio = Number((potentialGainPct / (potentialRiskPct || 1)).toFixed(2));

        const cdPathLevels = [
          { levelName: 'Point D (PRZ Entry)', fibRatio: '0.000', price: entryPrice, gainPct: 0.0, description: 'Reversal entry at PRZ' },
          { levelName: 'Target 1', fibRatio: '0.382 C-D', price: t1Price, gainPct: t1GainPct, description: 'First partial profit' },
          { levelName: 'Target 2', fibRatio: '0.618 A-D', price: t2Price, gainPct: t2GainPct, description: 'Secondary target' },
          { levelName: 'Point C Target', fibRatio: '1.000 C-D', price: dTargetPrice, gainPct: potentialGainPct, description: 'Major resistance target' },
          { levelName: 'Stop Loss', fibRatio: 'Stop-Loss', price: stopLossPrice, gainPct: -potentialRiskPct, description: 'Hard stop loss' }
        ];

        return {
          subtype,
          patternType: 'BULLISH_D_REVERSAL',
          xPrice: xBull.val, xDate: xBull.candle.date, xIdx: xBull.idx,
          aPrice: aBull.val, aDate: aBull.candle.date, aIdx: aBull.idx,
          bPrice: bBull.val, bDate: bBull.candle.date, bIdx: bBull.idx,
          cPrice: cBull.val, cDate: cBull.candle.date, cIdx: cBull.idx,
          dPrice: dbull.val, dDate: dbull.candle.date, dIdx: dbull.idx,
          dTargetPrice, entryPrice, t1Price, t2Price, stopLossPrice,
          abXaRatio, bcAbRatio, cdBcRatio,
          potentialGainPct, potentialRiskPct, riskRewardRatio, cdPathLevels
        };
      }
    }
  }

  return null;
}
`;

content = content.substring(0, startIndex) + newFunction + content.substring(endIndex);
fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
