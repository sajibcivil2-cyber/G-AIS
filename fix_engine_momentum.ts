import fs from 'fs';
let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

const regex = /\/\/ Sector Momentum logic[\s\S]*?\} \/\/ 5-day lookback for sector momentum/m;
const regex2 = /\/\/ Sector Momentum logic[\s\S]*?\}\n\s*if \(edgeStats && edgeStats.length > 0\) \{/;

content = content.replace(/\/\/ Sector Momentum logic[\s\S]*?\}\n\s*if \(edgeStats && edgeStats\.length > 0\) \{/, "if (edgeStats && edgeStats.length > 0) {");

fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
