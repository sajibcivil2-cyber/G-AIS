import fs from 'fs';
let content = fs.readFileSync('src/components/DseStockScreener.tsx', 'utf8');

// types imports
content = content.replace(/ScreenerStockCandidate, ScreenerDecisionStatus } from '\.\.\/types';/, "ScreenerStockCandidate, ScreenerDecisionStatus, SectorMomentumStat } from '../types';");

// props
content = content.replace(/edgeStats\?: PatternEdgeStat\[\];\n  onUpdateConfig:/, "edgeStats?: PatternEdgeStat[];\n  sectorMomentum?: Record<string, SectorMomentumStat>;\n  onUpdateConfig:");
content = content.replace(/  edgeStats,\n  onUpdateConfig,/, "  edgeStats,\n  sectorMomentum,\n  onUpdateConfig,");

// useMemo runDseStockScreener
content = content.replace(/return runDseStockScreener\(stocks, config, edgeStats\);\n  \}, \[stocks, config, edgeStats\]\);/, "return runDseStockScreener(stocks, config, edgeStats, sectorMomentum);\n  }, [stocks, config, edgeStats, sectorMomentum]);");

// Score badge in UI
const oldScore = /<div className="text-\[10px\] text-slate-400 uppercase font-semibold">Profit Potential Score<\/div>/;
const newScore = `<div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-end gap-1.5">
                    Profit Potential Score
                    {activeTopPick.edgeConfidence && (
                      <span
                        title={\`Historical edge based on \${activeTopPick.edgeSampleSize} trade\${activeTopPick.edgeSampleSize === 1 ? '' : 's'}\`}
                        className={\`px-1.5 py-0.5 rounded-md border text-[8px] font-bold uppercase tracking-wide normal-case \${
                          activeTopPick.edgeConfidence === 'High'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : activeTopPick.edgeConfidence === 'Medium'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-slate-700/40 text-slate-400 border-slate-600/50'
                        }\`}
                      >
                        {activeTopPick.edgeConfidence} conf.
                      </span>
                    )}
                  </div>`;
content = content.replace(oldScore, newScore);

fs.writeFileSync('src/components/DseStockScreener.tsx', content);
