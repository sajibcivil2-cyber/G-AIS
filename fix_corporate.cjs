const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');
file = file.replace(/return 'Miscellaneous';/g, "if (/BOND|DEBENTURE/i.test(target)) return 'Corporate Bond';\n  return 'Miscellaneous';");
fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
