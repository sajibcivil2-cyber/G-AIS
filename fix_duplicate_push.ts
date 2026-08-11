import fs from 'fs';

let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

const regex = /      earlyTrendSignals: earlyTrend\.signals,\n      harmonicDetails: harmonic \|\| undefined,\n      edgeSampleSize,\n      edgeConfidence,\n      sectorMomentumPct,\n      edgeSampleSize:\s*edgeSampleSize > 0 \? edgeSampleSize : undefined,\n      edgeConfidence,\n      sectorMomentumPct,\n    \}\);/;

content = content.replace(regex, `      earlyTrendSignals: earlyTrend.signals,
      harmonicDetails: harmonic || undefined,
      edgeSampleSize: edgeSampleSize > 0 ? edgeSampleSize : 0,
      edgeConfidence,
      sectorMomentumPct,
    });`);

fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
