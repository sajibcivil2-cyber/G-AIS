const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

file = file.replace(/if \(isSectorOrMarketIndex\(rawSym\)\) \{\ncontinue;\n      \}/, "// sector parsing allowed");

fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
