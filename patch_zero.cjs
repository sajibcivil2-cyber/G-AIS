const fs = require('fs');
let code = fs.readFileSync('src/utils/databaseStorage.ts', 'utf-8');
const oldCode = `  for (let i = 0; i < sorted.length; i++) {
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

const newCode = `  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    
    // Completely drop candles with 0 or negative prices to avoid math errors and corruption
    if (c.close <= 0 || c.open <= 0) {
      wasRepaired = true;
      continue;
    }

    if (lastGoodClose !== null) {
      const movePct = Math.abs((c.close - lastGoodClose) / lastGoodClose) * 100;
      if (movePct > MAX_PLAUSIBLE_DAILY_MOVE_PCT) {
        // Suspicious candle. Check if it's an isolated spike or a permanent shift (e.g. split).
        // Find the next non-zero candle to check for reversion
        let nextValidC = null;
        for (let j = i + 1; j < sorted.length; j++) {
          if (sorted[j].close > 0) {
            nextValidC = sorted[j];
            break;
          }
        }

        if (nextValidC) {
          const revertPct = Math.abs((nextValidC.close - lastGoodClose) / lastGoodClose) * 100;
          if (revertPct <= MAX_PLAUSIBLE_DAILY_MOVE_PCT) {
            // The next valid candle reverts back to the old price level. 
            // This means the current candle is an isolated spike (glitch).
            wasRepaired = true;
            continue;
          }
        } else {
          // Last valid candle in the dataset has a massive jump. Likely a glitch, drop it.
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
