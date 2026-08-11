import fs from 'fs';

let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

// 6. Update scoring
const oldScoring = /    \/\/ 4\. Historical Backtest Win Rate on this Stock \(15 pts max\)\n    if \(winRate >= 75\) score \+= 15;\n    else if \(winRate >= 60\) score \+= 10;\n    else if \(winRate >= 50\) score \+= 5;\n\n    \/\/ 5\. Liquidity & Valuation P\/E Safety \(10 pts max\)\n    if \(stock\.peRatio < 15 && stock\.peRatio > 0\) score \+= 5;\n    if \(passesTurnover\) score \+= 5;/;

const newScoring = `    // 4. Historical Backtest Win Rate on this Stock (15 pts max)
    const hasReliableOwnHistory = totalSignals >= MIN_RELIABLE_SAMPLE;
    if (hasReliableOwnHistory) {
      if (winRate >= 75) score += 15;
      else if (winRate >= 60) score += 10;
      else if (winRate >= 50) score += 5;
    }

    // 5. Liquidity & Valuation P/E Safety (10 pts max)
    if (stock.peRatio < 15 && stock.peRatio > 0) score += 5;
    if (passesTurnover) score += 5;

    // 6. Sector Momentum
    const sectorMomentumPct = sectorMomentum?.[stock.sector]?.momentumPct;
    if (sectorMomentumPct !== undefined) {
      if (sectorMomentumPct >= 20) score += 10;
      else if (sectorMomentumPct >= 10) score += 6;
      else if (sectorMomentumPct >= 5) score += 3;
    }`;
content = content.replace(oldScoring, newScoring);

// 7. Update catalysts
const oldCatalysts = /    if \(winRate >= 65 && totalSignals > 0\) catalysts\.push\(\`🏆 \$\{winRate\.toFixed\(0\)\}% Historical Signal Win Rate\`\);/;
const newCatalysts = `    if (hasReliableOwnHistory && winRate >= 65) catalysts.push(\`🏆 \${winRate.toFixed(0)}% Historical Signal Win Rate (\${totalSignals} trades)\`);
    if (sectorMomentumPct !== undefined && sectorMomentumPct >= 10) catalysts.push(\`🌊 \${stock.sector} sector volume rotation +\${sectorMomentumPct.toFixed(0)}%\`);`;
content = content.replace(oldCatalysts, newCatalysts);

// 8. Update Edge Analysis
const oldEdge = /    \/\/ Edge Analysis Factor\n    let historicalEdgeWinRate = winRate;\n    let patternEdgeBonus = 0;\n    \n[\s\S]*?if \(patternEdgeBonus > 0\) {\n       profitPotentialScore = Math\.min\(100, profitPotentialScore \+ patternEdgeBonus\);\n       catalysts\.push\(\`🎯 Pattern-Sector Edge \(\$\{historicalEdgeWinRate\.toFixed\(0\)\}% Win Prob\)\`\);\n    }/;

const newEdge = `    // Historical Edge Factor
    let historicalEdgeWinRate = hasReliableOwnHistory ? winRate : 0;
    let patternEdgeBonus = 0;
    let edgeSampleSize = totalSignals;

    const matchedPatternEdge = edgeStats?.find((e) => e.pattern === canonicalPattern);

    if (matchedPatternEdge) {
      // Market-wide edge
      if (matchedPatternEdge.count >= MIN_RELIABLE_SAMPLE && matchedPatternEdge.winRate >= 60) {
        patternEdgeBonus += 8;
        historicalEdgeWinRate = Math.max(historicalEdgeWinRate, matchedPatternEdge.winRate);
        edgeSampleSize = Math.max(edgeSampleSize, matchedPatternEdge.count);
      }

      // Sector-specific edge
      const sectorEdge = matchedPatternEdge.sectorEdges.find((se) => se.sector === stock.sector);
      if (sectorEdge && sectorEdge.count >= MIN_RELIABLE_SAMPLE && sectorEdge.winRate >= 60) {
        patternEdgeBonus += 15;
        historicalEdgeWinRate = Math.max(historicalEdgeWinRate, sectorEdge.winRate);
        edgeSampleSize = Math.max(edgeSampleSize, sectorEdge.count);
      }

      // Stock-specific edge
      const stockEdge = matchedPatternEdge.stockEdges.find((se) => se.symbol === stock.symbol);
      if (stockEdge && stockEdge.count >= MIN_RELIABLE_SAMPLE && stockEdge.winRate >= 70) {
        patternEdgeBonus += 25;
        historicalEdgeWinRate = Math.max(historicalEdgeWinRate, stockEdge.winRate);
        edgeSampleSize = Math.max(edgeSampleSize, stockEdge.count);
      }
    }

    if (patternEdgeBonus > 0) {
      profitPotentialScore = Math.min(100, profitPotentialScore + patternEdgeBonus);
      catalysts.push(\`🎯 \${canonicalPattern} Edge: \${historicalEdgeWinRate.toFixed(0)}% Win Rate (\${edgeSampleSize} trades)\`);
    }

    const edgeConfidence = edgeConfidenceFromSampleSize(edgeSampleSize);`;
content = content.replace(oldEdge, newEdge);

// 9. Update candidates.push
const oldPush = /      earlyTrendSignals: earlyTrend\.signals,\n      harmonicDetails: harmonic \|\| undefined,\n    \}\);/;
const newPush = `      earlyTrendSignals: earlyTrend.signals,
      harmonicDetails: harmonic || undefined,
      edgeSampleSize,
      edgeConfidence,
      sectorMomentumPct,
    });`;
content = content.replace(oldPush, newPush);

// 10. Update evaluateStockForScreener
const oldEval = /export function evaluateStockForScreener\(\n  stock: DseStockData,\n  config: BacktestConfig,\n  signals\?: BreakoutSignal\[\],\n  edgeStats\?: PatternEdgeStat\[\]\n\): ScreenerStockCandidate \| null {\n  const candidates = runDseStockScreener\(\[stock\], config, edgeStats\);/;
const newEval = `export function evaluateStockForScreener(
  stock: DseStockData,
  config: BacktestConfig,
  signals?: BreakoutSignal[],
  edgeStats?: PatternEdgeStat[],
  sectorMomentum?: Record<string, SectorMomentumStat>
): ScreenerStockCandidate | null {
  const candidates = runDseStockScreener([stock], config, edgeStats, sectorMomentum);`;
content = content.replace(oldEval, newEval);

fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
