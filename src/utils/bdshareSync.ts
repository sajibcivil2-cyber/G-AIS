import { DseStockData, DseStockCandle } from '../types';
import { validateAndRepairStock } from './databaseStorage';
// NOTE: server-side clamping lives in server.ts (bdshare-live endpoint). This client-side
// validation is a second, independent line of defense — it must not rely on the server
// having been fixed, since stale deployments or future changes to that endpoint could
// reintroduce bad data.

export interface BdShareSyncStatus {
  lastAvailableDate: string;
  todayDate: string;
  missingDaysCount: number;
  isUpToDate: boolean;
  totalCandlesCount: number;
  lastSyncedAt?: string;
}

export interface BdShareSyncResult {
  success: boolean;
  updatedStocks: DseStockData[];
  addedCandlesCount: number;
  rejectedCandlesCount: number;
  missingDates: string[];
  message: string;
  syncedAt: string;
}

/**
  Check dataset freshness and count missing trading days up to current date
 */
export function getDatasetFreshness(stocks: DseStockData[]): BdShareSyncStatus {
  if (!stocks || stocks.length === 0) {
    return {
      lastAvailableDate: 'N/A',
      todayDate: new Date().toISOString().split('T')[0],
      missingDaysCount: 0,
      isUpToDate: true,
      totalCandlesCount: 0,
    };
  }

  // Find the earliest last date across all stocks to ensure we sync if ANY stock is behind
  let minLastDate = '9999-12-31';
  let totalCandles = 0;

  stocks.forEach((stock) => {
    totalCandles += stock.candles?.length || 0;
    if (stock.candles && stock.candles.length > 0) {
      // Assuming candles might not be perfectly sorted, find max for this stock
      let stockMaxDate = '1970-01-01';
      stock.candles.forEach((c) => {
        if (c.date && c.date > stockMaxDate) {
          stockMaxDate = c.date;
        }
      });
      if (stockMaxDate < minLastDate) {
        minLastDate = stockMaxDate;
      }
    } else {
      minLastDate = '1970-01-01';
    }
  });

  if (minLastDate === '9999-12-31') {
    minLastDate = '1970-01-01';
  }

  const todayStr = new Date().toISOString().split('T')[0];

  if (minLastDate >= todayStr) {
    return {
      lastAvailableDate: minLastDate,
      todayDate: todayStr,
      missingDaysCount: 0,
      isUpToDate: true,
      totalCandlesCount: totalCandles,
    };
  }

  // Calculate missing trading days (Sun - Thu)
  const startDate = new Date(minLastDate);
  const endDate = new Date();
  let missingDays = 0;

  const cur = new Date(startDate);
  cur.setDate(cur.getDate() + 1);

  while (cur <= endDate) {
    const dayOfWeek = cur.getDay(); // 5=Fri, 6=Sat
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      missingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return {
    lastAvailableDate: minLastDate,
    todayDate: todayStr,
    missingDaysCount: missingDays,
    isUpToDate: missingDays === 0,
    totalCandlesCount: totalCandles,
  };
}

/**
 * Sync live BD Share stock data from Express server proxy.
 * Server-returned candles are treated as untrusted input: each stock's merged series is
 * re-validated/repaired (see databaseStorage.validateAndRepairStock) before being accepted,
 * so a bad sync batch can never silently corrupt stored prices.
 */
export async function syncLiveBdShareData(stocks: DseStockData[]): Promise<BdShareSyncResult> {
  const freshness = getDatasetFreshness(stocks);

  if (freshness.isUpToDate || stocks.length === 0) {
    return {
      success: true,
      updatedStocks: stocks,
      addedCandlesCount: 0,
      rejectedCandlesCount: 0,
      missingDates: [],
      message: 'Dataset is already up to date with BD Share live feed.',
      syncedAt: new Date().toISOString(),
    };
  }

  const stocksInfo = stocks.map((s) => {
    const lastCandle = s.candles && s.candles.length > 0 ? s.candles[s.candles.length - 1] : null;
    const avgVol = s.candles && s.candles.length > 0
      ? Math.round(s.candles.slice(-20).reduce((acc, c) => acc + c.volume, 0) / Math.min(20, s.candles.length))
      : 100000;

    return {
      symbol: s.symbol,
      lastClose: lastCandle ? lastCandle.close : 100.0,
      avgVolume: avgVol,
    };
  });

  const response = await fetch('/api/dse/bdshare-live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stocksInfo,
      lastAvailableDate: freshness.lastAvailableDate,
    }),
  });

  if (!response.ok) {
    throw new Error(`BD Share server returned status ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to sync BD Share live market data.');
  }

  if (!data.syncedCandles || Object.keys(data.syncedCandles).length === 0) {
    return {
      success: true,
      updatedStocks: stocks,
      addedCandlesCount: 0,
      rejectedCandlesCount: 0,
      missingDates: [],
      message: 'No new candles returned from BD Share feed.',
      syncedAt: data.syncedAt || new Date().toISOString(),
    };
  }

  let totalAdded = 0;
  let totalRejected = 0;

  // Merge returned missing candles into active stock datasets
  const updatedStocks: DseStockData[] = stocks.map((stock) => {
    const newCandles = data.syncedCandles[stock.symbol];
    if (!newCandles || newCandles.length === 0) {
      return stock;
    }

    const existingDateSet = new Set(stock.candles.map((c) => c.date));
    const candlesToAppend: DseStockCandle[] = [];

    newCandles.forEach((c: DseStockCandle) => {
      if (!existingDateSet.has(c.date)) {
        candlesToAppend.push(c);
        existingDateSet.add(c.date);
      }
    });

    const mergedCandles = [...stock.candles, ...candlesToAppend].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Validate the merged series before accepting it. If the server sent a corrupted
    // or implausible price jump, it gets dropped here rather than poisoning storage.
    const { stock: validatedStock, wasRepaired } = validateAndRepairStock({
      ...stock,
      candles: mergedCandles,
    });

    const acceptedNewCount = validatedStock.candles.filter((c) => !stock.candles.some((oc) => oc.date === c.date)).length;
    totalAdded += acceptedNewCount;
    totalRejected += wasRepaired ? candlesToAppend.length - acceptedNewCount : 0;

    return validatedStock;
  });

  return {
    success: true,
    updatedStocks,
    addedCandlesCount: totalAdded,
    rejectedCandlesCount: totalRejected,
    missingDates: data.missingDates || [],
    message: totalRejected > 0
      ? `Synced ${data.missingDatesCount || 0} missing BD Share trading days (${totalAdded} candles appended, ${totalRejected} rejected as implausible price data).`
      : `Successfully synced ${data.missingDatesCount || 0} missing BD Share trading days (${totalAdded} daily daily candles appended across ${stocks.length} stocks).`,
    syncedAt: data.syncedAt || new Date().toISOString(),
  };
}
