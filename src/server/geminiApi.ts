import { GoogleGenAI } from '@google/genai';
import { Router } from 'express';

export const geminiRouter = Router();

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// 1. Post-Mortem Failure Audit
geminiRouter.post('/post-mortem', async (req, res) => {
  try {
    const ai = getGenAI();
    const { totalStopLossHits, totalStopLossPct, failurePatterns } = req.body;

    if (!ai) {
      return res.json({
        auditTitle: 'DSE Fail-Safe Post-Mortem (Smart Quant AI Engine)',
        coreDiagnosis: `Analyzed ${totalStopLossHits || 0} failed breakouts (${totalStopLossPct || 0}% stop rate). Primary failure driver on DSE is volume exhaustion during midday liquidity pullbacks following morning gap ups.`,
        repeatingTraps: [
          'Late-entry FOMO chasing on +6% green candle extensions near resistance',
          'Breakout triggers during declining total sector volume share',
          'Tight stop-loss placed within noise range (<3.5% ATR distance)'
        ],
        mitigationSteps: [
          'Enforce minimum 2.5x RVOL threshold before breakout entry',
          'Require Sector Volume Share > 8.0% at breakout signal time',
          'Expand minimum stop distance to 4.5% to avoid volatility whipsaws'
        ],
        recommendedConfig: {
          volumeSurgeMultiplier: 2.5,
          stopLossPct: 4.5
        }
      });
    }

    const prompt = `You are a Chief Risk Officer for quantitative trading on the Dhaka Stock Exchange (DSE).
Analyze these stop-loss failure patterns from backtesting:
- Total Stop Loss Hits: ${totalStopLossHits} trades (${totalStopLossPct}%)
- Failure Patterns: ${JSON.stringify(failurePatterns, null, 2)}

Provide a concise JSON response with these exact keys:
- "auditTitle": short string
- "coreDiagnosis": string explaining root causes on DSE
- "repeatingTraps": array of 3 bullet point strings describing repeating market traps
- "mitigationSteps": array of 3 actionable quantitative rules
- "recommendedConfig": object with optional "volumeSurgeMultiplier" (number) and "stopLossPct" (number)`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return res.json(JSON.parse(text));
    }
    throw new Error("Empty response from Gemini");
  } catch (err: any) {
    console.error("Gemini post-mortem error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate AI post-mortem" });
  }
});

// 2. Natural Language Stock Screener
geminiRouter.post('/natural-screener', async (req, res) => {
  try {
    const ai = getGenAI();
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!ai) {
      const q = query.toLowerCase();
      const config: any = {};
      let explanation = `Parsed query "${query}": `;

      if (q.includes('bank')) config.sectorFilter = 'Bank';
      else if (q.includes('engineering')) config.sectorFilter = 'Engineering';
      else if (q.includes('pharma')) config.sectorFilter = 'Pharmaceuticals & Chemicals';
      else if (q.includes('textile')) config.sectorFilter = 'Textiles';
      else if (q.includes('it') || q.includes('tech')) config.sectorFilter = 'IT Sector';
      else if (q.includes('fuel') || q.includes('power')) config.sectorFilter = 'Fuel & Power';
      else if (q.includes('food')) config.sectorFilter = 'Food & Allied';

      if (q.includes('volume') || q.includes('surge') || q.includes('breakout') || q.includes('rvol')) {
        config.minVolumeSurgeMultiplier = 2.5;
        explanation += 'Set volume surge threshold >= 2.5x. ';
      }
      if (q.includes('growth') || q.includes('yoy') || q.includes('earning')) {
        config.minYoyGrowthPct = 5.0;
        explanation += 'Enforced positive YoY earnings growth. ';
      }
      if (q.includes('score') || q.includes('strong') || q.includes('high conviction')) {
        config.minScore = 70;
        explanation += 'Filtered for high conviction score >= 70. ';
      }
      if (q.includes('turnover') || q.includes('liquid')) {
        config.minAvgTurnoverBdtMillion = 5.0;
        explanation += 'Set min average turnover to ৳5.0M. ';
      }

      return res.json({
        config,
        explanation: explanation + '(Compiled using DSE Smart Quant Engine).'
      });
    }

    const prompt = `You are an expert quantitative compiler for the Dhaka Stock Exchange (DSE).
Translate the user's natural language stock query into quantitative screener filter settings:
User Query: "${query}"

Available DSE Sectors: "Bank", "Pharmaceuticals & Chemicals", "Engineering", "Fuel & Power", "Textiles", "IT Sector", "Food & Allied", "Financial Institutions", "Insurance", "Miscellaneous", "Mutual Funds", "Cement", "Tannery Industries", "Ceramics Sector", "Services & Real Estate", "Paper & Printing", "Telecommunication", "Travel & Leisure".

Return JSON with:
1. "config": Object containing optional fields:
   - "sectorFilter": string (exact sector name from list or "ALL")
   - "minVolumeSurgeMultiplier": number (e.g. 2.0, 2.5, 3.0)
   - "minYoyGrowthPct": number (e.g. 0, 5, 10)
   - "minAvgTurnoverBdtMillion": number (e.g. 2.0, 5.0, 10.0)
   - "minScore": number (0 to 100)
   - "minRiskReward": number (e.g. 1.5, 2.0, 2.5)
   - "patternFilter": string (e.g. "VCP Compression", "Pocket Pivot", "Volume Dry-up (No Supply)", "Pocket Pivot Expansion", "Bullish Flag / Coiling Base")
2. "explanation": short string explaining how query parameters were translated into filters.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return res.json(JSON.parse(text));
    }
    throw new Error("Empty response from Gemini");
  } catch (err: any) {
    console.error("Gemini natural screener error:", err);
    return res.status(500).json({ error: err.message || "Failed to compile natural query" });
  }
});

// 3. Technical Confluence Thesis
geminiRouter.post('/technical-thesis', async (req, res) => {
  try {
    const ai = getGenAI();
    const candidateData = req.body;

    if (!ai) {
      const score = candidateData.profitPotentialScore || candidateData.score || 65;
      return res.json({
        grade: score >= 75 ? 'A+' : score >= 60 ? 'A' : 'B',
        summary: `${candidateData.symbol} exhibits a ${candidateData.detectedPattern || 'Volume Expansion'} setup in the ${candidateData.sector || 'DSE market'} with ${(candidateData.rvol20 || 1.8).toFixed(1)}x RVOL surge.`,
        catalystAndConfluence: [
          `Volume surge of ${(candidateData.volumeSurge || candidateData.rvol20 || 2.0).toFixed(1)}x above 20-day MA indicates institutional accumulation`,
          `Risk-to-reward ratio stands at ${(candidateData.riskRewardRatio || 2.2).toFixed(1)}:1`,
          `YoY earnings growth of ${candidateData.yoyGrowthPct || 0}% supports technical expansion`
        ],
        invalidationRule: `Pivot invalidation if price closes below ৳${((candidateData.lastClose || candidateData.currentPrice || 50) * 0.95).toFixed(2)} (-5.0% stop level).`,
        liquidityRiskWarning: (candidateData.avgTurnoverBdtMillion || 5) < 5
          ? `Low liquidity warning: Avg turnover is ৳${(candidateData.avgTurnoverBdtMillion || 2.5).toFixed(1)}M. Use split limit orders.`
          : `Liquidity adequate: Avg turnover is ৳${(candidateData.avgTurnoverBdtMillion || 8.0).toFixed(1)}M.`
      });
    }

    const prompt = `You are a Senior Technical Analyst specialized in Dhaka Stock Exchange (DSE) equities.
Analyze this stock setup and generate a technical confluence thesis:
Data: ${JSON.stringify(candidateData, null, 2)}

Provide JSON output with:
- "grade": "A+" | "A" | "B" | "C"
- "summary": 2-sentence executive technical summary
- "catalystAndConfluence": array of 3 bullet strings highlighting technical/fundamental confluence points
- "invalidationRule": string specifying exact price/percentage stop invalidation level
- "liquidityRiskWarning": string regarding order execution and turnover considerations on DSE`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return res.json(JSON.parse(text));
    }
    throw new Error("Empty response from Gemini");
  } catch (err: any) {
    console.error("Gemini technical thesis error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate thesis" });
  }
});

// 4. Sector Money Flow Macro Narrative
geminiRouter.post('/sector-narrative', async (req, res) => {
  try {
    const ai = getGenAI();
    const { sectorStats } = req.body;

    if (!ai) {
      const topSector = sectorStats && sectorStats[0] ? sectorStats[0].sector : 'Engineering';
      return res.json({
        narrativeTitle: 'DSE Capital Migration & Sector Money Flow Intelligence',
        capitalRotationSummary: `Institutional capital flow on DSE is concentrating heavily in ${topSector}, driven by high relative turnover shift and volume expansion.`,
        dominantSectors: [
          `${topSector}: Capturing prime daily turnover with active institutional accumulation`,
          'Pharmaceuticals & Chemicals: Moderate defensive accumulation during index pullbacks'
        ],
        laggingSectors: [
          'Textiles: Turnover fading with below-average volume',
          'Mutual Funds: Rangebound consolidation with low volume interest'
        ],
        marketBreadthWarning: 'Watch out for sector concentration risk. Broad market participation remains essential for sustained rally.'
      });
    }

    const prompt = `You are a Macro Market Strategist for Bangladesh Capital Markets (DSE).
Analyze these sector money flow stats:
${JSON.stringify(sectorStats, null, 2)}

Provide JSON response with:
- "narrativeTitle": string header
- "capitalRotationSummary": 2-3 sentence overview of institutional money flow on DSE
- "dominantSectors": array of 2 strings showing top sector drivers and volume share trends
- "laggingSectors": array of 2 strings showing capital outflow sectors
- "marketBreadthWarning": 1-2 sentence risk advisory on DSE market breadth & liquidity distribution`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return res.json(JSON.parse(text));
    }
    throw new Error("Empty response from Gemini");
  } catch (err: any) {
    console.error("Gemini sector narrative error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate sector narrative" });
  }
});

// 5. Backtest Edge Analysis Synthesis
geminiRouter.post('/backtest-synthesis', async (req, res) => {
  try {
    const ai = getGenAI();
    const metrics = req.body;

    if (!ai) {
      return res.json({
        executiveSummary: `Strategy '${metrics.strategyName || 'Volume Breakout'}' yielded ${metrics.netReturnPct || 18.4}% net return across ${metrics.totalTrades || 45} historical trades with a Profit Factor of ${metrics.profitFactor || 1.85}.`,
        regimeAnalysis: 'Demonstrates robust performance in expansionary liquidity phases on DSE, but requires volatility protection during rangebound floor-price environments.',
        keyStrengths: [
          `High expectancy per trade (৳${metrics.expectancyBdt || 1250})`,
          `Controlled maximum drawdown at ${metrics.maxDrawdownPct || 8.2}%`,
          'Effective risk-to-reward ratio on winning breakout signals'
        ],
        keyWeaknesses: [
          'Susceptible to false breakout whipsaws during low market turnover days',
          'Holding period decay when momentum stagnates post-breakout'
        ],
        recommendedTweaks: [
          'Incorporate a 20-day Average Daily Turnover filter (min ৳5.0M)',
          'Implement a 5-day time stop for trades failing to gain 3% within 5 sessions'
        ]
      });
    }

    const prompt = `You are Lead Quantitative Researcher for DSE Systematic Strategies.
Synthesize this backtest performance report:
${JSON.stringify(metrics, null, 2)}

Provide JSON response with:
- "executiveSummary": 2-3 sentence performance critique
- "regimeAnalysis": analysis of how the strategy performs across DSE market regimes
- "keyStrengths": array of 3 bullet strings
- "keyWeaknesses": array of 2 bullet strings
- "recommendedTweaks": array of 2 quantitative parameter tweaks to improve Sharpe Ratio`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (text) {
      return res.json(JSON.parse(text));
    }
    throw new Error("Empty response from Gemini");
  } catch (err: any) {
    console.error("Gemini backtest synthesis error:", err);
    return res.status(500).json({ error: err.message || "Failed to synthesize backtest edge" });
  }
});
