const fs = require('fs');
let file = fs.readFileSync('src/components/DseStockScreener.tsx', 'utf8');

const targetStr = `{/* Top Identified Stocks Summary & Feature Card */}`;
const insertionStr = `      {/* Early Radar Picks */}
      {earlyRadarPicks.length > 0 && (
        <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-5">
          <div className="space-y-2.5 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider font-mono">
                  Early Radar Picks (Pre-Breakout / Stage 1 & 2)
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
              {earlyRadarPicks.map((pick) => (
                <button
                  key={pick.symbol}
                  onClick={() => setSelectedCandidateModal(pick)}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left flex flex-col justify-between h-full"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-black text-white text-xs font-mono">{pick.symbol}</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold font-mono">
                      {pick.profitPotentialScore}%
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-1.5 line-clamp-1">
                    {pick.earlyTrendStage === 'STAGE_1_EARLY_COIL' ? 'Stage 1 Coil' : pick.earlyTrendStage === 'STAGE_2_IGNITION' ? 'Stage 2 Ignition' : pick.earlyTrendStage}
                  </div>
                  <div className="flex justify-between items-end mt-3 border-t border-slate-800 pt-2">
                    <span className="text-xs font-bold text-slate-200">৳{pick.entryPrice}</span>
                    <span className="text-[9px] text-emerald-400">+{pick.potentialGainPct}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Identified Stocks Summary & Feature Card */}`;

if (!file.includes('Early Radar Picks')) {
  file = file.replace(targetStr, insertionStr);
  fs.writeFileSync('src/components/DseStockScreener.tsx', file);
}
