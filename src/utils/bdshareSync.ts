import { DseStockData } from '../types';

export interface BdShareSyncStatus {
  lastAvailableDate: string;
  todayDate: string;
  missingDaysCount: number;
  isUpToDate: boolean;
  totalCandlesCount: number;
  lastSyncedAt?: string;
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
