import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

const toRemove = [
  /export type IssueSeverity[\s\S]*?(?=export interface ExtractedFile)/,
  /export interface SampleProject[\s\S]*?(?=export interface DseStockCandle)/
];

for (const regex of toRemove) {
  content = content.replace(regex, '');
}

const momentumType = `export interface SectorMomentumStat {
  sector: string;
  momentumPct: number; // % change in aggregate sector volume, recent 5d vs prior 5d
  currentVol: number;
  pastVol: number;
}

export interface ScreenerStockCandidate`;

content = content.replace('export interface ScreenerStockCandidate', momentumType);

const newFields = `  harmonicDetails?: HarmonicPatternDetails;
  edgeSampleSize: number; // how many historical trades back the displayed win rate
  edgeConfidence: 'Low' | 'Medium' | 'High'; // reliability of historicalWinRate given sample size
  sectorMomentumPct?: number; // current sector volume rotation, if available
}`;

content = content.replace(/  harmonicDetails\?: HarmonicPatternDetails;\n}/, newFields);

fs.writeFileSync('src/types.ts', content);
