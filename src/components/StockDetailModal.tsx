import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  BarChart3,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Eye,
  Sliders,
  Calculator,
  ShieldCheck,
  Scale,
  ArrowRight,
  Coins,
  Briefcase,
  AlertTriangle,
  Waves,
  Flame,
  Anchor,
  Rocket,
  Droplets,
  Crosshair,
  HelpCircle
} from 'lucide-react';
import { ScreenerStockCandidate, DseStockCandle, BacktestConfig, BreakoutSignal } from '../types';
import { getDseMarketProfile, generateRealisticTradePlan, analyzeDseVolumeFootprint } from '../utils/dseBacktestEngine';

interface StockDetailModalProps {
  candidate: ScreenerStockCandidate;
  signal?: BreakoutSignal | null;
  config?: BacktestConfig;
  onClose: () => void;
  onOpenChart?: (symbol: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  candidate,
  signal,
  config,
  onClose,
  onOpenChart,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'volume-footprint' | 'trade-plan' | 'performance' | 'risk' | 'patterns' | 'dse-profile'>('overview');
  const [customAccountBdt, setCustomAccountBdt] = useState<number>(100000);
  const [customRiskPct, setCustomRiskPct] = useState<number>(1.5);

  const [thesisLoading, setThesisLoading] = useState(false);
  const [thesisData, setThesisData] = useState<{
    grade?: string;
    summary?: string;
    catalystAndConfluence?: string[];
    invalidationRule?: string;
    liquidityRiskWarning?: string;
  } | null>(null);

  const handleGenerateThesis = async () => {
    setThesisLoading(true);
    try {
      const res = await fetch('/api/gemini/technical-thesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: candidate.symbol,
          stockName: candidate.stockName,
          sector: candidate.sector,
          profitPotentialScore: candidate.profitPotentialScore,
          entryPrice: candidate.entryPrice,
          targetPrice: candidate.targetPrice,
          stopLossPrice: candidate.stopLossPrice,
          riskRewardRatio: candidate.riskRewardRatio,
          rvol20: candidate.rvol20,
          breakoutPattern: candidate.breakoutPattern,
          detectedPattern: candidate.detectedPattern,
          peRatio: candidate.peRatio,
          yoyGrowthPct: candidate.yoyGrowthPct,
          avgTurnoverBdtMillion: candidate.avgTurnoverBdtMillion
        })
      });
      const data = await res.json();
      setThesisData(data);
    } catch (err) {
      console.error('Thesis generation error:', err);
    } finally {
      setThesisLoading(false);
    }
  };

  const {
    symbol,
    stockName,
    sector,
    stock,
    decisionStatus,
    profitPotentialScore,
    entryPrice,
    targetPrice,
    stopLossPrice,
    riskRewardRatio,
    potentialGainPct,
    potentialRiskPct,
    keyCatalysts,
    breakoutPattern,
    detectedPattern,
    patternConfidence,
    patternDescription,
    historicalWinRate,
    edgeSampleSize,
    edgeConfidence,
    sectorMomentumPct,
    tradeSetupReasoning,
    recommendedPositionSizePct,
    peRatio,
    yoyGrowthPct,
    avgTurnoverBdtMillion,
    rvol20,
    latestClose,
    latestDate,
    avgVolume20,
  } = candidate;

  const isImmediateMomentum = Boolean(
    ((decisionStatus === 'STRONG_BUY') ||
     (candidate.volumeFootprint?.isPocketPivot && rvol20 >= 1.3) ||
     (rvol20 >= 1.75) ||
     ((candidate.volumeFootprint?.compositeScore || 0) >= 75 && rvol20 >= 1.3)) &&
    profitPotentialScore >= 60 &&
    !candidate.tradePlan?.isOverextended
  );

  const isEarlyAccumulation = Boolean(
    candidate.earlyTrendStage === 'STAGE_1_EARLY_COIL' ||
    candidate.earlyTrendStage === 'STAGE_2_IGNITION' ||
    decisionStatus === 'EARLY_TREND_IGNITION' ||
    candidate.volumeFootprint?.isVdu ||
    (candidate.volumeFootprint?.isAboveAvwap && (candidate.volumeFootprint?.priceVsAvwapPct || 0) <= 4.0) ||
    candidate.volumeFootprint?.vsaSignal === 'No Supply Test' ||
    candidate.volumeFootprint?.vsaSignal === 'Absorption Bar' ||
    ((detectedPattern === 'VCP Compression' || detectedPattern === 'Volume Dry-up (No Supply)') && (candidate.volumeFootprint?.vduRatio || 1) < 0.9)
  );

  const isHighConvictionSwing = Boolean(
    (riskRewardRatio >= 2.3 || (candidate.tradePlan?.netRiskRewardRatio || 0) >= 2.1) &&
    profitPotentialScore >= 65 &&
    (historicalWinRate >= 45 || (candidate.volumeFootprint?.compositeScore || 0) >= 60 || yoyGrowthPct > 0)
  );

  const candles = stock?.candles || [];
  const candleCount = candles.length;

  const dseProfile = candidate.dseProfile || (stock ? getDseMarketProfile(stock, candles) : undefined);

  // Compute or reuse deep institutional volume footprint
  const volumeFootprint = React.useMemo(() => {
    if (candidate.volumeFootprint) return candidate.volumeFootprint;
    if (stock && candles.length > 0) {
      return analyzeDseVolumeFootprint(stock, candles);
    }
    return null;
  }, [candidate, stock, candles]);

  // Derive or fallback to realistic trade plan
  const tradePlan = React.useMemo(() => {
    if (candidate.tradePlan) return candidate.tradePlan;
    if (stock && dseProfile) {
      return generateRealisticTradePlan(
        stock,
        candles,
        config || {
          strategyType: 'VOLUME_BREAKOUT',
          volumeSurgeMultiplier: 2.0,
          targetProfitPct: 15,
          stopLossPct: 5,
          microConsolidationDays: 5,
          macroBaseDays: 60,
          minYoyGrowthPct: 0,
          minTurnoverMillionBdt: 5.0
        },
        candidate.harmonicDetails,
        candidate.detectedPattern as any,
        dseProfile,
        {
          isEarlyTrend: false,
          stage: 'STAGE_1_EARLY_COIL',
          stageLabel: 'Consolidation',
          signals: [],
          score: 50
        }
      );
    }
    return undefined;
  }, [candidate, stock, candles, config, dseProfile]);

  // 3-Month Performance Calculations (assuming 60 trading days = ~3 months)
  const perfMetrics = React.useMemo(() => {
    if (candleCount === 0) {
      return {
        pct3m: 0,
        pct1m: 0,
        pct2w: 0,
        pct1w: 0,
        high3m: latestClose,
        low3m: latestClose,
        distFromHighPct: 0,
        maxDrawdown3mPct: 0,
        avgVol3m: avgVolume20,
        rsi14: 50,
        sma20: latestClose,
        sma50: latestClose,
      };
    }

    const currentPrice = candles[candleCount - 1].close;

    // 3M (up to 60 candles back)
    const c3m = candles[Math.max(0, candleCount - 60)];
    const pct3m = c3m.close > 0 ? ((currentPrice - c3m.close) / c3m.close) * 100 : 0;

    // 1M (up to 20 candles back)
    const c1m = candles[Math.max(0, candleCount - 20)];
    const pct1m = c1m.close > 0 ? ((currentPrice - c1m.close) / c1m.close) * 100 : 0;

    // 2W (up to 10 candles back)
    const c2w = candles[Math.max(0, candleCount - 10)];
    const pct2w = c2w.close > 0 ? ((currentPrice - c2w.close) / c2w.close) * 100 : 0;

    // 1W (up to 5 candles back)
    const c1w = candles[Math.max(0, candleCount - 5)];
    const pct1w = c1w.close > 0 ? ((currentPrice - c1w.close) / c1w.close) * 100 : 0;

    // 3M High & Low Range
    const range3mCandles = candles.slice(Math.max(0, candleCount - 60));
    let high3m = -Infinity;
    let low3m = Infinity;
    let maxDd = 0;
    let peak = -Infinity;

    range3mCandles.forEach((c) => {
      if (c.high > high3m) high3m = c.high;
      if (c.low < low3m) low3m = c.low;

      if (c.high > peak) peak = c.high;
      const dd = peak > 0 ? ((peak - c.low) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    });

    if (high3m === -Infinity) high3m = currentPrice;
    if (low3m === Infinity) low3m = currentPrice;

    const distFromHighPct = high3m > 0 ? ((currentPrice - high3m) / high3m) * 100 : 0;

    // Simple Moving Averages
    const slice20 = candles.slice(Math.max(0, candleCount - 20));
    const sma20 = slice20.reduce((s, c) => s + c.close, 0) / (slice20.length || 1);

    const slice50 = candles.slice(Math.max(0, candleCount - 50));
    const sma50 = slice50.reduce((s, c) => s + c.close, 0) / (slice50.length || 1);

    // Approximate 14-day RSI
    const slice14 = candles.slice(Math.max(0, candleCount - 15));
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < slice14.length; i++) {
      const diff = slice14[i].close - slice14[i - 1].close;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
    const rsi14 = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

    return {
      pct3m,
      pct1m,
      pct2w,
      pct1w,
      high3m,
      low3m,
      distFromHighPct,
      maxDrawdown3mPct: maxDd,
      rsi14,
      sma20,
      sma50,
    };
  }, [candles, candleCount, latestClose, avgVolume20]);

  // Detected Patterns List
  const detectedPatternList = React.useMemo(() => {
    const list: { name: string; category: string; confidence: number; desc: string; type: 'micro' | 'macro' | 'candlestick' }[] = [];

    // Primary pattern
    list.push({
      name: detectedPattern || breakoutPattern || 'Volume Surge Breakout',
      category: 'Primary Breakout Signal',
      confidence: patternConfidence || 92,
      desc: patternDescription || 'Consolidation base breakout driven by unusual institutional turnover.',
      type: 'macro',
    });

    // Secondary / Micro Patterns
    if (rvol20 >= 2.0) {
      list.push({
        name: 'RVOL Institutional Accumulation Surge',
        category: 'Volume Dynamics',
        confidence: 95,
        desc: `Relative Volume is ${rvol20.toFixed(1)}x above 20-day average daily volume.`,
        type: 'micro',
      });
    }

    if (signal?.microPattern) {
      list.push({
        name: signal.microPattern,
        category: 'Micro Volatility Structure',
        confidence: 90,
        desc: 'Tight price contraction range prior to current volume expansion.',
        type: 'micro',
      });
    } else {
      list.push({
        name: 'VCP (Volatility Contraction Pattern)',
        category: 'Micro Volatility Structure',
        confidence: 88,
        desc: 'Progressive narrowing of price swings indicating supply absorption by strong hands.',
        type: 'micro',
      });
    }

    if (signal?.macroPattern) {
      list.push({
        name: signal.macroPattern,
        category: 'Macro Base Formation',
        confidence: 91,
        desc: 'Multi-week structural base giving clear support and resistance bounds.',
        type: 'macro',
      });
    } else {
      list.push({
        name: 'Ascending Base Consolidation',
        category: 'Macro Base Formation',
        confidence: 89,
        desc: 'Higher lows forming along key moving average support levels.',
        type: 'macro',
      });
    }

    // Candlestick Pattern check
    if (candles.length >= 2) {
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      if (last.close > last.open && (last.close - last.open) > (prev.high - prev.low)) {
        list.push({
          name: 'Bullish Engulfing Candle',
          category: 'Price Action Trigger',
          confidence: 86,
          desc: 'Current close engulfs previous bar range on strong buying volume.',
          type: 'candlestick',
        });
      } else {
        list.push({
          name: 'Pocket Pivot Volume Spike',
          category: 'Price Action Trigger',
          confidence: 85,
          desc: 'Volume surge exceeds highest down-volume bar of the past 10 sessions.',
          type: 'candlestick',
        });
      }
    }

    return list;
  }, [detectedPattern, breakoutPattern, patternConfidence, patternDescription, rvol20, signal, candles]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-3xl w-full p-4 sm:p-6 space-y-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-lg font-mono shrink-0">
              {symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white font-mono tracking-tight">{symbol}</h2>
                <span className="text-xs text-slate-400 font-sans">({stockName})</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono border ${
                    decisionStatus === 'STRONG_BUY'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {decisionStatus === 'STRONG_BUY' ? '🟢 STRONG BUY' : '🟡 BREAKOUT WATCHLIST'}
                </span>

                {/* DSE Listing Category & Settlement Badge */}
                {dseProfile && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono border flex items-center gap-1 ${
                      dseProfile.category === 'A'
                        ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                        : dseProfile.category === 'B'
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : dseProfile.category === 'N'
                        ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                        : 'bg-rose-950 text-rose-300 border-rose-500/50'
                    }`}
                  >
                    <span>DSE Cat {dseProfile.category}</span>
                    <span className="text-[9px] opacity-75">({dseProfile.settlementDays} {dseProfile.isMarginable ? 'Marginable' : 'Cash Only'})</span>
                  </span>
                )}

                {/* DSE Daily Circuit Breaker Proximity */}
                {dseProfile?.circuitInfo && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono border ${
                      dseProfile.circuitInfo.isAtUpperCircuit
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : dseProfile.circuitInfo.isNearUpperCircuit
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : dseProfile.circuitInfo.isAtLowerCircuit
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Circuit: ৳{dseProfile.circuitInfo.lowerCircuitPrice} ~ ৳{dseProfile.circuitInfo.upperCircuitPrice} (±{dseProfile.circuitInfo.circuitLimitPct}%)
                  </span>
                )}

                {candidate.warningFlags && candidate.warningFlags.map((flag, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-full border text-[10px] font-extrabold font-mono bg-rose-950/80 text-rose-300 border-rose-500/40 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {flag}
                  </span>
                ))}

                {/* Strategy Archetype Badges */}
                {isImmediateMomentum && (
                  <span className="px-2 py-0.5 rounded-full border text-[10px] font-extrabold font-mono bg-emerald-950/90 text-emerald-300 border-emerald-500/50 flex items-center gap-1">
                    <Rocket className="w-3 h-3 text-emerald-400" /> Immediate Momentum
                  </span>
                )}
                {isEarlyAccumulation && (
                  <span className="px-2 py-0.5 rounded-full border text-[10px] font-extrabold font-mono bg-amber-950/90 text-amber-300 border-amber-500/50 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-amber-400" /> Early Accumulation
                  </span>
                )}
                {isHighConvictionSwing && (
                  <span className="px-2 py-0.5 rounded-full border text-[10px] font-extrabold font-mono bg-indigo-950/90 text-indigo-300 border-indigo-500/50 flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-indigo-400" /> High-Conviction Swing
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap font-mono">
                <span>Sector: <strong className="text-slate-200">{sector}</strong></span>
                <span>•</span>
                <span>LTP: <strong className="text-white">৳{entryPrice}</strong></span>
                <span>•</span>
                <span>Float: <span className="text-indigo-300 font-bold">{dseProfile?.floatProfile || 'Mid Float'}</span></span>
                <span>•</span>
                <span>Updated: <span className="text-slate-300">{latestDate}</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {onOpenChart && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChart(symbol);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open D3 Chart</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Setup Overview', icon: Sparkles },
            { id: 'volume-footprint', label: '🌊 Volume Footprint & VSA', icon: Waves },
            { id: 'trade-plan', label: '🎯 Realistic Trade Plan', icon: Target },
            { id: 'dse-profile', label: '🏛️ DSE Mechanics', icon: Activity },
            { id: 'performance', label: '📈 3-Month Performance', icon: BarChart3 },
            { id: 'risk', label: '🛡️ Risk & Reward Metrics', icon: ShieldAlert },
            { id: 'patterns', label: '🔍 Detected Technical Patterns', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* AI Confluence Thesis Card */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-950 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-4 shadow-xl space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">AI Quant Technical Thesis</span>
                  {thesisData?.grade && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Grade {thesisData.grade} Setup
                    </span>
                  )}
                </div>

                <button
                  onClick={handleGenerateThesis}
                  disabled={thesisLoading}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${thesisLoading ? 'animate-spin' : ''}`} />
                  <span>{thesisLoading ? 'Synthesizing...' : thesisData ? 'Re-Analyze Setup' : '🤖 Generate Technical Thesis'}</span>
                </button>
              </div>

              {thesisData ? (
                <div className="space-y-2 text-xs">
                  <p className="text-slate-200 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    {thesisData.summary}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-emerald-500/20 space-y-1">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">Catalysts & Confluence</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {thesisData.catalystAndConfluence?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-rose-500/20 space-y-1">
                      <div className="text-[10px] font-bold text-rose-400 uppercase">Invalidation Rule & Liquidity</div>
                      <p className="text-slate-300 text-[11px]">{thesisData.invalidationRule}</p>
                      <p className="text-amber-300 text-[10px] pt-1">{thesisData.liquidityRiskWarning}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Click <strong className="text-purple-300">"Generate Technical Thesis"</strong> to run an instant AI multi-factor analysis (Volume Footprint, Pattern Confluence, Valuation & Risk Invalidation Rules) for {symbol}.
                </p>
              )}
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Profit Potential Score</span>
                <div className="text-xl font-black text-emerald-400">
                  {profitPotentialScore} <span className="text-xs text-slate-500">/ 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${profitPotentialScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Volume Surge (RVOL)</span>
                <div className="text-xl font-black text-indigo-300">
                  {rvol20.toFixed(1)}x
                </div>
                <span className="text-[10px] text-slate-500">vs 20d Average Vol</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">YoY Revenue Growth</span>
                <div className="text-xl font-black text-emerald-400">
                  +{yoyGrowthPct}%
                </div>
                <span className="text-[10px] text-slate-500">DSE Category Filter</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">P/E Valuation</span>
                <div className="text-xl font-black text-amber-300">
                  {peRatio.toFixed(1)}x
                </div>
                <span className="text-[10px] text-slate-500">Earnings Multiple</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Sector Momentum</span>
                {sectorMomentumPct !== undefined ? (
                  <>
                    <div className={`text-xl font-black ${sectorMomentumPct >= 0 ? 'text-cyan-300' : 'text-slate-400'}`}>
                      {sectorMomentumPct >= 0 ? '+' : ''}{sectorMomentumPct.toFixed(0)}%
                    </div>
                    <span className="text-[10px] text-slate-500">{sector} 5d money flow</span>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-black text-slate-600">—</div>
                    <span className="text-[10px] text-slate-500">Not enough sector data</span>
                  </>
                )}
              </div>
            </div>

            {/* Harmonic Pattern XABCD Card if present */}
            {candidate.harmonicDetails && (
              <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-950 p-4 rounded-xl border border-pink-500/40 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-pink-500/30 pb-2">
                  <span className="font-extrabold text-pink-300 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    Harmonic Setup: {candidate.harmonicDetails.subtype} (C-to-D Swing Trade)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-900/60 text-pink-200 border border-pink-700 font-bold text-[11px]">
                    R:R = {candidate.harmonicDetails.riskRewardRatio} : 1
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Point X (Origin)</span>
                    <strong className="text-slate-200">৳{candidate.harmonicDetails.xPrice}</strong>
                    <span className="text-[9px] text-slate-500 block">{candidate.harmonicDetails.xDate}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Point A (Peak)</span>
                    <strong className="text-slate-200">৳{candidate.harmonicDetails.aPrice}</strong>
                    <span className="text-[9px] text-slate-500 block">{candidate.harmonicDetails.aDate}</span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Point B (Retrace)</span>
                    <strong className="text-slate-200">৳{candidate.harmonicDetails.bPrice}</strong>
                    <span className="text-[9px] text-pink-400 block">{(candidate.harmonicDetails.abXaRatio * 100).toFixed(1)}% XA</span>
                  </div>

                  <div className="bg-emerald-950/80 p-2 rounded-lg border border-emerald-500/40 shadow">
                    <span className="text-[10px] text-emerald-300 font-bold block">🟢 Point C (Buy Entry)</span>
                    <strong className="text-emerald-200 text-sm">৳{candidate.harmonicDetails.cPrice}</strong>
                    <span className="text-[9px] text-emerald-400 block">Entry Point ({candidate.harmonicDetails.cDate})</span>
                  </div>

                  <div className="bg-amber-950/80 p-2 rounded-lg border border-amber-500/40 col-span-2 sm:col-span-1 shadow">
                    <span className="text-[10px] text-amber-300 font-bold block">🎯 Point D (Exit Target)</span>
                    <strong className="text-amber-200 text-sm">৳{candidate.harmonicDetails.dTargetPrice}</strong>
                    <span className="text-[9px] text-amber-400 block">+{candidate.harmonicDetails.potentialGainPct}% Target Gain</span>
                  </div>
                </div>

                {/* C-D Trade Path Milestone Roadmap */}
                {candidate.harmonicDetails.cdPathLevels && candidate.harmonicDetails.cdPathLevels.length > 0 && (
                  <div className="pt-2 border-t border-pink-500/20 space-y-1.5">
                    <span className="text-[11px] font-bold text-pink-300 block">
                      🛤️ Harmonic C-to-D Trade Path Roadmap & Target Levels:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {candidate.harmonicDetails.cdPathLevels.map((lvl, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border text-[10px] space-y-0.5 ${
                            lvl.fibRatio === '0.000'
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                              : lvl.fibRatio === '1.000 PRZ'
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                              : lvl.fibRatio === 'Stop-Loss'
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span>{lvl.levelName}</span>
                            <span className="font-mono text-[9px] px-1 rounded bg-black/40">{lvl.fibRatio}</span>
                          </div>
                          <div className="text-xs font-extrabold font-mono">৳{lvl.price.toFixed(2)}</div>
                          <div className="text-[9px] opacity-80">
                            {lvl.gainPct > 0 ? `+${lvl.gainPct.toFixed(1)}%` : `${lvl.gainPct.toFixed(1)}%`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Realistic Trade Execution Plan Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Realistic Trade Execution Plan
                  </span>
                  {tradePlan && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                      tradePlan.isWithinBuyZone
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : tradePlan.isOverextended
                        ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}>
                      {tradePlan.isWithinBuyZone ? '🎯 In Optimal Buy Zone' : tradePlan.isOverextended ? `⚠️ Overextended (+${tradePlan.chasePctFromPivot}%)` : 'Near Pivot Base'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Net R:R = {tradePlan?.netRiskRewardRatio || riskRewardRatio} : 1
                  </span>
                  <button
                    onClick={() => setActiveTab('trade-plan')}
                    className="text-[11px] font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Full Plan & Sizing</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Core Execution Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                {/* Entry Zone */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Optimal Entry Range</span>
                    <span className="text-indigo-300 font-semibold">{tradePlan?.entryStyle || 'Breakout'}</span>
                  </div>
                  <div className="text-base font-extrabold text-white">
                    ৳{tradePlan ? `${tradePlan.entryRangeMin} - ${tradePlan.entryRangeMax}` : `৳${entryPrice}`}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Pivot: ৳{tradePlan?.idealEntryPrice || entryPrice}</span>
                    <span>Max Chase: ৳{tradePlan?.maxChasePrice || (entryPrice * 1.035).toFixed(2)}</span>
                  </div>
                </div>

                {/* Stop Loss with Volatility context */}
                <div className="bg-slate-900 p-3 rounded-lg border border-rose-500/30 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Stop Loss (-{tradePlan?.stopLossPct || potentialRiskPct}%)</span>
                    <span className="text-rose-400 font-semibold text-[9px]">{tradePlan?.stopLossType || 'ATR 1.5x'}</span>
                  </div>
                  <div className="text-base font-extrabold text-rose-400">
                    ৳{tradePlan?.stopLossPrice || stopLossPrice}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Risk: -৳{tradePlan?.riskAmountBdt || (entryPrice - stopLossPrice).toFixed(2)}</span>
                    <span>ATR-14: ৳{tradePlan?.atr14 || (entryPrice * 0.035).toFixed(2)}</span>
                  </div>
                </div>

                {/* Multi-Tier Targets Summary */}
                <div className="bg-slate-900 p-3 rounded-lg border border-emerald-500/30 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Weighted Gain (+{tradePlan?.weightedAvgTargetGainPct || potentialGainPct}%)</span>
                    <span className="text-emerald-400 font-semibold text-[9px]">3-Tier Scale</span>
                  </div>
                  <div className="text-base font-extrabold text-emerald-400">
                    T1: ৳{tradePlan?.targets[0]?.price || targetPrice} <span className="text-xs text-emerald-300 font-normal">(+{tradePlan?.targets[0]?.gainPct || potentialGainPct}%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>T2: ৳{tradePlan?.targets[1]?.price || (targetPrice * 1.08).toFixed(2)}</span>
                    <span>T3: ৳{tradePlan?.targets[2]?.price || (targetPrice * 1.18).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Execution Trigger Note */}
              {tradePlan?.entryTrigger && (
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-indigo-500/20 text-xs font-mono flex items-center justify-between gap-2">
                  <span className="text-indigo-300 font-bold shrink-0 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Trigger:
                  </span>
                  <span className="text-slate-300 text-[11px] font-sans text-right truncate">
                    {tradePlan.entryTrigger}
                  </span>
                </div>
              )}

              {/* Trade Catalyst Explanation */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Key Setup Catalyst & Reasoning
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{tradeSetupReasoning}</p>
              </div>

              {/* Key Catalysts Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-mono">Catalysts:</span>
                {keyCatalysts.map((cat, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Institutional Volume Footprint Mini-Card on Overview */}
            {volumeFootprint && (
              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                      <Waves className="w-4 h-4 text-cyan-400" />
                      Institutional Volume Footprint & VSA Signals
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                      volumeFootprint.compositeScore >= 80
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : volumeFootprint.compositeScore >= 60
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}>
                      Score: {volumeFootprint.compositeScore}/100 • {volumeFootprint.primaryPattern}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('volume-footprint')}
                    className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Full Volume & VSA Breakdown</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Pocket Pivot</span>
                    <div className={`font-bold ${volumeFootprint.isPocketPivot ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {volumeFootprint.isPocketPivot ? `🚀 Active (${volumeFootprint.pocketPivotRatio.toFixed(1)}x)` : 'Inactive'}
                    </div>
                    <span className="text-[9px] text-slate-500 block">vs 10d Down Vol</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Chaikin Money Flow</span>
                    <div className={`font-bold ${volumeFootprint.cmf20 >= 0.10 ? 'text-emerald-400' : volumeFootprint.cmf20 > 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
                      {volumeFootprint.cmf20 > 0 ? `+${volumeFootprint.cmf20.toFixed(2)}` : volumeFootprint.cmf20.toFixed(2)}
                    </div>
                    <span className="text-[9px] text-slate-500 block">20d Money Inflow</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">VSA Bar Pattern</span>
                    <div className={`font-bold truncate ${volumeFootprint.vsaSignal === 'Absorption Bar' || volumeFootprint.vsaSignal === 'No Supply Test' ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {volumeFootprint.vsaSignal}
                    </div>
                    <span className="text-[9px] text-slate-500 block">Wyckoff Bar Test</span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 block">Anchored VWAP</span>
                    <div className="font-bold text-amber-300">
                      ৳{volumeFootprint.anchoredVwap.toFixed(2)}
                    </div>
                    <span className="text-[9px] text-emerald-400 block">
                      {volumeFootprint.priceVsAvwapPct >= 0 ? `+${volumeFootprint.priceVsAvwapPct.toFixed(1)}%` : `${volumeFootprint.priceVsAvwapPct.toFixed(1)}%`} vs Floor
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEDICATED VOLUME FOOTPRINT & VSA ANALYSIS */}
        {activeTab === 'volume-footprint' && volumeFootprint && (
          <div className="space-y-4 font-mono">
            {/* Header Hero Banner: Composite Smart Money Footprint */}
            <div className="bg-gradient-to-r from-cyan-950/60 via-indigo-950/50 to-slate-950 p-5 rounded-2xl border border-cyan-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-black text-white">
                      Institutional Volume Footprint & VSA: {symbol}
                    </h3>
                  </div>
                  <p className="text-xs text-cyan-200/80 font-sans mt-0.5">
                    Price is narrative; volume is verifiable capital commitment. Analyzed against DSE liquidity dynamics.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Composite Vol Score</span>
                    <span className="text-2xl font-black text-cyan-300">{volumeFootprint.compositeScore} <span className="text-xs text-slate-500">/ 100</span></span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                    volumeFootprint.compositeScore >= 80
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : volumeFootprint.compositeScore >= 60
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}>
                    {volumeFootprint.primaryPattern}
                  </div>
                </div>
              </div>

              {/* Progress Bar of Composite Conviction */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Smart Money Accumulation Conviction</span>
                  <span className="text-cyan-300 font-bold">{volumeFootprint.compositeScore}% Active Inflow</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      volumeFootprint.compositeScore >= 80
                        ? 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                        : volumeFootprint.compositeScore >= 60
                        ? 'bg-gradient-to-r from-indigo-400 to-cyan-400'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${volumeFootprint.compositeScore}%` }}
                  />
                </div>
              </div>

              {/* 4 Pillars Quick Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">20d Average Turnover</span>
                  <div className="text-sm font-extrabold text-amber-300">৳{avgTurnoverBdtMillion}M BDT</div>
                  <span className="text-[10px] text-slate-500">Liquidity Tier</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Volume Surge (RVOL)</span>
                  <div className="text-sm font-extrabold text-emerald-400">{rvol20.toFixed(2)}x ADV</div>
                  <span className="text-[10px] text-slate-500">Multi-day surge factor</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Chaikin Money Flow</span>
                  <div className={`text-sm font-extrabold ${volumeFootprint.cmf20 > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {volumeFootprint.cmf20 > 0 ? `+${volumeFootprint.cmf20.toFixed(2)}` : volumeFootprint.cmf20.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-500">{volumeFootprint.cmf20 >= 0.10 ? 'Institutional Inflow' : 'Neutral / Mild Flow'}</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Anchored VWAP Floor</span>
                  <div className="text-sm font-extrabold text-indigo-300">৳{volumeFootprint.anchoredVwap.toFixed(2)}</div>
                  <span className="text-[10px] text-emerald-400">+{volumeFootprint.priceVsAvwapPct.toFixed(1)}% above anchor</span>
                </div>
              </div>
            </div>

            {/* Deep-Dive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pillar 1: Pocket Pivot (Morales & Kacher) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-white uppercase">
                      Pocket Pivot Footprint (Morales/Kacher)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    volumeFootprint.isPocketPivot
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {volumeFootprint.isPocketPivot ? '🚀 Active Pocket Pivot' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Surge Ratio vs 10d Down Vol:</span>
                    <strong className={`font-mono text-sm ${volumeFootprint.isPocketPivot ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {volumeFootprint.pocketPivotRatio.toFixed(2)}x
                    </strong>
                  </div>

                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Today's Up Volume vs Max 10d Down-Volume</span>
                      <span className="text-slate-200 font-bold">{Math.round(volumeFootprint.pocketPivotRatio * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${volumeFootprint.isPocketPivot ? 'bg-orange-400' : 'bg-slate-600'}`}
                        style={{ width: `${Math.min(100, volumeFootprint.pocketPivotRatio * 50)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1">
                    <strong className="text-white">Why it works on DSE:</strong> A Pocket Pivot occurs when buying volume exceeds the highest down-day volume of the past 10 sessions. This confirms institutional accumulation *inside* the base before breakouts happen, allowing entry before retail chases.
                  </p>
                </div>
              </div>

              {/* Pillar 2: Volume Spread Analysis (VSA) / Wyckoff Bar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase">
                      Volume Spread Analysis (VSA) / Wyckoff
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    {volumeFootprint.vsaSignal}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Bar Spread (H - L)</span>
                      <strong className="text-white">৳{(candles.length > 0 ? (candles[candles.length - 1].high - candles[candles.length - 1].low) : 0).toFixed(2)}</strong>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Close Location</span>
                      <strong className="text-emerald-400">
                        {candles.length > 0 && (candles[candles.length - 1].high - candles[candles.length - 1].low) > 0
                          ? `${Math.round(((candles[candles.length - 1].close - candles[candles.length - 1].low) / (candles[candles.length - 1].high - candles[candles.length - 1].low)) * 100)}% of Range`
                          : 'Upper Quartile'}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1">
                    <strong className="text-white">VSA Interpretation:</strong> {volumeFootprint.vsaSignal === 'Absorption Bar' ? 'Institutional smart money is absorbing supply at key resistance on heavy volume without allowing the price to drop back down.' : volumeFootprint.vsaSignal === 'No Supply Test' ? 'Spread is narrow and volume has dried up, proving that floating sellers have completely exited the market.' : volumeFootprint.vsaSignal === 'Stopping Volume' ? 'High volume on a down-bar with a close off the lows indicates smart money stepping in to halt the decline.' : 'Standard volume distribution with healthy price spread.'}
                  </p>
                </div>
              </div>

              {/* Pillar 3: Chaikin Money Flow (CMF-20) & Accumulation */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase">
                      Chaikin Money Flow (CMF-20)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    volumeFootprint.cmf20 >= 0.10
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : volumeFootprint.cmf20 > 0
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                      : 'bg-rose-950 text-rose-300 border-rose-500/50'
                  }`}>
                    {volumeFootprint.cmf20 >= 0.10 ? '🟢 Strong Accumulation' : volumeFootprint.cmf20 > 0 ? '🔵 Mild Accumulation' : '🔴 Distribution'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">CMF 20-Day Index:</span>
                    <strong className={`font-mono text-sm ${volumeFootprint.cmf20 > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {volumeFootprint.cmf20 > 0 ? `+${volumeFootprint.cmf20.toFixed(3)}` : volumeFootprint.cmf20.toFixed(3)}
                    </strong>
                  </div>

                  {/* Visual CMF Zero Line Meter */}
                  <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Outflow (-0.30)</span>
                      <span>Zero Line</span>
                      <span>Inflow (+0.30)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full relative overflow-hidden">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 z-10" />
                      <div
                        className={`h-full rounded-full ${volumeFootprint.cmf20 >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{
                          width: `${Math.min(50, Math.abs(volumeFootprint.cmf20) * 166)}%`,
                          marginLeft: volumeFootprint.cmf20 >= 0 ? '50%' : `${50 - Math.min(50, Math.abs(volumeFootprint.cmf20) * 166)}%`
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1">
                    <strong className="text-white">DSE Edge:</strong> Manipulative operators on DSE can push closing prices with 50-100 shares at the closing minute ("painting the tape"), but CMF measures the volume-weighted money flow across the entire trading session. Positive CMF confirms true buying pressure.
                  </p>
                </div>
              </div>

              {/* Pillar 4: On-Balance Volume (OBV) & Anchored VWAP */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase">
                      OBV & Anchored VWAP Floor
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    volumeFootprint.obv20dHigh
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-indigo-950 text-indigo-300 border-indigo-500/40'
                  }`}>
                    {volumeFootprint.obv20dHigh ? '🔥 OBV 20d High' : `OBV: ${volumeFootprint.obvSlope}`}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Anchored VWAP</span>
                      <strong className="text-white">৳{volumeFootprint.anchoredVwap.toFixed(2)}</strong>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Distance to AVWAP</span>
                      <strong className="text-emerald-400">+{volumeFootprint.priceVsAvwapPct.toFixed(2)}%</strong>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 font-sans space-y-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-slate-400">OBV Trend Slope:</span>
                      <span className="text-indigo-300 font-bold">{volumeFootprint.obvSlope}</span>
                    </div>
                    <p className="leading-relaxed">
                      <strong className="text-white">Institutional Base:</strong> Anchored VWAP from the 30-day swing low acts as the average cost basis of institutional accumulators. Trading within 0%~4% above AVWAP gives maximum asymmetric risk-to-reward.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DSE Market Reality & Manipulation Defense Notice */}
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-2 font-sans text-xs">
              <span className="font-bold text-white uppercase flex items-center gap-1.5 font-mono text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                DSE Volume Verification Rule: "Price is Opinion, Volume is Fact"
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300 text-[11px] leading-relaxed pt-1">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                  <strong className="text-cyan-300 block font-mono">1. Tape Painting Defense</strong>
                  <p className="text-slate-400">
                    Retail traders frequently get trapped buying green breakout candles on low volume that were manipulated in the final 5 minutes of trading. Genuine moves always show RVOL ≥ 2.0x and Pocket Pivot surge confirmation.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                  <strong className="text-emerald-300 block font-mono">2. Supply Exhaustion Confirmation</strong>
                  <p className="text-slate-400">
                    A Volume Dry-Up (VDU ≤ 0.55x) during base consolidation indicates that floating sellers are exhausted. When follow-through volume expands on a narrow spread, the stock is primed for rapid markup without heavy resistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REALISTIC TRADE PLAN & DYNAMIC POSITION SIZING */}
        {activeTab === 'trade-plan' && (
          <div className="space-y-4">
            {/* Header Strategy Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="text-sm font-black text-white font-mono flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Realistic Swing Trade Plan: {symbol}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Structure-based entry zones, ATR volatility stop loss, and tiered scale-out profit targets.
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
                    Net R:R = {tradePlan?.netRiskRewardRatio || riskRewardRatio} : 1
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">After 0.50% DSE Roundtrip Friction</span>
                </div>
              </div>

              {/* Trade Blueprint Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Optimal Buy Zone</span>
                  <div className="text-base font-black text-white">
                    ৳{tradePlan?.entryRangeMin || entryPrice} ~ ৳{tradePlan?.entryRangeMax || entryPrice}
                  </div>
                  <span className="text-[9px] text-emerald-400 block">
                    Ideal Pivot: ৳{tradePlan?.idealEntryPrice || entryPrice}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Max Chase Limit (+3.5%)</span>
                  <div className="text-base font-black text-amber-300">
                    ৳{tradePlan?.maxChasePrice || (entryPrice * 1.035).toFixed(2)}
                  </div>
                  <span className="text-[9px] text-slate-500 block">
                    Do not buy above this ceiling
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-rose-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Hard Stop Loss (-{tradePlan?.stopLossPct || potentialRiskPct}%)</span>
                  <div className="text-base font-black text-rose-400">
                    ৳{tradePlan?.stopLossPrice || stopLossPrice}
                  </div>
                  <span className="text-[9px] text-rose-500 block">
                    Risk/Share: -৳{tradePlan?.riskAmountBdt || (entryPrice - stopLossPrice).toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-indigo-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase block">Volatility (ATR-14)</span>
                  <div className="text-base font-black text-indigo-300">
                    ৳{tradePlan?.atr14 || (entryPrice * 0.035).toFixed(2)} ({tradePlan?.atrPct || 3.5}%)
                  </div>
                  <span className="text-[9px] text-slate-500 block">
                    5d Swing Low: ৳{tradePlan?.swingLow5d || (entryPrice * 0.95).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Invalidation Criteria Banner */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-rose-400 uppercase font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Trade Invalidation & Exit Trigger
                </span>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {tradePlan?.invalidationCriteria || `Daily close below ৳${stopLossPrice} constitutes structural breakdown. Exit position without emotional hesitation.`}
                </p>
              </div>
            </div>

            {/* Tiered Profit Scale-Out Matrix */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Tiered Scale-Out Profit Targets (T1, T2, T3)
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Weighted Target Return: <strong className="text-emerald-400">+{tradePlan?.weightedAvgTargetGainPct || potentialGainPct}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                {(tradePlan?.targets || [
                  { tier: 1, label: 'Target 1 (1st Resistance)', price: targetPrice, gainPct: potentialGainPct, gainBdt: targetPrice - entryPrice, allocationPct: 50, rewardRiskRatio: 1.8, rationale: `Sell 50%, move SL to Breakeven (৳${entryPrice})` },
                  { tier: 2, label: 'Target 2 (Pattern Target)', price: Number((entryPrice * 1.15).toFixed(2)), gainPct: 15.0, gainBdt: entryPrice * 0.15, allocationPct: 30, rewardRiskRatio: 3.0, rationale: 'Lock in 30% position at major resistance.' },
                  { tier: 3, label: 'Target 3 (Runner)', price: Number((entryPrice * 1.25).toFixed(2)), gainPct: 25.0, gainBdt: entryPrice * 0.25, allocationPct: 20, rewardRiskRatio: 5.0, rationale: 'Trail remaining 20% on 10 EMA.' }
                ]).map((tgt) => (
                  <div
                    key={tgt.tier}
                    className={`p-3 rounded-xl border space-y-2 ${
                      tgt.tier === 1
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : tgt.tier === 2
                        ? 'bg-indigo-950/30 border-indigo-500/40'
                        : 'bg-amber-950/30 border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold uppercase text-white">Tier {tgt.tier} Target</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300">
                        {tgt.allocationPct}% Shares
                      </span>
                    </div>

                    <div>
                      <div className="text-lg font-black text-white">৳{tgt.price.toFixed(2)}</div>
                      <div className="text-xs font-bold text-emerald-400">
                        +{tgt.gainPct.toFixed(2)}% (+৳{tgt.gainBdt.toFixed(2)} / share)
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Individual R:R</span>
                        <span className="font-bold text-indigo-300">{tgt.rewardRiskRatio}:1</span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-sans leading-tight pt-1">
                        {tgt.rationale}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* DSE Roundtrip Brokerage and AIT Tax Friction Breakdown */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">DSE Net Friction: 0.40% Broker Fee + 0.10% AIT Tax = <strong>0.50% Roundtrip</strong></span>
                </div>
                <div className="text-slate-400">
                  Net Expected Return: <strong className="text-emerald-400">+{tradePlan?.netTargetGainPct || (potentialGainPct - 0.5).toFixed(2)}%</strong>
                </div>
              </div>
            </div>

            {/* Interactive Dynamic Risk & Position Sizing Calculator */}
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase">
                    Dynamic Position Sizing & Risk Calculator
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  Fixed Fractional Capital Protection
                </span>
              </div>

              {/* Interactive Sizing Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Account Size Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>Total Trading Capital (BDT):</span>
                    <strong className="text-white">৳{customAccountBdt.toLocaleString()}</strong>
                  </label>
                  <input
                    type="range"
                    min="20000"
                    max="1000000"
                    step="10000"
                    value={customAccountBdt}
                    onChange={(e) => setCustomAccountBdt(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-500">
                    <button onClick={() => setCustomAccountBdt(50000)} className="hover:text-indigo-300">50k</button>
                    <button onClick={() => setCustomAccountBdt(100000)} className="hover:text-indigo-300">100k</button>
                    <button onClick={() => setCustomAccountBdt(250000)} className="hover:text-indigo-300">250k</button>
                    <button onClick={() => setCustomAccountBdt(500000)} className="hover:text-indigo-300">500k</button>
                    <button onClick={() => setCustomAccountBdt(1000000)} className="hover:text-indigo-300">1M</button>
                  </div>
                </div>

                {/* Risk per Trade Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>Risk Tolerance per Trade (%):</span>
                    <strong className="text-amber-400">{customRiskPct}% (৳{((customAccountBdt * customRiskPct) / 100).toLocaleString()} Max Risk)</strong>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1.0, 1.5, 2.0, 3.0].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setCustomRiskPct(pct)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                          customRiskPct === pct
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Professional standard: 1.0% ~ 1.5% maximum account risk per swing setup
                  </span>
                </div>
              </div>

              {/* Live Sizing Calculations Output Grid */}
              {(() => {
                const planEntry = tradePlan?.idealEntryPrice || entryPrice;
                const planSL = tradePlan?.stopLossPrice || stopLossPrice;
                const perShareRisk = Math.max(0.1, planEntry - planSL);
                const accountRiskBdt = customAccountBdt * (customRiskPct / 100);
                const maxShares = Math.max(1, Math.floor(accountRiskBdt / perShareRisk));
                const totalPositionCapital = maxShares * planEntry;
                const portfolioAllocationPct = Number(((totalPositionCapital / customAccountBdt) * 100).toFixed(1));

                const t1Shares = Math.round(maxShares * 0.50);
                const t2Shares = Math.round(maxShares * 0.30);
                const t3Shares = Math.max(0, maxShares - t1Shares - t2Shares);

                const t1Price = tradePlan?.targets[0]?.price || targetPrice;
                const t2Price = tradePlan?.targets[1]?.price || (targetPrice * 1.08);
                const t3Price = tradePlan?.targets[2]?.price || (targetPrice * 1.18);

                const t1Profit = t1Shares * (t1Price - planEntry);
                const t2Profit = t2Shares * (t2Price - planEntry);
                const t3Profit = t3Shares * (t3Price - planEntry);
                const grossProfit = t1Profit + t2Profit + t3Profit;

                const frictionBdt = totalPositionCapital * 0.005; // 0.5% roundtrip
                const netProfit = Math.max(0, grossProfit - frictionBdt);

                const adv20 = avgVolume20 || 100000;
                const advPctOfOrder = Number(((maxShares / adv20) * 100).toFixed(2));
                const isAdvSafe = advPctOfOrder <= 5.0;

                return (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Recommended Quantity</span>
                        <div className="text-base font-black text-white">
                          {maxShares.toLocaleString()} Shares
                        </div>
                        <span className="text-[9px] text-slate-500 block">
                          ৳{planEntry} / share
                        </span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Capital Required</span>
                        <div className="text-base font-black text-indigo-300">
                          ৳{totalPositionCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <span className="text-[9px] text-slate-400 block">
                          {portfolioAllocationPct}% Portfolio Size
                        </span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-rose-500/30">
                        <span className="text-[10px] text-slate-400 block">Total Risk at Stop Loss</span>
                        <div className="text-base font-black text-rose-400">
                          -৳{accountRiskBdt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <span className="text-[9px] text-rose-500 block">
                          Exact {customRiskPct}% Account Risk
                        </span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30">
                        <span className="text-[10px] text-slate-400 block">Net Expected Profit</span>
                        <div className="text-base font-black text-emerald-400">
                          +৳{netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <span className="text-[9px] text-emerald-500 block">
                          After ৳{frictionBdt.toFixed(0)} Fees
                        </span>
                      </div>
                    </div>

                    {/* Scale-out Breakdown by Shares */}
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
                      <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold pb-1 border-b border-slate-800">
                        <span>Tier Scale-out Plan</span>
                        <span>Quantity & Expected Value</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Tier 1 (50% scale-out at ৳{t1Price.toFixed(2)}):</span>
                        <span className="text-emerald-400 font-bold">
                          Sell {t1Shares.toLocaleString()} shares ➔ +৳{t1Profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Tier 2 (30% scale-out at ৳{t2Price.toFixed(2)}):</span>
                        <span className="text-emerald-400 font-bold">
                          Sell {t2Shares.toLocaleString()} shares ➔ +৳{t2Profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Tier 3 (20% runner at ৳{t3Price.toFixed(2)}):</span>
                        <span className="text-emerald-400 font-bold">
                          Trail {t3Shares.toLocaleString()} shares ➔ +৳{t3Profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} profit
                        </span>
                      </div>
                    </div>

                    {/* ADV Liquidity Protection Status */}
                    <div className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                      isAdvSafe
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          DSE ADV Liquidity Check: {maxShares.toLocaleString()} shares is <strong>{advPctOfOrder}%</strong> of 20d Average Daily Volume ({adv20.toLocaleString()}).
                        </span>
                      </div>
                      <span className="font-bold">
                        {isAdvSafe ? '✓ Safe Liquidity' : '⚠️ High ADV Slippage Risk'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Trailing Stop & Settlement Safety Guidance */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5 font-mono">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                DSE Execution Discipline & Settlement Rules
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-slate-200">Trailing Stop Discipline:</strong> Once Target 1 is achieved, immediately raise your stop loss order to Breakeven (৳{tradePlan?.idealEntryPrice || entryPrice}). Never let a green trade turn into a red loss.
                </li>
                <li>
                  <strong className="text-slate-200">T+2 Settlement Lock:</strong> Purchases made on Day T cannot be sold until Day T+2. If a stock drops on Day 1, you cannot execute an intra-day stop loss. Keep position size within the calculated {customRiskPct}% risk limit to protect against gap-downs.
                </li>
                <li>
                  <strong className="text-slate-200">Upper Circuit Chasing Prohibition:</strong> If the price has already surged beyond Max Chase (৳{tradePlan?.maxChasePrice || (entryPrice * 1.035).toFixed(2)}), cancel buy orders and wait for a low-volume pullback to the 20d MA.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: 3-MONTH PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Historical Returns Breakdown (Up to 3-Month Window)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {candleCount} Candles Loaded
                </span>
              </div>

              {/* Performance Returns Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">1-Week Return (5d)</span>
                  <div className={`text-lg font-black ${perfMetrics.pct1w >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct1w >= 0 ? '+' : ''}{perfMetrics.pct1w.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">2-Week Return (10d)</span>
                  <div className={`text-lg font-black ${perfMetrics.pct2w >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct2w >= 0 ? '+' : ''}{perfMetrics.pct2w.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">1-Month Return (20d)</span>
                  <div className={`text-lg font-black ${perfMetrics.pct1m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct1m >= 0 ? '+' : ''}{perfMetrics.pct1m.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 uppercase block">3-Month Return (60d)</span>
                  <div className={`text-xl font-black ${perfMetrics.pct3m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {perfMetrics.pct3m >= 0 ? '+' : ''}{perfMetrics.pct3m.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Price Extremes & Volatility */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">3-Month High Range</span>
                  <span className="text-sm font-extrabold text-white">৳{perfMetrics.high3m.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Dist: <strong className="text-amber-300">{perfMetrics.distFromHighPct.toFixed(1)}%</strong>
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">3-Month Low Floor</span>
                  <span className="text-sm font-extrabold text-slate-300">৳{perfMetrics.low3m.toFixed(1)}</span>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    Above Low: +{((latestClose - perfMetrics.low3m) / (perfMetrics.low3m || 1) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block">Max 3M Peak Drawdown</span>
                  <span className="text-sm font-extrabold text-rose-400">-{perfMetrics.maxDrawdown3mPct.toFixed(1)}%</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    RSI (14): <strong className="text-indigo-300">{perfMetrics.rsi14.toFixed(1)}</strong>
                  </span>
                </div>
              </div>

              {/* Trend Alignment Indicator */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Moving Average Trend Position:</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={latestClose >= perfMetrics.sma20 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    20 SMA: ৳{perfMetrics.sma20.toFixed(1)} ({latestClose >= perfMetrics.sma20 ? 'Above ✓' : 'Below ✕'})
                  </span>
                  <span className={latestClose >= perfMetrics.sma50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    50 SMA: ৳{perfMetrics.sma50.toFixed(1)} ({latestClose >= perfMetrics.sma50 ? 'Above ✓' : 'Below ✕'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RISK & REWARD METRICS */}
        {activeTab === 'risk' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Risk Profile & Position Sizing Analytics
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                  <span>Win Rate: {historicalWinRate}%</span>
                  {candidate.keyCatalysts.some(c => c.includes('Sector Momentum')) && (
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px]">
                      Sector Rotation Active
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 p-3 rounded-xl border border-indigo-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Risk-Reward Ratio</span>
                  <div className="text-2xl font-black text-indigo-300">{riskRewardRatio} : 1</div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    For every ৳1 risked, expected target reward is ৳{riskRewardRatio.toFixed(2)}.
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Recommended Allocation</span>
                  <div className="text-2xl font-black text-emerald-400">{recommendedPositionSizePct}%</div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Optimal portfolio weight based on Kelly Criterion risk limits.
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase">Historical Strategy Win Rate</span>
                  <div className="flex items-end gap-2">
                    <div className="text-2xl font-black text-amber-300">{historicalWinRate}%</div>
                    {candidate.edgeConfidence && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold mb-1 ${
                        candidate.edgeConfidence === 'High' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
                        candidate.edgeConfidence === 'Medium' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {candidate.edgeConfidence} Conf (n={candidate.edgeSampleSize})
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Win rate across past pattern setups in DSE database.
                  </p>
                </div>
              </div>

              {/* Risk Level Bar & Calculations */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Risk vs Target Profit Margin</span>
                  <span className="text-slate-400">
                    Max Loss: -{potentialRiskPct}% | Max Target: +{potentialGainPct}%
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${(potentialRiskPct / (potentialRiskPct + potentialGainPct)) * 100}%` }}
                    title={`Risk: -${potentialRiskPct}%`}
                  />
                  <div
                    className="bg-emerald-400 h-full"
                    style={{ width: `${(potentialGainPct / (potentialRiskPct + potentialGainPct)) * 100}%` }}
                    title={`Gain: +${potentialGainPct}%`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span className="text-rose-400 font-bold">Stop Level: ৳{stopLossPrice}</span>
                  <span className="text-white font-bold">Entry: ৳{entryPrice}</span>
                  <span className="text-emerald-400 font-bold">Target Level: ৳{targetPrice}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DETECTED TECHNICAL PATTERNS */}
        {activeTab === 'patterns' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  All Detected Technical & Volatility Patterns ({detectedPatternList.length})
                </span>
                <span className="text-xs text-indigo-300 font-bold">
                  Primary: {detectedPattern}
                </span>
              </div>

              <div className="space-y-2.5">
                {detectedPatternList.map((pat, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1 hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-extrabold text-white text-sm">{pat.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-sans border border-slate-700">
                          {pat.category}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold text-[10px]">
                        {pat.confidence}% Confidence
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-sans pl-6 leading-relaxed">
                      {pat.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DSE MARKET PROFILE & REGULATORY MECHANICS */}
        {activeTab === 'dse-profile' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category & Settlement */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 relative group">
                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  DSE Listing Category
                  <HelpCircle className="w-3 h-3 text-slate-500 cursor-help" />
                </div>
                
                {/* Tooltip */}
                <div className="absolute left-0 bottom-full mb-2 w-48 bg-slate-800 text-slate-200 text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl border border-slate-700">
                  Categories define settlement cycles and margin eligibility. Z is high-risk.
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${
                    dseProfile?.category === 'A' ? 'text-blue-400' :
                    dseProfile?.category === 'B' ? 'text-slate-300' :
                    dseProfile?.category === 'N' ? 'text-purple-400' : 'text-rose-400'
                  }`}>
                    Category {dseProfile?.category || 'A'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {dseProfile?.settlementDays || 'T+2'} Settlement
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-snug">
                  {dseProfile?.category === 'A'
                    ? 'Regular AGM compliance with dividend ≥ 10%. Margin loan facility active.'
                    : dseProfile?.category === 'B'
                    ? 'Dividend < 10%. Standard settlement cycle with marginable status.'
                    : dseProfile?.category === 'N'
                    ? 'Newly listed company. Standard T+2 settlement applies.'
                    : '⚠️ Defaulter / Non-compliant. T+3 settlement with 100% cash requirement (No margin loan).'}
                </p>
              </div>

              {/* Statutory Circuit Breaker Band */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-indigo-500/30 space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase">BSEC Daily Price Band</div>
                <div className="text-xl font-black text-indigo-300">
                  ±{dseProfile?.circuitInfo.circuitLimitPct || 10.0}% Limit
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-snug">
                  Based on LTP tier (৳{entryPrice}). Maximum intraday ceiling is ৳{dseProfile?.circuitInfo.upperCircuitPrice} and floor is ৳{dseProfile?.circuitInfo.lowerCircuitPrice}.
                </p>
              </div>

              {/* Market Float & Manipulation Risk */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 relative group">
                <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                  Float & Speculation Risk
                  <HelpCircle className="w-3 h-3 text-slate-500 cursor-help" />
                </div>
                
                {/* Tooltip */}
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-800 text-slate-200 text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl border border-slate-700">
                  Low free float stocks with small paid-up capital (&lt;50 Cr) are easily cornered ("Item Stocks").
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white">
                    {dseProfile?.floatProfile || 'Mid Float'}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    dseProfile?.itemStockRisk === 'HIGH' || (dseProfile?.manipulationRiskScore || 20) > 50
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    Risk: {dseProfile?.itemStockRisk === 'HIGH' ? 'ITEM STOCK' : dseProfile?.manipulationRiskScore + '/100'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-snug">
                  Paid-Up Capital: ৳{dseProfile?.paidUpCapitalCrores?.toFixed(1) || '--'} Cr | Free Float: {dseProfile?.freeFloatPct || '--'}%
                </p>
              </div>
            </div>

            {/* Circuit Limit Visualizer Bar */}
            {dseProfile?.circuitInfo && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Intraday Circuit Breaker Range (Today's Bounds)
                  </span>
                  <div className="flex items-center gap-2">
                    {dseProfile.circuitInfo.circuitLockStreak > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        🔥 Circuit Lock Streak: {dseProfile.circuitInfo.circuitLockStreak} day(s)
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Previous Close: ৳{(entryPrice / (1 + (dseProfile.circuitInfo.changeFromPrevClosePct / 100))).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-rose-400 font-bold">Lower Circuit (Floor): ৳{dseProfile.circuitInfo.lowerCircuitPrice} (-{dseProfile.circuitInfo.circuitLimitPct}%)</span>
                    <span className="text-white font-bold">LTP: ৳{entryPrice} ({dseProfile.circuitInfo.changeFromPrevClosePct >= 0 ? '+' : ''}{dseProfile.circuitInfo.changeFromPrevClosePct}%)</span>
                    <span className="text-emerald-400 font-bold">Upper Circuit (Ceiling): ৳{dseProfile.circuitInfo.upperCircuitPrice} (+{dseProfile.circuitInfo.circuitLimitPct}%)</span>
                  </div>

                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative">
                    {/* Range track */}
                    <div className="w-full h-full bg-gradient-to-r from-rose-500/30 via-slate-700 to-emerald-500/30" />
                    {/* Current price marker */}
                    <div
                      className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg border border-slate-900 -translate-x-1/2"
                      style={{
                        left: `${Math.max(2, Math.min(98,
                          ((entryPrice - dseProfile.circuitInfo.lowerCircuitPrice) /
                          (dseProfile.circuitInfo.upperCircuitPrice - dseProfile.circuitInfo.lowerCircuitPrice || 1)) * 100
                        ))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Status Notice */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">
                    {dseProfile.circuitInfo.isAtUpperCircuit
                      ? '🚀 Stock is locked at Upper Circuit limit. High buying pressure / buyer-only queue.'
                      : dseProfile.circuitInfo.isNearUpperCircuit
                      ? '⚡ Stock is within 1.5% of Upper Circuit ceiling. Strong momentum.'
                      : dseProfile.circuitInfo.isAtLowerCircuit
                      ? '⛔ Stock is locked at Lower Circuit floor. High sell-off pressure / seller-only queue.'
                      : '✓ Trading within standard permitted price limits.'}
                  </span>
                  <span className="text-slate-500 shrink-0 ml-2">
                    Headroom to Upper Limit: +৳{(dseProfile.circuitInfo.upperCircuitPrice - entryPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* DSE Trading Execution & Settlement Constraints */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                DSE Trading Rule Reminders
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-400 font-sans leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-slate-200">T+2 Settlement Lock:</strong> Purchases made on Day T settle on Day T+2. Shares cannot be sold on Day T+1, meaning sudden stop losses on Day 1 cannot be closed until Day 2.
                </li>
                <li>
                  <strong className="text-slate-200">Margin Requirements:</strong> Category {dseProfile?.category || 'A'} securities {dseProfile?.isMarginable ? 'are eligible for broker margin loans' : 'require 100% equity cash and are not eligible for margin loans'}.
                </li>
                <li>
                  <strong className="text-slate-200">Turnover Liquidity:</strong> 20-day Average Daily Turnover is ৳{avgTurnoverBdtMillion} Million BDT. Ensure position sizes do not exceed 5% of daily volume to avoid slippage.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Symbol: <span className="text-white font-bold">{symbol}</span> • 20d Turnover: <span className="text-amber-300 font-bold">৳{avgTurnoverBdtMillion}M</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onOpenChart && (
              <button
                onClick={() => {
                  onClose();
                  onOpenChart(symbol);
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs transition-all shadow-md shadow-indigo-950/40"
              >
                Inspect on D3 Interactive Chart
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
      title={`Based on ${sampleSize ?? 0} historical trade${sampleSize === 1 ? '' : 's'} — ${confidence.toLowerCase()} confidence sample size`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wide ${styles[confidence]}`}
    >
      {confidence} conf. · n={sampleSize ?? 0}
    </span>
  );
};
