import fs from 'fs';
let content = fs.readFileSync('src/components/DseStockScreener.tsx', 'utf8');

const oldBlock = `                      {/* Post-Mortem Fail-Safe Tag */}
                      {candidate.rvol20 >= 2.5 && candidate.priceIncreasePct <= 5.5 ? (`;

const newBlock = `                      {/* Post-Mortem Fail-Safe Tag */}
                      {candidate.rvol20 >= 2.5 && (candidate.stock.candles.length > 1 ? ((candidate.latestClose - candidate.stock.candles[candidate.stock.candles.length - 2].close) / (candidate.stock.candles[candidate.stock.candles.length - 2].close || 1)) * 100 : 0) <= 5.5 ? (`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/DseStockScreener.tsx', content);
