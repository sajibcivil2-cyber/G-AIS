import fs from 'fs';

let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

const oldBlock = `    if (harmonic) {
      finalDetectedPattern = 'Harmonic Pattern (C-to-D)';
      finalPatternConfidence = 95;
      finalPatternDescription = \`\${harmonic.subtype} Harmonic Pattern: C-Point Entry at ৳\${harmonic.cPrice.toFixed(2)} ➔ Target D-Point Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`;
    }`;

const newBlock = `    if (harmonic) {
      if (harmonic.patternType === 'BEARISH_C_TO_D') {
        finalDetectedPattern = 'Harmonic Pattern (C-to-D)';
        finalPatternConfidence = 95;
        finalPatternDescription = \`\${harmonic.subtype} Pattern: C-Point Entry at ৳\${harmonic.entryPrice.toFixed(2)} ➔ Target D-Point Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`;
      } else {
        finalDetectedPattern = 'Harmonic Pattern (D-Reversal)';
        finalPatternConfidence = 95;
        finalPatternDescription = \`\${harmonic.subtype} Pattern: D-Point Reversal Entry at ৳\${harmonic.entryPrice.toFixed(2)} ➔ Target Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (+\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`;
      }
    }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
