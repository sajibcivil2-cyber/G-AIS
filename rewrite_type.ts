import fs from 'fs';

let content = fs.readFileSync('src/types.ts', 'utf8');

const regex = /export interface ScreenerStockCandidate \{[\s\S]*?\}\n/;

const newType = `export interface ScreenerStockCandidate {
  symbol: string;
  stockName: string;
  sector: string;
  stock: DseStockData;
  decisionStatus: ScreenerDecisionStatus;
  profitPotentialScore: number;
  latestClose: number;
  latestDate: string;
  latestVolume: number;
  avgVolume20: number;
  rvol20: number;
  ma20Price: number;
  entryPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  riskRewardRatio: number;
  potentialGainPct: number;
  potentialRiskPct: number;
  keyCatalysts: string[];
  breakoutPattern: string;
  detectedPattern: TechnicalPatternType;
  patternConfidence: number;
  patternDescription: string;
  historicalWinRate: number;
  tradeSetupReasoning: string;
  recommendedPositionSizePct: number;
  peRatio: number;
  yoyGrowthPct: number;
  avgTurnoverBdtMillion: number;
  earlyTrendStage?: 'STAGE_1_EARLY_COIL' | 'STAGE_2_IGNITION' | 'STAGE_3_FULL_BREAKOUT' | 'BASE_ACCUMULATION';
  earlyTrendSignals?: string[];
  harmonicDetails?: HarmonicPatternDetails;
  edgeSampleSize?: number;
  edgeConfidence?: 'Low' | 'Medium' | 'High';
  sectorMomentumPct?: number;
}
`;

content = content.replace(regex, newType);
fs.writeFileSync('src/types.ts', content);
