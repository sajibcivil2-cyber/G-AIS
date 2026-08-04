const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

file = file.replace(/if \(\/INSUR\/i\.test\(stripped\)\) return 'Insurance General';/g, 
  "if (/INSURANCE.*LIFE/i.test(stripped)) return 'Insurance Life';\n    if (/INSUR/i.test(stripped)) return 'Insurance General';");

file = file.replace(/if \(\/JUTE\/i\.test\(stripped\)\) return 'Jute';/g, 
  "if (/JUTE/i.test(stripped)) return 'Jute';\n    if (/BOND|DEBENTURE/i.test(stripped)) return 'Corporate Bond';\n    if (/MISC/i.test(stripped)) return 'Miscellaneous';");

fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
