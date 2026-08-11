import fs from 'fs';

let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

// The original issue: We have a huge old Edge calculation block remaining because update_engine2.ts regex missed it.
const startStr = `    let patternEdgeBonus = 0;
    let edgeSampleSize = 0;
    let edgeConfidence: 'Low' | 'Medium' | 'High' | undefined = undefined;`;
const endStr = `    // Trade reasoning sentence
    let reasoning = 'Stock is maintaining healthy price structure above 20d MA with stable turnover.';`;

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
  console.log("Removed duplicate Edge calculation block");
}

fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
