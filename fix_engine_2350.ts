import fs from 'fs';
let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

const oldBlock = `    if (harmonic) {
      finalDetectedPattern = 'Harmonic Pattern (C-to-D)';
      finalPatternConfidence = 95;
      finalPatternDescription = \`\${harmonic.subtype} Harmonic Pattern: C-Point Entry at ৳\${harmonic.cPrice.toFixed(2)} ➔ Target D-Point Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`;
      pattern = \`\${harmonic.subtype} (C-to-D Swing)\`;

      catalysts.unshift(\`💎 \${harmonic.subtype} Harmonic Pattern (Point C Entry ➔ Point D Exit)\`);
      if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
        entryPrice = harmonic.cPrice;
        targetPrice = harmonic.dTargetPrice;
        stopLossPrice = harmonic.stopLossPrice;
        targetProfitPct = harmonic.potentialGainPct;
        stopLossPct = harmonic.potentialRiskPct;
        riskRewardRatio = harmonic.riskRewardRatio;
        decisionStatus = 'STRONG_BUY';
        profitPotentialScore = Math.min(100, profitPotentialScore + 35);
        reasoning = \`Harmonic Pattern C-to-D Strategy: \${harmonic.subtype} setup! Buy at Point C (৳\${harmonic.cPrice.toFixed(2)}), Target Point D Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% gain). Stop Loss at ৳\${harmonic.stopLossPrice.toFixed(2)} (R:R = \${harmonic.riskRewardRatio}:1).\`;
      }
    }`;

const newBlock = `    if (harmonic) {
      if (harmonic.patternType === 'BEARISH_C_TO_D') {
        finalDetectedPattern = 'Harmonic Pattern (C-to-D)';
        finalPatternConfidence = 95;
        finalPatternDescription = \`\${harmonic.subtype} Pattern: C-Point Entry at ৳\${harmonic.entryPrice.toFixed(2)} ➔ Target D-Point Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`;
        pattern = \`\${harmonic.subtype} (C-to-D Swing)\`;
        catalysts.unshift(\`💎 \${harmonic.subtype} Pattern (Point C Entry ➔ Point D Exit)\`);
        
        if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
          entryPrice = harmonic.entryPrice;
          targetPrice = harmonic.dTargetPrice;
          stopLossPrice = harmonic.stopLossPrice;
          targetProfitPct = harmonic.potentialGainPct;
          stopLossPct = harmonic.potentialRiskPct;
          riskRewardRatio = harmonic.riskRewardRatio;
          decisionStatus = 'STRONG_BUY';
          profitPotentialScore = Math.min(100, profitPotentialScore + 35);
          reasoning = \`Harmonic C-to-D Strategy: \${harmonic.subtype} setup! Buy at Point C (৳\${harmonic.entryPrice.toFixed(2)}), Target Point D at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% gain). Stop Loss at ৳\${harmonic.stopLossPrice.toFixed(2)}.\`;
        }
      } else {
        finalDetectedPattern = 'Harmonic Pattern (D-Reversal)' as any;
        finalPatternConfidence = 95;
        finalPatternDescription = \`\${harmonic.subtype} Pattern: D-Point Entry at ৳\${harmonic.entryPrice.toFixed(2)} ➔ Target Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`;
        pattern = \`\${harmonic.subtype} (D-Reversal)\` as any;
        catalysts.unshift(\`🎯 \${harmonic.subtype} Pattern (Point D Reversal Entry)\`);
        
        if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
          entryPrice = harmonic.entryPrice;
          targetPrice = harmonic.dTargetPrice;
          stopLossPrice = harmonic.stopLossPrice;
          targetProfitPct = harmonic.potentialGainPct;
          stopLossPct = harmonic.potentialRiskPct;
          riskRewardRatio = harmonic.riskRewardRatio;
          decisionStatus = 'STRONG_BUY';
          profitPotentialScore = Math.min(100, profitPotentialScore + 35);
          reasoning = \`Harmonic D-Reversal Strategy: \${harmonic.subtype} setup! Buy at Point D (৳\${harmonic.entryPrice.toFixed(2)}), Target Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% gain). Stop Loss at ৳\${harmonic.stopLossPrice.toFixed(2)}.\`;
        }
      }
    }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
