import { parseCustomDseStockFiles } from './src/utils/dseBacktestEngine';
const csv = `01_Bank,20260309,15.25,15.97,15.00,15.80,1508810
03_Ceramic_Sector,20260309,39.50,40.44,38.00,39.84,477291
04_Corporate_Bond,20260309,150846.22,150846.36,150846.22,150846.36,1414
02_Cement,20260309,68.03,69.60,65.72,67.25,46024
05_Engineering,20260309,72.58,75.65,72.07,74.85,261412
06_Financial_Institution,20260309,11.69,12.19,11.47,12.03,868604`;

console.log(parseCustomDseStockFiles(csv, 'test.csv').length);
