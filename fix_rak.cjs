const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');
file = file.replace(/RAK\|SHIN/g, "\\\\bRAK\\\\b|RAKCERAMIC|\\\\bSHIN\\\\b|SHINECPA");
fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
