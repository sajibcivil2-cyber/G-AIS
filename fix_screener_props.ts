import fs from 'fs';
let content = fs.readFileSync('src/components/DseStockScreener.tsx', 'utf8');

const oldBlock = `          // Rule 2: Extended Single Day Candle Chasing (> 5.5% single candle)
          if (c.priceIncreasePct > 5.5) return false;
          // Rule 3: Thin Liquidity Drag (< 15M BDT daily turnover)
          if (c.avgVolume20 * c.currentPrice < 15000000) return false;`;

const newBlock = `          // Rule 2: Extended Single Day Candle Chasing (> 5.5% single candle)
          const priceIncreasePct = c.stock.candles.length > 1 ? ((c.latestClose - c.stock.candles[c.stock.candles.length - 2].close) / c.stock.candles[c.stock.candles.length - 2].close) * 100 : 0;
          if (priceIncreasePct > 5.5) return false;
          // Rule 3: Thin Liquidity Drag (< 15M BDT daily turnover)
          if (c.avgVolume20 * c.latestClose < 15000000) return false;`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/DseStockScreener.tsx', content);
