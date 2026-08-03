import { DseStockData } from '../types';

const DB_NAME = 'DSE_STOCK_DATABASE_DB';
const STORE_NAME = 'stock_datasets';
const DB_VERSION = 1;
const LOCALSTORAGE_KEY = 'DSE_STOCK_DATABASE_JSON';
const TIMESTAMP_KEY = 'DSE_STOCK_DATABASE_TIMESTAMP';

// Initialize IndexedDB
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

// Save stock dataset to IndexedDB & localStorage fallback
export async function saveDatabaseToStorage(stocks: DseStockData[]): Promise<{ success: boolean; message: string }> {
  try {
    const timestamp = new Date().toLocaleString();
    
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
      for (const stock of stocks) {
        store.put(stock);
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (idbErr) {
      console.warn('IndexedDB save warning, attempting localStorage fallback:', idbErr);
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(stocks));
    }

    localStorage.setItem(TIMESTAMP_KEY, timestamp);
    const totalCandles = stocks.reduce((acc, s) => acc + (s.candles?.length || 0), 0);

    return {
      success: true,
      message: `Database saved successfully! ${stocks.length} stocks (${totalCandles} candles) stored locally at ${timestamp}.`,
    };
  } catch (err: any) {
    console.error('Failed to save database:', err);
    return {
      success: false,
      message: err.message || 'Failed to save database to browser storage.',
    };
  }
}

// Load stock dataset from IndexedDB & localStorage fallback
export async function loadDatabaseFromStorage(): Promise<DseStockData[] | null> {
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
        // Enforce data cleanup for corrupted prices (e.g., from legacy parseFloat comma bug where RENATA/GP/BATBC fell to ~1 BDT)
        const highValueSymbols = new Set(['GP', 'RENATA', 'BATBC', 'SQURPHARMA', 'BEXIMCO', 'LHBL', 'OLYMPIC', 'WALTON', 'MARICO']);
        const hasCorruptedPrice = allStocks.some((s) => {
          if (!s.candles || s.candles.length === 0) return true;
          const lastClose = s.candles[s.candles.length - 1].close;
          if (isNaN(lastClose) || lastClose <= 0) return true;
          if (highValueSymbols.has(s.symbol) && lastClose < 10) return true;
          return false;
        });

        if (hasCorruptedPrice) {
          console.warn('Detected corrupted price data in stock database. Clearing cache to reset to clean defaults...');
          const clearTx = db.transaction(STORE_NAME, 'readwrite');
          clearTx.objectStore(STORE_NAME).clear();
          localStorage.removeItem(LOCALSTORAGE_KEY);
          return null;
        }

        return allStocks;
      }
    } catch (idbErr) {
      console.warn('IndexedDB load warning, falling back to localStorage:', idbErr);
    }

    // LocalStorage Fallback
    const jsonStr = localStorage.getItem(LOCALSTORAGE_KEY);
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as DseStockData[];
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
