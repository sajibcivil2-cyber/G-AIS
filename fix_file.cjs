const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

// Fix the CSV check
const target = `      // Skip market/sector index summary lines from tradeable individual stock lists
      if (isSectorOrMarketIndex(rawSym)) {
        continue;
      }`;
      
const replacement = `      // Note: We used to skip sector/market indices here, but now we allow them to be parsed
      // so users can backtest indices and sectors directly.
      // if (isSectorOrMarketIndex(rawSym)) {
      //   continue;
      // }`;
      
file = file.replace(target, replacement);

fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
