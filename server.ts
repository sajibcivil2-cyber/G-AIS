import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Synthetic Gap-Fill Endpoint for Dhaka Stock Exchange (DSE) missing trading days
  //
  // IMPORTANT: This does NOT fetch real market data from dsebd.org or any live source.
  // dsebd.org's robots.txt disallows automated access, and even if it didn't, its public
  // pages only expose today's latest snapshot price — not historical daily OHLC candles for
  // arbitrary past dates. So there is no legitimate way to "backfill" missing historical
  // days from a live feed. What this endpoint actually does is generate a plausible-looking
  // synthetic random walk, anchored and clamped to the stock's last known real close, purely
  // so the backtester has continuous candles to work with. It WILL diverge from the stock's
  // real dsebd.org closing price on any day it filled in — that divergence is expected, not
  // a bug. If you need real prices, re-upload a fresh historical data file instead of relying
  // on this to catch up.
  app.post('/api/dse/bdshare-live', async (req, res) => {
    try {
      const { stocksInfo, lastAvailableDate } = req.body;

      if (!stocksInfo || !Array.isArray(stocksInfo) || stocksInfo.length === 0) {
        return res.status(400).json({ error: 'Missing stocksInfo array for BD Share sync.' });
      }

      // Determine date range for missing days
      const startDateStr = lastAvailableDate || '2025-06-30';
      const startDate = new Date(startDateStr);
      const endDate = new Date(); // Current date (e.g. 2026-08-02)

      // Calculate missing trading days (Exclude BD weekends: Friday=5, Saturday=6)
      const missingDates: string[] = [];
      const cur = new Date(startDate);
      cur.setDate(cur.getDate() + 1); // Start next day

      while (cur <= endDate) {
        const dayOfWeek = cur.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
        // Bangladesh stock market trades Sun(0) to Thu(4). Fri(5) and Sat(6) are closed.
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
          missingDates.push(cur.toISOString().split('T')[0]);
        }
        cur.setDate(cur.getDate() + 1);
      }

      if (missingDates.length === 0) {
        return res.json({
          success: true,
          message: 'No missing trading days to fill — dataset already covers every trading day up to today.',
          missingDatesCount: 0,
          syncedCandles: {},
          syncedAt: new Date().toISOString(),
        });
      }

      // Generate/Fetch live market daily candles for missing days per symbol.
      //
      // FIX: previously this random walk had no bound on cumulative drift — the
      // mean-reversion force was gentle (10%) and pure compounding random noise over
      // many missing days could push a stock's price arbitrarily far from its real
      // last-known value (this is what produced corrupted candles like GP > ৳1000).
      // We now hard-clamp every day's close to stay within a plausible band of the
      // ORIGINAL lastClose for the whole batch, in addition to the existing per-day
      // mean reversion. This guarantees the server can never emit a candle that the
      // client-side validator would have to reject.
      const MAX_TOTAL_DRIFT_PCT = 35; // max total drift from original lastClose across the whole missing-day batch
      const MAX_DAILY_MOVE_PCT = 8; // max single-day move (DSE circuit breaker is ~10%)

      const syncedCandles: Record<string, Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>> = {};

      stocksInfo.forEach((info: { symbol: string; lastClose?: number; avgVolume?: number }) => {
        const symbol = info.symbol;
        const anchorClose = info.lastClose && info.lastClose > 0 ? info.lastClose : 100.0;
        const minAllowed = anchorClose * (1 - MAX_TOTAL_DRIFT_PCT / 100);
        const maxAllowed = anchorClose * (1 + MAX_TOTAL_DRIFT_PCT / 100);

        let runningPrice = anchorClose;
        const baseVolume = info.avgVolume || 150000;
        const candlesForSymbol: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> = [];

        missingDates.forEach((dateStr) => {
          // Mean reversion toward the anchor close, strengthened as we approach the drift band
          const deviation = (runningPrice - anchorClose) / anchorClose;
          const meanReversionForce = -deviation * 0.15;

          // Simulate BD Share daily price fluctuation, clamped to a realistic daily range
          let changePct = (Math.random() - 0.5) * 0.035 + meanReversionForce;
          changePct = Math.max(-MAX_DAILY_MOVE_PCT / 100, Math.min(MAX_DAILY_MOVE_PCT / 100, changePct));

          const open = Number((runningPrice * (1 + (Math.random() - 0.5) * 0.008)).toFixed(2));
          let close = Number((runningPrice * (1 + changePct)).toFixed(2));

          // Hard clamp to the total-drift band regardless of compounding above
          close = Math.max(minAllowed, Math.min(maxAllowed, close));
          if (close <= 0) close = anchorClose; // absolute safety net, should be unreachable

          // High & Low derived from clamped open/close so OHLC relationship stays valid
          const maxPrice = Math.max(open, close);
          const minPrice = Math.min(open, close);
          const high = Number((maxPrice * (1 + Math.random() * 0.015)).toFixed(2));
          const low = Number((minPrice * (1 - Math.random() * 0.015)).toFixed(2));

          // Occasional volume surge on breakout days (1 in 15 days)
          const isBreakout = Math.random() > 0.93;
          const volMultiplier = isBreakout ? 2.5 + Math.random() * 2.0 : 0.7 + Math.random() * 0.6;
          const volume = Math.round(baseVolume * volMultiplier);

          candlesForSymbol.push({
            date: dateStr,
            open,
            high,
            low,
            close,
            volume,
          });

          runningPrice = close;
        });

        syncedCandles[symbol] = candlesForSymbol;
      });

      return res.json({
        success: true,
        missingDatesCount: missingDates.length,
        missingDates,
        syncedCandles,
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('API /api/dse/bdshare-live Error:', error);
      return res.status(500).json({
        error: 'Failed to sync live BD Share market data.',
        details: error.message || String(error),
      });
    }
  });

  // Vite development middleware vs Static Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();