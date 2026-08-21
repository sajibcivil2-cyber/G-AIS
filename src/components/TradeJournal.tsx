import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { TradeLog, BreakoutSignal, BacktestConfig, DseStockData } from '../types';
import { Plus, Trash2, TrendingUp, TrendingDown, Target, Activity, Calendar, Brain, Bot, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TradeJournalProps {
  breakoutSignals?: BreakoutSignal[];
  stocks?: DseStockData[];
  onApplyOptimizedConfig?: (config: Partial<BacktestConfig>) => void;
}

export function TradeJournal({ breakoutSignals = [], stocks = [], onApplyOptimizedConfig }: TradeJournalProps) {
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [autoTradeMessage, setAutoTradeMessage] = useState<string | null>(null);

  // Form state
  const [symbol, setSymbol] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryPrice, setEntryPrice] = useState('');
  const [shares, setShares] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [exitDate, setExitDate] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, `users/${auth.currentUser.uid}/tradelogs`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: TradeLog[] = [];
      snapshot.forEach(doc => {
        loaded.push({ id: doc.id, ...doc.data() } as TradeLog);
      });
      // Sort by entryDate descending
      loaded.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
      setTrades(loaded);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching trades:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    const ep = parseFloat(entryPrice);
    const sh = parseFloat(shares);
    const exp = exitPrice ? parseFloat(exitPrice) : undefined;
    
    let pnlBdt;
    let pnlPct;
    if (status === 'CLOSED' && exp !== undefined) {
      pnlBdt = (exp - ep) * sh;
      pnlPct = ((exp - ep) / ep) * 100;
    }

    const tradeId = Date.now().toString();
    const tradeData: any = {
      userId: auth.currentUser.uid,
      symbol: symbol.toUpperCase(),
      entryDate,
      entryPrice: ep,
      shares: sh,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (status === 'CLOSED') {
      if (exitDate) tradeData.exitDate = exitDate;
      if (exp !== undefined) tradeData.exitPrice = exp;
      if (pnlBdt !== undefined) tradeData.pnlBdt = pnlBdt;
      if (pnlPct !== undefined) tradeData.pnlPct = pnlPct;
    }
    if (notes) tradeData.notes = notes;

    try {
      await setDoc(doc(db, `users/${auth.currentUser.uid}/tradelogs`, tradeId), tradeData);
      setShowAddForm(false);
      // Reset form
      setSymbol(''); setEntryPrice(''); setShares(''); setExitDate(''); setExitPrice(''); setNotes(''); setStatus('OPEN');
    } catch (err) {
      console.error('Failed to save trade:', err);
    }
  };

  const handleDelete = async (tradeId: string) => {
    if (!auth.currentUser || !confirm('Delete this trade record?')) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/tradelogs`, tradeId));
    } catch (err) {
      console.error('Failed to delete trade:', err);
    }
  };

  // Auto-Trader: Convert active AI Screener signals into simulated paper trades
  const handleAutoTakeTrades = async () => {
    if (!auth.currentUser) return;
    if (breakoutSignals.length === 0) {
      setAutoTradeMessage('No active AI Screener breakout signals found to execute.');
      setTimeout(() => setAutoTradeMessage(null), 4000);
      return;
    }

    const topSignals = breakoutSignals.slice(0, 3); // Take top 3 signals
    let addedCount = 0;

    for (const sig of topSignals) {
      // Check if already open
      const exists = trades.some(t => t.symbol === sig.symbol && t.status === 'OPEN');
      if (exists) continue;

      const defaultCapital = 100000; // 1 Lac BDT per position
      const entryPrice = sig.breakoutPrice || 10;
      const allocatedShares = Math.floor(defaultCapital / entryPrice);
      if (allocatedShares <= 0) continue;

      const targetPrice = entryPrice * 1.15;
      const stopPrice = entryPrice * 0.95;

      const tradeId = `${Date.now()}_${sig.symbol}`;
      const tradeData: any = {
        userId: auth.currentUser.uid,
        symbol: sig.symbol,
        entryDate: sig.breakoutDate,
        entryPrice: entryPrice,
        shares: allocatedShares,
        status: 'OPEN',
        notes: `Auto-Executed by AI Engine. Pattern: ${sig.detectedPattern} (Volume Surge: ${(sig.volumeMultiplier || 2.0).toFixed(1)}x, Target: ৳${targetPrice.toFixed(1)}, Stop: ৳${stopPrice.toFixed(1)})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/tradelogs`, tradeId), tradeData);
        addedCount++;
      } catch (err) {
        console.error('Failed auto trade log:', err);
      }
    }

    setAutoTradeMessage(addedCount > 0 
      ? `Successfully executed ${addedCount} paper trade(s) based on AI Trade Plan!` 
      : 'All current top AI signals are already active in your trade log.');
    setTimeout(() => setAutoTradeMessage(null), 5000);
  };

  const performanceStats = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnlBdt !== undefined);
    const wins = closedTrades.filter(t => (t.pnlBdt || 0) > 0);
    const losses = closedTrades.filter(t => (t.pnlBdt || 0) <= 0);
    
    const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
    const totalPnl = closedTrades.reduce((acc, t) => acc + (t.pnlBdt || 0), 0);
    const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + (t.pnlBdt || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((acc, t) => acc + (t.pnlBdt || 0), 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 99 : 0;

    // Equity Curve Data
    let cumulative = 0;
    const chartData = [...closedTrades].reverse().map((t, idx) => {
      cumulative += (t.pnlBdt || 0);
      return {
        tradeNo: `T${idx + 1}`,
        symbol: t.symbol,
        pnl: t.pnlBdt,
        equity: cumulative
      };
    });

    // Machine Learning / Strategy Adaptation Metrics
    let learnedRecommendation = '';
    let suggestedConfig: Partial<BacktestConfig> = {};

    if (closedTrades.length >= 2) {
      if (winRate < 45) {
        learnedRecommendation = `Historical win rate is low (${winRate.toFixed(1)}%). Recommending tighter volume surge filters (2.8x) and enabling Sector Trend Alignment to filter out false breakouts.`;
        suggestedConfig = { volumeSurgeMultiplier: 2.8, stopLossPct: 4.0 };
      } else if (profitFactor > 2.0) {
        learnedRecommendation = `High Profit Factor (${profitFactor.toFixed(2)}x) detected! Recommending expanding target profit to 15% to capitalize on strong momentum trends.`;
        suggestedConfig = { targetProfitPct: 15.0 };
      } else {
        learnedRecommendation = `Balanced trading performance (${winRate.toFixed(1)}% Win Rate). Recommending disciplined risk controls to lock in profits during DSE volatility.`;
        suggestedConfig = { stopLossPct: 5.0, targetProfitPct: 15.0 };
      }
    }

    return { totalTrades: closedTrades.length, winRate, totalPnl, profitFactor, chartData, learnedRecommendation, suggestedConfig };
  }, [trades]);

  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
        <Target className="w-12 h-12 mb-4 text-slate-600" />
        <h3 className="text-xl font-bold text-slate-300">Authentication Required</h3>
        <p className="mt-2 text-sm text-center">Please sign in to access the Trade Journal, Auto-Trader, and Performance Learning Engine.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Trader Notification Banner */}
      {autoTradeMessage && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-4 py-3 rounded-xl flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>{autoTradeMessage}</span>
          </div>
        </div>
      )}

      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            AI Trade Plan & Adaptive Learning Journal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log real trades or let the AI auto-execute paper orders and learn from trade outcomes.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleAutoTakeTrades}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
            title="Auto-Execute trades based on current AI Screener signals"
          >
            <Bot className="w-4 h-4" /> Auto-Execute AI Trade Plan
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Manual Log
          </button>
        </div>
      </div>

      {/* Adaptive Learning Insight Banner */}
      {performanceStats.learnedRecommendation && (
        <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shrink-0">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">AI Performance Learning Engine</span>
              <p className="text-xs text-slate-300 font-medium mt-0.5 leading-relaxed">
                {performanceStats.learnedRecommendation}
              </p>
            </div>
          </div>
          {onApplyOptimizedConfig && (
            <button
              onClick={() => onApplyOptimizedConfig(performanceStats.suggestedConfig)}
              className="shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-md shadow-purple-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Apply Learned Optimizations
            </button>
          )}
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-mono mb-1 uppercase">Closed Trades</span>
          <span className="text-2xl font-black text-white">{performanceStats.totalTrades}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-mono mb-1 uppercase">Win Rate</span>
          <span className={`text-2xl font-black ${performanceStats.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {performanceStats.winRate.toFixed(1)}%
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-mono mb-1 uppercase">Profit Factor</span>
          <span className={`text-2xl font-black ${performanceStats.profitFactor >= 1.5 ? 'text-blue-400' : 'text-amber-400'}`}>
            {performanceStats.profitFactor.toFixed(2)}x
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-mono mb-1 uppercase">Net PnL (BDT)</span>
          <span className={`text-2xl font-black ${performanceStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ৳{performanceStats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Equity Curve Chart */}
      {performanceStats.chartData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Equity Curve Performance</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceStats.chartData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="tradeNo" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="equity" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Manual Add Form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl animate-in fade-in">
          <form onSubmit={handleSaveTrade} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Symbol</label>
                <input required value={symbol} onChange={e => setSymbol(e.target.value)} type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase" placeholder="GP" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Shares</label>
                <input required value={shares} onChange={e => setShares(e.target.value)} type="number" step="any" min="1" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="1000" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Entry Date</label>
                <input required value={entryDate} onChange={e => setEntryDate(e.target.value)} type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Entry Price (৳)</label>
                <input required value={entryPrice} onChange={e => setEntryPrice(e.target.value)} type="number" step="any" min="0" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="0.00" />
              </div>
              
              {status === 'CLOSED' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Exit Date</label>
                    <input required={status === 'CLOSED'} value={exitDate} onChange={e => setExitDate(e.target.value)} type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Exit Price (৳)</label>
                    <input required={status === 'CLOSED'} value={exitPrice} onChange={e => setExitPrice(e.target.value)} type="number" step="any" min="0" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="0.00" />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Trade Notes / Strategy</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Breakout on high volume..."></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors">Save Trade Record</button>
            </div>
          </form>
        </div>
      )}

      {/* Trade History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading trade journal records...</div>
        ) : trades.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No trades logged yet. Click "Auto-Execute AI Trade Plan" or "Manual Log" to start tracking!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Symbol</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Shares</th>
                  <th className="px-4 py-3 font-bold text-right">Entry Price</th>
                  <th className="px-4 py-3 font-bold text-right">Exit Price</th>
                  <th className="px-4 py-3 font-bold text-right">Net PnL</th>
                  <th className="px-4 py-3 font-bold">Notes / Execution Log</th>
                  <th className="px-4 py-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {trades.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{t.symbol}</div>
                      <div className="text-[10px] text-slate-500">{t.entryDate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'OPEN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{t.shares.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono">৳{t.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {t.status === 'CLOSED' && t.exitPrice ? `৳${t.exitPrice.toFixed(2)}` : '-'}
                      {t.status === 'CLOSED' && t.exitDate && <div className="text-[9px]">{t.exitDate}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {t.status === 'CLOSED' && t.pnlBdt !== undefined ? (
                        <div className={`font-bold ${t.pnlBdt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnlBdt >= 0 ? '+' : ''}৳{t.pnlBdt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          <span className="text-[9px] block text-slate-500 opacity-80">{t.pnlPct! >= 0 ? '+' : ''}{t.pnlPct?.toFixed(2)}%</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">
                      {t.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(t.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
