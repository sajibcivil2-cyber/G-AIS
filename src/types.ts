export type IssueSeverity = 'High' | 'Medium' | 'Low';

export type IssueCategory =
  | 'Architecture'
  | 'AntiPattern'
  | 'Performance'
  | 'Accessibility'
  | 'Security'
  | 'OutputQuality';

export interface AuditIssue {
  id: string;
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  file?: string;
  lineNumber?: number;
  description: string;
  recommendation: string;
  suggestedFix?: string;
}

export interface MetricScores {
  architecture: number;
  antiPattern: number;
  performance: number;
  accessibility: number;
  security: number;
  outputQuality: number;
}

export interface AuditResult {
  overallScore: number;
  overallGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  scores: MetricScores;
  strengths: string[];
  issues: AuditIssue[];
  actionableFixes: string[];
  analyzedAt: string;
}

export interface ExtractedFile {
  path: string;
  name: string;
  size: number;
  extension: string;
  content: string;
  isBinary: boolean;
}

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  badge: string;
  files: ExtractedFile[];
}

export interface DseStockCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DseStockData {
  symbol: string;
  name: string;
  sector: string;
  yoyGrowthPct: number;
  peRatio: number;
  avgTurnoverBdtMillion: number;
  candles: DseStockCandle[];
}

export interface BacktestConfig {
  minYoyGrowthPct: number; // e.g. 3% - 8% (realistic for DSE)
  volumeSurgeMultiplier: number; // e.g. 2.5x ADV
  microConsolidationDays: number; // 3 - 7 days tight range
  macroBaseDays: number; // 20 - 60 days base formation
  stopLossPct: number; // e.g. 5%
  targetProfitPct: number; // e.g. 15%
  minTurnoverMillionBdt: number; // e.g. 20 BDT million
}

export type TechnicalPatternType =
  | 'Bullish Flag'
  | 'Double Bottom'
  | 'Cup & Handle'
  | 'Ascending Triangle'
  | 'VCP Compression'
  | 'Box Range Consolidation';

export interface BreakoutSignal {
  symbol: string;
  stockName: string;
  sector: string;
  breakoutDate: string;
  breakoutPrice: number;
  breakoutVolume: number;
  avgVolume20: number;
  priceIncreasePct: number;
  volumeMultiplier: number;
  microPattern: 'VCP Compression' | 'Narrow Range (NR7)' | 'Dry-up Spike' | 'Resistance Retest';
  macroPattern: 'Cup & Handle' | 'Ascending Triangle' | 'Multi-Week Box' | '50/200 EMA Golden Cross';
  detectedPattern: TechnicalPatternType;
  patternConfidence: number; // e.g. 85 - 98 (%)
  patternDescription: string;
  forward5dPct: number;
  forward10dPct: number;
  forward20dPct: number;
  forward60dPct: number;
  peakReturnPct: number;
  maxDrawdownPct: number;
  status: 'Target Hit' | 'Stop Loss Hit' | 'In Progress';
  realizedGainPct: number;
  riskRewardRatio: number; // Planned Target:Stop ratio (e.g. 3.0 = 3.00:1)
  realizedRiskRewardRatio: number; // Historical Peak Return / Max Drawdown ratio
}

export interface BacktestSummary {
  totalSignals: number;
  winningSignals: number;
  losingSignals: number;
  winRatePct: number;
  avgGainPct: number;
  avgLossPct: number;
  profitFactor: number;
  avgRiskRewardRatio: number;
  avgRealizedRiskRewardRatio: number;
  avgHoldDays: number;
  bestTrade: BreakoutSignal | null;
  worstTrade: BreakoutSignal | null;
  signals: BreakoutSignal[];
}

export type ScreenerDecisionStatus = 'STRONG_BUY' | 'WATCHLIST_BREAKOUT' | 'CONSOLIDATING_ACCUMULATION' | 'NEUTRAL';

export interface ScreenerStockCandidate {
  symbol: string;
  stockName: string;
  sector: string;
  stock: DseStockData;
  decisionStatus: ScreenerDecisionStatus;
  profitPotentialScore: number; // 0 - 100 score
  latestClose: number;
  latestDate: string;
  latestVolume: number;
  avgVolume20: number;
  rvol20: number; // Volume / 20d MA Volume
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
}

