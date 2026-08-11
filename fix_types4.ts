import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

const regex = /  earlyTrendSignals\?: string\[\];\n\}/;
const newFields = `  earlyTrendSignals?: string[];
  harmonicDetails?: HarmonicPatternDetails;
  edgeSampleSize?: number;
  edgeConfidence?: 'Low' | 'Medium' | 'High';
  sectorMomentumPct?: number;
}`;

content = content.replace(regex, newFields);

fs.writeFileSync('src/types.ts', content);
