export type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

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

export interface HarmonicPathLevel {
  levelName: string;
  fibRatio: string;
  price: number;
  gainPct: number;
  description: string;
}

export interface HarmonicPatternDetails {
  subtype: string;
  patternType: 'BEARISH_C_TO_D' | 'BULLISH_D_REVERSAL';
  xPrice: number;
  xDate: string;
  xIdx: number;
  aPrice: number;
  aDate: string;
  aIdx: number;
  bPrice: number;
  bDate: string;
  bIdx: number;
  cPrice: number;
  cDate: string;
  cIdx: number;
  dPrice?: number;
  dDate?: string;
  dIdx?: number;
  dTargetPrice: number;
  entryPrice: number;
  t1Price: number; 
  t2Price: number; 
  stopLossPrice: number;
  abXaRatio: number; 
  bcAbRatio: number; 
  cdBcRatio: number; 
  potentialGainPct: number;
  potentialRiskPct: number;
  riskRewardRatio: number;
  cdPathLevels: HarmonicPathLevel[];
}

export interface BacktestConfig {
  minYoyGrowthPct: number; // e.g. 3% - 8% (realistic for DSE)
  volumeSurgeMultiplier: number; // e.g. 2.5x ADV
  microConsolidationDays: number; // 3 - 7 days tight range
  macroBaseDays: number; // 20 - 60 days base formation
  stopLossPct: number; // e.g. 5%
  targetProfitPct: number; // e.g. 15%
  minTurnoverMillionBdt: number; // e.g. 20 BDT million
  strategyType?: 'VOLUME_BREAKOUT' | 'HARMONIC_C_ENTRY_D_EXIT';
}

export type TechnicalPatternType =
  | 'Bullish Flag'
  | 'Double Bottom'
  | 'Cup & Handle'
  | 'Ascending Triangle'
  | 'VCP Compression'
  | 'Harmonic Pattern (C-to-D)'
  | 'Harmonic Pattern (D-Reversal)'
  | 'Box Range Consolidation'
  | 'Inverse Head & Shoulders'
  | 'Falling Wedge Breakout'
  | 'Rounding Bottom'
  | 'MA 10/20/30 Crossover'
  | 'Bullish Pennant'
  | 'Symmetrical Triangle';

export interface EdgeStat {
  count: number;
  wins: number;
  winRate: number;
  avgReturn: number;
}

export interface StockEdgeStat extends EdgeStat {
  symbol: string;
}

export interface SectorEdgeStat extends EdgeStat {
  sector: string;
  stocks: string[];
}

export interface PatternEdgeStat extends EdgeStat {
  pattern: string;
  sectorEdges: SectorEdgeStat[];
  stockEdges: StockEdgeStat[];
}

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
  macroPattern: 'Cup & Handle' | 'Ascending Triangle' | 'Multi-Week Box' | '50/200 EMA Golden Cross' | 'Harmonic XABCD Pattern';
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
  harmonicDetails?: HarmonicPatternDetails;
}

export type TradeRecord = BreakoutSignal;

export interface StopLossFailurePattern {
  id: string;
  name: string;
  category: 'Volume Exhaustion' | 'Extended Overbought' | 'Overhead Resistance' | 'Wide Volatile Base' | 'Low Turnover Liquidity' | 'Market Sector Drag';
  count: number;
  percentage: number;
  avgLossPct: number;
  keyIndicators: string[];
  repetitionReasoning: string;
  mitigationRule: string;
  affectedSymbols: string[];
}

export interface StopLossPostMortemReport {
  totalStopLossHits: number;
  totalStopLossPct: number;
  avgLossPct: number;
  worstStopLossTrade: BreakoutSignal | null;
  failurePatterns: StopLossFailurePattern[];
  sectorFailureBreakdown: Array<{ sector: string; count: number; percentage: number }>;
  patternFailureBreakdown: Array<{ pattern: string; count: number; percentage: number }>;
  keyTakeaways: string[];
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
  stopLossReport?: StopLossPostMortemReport;
}

export type ScreenerDecisionStatus = 'STRONG_BUY' | 'EARLY_TREND_IGNITION' | 'WATCHLIST_BREAKOUT' | 'CONSOLIDATING_ACCUMULATION' | 'NEUTRAL';

export interface EarlyTrendAnalysis {
  stage: 'STAGE_1_EARLY_COIL' | 'STAGE_2_IGNITION' | 'STAGE_3_FULL_BREAKOUT' | 'BASE_ACCUMULATION';
  stageLabel: string;
  isEarlyTrend: boolean;
  score: number;
  signals: string[];
}

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
  earlyTrendStage?: 'STAGE_1_EARLY_COIL' | 'STAGE_2_IGNITION' | 'STAGE_3_FULL_BREAKOUT' | 'BASE_ACCUMULATION';
  earlyTrendSignals?: string[];
  harmonicDetails?: HarmonicPatternDetails;
}

