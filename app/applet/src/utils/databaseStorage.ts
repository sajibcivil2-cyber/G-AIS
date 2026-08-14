import { DseStockData, DseStockCandle } from '../types';

const DB_NAME = 'DSE_STOCK_DATABASE_DB';
const STORE_NAME = 'stock_datasets';
const DB_VERSION = 1;
const LOCALSTORAGE_KEY = 'DSE_STOCK_DATABASE_JSON';
const TIMESTAMP_KEY = 'DSE_STOCK_DATABASE_TIMESTAMP';

// Maximum plausible single-day close-to-close move before a candle is treated as corrupted.
// DSE has a 10% circuit breaker in real trading; we allow generous headroom (60%) to avoid
// false positives from legitimate gap-up/gap-down days, while still catching data corruption
// (e.g. a sync bug that multiplies/duplicates a price, decimal shifts, stale merges, etc.)
const MAX_PLAUSIBLE_DAILY_MOVE_PCT = 60;

// ---------------------------------------------------------------------------
// Validation & repair helpers
// ---------------------------------------------------------------------------

function isFiniteQuietPositive(n: unknown): n is number {
  return typeof n === 'number' && isFinite(n) && n > 0;
}

function isCandleStructurallyValid(c: DseStockCandle): boolean {
  if (!c || !c.date) return false;
  if (!isFiniteQuietPositive(c.open) || !isFiniteQuietPositive(c.high) ||
      !isFiniteQuietPositive(c.low) || !isFiniteQuietPositive(c.close)) {
    return false;
  }
  if (typeof c.volume !== 'number' || !isFinite(c.volume) || c.volume < 0) return false;
  // High must be the max and low must be the min of the bar
  const maxOC = Math.max(c.open, c.close);
  const minOC = Math.min(c.open, c.close);
  if (c.high < maxOC * 0.999) return false; // small epsilon for rounding
  if (c.low > minOC * 1.001) return false;
  return true;
}

/**
 * Validates and repairs a single stock's candle series.
 * - Drops structurally invalid candles (negative/zero/NaN prices, broken OHLC relationships).
 * - Sorts & deduplicates by date.
 * - Scans chronologically and drops any candle that represents an implausible single-day
 *   price jump relative to the last known-good candle (data corruption / bad sync), rather
 *   than discarding the entire stock or the entire database.
 *
 * Returns the repaired stock and whether any repair was necessary.
 */
export function validateAndRepairStock(stock: DseStockData): { stock: DseStockData; wasRepaired: boolean } {
  if (!stock || !Array.isArray(stock.candles) || stock.candles.length === 0) {
    return { stock, wasRepaired: false };
  }

  let wasRepaired = false;

  // 1. Drop structurally invalid candles
  const structurallyValid = stock.candles.filter((c) => {
    const ok = isCandleStructurallyValid(c);
    if (!ok) wasRepaired = true;
    return ok;
  });

  // 2. Dedupe by date (keep last occurrence) & sort chronologically
  const byDate = new Map<string, DseStockCandle>();
  structurallyValid.forEach((c) => {
    if (byDate.has(c.date)) wasRepaired = true;
    byDate.set(c.date, c);
  });
  const sorted = Array.from(byDate.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 3. Walk chronologically, dropping candles with implausible jumps vs. last good candle.
  //    This repairs corruption locally instead of nuking the whole series.
  const repaired: DseStockCandle[] = [];
  let lastGoodClose: number | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    
    // Completely drop candles with 0 or negative prices to avoid math errors and corruption
    if (c.close <= 0 || c.open <= 0) {
      wasRepaired = true;
      continue;
    }

    if (lastGoodClose !== null) {
      const movePct = Math.abs((c.close - lastGoodClose) / lastGoodClose) * 100;
      if (movePct > MAX_PLAUSIBLE_DAILY_MOVE_PCT) {
        // Suspicious candle. Check if it's an isolated spike or a permanent shift (e.g. split).
        // Find the next non-zero candle to check for reversion
        let nextValidC = null;
        for (let j = i + 1; j < sorted.length; j++) {
          if (sorted[j].close > 0) {
            nextValidC = sorted[j];
            break;
          }
        }

        if (nextValidC) {
          const revertPct = Math.abs((nextValidC.close - lastGoodClose) / lastGoodClose) * 100;
          if (revertPct <= MAX_PLAUSIBLE_DAILY_MOVE_PCT) {
            // The next valid candle reverts back to the old price level. 
            // This means the current candle is an isolated spike (glitch).
            wasRepaired = true;
            continue;
          }
        } else {
          // This is the most recent candle in the whole dataset — there's no future day to
          // confirm whether it reverts. Blindly dropping it here is dangerous for THIS app
          // specifically: the most recent trading day is exactly what an early-move
          // screener cares about most, and a real breakout, split, rights issue, or bonus
          // share adjustment can legitimately produce a large one-day jump. Silently
          // deleting it would erase the exact signal this app exists to catch.
          //
          // Instead, keep it but flag the stock as repaired/flagged so the UI can surface
          // "unconfirmed recent price jump — verify against source data" rather than either
          // trusting it blindly or deleting it blindly.
          wasRepaired = true;
        }
      }
    }
    repaired.push(c);
    lastGoodClose = c.close;
  }

  if (!wasRepaired) {
    return { stock, wasRepaired: false };
  }

  return {
    stock: { ...stock, candles: repaired },
    wasRepaired: true,
  };
}

/**
 * Validates an entire stock pool, repairing or dropping individual stocks as needed.
 * A stock is only dropped entirely if it has zero valid candles after repair — otherwise
 * we keep its cleaned data. Returns the cleaned pool and a summary for diagnostics.
 */
export function validateAndRepairDatabase(stocks: DseStockData[]): {
  stocks: DseStockData[];
  repairedSymbols: string[];
  droppedSymbols: string[];
} {
  const repairedSymbols: string[] = [];
  const droppedSymbols: string[] = [];
  const cleaned: DseStockData[] = [];

  for (const s of stocks) {
    const { stock, wasRepaired } = validateAndRepairStock(s);
    if (!stock.candles || stock.candles.length === 0) {
      droppedSymbols.push(s.symbol);
      continue;
    }
    if (wasRepaired) repairedSymbols.push(s.symbol);
    cleaned.push(stock);
  }

  return { stocks: cleaned, repairedSymbols, droppedSymbols };
}

// ---------------------------------------------------------------------------
// IndexedDB plumbing
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'symbol' });
      }
    };
  });
}

// Save stock dataset to IndexedDB & localStorage fallback.
// Validates/repairs data before persisting so corruption never gets written to disk.
export async function saveDatabaseToStorage(stocks: DseStockData[]): Promise<{ success: boolean; message: string }> {
  try {
    const timestamp = new Date().toLocaleString();
    const { stocks: cleanStocks, repairedSymbols, droppedSymbols } = validateAndRepairDatabase(stocks);

    // Save to IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      // Clear existing records first
      await new Promise<void>((resolve, reject) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => resolve();
        clearReq.onerror = () => reject(clearReq.error);
      });

      // Put all stock objects
      for (const stock of cleanStocks) {
        store.put(stock);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (idbErr) {
      console.warn('IndexedDB save warning, attempting localStorage fallback:', idbErr);
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(cleanStocks));
    }

    localStorage.setItem(TIMESTAMP_KEY, timestamp);
    const totalCandles = cleanStocks.reduce((acc, s) => acc + (s.candles?.length || 0), 0);

    let message = `Database saved successfully! ${cleanStocks.length} stocks (${totalCandles} candles) stored locally at ${timestamp}.`;
    if (repairedSymbols.length > 0) {
      message += ` Repaired corrupted price data for: ${repairedSymbols.join(', ')}.`;
    }
    if (droppedSymbols.length > 0) {
      message += ` Dropped unrecoverable stocks: ${droppedSymbols.join(', ')}.`;
    }

    return { success: true, message };
  } catch (err: any) {
    console.error('Failed to save database:', err);
    return {
      success: false,
      message: err.message || 'Failed to save database to browser storage.',
    };
  }
}

// Load stock dataset from IndexedDB & localStorage fallback.
// Corrupted candles/stocks are repaired in place instead of wiping the entire cache.
export interface LoadDatabaseResult {
  stocks: DseStockData[];
  repairedSymbols: string[];
  droppedSymbols: string[];
}

export async function loadDatabaseFromStorage(): Promise<LoadDatabaseResult | null> {
  try {
    // Try loading from IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);

      const allStocks = await new Promise<DseStockData[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as DseStockData[]);
        req.onerror = () => reject(req.error);
      });

      if (allStocks && allStocks.length > 0) {
        const { stocks: cleanStocks, repairedSymbols, droppedSymbols } = validateAndRepairDatabase(allStocks);

        if (repairedSymbols.length > 0 || droppedSymbols.length > 0) {
          console.warn(
            `Stock database repaired on load. Fixed: [${repairedSymbols.join(', ') || 'none'}]. ` +
            `Dropped (unrecoverable): [${droppedSymbols.join(', ') || 'none'}].`
          );
          // Persist the repaired version immediately so the fix sticks and we don't
          // re-detect/re-log the same corruption on every future load.
          try {
            const writeTx = db.transaction(STORE_NAME, 'readwrite');
            const writeStore = writeTx.objectStore(STORE_NAME);
            await new Promise<void>((resolve, reject) => {
              const clearReq = writeStore.clear();
              clearReq.onsuccess = () => resolve();
              clearReq.onerror = () => reject(clearReq.error);
            });
            cleanStocks.forEach((s) => writeStore.put(s));
            await new Promise<void>((resolve, reject) => {
              writeTx.oncomplete = () => resolve();
              writeTx.onerror = () => reject(writeTx.error);
            });
          } catch (persistErr) {
            console.warn('Could not persist repaired database:', persistErr);
          }
        }

        if (cleanStocks.length > 0) {
          return { stocks: cleanStocks, repairedSymbols, droppedSymbols };
        }
        // Every stock was unrecoverable — fall through to localStorage/defaults.
      }
    } catch (idbErr) {
      console.warn('IndexedDB load warning, falling back to localStorage:', idbErr);
    }

    // LocalStorage Fallback
    const jsonStr = localStorage.getItem(LOCALSTORAGE_KEY);
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const { stocks: cleanStocks, repairedSymbols, droppedSymbols } = validateAndRepairDatabase(parsed as DseStockData[]);
        if (cleanStocks.length > 0) {
          return { stocks: cleanStocks, repairedSymbols, droppedSymbols };
        }
      }
    }

    return null;
  } catch (err) {
    console.error('Error loading database from storage:', err);
    return null;
  }
}

// Get timestamp of last saved database
export function getLastSavedTimestamp(): string | null {
  return localStorage.getItem(TIMESTAMP_KEY);
}

// Clear Database completely
export async function clearDatabaseStorage(): Promise<void> {
  localStorage.removeItem(LOCALSTORAGE_KEY);
  localStorage.removeItem(TIMESTAMP_KEY);

  if (window.indexedDB) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const req = tx.objectStore(STORE_NAME).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      db.close();
    } catch (err) {
      console.error('Failed to clear IndexedDB:', err);
    }
  }
}

// Export database as JSON file for download
export function exportDatabaseToFile(stocks: DseStockData[], fileName = 'dse_stock_database.json'): void {
  try {
    const dataStr = JSON.stringify(stocks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const finalFileName = fileName.endsWith('.json')
      ? fileName.replace('.json', `_${dateStr}.json`)
      : `${fileName}_${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export database file:', err);
    alert('Failed to export database file.');
  }
}
