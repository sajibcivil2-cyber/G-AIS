const fs = require('fs');
let file = fs.readFileSync('src/components/DseStockScreener.tsx', 'utf8');

file = file.replace(/\/\/ Top Identified Picks Pool \(Top 8 ranked candidates\)/, 
`const earlyRadarPicks = useMemo(
  () => candidates
    .filter(c => c.earlyTrendStage === 'STAGE_1_EARLY_COIL' || c.earlyTrendStage === 'STAGE_2_IGNITION')
    .sort((a, b) => b.profitPotentialScore - a.profitPotentialScore)
    .slice(0, 6),
  [candidates]
);

  // Top Identified Picks Pool (Top 8 ranked candidates)`);
fs.writeFileSync('src/components/DseStockScreener.tsx', file);
