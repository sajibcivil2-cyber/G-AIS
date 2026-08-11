const fs = require('fs');
let code = fs.readFileSync('src/utils/databaseStorage.ts', 'utf-8');
const oldCode = `  // 3. Walk chronologically, dropping candles with implausible jumps vs. last good candle.
  //    This repairs corruption locally instead of nuking the whole series.
  const repaired: DseStockCandle[] = [];
  let lastGoodClose: number | null = null;

  for (const c of sorted) {
    if (lastGoodClose !== null) {
      const movePct = Math.abs((c.close - lastGoodClose) / lastGoodClose) * 100;
      if (movePct > MAX_PLAUSIBLE_DAILY_MOVE_PCT) {
        // Suspicious candle — drop it, keep scanning against the last known-good price
        // rather than aborting the whole series.
        wasRepaired = true;
        continue;
      }
    }
    repaired.push(c);
    lastGoodClose = c.close;
  }`;

const newCode = `  // 3. Walk chronologically, dropping candles with implausible jumps vs. last good candle.
  //    This repairs corruption locally instead of nuking the whole series.
  const repaired: DseStockCandle[] = [];
  let lastGoodClose: number | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    if (lastGoodClose !== null) {
      const movePct = Math.abs((c.close - lastGoodClose) / lastGoodClose) * 100;
      if (movePct > MAX_PLAUSIBLE_DAILY_MOVE_PCT) {
        // Suspicious candle. Check if it's an isolated spike or a permanent shift (e.g. split).
        const nextC = sorted[i + 1];
        if (nextC) {
          const revertPct = Math.abs((nextC.close - lastGoodClose) / lastGoodClose) * 100;
          if (revertPct <= MAX_PLAUSIBLE_DAILY_MOVE_PCT) {
            // The next candle reverts back to the old price level. 
            // This means the current candle is an isolated spike (glitch).
            wasRepaired = true;
            continue;
          }
        } else {
          // Last candle in the dataset has a massive jump. Likely a glitch, drop it.
          wasRepaired = true;
          continue;
        }
      }
    }
    repaired.push(c);
    lastGoodClose = c.close;
  }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/utils/databaseStorage.ts', code);
