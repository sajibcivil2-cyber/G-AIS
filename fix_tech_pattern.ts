import fs from 'fs';
let content = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

const oldBlock = `  // 0. Check Harmonic Pattern (C Point Entry to D Point Exit)
  const harmonic = detectHarmonicPattern(candles, breakoutIdx);
  if (harmonic && harmonic.potentialGainPct >= 6.0) {
    return {
      detectedPattern: 'Harmonic Pattern (C-to-D)',
      patternConfidence: 95,
      patternDescription: \`\${harmonic.subtype} Harmonic Pattern: C-Point Entry at ৳\${harmonic.cPrice.toFixed(2)} ➔ Target D-Point Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`,
    };
  }`;

const newBlock = `  // 0. Check Harmonic Pattern
  const harmonic = detectHarmonicPattern(candles, breakoutIdx);
  if (harmonic && harmonic.potentialGainPct >= 6.0) {
    if (harmonic.patternType === 'BEARISH_C_TO_D') {
      return {
        detectedPattern: 'Harmonic Pattern (C-to-D)' as any,
        patternConfidence: 95,
        patternDescription: \`\${harmonic.subtype} Pattern: C-Point Entry at ৳\${harmonic.entryPrice.toFixed(2)} ➔ Target D-Point Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`,
      };
    } else {
      return {
        detectedPattern: 'Harmonic Pattern (D-Reversal)' as any,
        patternConfidence: 95,
        patternDescription: \`\${harmonic.subtype} Pattern: D-Point Reversal Entry at ৳\${harmonic.entryPrice.toFixed(2)} ➔ Target Exit at ৳\${harmonic.dTargetPrice.toFixed(2)} (\${harmonic.potentialGainPct}% Gain, R:R \${harmonic.riskRewardRatio}:1).\`,
      };
    }
  }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/utils/dseBacktestEngine.ts', content);
