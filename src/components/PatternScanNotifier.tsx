import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
  ChevronRight,
  Filter,
  X,
  Flame,
  ShieldCheck,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { BreakoutSignal, TechnicalPatternType } from '../types';

interface PatternScanNotifierProps {
  signals: BreakoutSignal[];
  selectedPatternFilter: string;
  onSelectPatternFilter: (pattern: string) => void;
  onJumpToSignal?: (signal: BreakoutSignal) => void;
}

export const PatternScanNotifier: React.FC<PatternScanNotifierProps> = ({
  signals,
  selectedPatternFilter,
  onSelectPatternFilter,
  onJumpToSignal,
}) => {
  const [showNotificationToast, setShowNotificationToast] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [timeWindow, setTimeWindow] = useState<'7D' | 'ALL'>('7D');

  // Filter signals by selected time window (defaulting to last 7 trading sessions)
  const windowSignals = React.useMemo(() => {
    if (timeWindow === 'ALL' || signals.length === 0) return signals;
    const uniqueDates = Array.from(new Set(signals.map((s) => s.breakoutDate))).sort().reverse();
    const last7Dates = new Set(uniqueDates.slice(0, 7));
    return signals.filter((s) => last7Dates.has(s.breakoutDate));
  }, [signals, timeWindow]);

  // Group signals by detected pattern
  const patternStats = React.useMemo(() => {
    const map = new Map<
      TechnicalPatternType,
      {
        count: number;
        winners: number;
        totalGain: number;
        highConfidenceSignals: BreakoutSignal[];
      }
    >();

    const patternsList: TechnicalPatternType[] = [
      'Bullish Flag',
      'Double Bottom',
      'Cup & Handle',
      'Ascending Triangle',
      'VCP Compression',
      'Harmonic Pattern (C-to-D)',
      'Box Range Consolidation',
    ];

    patternsList.forEach((p) => {
      map.set(p, { count: 0, winners: 0, totalGain: 0, highConfidenceSignals: [] });
    });

    windowSignals.forEach((sig) => {
      const p = sig.detectedPattern || 'Box Range Consolidation';
      const existing = map.get(p) || { count: 0, winners: 0, totalGain: 0, highConfidenceSignals: [] };
      existing.count += 1;
      if (sig.realizedGainPct > 0) existing.winners += 1;
      existing.totalGain += sig.realizedGainPct;
      if (sig.patternConfidence >= 88) {
        existing.highConfidenceSignals.push(sig);
      }
      map.set(p, existing);
    });

    return Array.from(map.entries()).map(([pattern, data]) => {
      const winRate = data.count > 0 ? Number(((data.winners / data.count) * 100).toFixed(1)) : 0;
      const avgGain = data.count > 0 ? Number((data.totalGain / data.count).toFixed(1)) : 0;
      return {
        pattern,
        count: data.count,
        winRate,
        avgGain,
        highConfidenceSignals: data.highConfidenceSignals,
      };
    });
  }, [windowSignals]);

  // High conviction alert notifications
  const topNotifications = React.useMemo(() => {
    return windowSignals
      .filter((s) => s.patternConfidence >= 88)
      .sort((a, b) => b.patternConfidence - a.patternConfidence)
      .slice(0, 4);
  }, [windowSignals]);

  // Icon mapping per pattern
  const getPatternBadge = (pattern: TechnicalPatternType) => {
    switch (pattern) {
      case 'Bullish Flag':
        return { icon: '🚩', label: 'Bullish Flag', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
      case 'Double Bottom':
        return { icon: 'Ⓦ', label: 'Double Bottom (W-Base)', color: 'text-amber-300 bg-amber-500/20 border-amber-500/40' };
      case 'Cup & Handle':
        return { icon: '🍵', label: 'Cup & Handle', color: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/40' };
      case 'Ascending Triangle':
        return { icon: '🔺', label: 'Ascending Triangle', color: 'text-sky-300 bg-sky-500/20 border-sky-500/40' };
      case 'VCP Compression':
        return { icon: '⚡', label: 'VCP Volatility Coil', color: 'text-purple-300 bg-purple-500/20 border-purple-500/40' };
      default:
        return { icon: '📦', label: 'Box Consolidation', color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Floating Pattern Alert Notification Toast */}
      {showNotificationToast && topNotifications.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/40 rounded-2xl p-4 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 relative">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/40">
                  ⚡ PATTERN SCAN NOTIFICATION
                </span>
                <span className="text-xs font-extrabold text-white">
                  Detected {topNotifications.length} High-Confidence Technical Setups Prior to Breakouts!
                </span>
              </div>

              <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap font-mono">
                {topNotifications.map((n, idx) => {
                  const badge = getPatternBadge(n.detectedPattern);
                  return (
                    <span
                      key={idx}
                      onClick={() => onJumpToSignal && onJumpToSignal(n)}
                      className="cursor-pointer hover:underline text-emerald-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1"
                    >
                      <span>{badge.icon}</span>
                      <span>{n.symbol} ({n.detectedPattern} {n.patternConfidence}%)</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowNotificationModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Pattern Matrix
            </button>
            <button
              onClick={() => setShowNotificationToast(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pattern Matrix & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Technical Pattern Scanner Matrix</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-bold">
                    {timeWindow === '7D' ? '⚡ Last 7 Days Setups' : '📅 All History'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Pre-breakout chart patterns scanned across recent DSE market data</p>
              </div>
            </div>

            {/* Time Window Switcher (Last 7 Days vs All History) */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold shrink-0">
              <button
                onClick={() => setTimeWindow('7D')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeWindow === '7D'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Last 7 Days
              </button>
              <button
                onClick={() => setTimeWindow('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeWindow === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📅 All History
              </button>
            </div>
          </div>

          {/* Pattern Filter Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onSelectPatternFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                selectedPatternFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Patterns ({signals.length})
            </button>

            {patternStats.map((st) => {
              const badge = getPatternBadge(st.pattern);
              const isActive = selectedPatternFilter === st.pattern;
              return (
                <button
                  key={st.pattern}
                  onClick={() => onSelectPatternFilter(st.pattern)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1 border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 hover:text-white border-slate-800'
                  }`}
                >
                  <span>{badge.icon}</span>
                  <span>{st.pattern} ({st.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pattern Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {patternStats.map((st) => {
            const badge = getPatternBadge(st.pattern);
            const isSelected = selectedPatternFilter === st.pattern;

            return (
              <div
                key={st.pattern}
                onClick={() => onSelectPatternFilter(isSelected ? 'ALL' : st.pattern)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-lg ring-1 ring-indigo-500'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{badge.icon}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {st.count} signals
                  </span>
                </div>

                <div className="text-xs font-bold text-white font-mono line-clamp-1">{st.pattern}</div>

                <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-800/80 pt-1">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className={`font-bold ${st.winRate >= 75 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {st.winRate}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Avg Return:</span>
                  <span className={`font-bold ${st.avgGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    +{st.avgGain}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pattern Modal Detailed Scan Overview */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white font-mono">
                  Technical Pattern Scan & Notification Directory
                </h3>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Automated pattern scanner detects pre-breakout structures ('Bullish Flag', 'Double Bottom', 'Cup & Handle', 'Ascending Triangle', 'VCP Compression') prior to volume surge entry triggers.
            </p>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 font-mono uppercase tracking-wider">
                Scanned Pattern Breakout Candidates
              </h4>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {signals.map((sig, idx) => {
                  const badge = getPatternBadge(sig.detectedPattern);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white">{sig.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                            {badge.icon} {sig.detectedPattern} ({sig.patternConfidence}%)
                          </span>
                          <span className="text-[10px] text-slate-400">Date: {sig.breakoutDate}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{sig.patternDescription}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">Breakout Vol</div>
                          <div className="text-emerald-400 font-bold">{sig.volumeMultiplier}x ADV</div>
                        </div>

                        {onJumpToSignal && (
                          <button
                            onClick={() => {
                              setShowNotificationModal(false);
                              onJumpToSignal(sig);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors"
                          >
                            Inspect Chart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
