import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

const regex = /  harmonicDetails\?: HarmonicPatternDetails;\n  edgeSampleSize: number; \/\/ how many historical trades back the displayed win rate\n  edgeConfidence: 'Low' \| 'Medium' \| 'High'; \/\/ reliability of historicalWinRate given sample size\n  sectorMomentumPct\?: number; \/\/ current sector volume rotation, if available\n}/;

content = content.replace(regex, "  harmonicDetails?: HarmonicPatternDetails;\n}");

fs.writeFileSync('src/types.ts', content);
