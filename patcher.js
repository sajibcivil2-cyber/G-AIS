const fs = require('fs');

function applyDiff(filename, oldText, newText) {
  let content = fs.readFileSync(filename, 'utf8');
  if (content.includes(oldText)) {
    content = content.replace(oldText, newText);
    fs.writeFileSync(filename, content);
    console.log("Applied to " + filename);
  } else {
    console.log("Could not find old text in " + filename);
  }
}

let old1 = `  // Sector Momentum logic
  const isSectorRotating = computeSectorMomentum(stocks, stock.sector, 5); // 5-day lookback for sector momentum
  if (isSectorRotating) {`;

let new1 = `// Aggregate 5d-vs-prior-5d volume momentum per sector across the active pool. Used to
// reward candidates sitting in a sector where money is currently rotating in — an "early
// move" is far more credible when the whole sector is waking up, not just one ticker.
export function computeSectorMomentum(stocks: DseStockData[]): Record<string, SectorMomentumStat> {
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
}`;

// I'll just write a script to completely reconstruct `src/utils/dseBacktestEngine.ts` where necessary, or actually wait, since `patch` failed, let's just do it directly.
