import React, { useMemo, useState } from 'react';
import { BacktestSummary, BreakoutSignal, DseStockData } from '../types';
import { Target, TrendingUp, BarChart2, ShieldAlert, Award } from 'lucide-react';

interface EdgeAnalysisDashboardProps {
  backtestResult: BacktestSummary;
  stocks: DseStockData[];
}

export const EdgeAnalysisDashboard: React.FC<EdgeAnalysisDashboardProps> = ({ backtestResult, stocks }) => {
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  // 1. Group signals by pattern
  const patternEdgeStats = useMemo(() => {
    const patterns = new Map<string, {
      count: number;
      wins: number;
      totalReturn: number;
      sectors: Record<string, { count: number; wins: number; totalReturn: number; stocks: Set<string> }>;
    }>();

    backtestResult.signals.forEach(sig => {
      if (sig.status === 'In Progress') return; // Only count resolved trades
      
      if (!patterns.has(sig.detectedPattern)) {
        patterns.set(sig.detectedPattern, { count: 0, wins: 0, totalReturn: 0, sectors: {} });
      }
      
      const stats = patterns.get(sig.detectedPattern)!;
      stats.count += 1;
      const isWin = sig.status === 'Target Hit';
      if (isWin) stats.wins += 1;
      stats.totalReturn += sig.realizedGainPct || 0;

      if (!stats.sectors[sig.sector]) {
        stats.sectors[sig.sector] = { count: 0, wins: 0, totalReturn: 0, stocks: new Set() };
      }
      
      const sectorStats = stats.sectors[sig.sector];
      sectorStats.count += 1;
      if (isWin) sectorStats.wins += 1;
      sectorStats.totalReturn += sig.realizedGainPct || 0;
      sectorStats.stocks.add(sig.symbol);
    });

    return Array.from(patterns.entries()).map(([pattern, data]) => {
      const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0;
      const avgReturn = data.count > 0 ? data.totalReturn / data.count : 0;
      
      // Calculate best sectors for this pattern
      const sectorEdges = Object.entries(data.sectors).map(([sector, sData]) => {
        return {
          sector,
          count: sData.count,
          winRate: sData.count > 0 ? (sData.wins / sData.count) * 100 : 0,
          avgReturn: sData.count > 0 ? sData.totalReturn / sData.count : 0,
          stocks: Array.from(sData.stocks)
        };
      }).sort((a, b) => b.winRate - a.winRate); // Sort by highest win rate

      return {
        pattern,
        count: data.count,
        winRate,
        avgReturn,
        sectorEdges
      };
    }).sort((a, b) => b.winRate - a.winRate); // Sort patterns by overall win rate
  }, [backtestResult.signals]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Market Edge Analysis</h2>
            <p className="text-sm text-slate-400">Correlating technical patterns with sector-wide historical win rates to identify higher-probability setups.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {patternEdgeStats.map(stat => (
            <div 
              key={stat.pattern}
              onClick={() => setSelectedPattern(selectedPattern === stat.pattern ? null : stat.pattern)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedPattern === stat.pattern 
                  ? 'bg-indigo-900/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-white text-sm">{stat.pattern}</h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">{stat.count} Trades</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Win Rate</span>
                  <span className={`font-bold ${stat.winRate >= 70 ? 'text-emerald-400' : stat.winRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {stat.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Avg Return</span>
                  <span className={`font-bold ${stat.avgReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stat.avgReturn >= 0 ? '+' : ''}{stat.avgReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          {patternEdgeStats.length === 0 && (
             <div className="col-span-3 text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
               <ShieldAlert className="w-10 h-10 mx-auto text-amber-500/50 mb-3" />
               <p className="text-sm">Not enough resolved historical trades to perform edge analysis.</p>
               <p className="text-xs mt-1">Run a backtest that generates completed signals to view correlations.</p>
             </div>
          )}
        </div>
      </div>

      {selectedPattern && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-5 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Sector Correlation: <span className="text-indigo-300">{selectedPattern}</span></h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {patternEdgeStats.find(p => p.pattern === selectedPattern)?.sectorEdges.map((sectorEdge, idx) => (
              <div key={sectorEdge.sector} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3 border-b border-slate-800/50 pb-2">
                  <div className="flex items-center gap-2">
                    {idx === 0 ? <Award className="w-4 h-4 text-amber-400" /> : <BarChart2 className="w-4 h-4 text-slate-500" />}
                    <h4 className="font-bold text-slate-200 text-sm">{sectorEdge.sector}</h4>
                  </div>
                  <div className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">{sectorEdge.count} signals</div>
                </div>
                
                <div className="flex gap-6 mb-4 text-xs font-mono">
                  <div>
                    <div className="text-slate-500 mb-1">Win Rate</div>
                    <div className={`font-bold text-base ${sectorEdge.winRate >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {sectorEdge.winRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">Avg Return</div>
                    <div className={`font-bold text-base ${sectorEdge.avgReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sectorEdge.avgReturn > 0 ? '+' : ''}{sectorEdge.avgReturn.toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">High Probability Stocks</div>
                  <div className="flex flex-wrap gap-2">
                    {sectorEdge.stocks.map(sym => (
                      <span key={sym} className="text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded">
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
