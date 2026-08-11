import fs from 'fs';

let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

// 1. imports
content = content.replace(/StopLossFailurePattern\n\} from '\.\.\/types';/, "StopLossFailurePattern,\n  SectorMomentumStat\n} from '../types';");

// 2. remove old computeSectorMomentum
const oldCompute = /export function computeSectorMomentum[\s\S]*?return \(rotatingCount \/ sectorStocks\.length\) >= 0\.4;\n\}/;
content = content.replace(oldCompute, '');

// 3. new computeSectorMomentum and MIN_RELIABLE_SAMPLE
const newCompute = `export function computeSectorMomentum(stocks: DseStockData[]): Record<string, SectorMomentumStat> {
  const raw = new Map<string, { currentVol: number; pastVol: number }>();

  stocks.forEach((s) => {
    if (!s.sector || !s.candles || s.candles.length < 10) return;
    const len = s.candles.length;
    const recent = s.candles.slice(len - 5);
    const past = s.candles.slice(len - 10, len - 5);
    const currentVol = recent.reduce((sum, c) => sum + c.volume, 0);
    const pastVol = past.reduce((sum, c) => sum + c.volume, 0);

    if (!raw.has(s.sector)) raw.set(s.sector, { currentVol: 0, pastVol: 0 });
    const cur = raw.get(s.sector)!;
    cur.currentVol += currentVol;
    cur.pastVol += pastVol;
  });

  const result: Record<string, SectorMomentumStat> = {};
  raw.forEach((data, sector) => {
    const momentumPct = data.pastVol > 0 ? ((data.currentVol - data.pastVol) / data.pastVol) * 100 : 0;
    result[sector] = { sector, momentumPct: Number(momentumPct.toFixed(1)), currentVol: data.currentVol, pastVol: data.pastVol };
  });
  return result;
}

const MIN_RELIABLE_SAMPLE = 3;

function edgeConfidenceFromSampleSize(n: number): 'Low' | 'Medium' | 'High' {
  if (n >= 10) return 'High';
  if (n >= MIN_RELIABLE_SAMPLE) return 'Medium';
  return 'Low';
}

export function runDseStockScreener`;

content = content.replace('export function runDseStockScreener', newCompute);

// 4. Update signature of runDseStockScreener
content = content.replace(/edgeStats\?: PatternEdgeStat\[\]\n\): ScreenerStockCandidate\[\]/, "edgeStats?: PatternEdgeStat[],\n  sectorMomentum?: Record<string, SectorMomentumStat>\n): ScreenerStockCandidate[]");

// 5. detect canonical pattern early
const oldPatternCheck = /    const techPattern = detectTechnicalPattern\(candles, candles\.length - 1\);\n    const harmonic = detectHarmonicPattern\(candles, candles\.length - 1\);\n\n    let finalDetectedPattern = techPattern\.detectedPattern;/;
content = content.replace(oldPatternCheck, '    let finalDetectedPattern = techPattern.detectedPattern;');

const newCanonical = `    // Early Trend Ignition Analysis
    const earlyTrend = detectEarlyTrendIgnition(candles);

    const techPattern = detectTechnicalPattern(candles, candles.length - 1);
    const harmonic = detectHarmonicPattern(candles, candles.length - 1);
    const canonicalPattern: TechnicalPatternType = harmonic
      ? 'Harmonic Pattern (C-to-D)'
      : techPattern.detectedPattern;`;

content = content.replace(/    \/\/ Early Trend Ignition Analysis\n    const earlyTrend = detectEarlyTrendIgnition\(candles\);/, newCanonical);

fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
