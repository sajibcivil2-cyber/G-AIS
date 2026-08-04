import { parseCustomDseStockFiles } from './src/utils/dseBacktestEngine';
const csv = `01_Bank,20260309,15.25,15.97,15.00,15.80,1508810
03_Ceramic_Sector,20260309,39.50,40.44,38.00,39.84,477291`;
const parsed = parseCustomDseStockFiles(csv, 'test.csv');
console.log(parsed.map(p => p.symbol + " -> " + p.sector));
