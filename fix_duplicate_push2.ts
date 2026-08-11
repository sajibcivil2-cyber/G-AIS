import fs from 'fs';

let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

const regex = /      edgeSampleSize: edgeSampleSize > 0 \? edgeSampleSize : undefined,\n      edgeConfidence,\n      tradeSetupReasoning: reasoning,\n      recommendedPositionSizePct,\n      peRatio: stock\.peRatio,\n      yoyGrowthPct: stock\.yoyGrowthPct,\n      avgTurnoverBdtMillion: stock\.avgTurnoverBdtMillion,\n      earlyTrendStage: earlyTrend\.stage,\n      earlyTrendSignals: earlyTrend\.signals,\n      harmonicDetails: harmonic \|\| undefined,\n      edgeSampleSize,\n      edgeConfidence,\n      sectorMomentumPct,\n    \}\);/;

content = content.replace(regex, `      edgeSampleSize: edgeSampleSize > 0 ? edgeSampleSize : 0,
      edgeConfidence,
      tradeSetupReasoning: reasoning,
      recommendedPositionSizePct,
      peRatio: stock.peRatio,
      yoyGrowthPct: stock.yoyGrowthPct,
      avgTurnoverBdtMillion: stock.avgTurnoverBdtMillion,
      earlyTrendStage: earlyTrend.stage,
      earlyTrendSignals: earlyTrend.signals,
      harmonicDetails: harmonic || undefined,
      sectorMomentumPct,
    });`);

fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
