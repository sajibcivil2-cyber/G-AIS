const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

if (!file.includes("SONALIANSH: 'Jute'")) {
  file = file.replace(/export const DSE_SECTOR_MAP: Record<string, string> = {/, 
`export const DSE_SECTOR_MAP: Record<string, string> = {
  // Jute
  SONALIANSH: 'Jute',
  NORTHERN: 'Jute',
  JUTESPINN: 'Jute',
`);
}

if (!file.includes("/JUTE|SONALIANSH|NORTHERN|JUTESPINN/i.test(target)")) {
  file = file.replace(/if \(\/BOND\|DEBENTURE\/i.test\(target\)\) return 'Corporate Bond';/, 
`if (/JUTE|SONALIANSH|NORTHERN|JUTESPINN/i.test(target)) return 'Jute';
  if (/BOND|DEBENTURE/i.test(target)) return 'Corporate Bond';`);
}

fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
