const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');
file = file.replace(/GRAMEEN2\|GRAMEENS2: 'Mutual Funds'/g, "GRAMEEN2: 'Mutual Funds'");
fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
