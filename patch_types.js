import fs from 'fs';
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(/subtype: 'Bullish Gartley' \\|[^;]+;/, "subtype: string;\n  patternType: 'BEARISH_C_TO_D' | 'BULLISH_D_REVERSAL';");
code = code.replace(/cPrice: number; \/\/ Point C \\(Entry Price\\)/, "cPrice: number;");
code = code.replace(/dTargetPrice: number; \/\/ Point D \\(Exit Target Price - 1.000 PRZ\\)/, "dTargetPrice: number;\n  dPrice?: number;\n  dIdx?: number;\n  entryPrice: number;");

fs.writeFileSync('src/types.ts', code);
