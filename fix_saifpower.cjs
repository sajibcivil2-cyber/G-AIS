const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

// Fix SAIFPOWER in DSE_SECTOR_MAP
file = file.replace(/  SAIFPOWER: 'Engineering',\n/, '');
if (!file.includes("SAIFPOWER: 'Services & Real Estate'")) {
  file = file.replace(/  SAMORITA: 'Services & Real Estate',/, "  SAMORITA: 'Services & Real Estate',\n  SAIFPOWER: 'Services & Real Estate',");
}

// Fix SAIFPOWER in heuristics
file = file.replace(/\|SAIFPOWER/, '');
file = file.replace(/\|SERVI\/i/, "|SERVI|SAIFPOWER/i");

fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
