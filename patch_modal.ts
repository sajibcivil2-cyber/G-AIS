import fs from 'fs';
let content = fs.readFileSync('src/components/StockDetailModal.tsx', 'utf8');

// props extraction
const oldProps = /    historicalWinRate,\n    tradeSetupReasoning,/;
const newProps = `    historicalWinRate,
    edgeSampleSize,
    edgeConfidence,
    sectorMomentumPct,
    tradeSetupReasoning,`;
content = content.replace(oldProps, newProps);

// Top Metrics Cards
const oldCardsGrid = /<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">/;
const newCardsGrid = `<div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">`;
content = content.replace(oldCardsGrid, newCardsGrid);

const oldPeCard = /                <span className="text-\[10px\] text-slate-500">Earnings Multiple<\/span>\n              <\/div>/;
const newPeCard = `                <span className="text-[10px] text-slate-500">Earnings Multiple</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Sector Momentum</span>
                {sectorMomentumPct !== undefined ? (
                  <>
                    <div className={\`text-xl font-black \${sectorMomentumPct >= 0 ? 'text-cyan-300' : 'text-slate-400'}\`}>
                      {sectorMomentumPct >= 0 ? '+' : ''}{sectorMomentumPct.toFixed(0)}%
                    </div>
                    <span className="text-[10px] text-slate-500">{sector} 5d volume rotation</span>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-black text-slate-600">—</div>
                    <span className="text-[10px] text-slate-500">Not enough sector data</span>
                  </>
                )}
              </div>`;
content = content.replace(oldPeCard, newPeCard);

// ConfidenceBadge
const oldBadge = /                <span className="text-xs text-emerald-400 font-bold">\n                  Win Rate: \{historicalWinRate\}%\n                <\/span>/;
const newBadge = `                <span className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                  Win Rate: {historicalWinRate}%
                  <ConfidenceBadge confidence={edgeConfidence} sampleSize={edgeSampleSize} />
                </span>`;
content = content.replace(oldBadge, newBadge);

const oldHistRate = /                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">\n                  <span className="text-\[10px\] text-slate-400 uppercase">Historical Strategy Win Rate<\/span>\n                  <div className="text-2xl font-black text-amber-300">\{historicalWinRate\}%<\/div>\n                  <p className="text-\[10px\] text-slate-400 font-sans">\n                    Win rate across past pattern setups in DSE database.\n                  <\/p>\n                <\/div>/;
const newHistRate = `                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">Historical Strategy Win Rate</span>
                    <ConfidenceBadge confidence={edgeConfidence} sampleSize={edgeSampleSize} />
                  </div>
                  <div className="text-2xl font-black text-amber-300">{historicalWinRate}%</div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    {edgeSampleSize
                      ? \`Based on \${edgeSampleSize} historical trade\${edgeSampleSize === 1 ? '' : 's'} for this pattern/stock/sector.\`
                      : 'No qualifying historical trades yet for this exact setup — treat as unproven.'}
                  </p>
                </div>`;
content = content.replace(oldHistRate, newHistRate);

const badgeComponent = `
// Sample-size-aware confidence badge — a win rate is only as trustworthy as the number of
// historical trades behind it. Shown next to every win-rate figure so a lucky 1-trade
// streak never reads with the same confidence as a proven 15-trade track record.
const ConfidenceBadge: React.FC<{ confidence?: 'Low' | 'Medium' | 'High'; sampleSize?: number }> = ({
  confidence,
  sampleSize,
}) => {
  if (!confidence) return null;
  const styles: Record<string, string> = {
    High: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Low: 'bg-slate-700/40 text-slate-400 border-slate-600/50',
  };
  return (
    <span
      title={\`Based on \${sampleSize ?? 0} historical trade\${sampleSize === 1 ? '' : 's'} — \${confidence.toLowerCase()} confidence sample size\`}
      className={\`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wide \${styles[confidence]}\`}
    >
      {confidence} conf. · n={sampleSize ?? 0}
    </span>
  );
};
`;

content += badgeComponent;

fs.writeFileSync('src/components/StockDetailModal.tsx', content);
