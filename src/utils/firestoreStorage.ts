import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface WatchlistItem {
  id: string;
  symbol: string;
  notes?: string;
  createdAt: string;
}

export interface SavedBacktest {
  id: string;
  strategyName: string;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  configSummary?: string;
  createdAt: string;
}

export interface SavedPriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  createdAt: string;
}

export interface SavedUserPreferences {
  initialCapital?: number;
  positionSizePct?: number;
  maxRiskPerTradePct?: number;
  stopLossPct?: number;
  targetProfitPct?: number;
  updatedAt: string;
}

// Watchlist Firestore API
export async function saveWatchlistItemToFirestore(symbol: string, notes: string = ''): Promise<WatchlistItem | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const id = symbol.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
  const path = `users/${user.uid}/watchlists/${id}`;
  const item: WatchlistItem = {
    id,
    symbol: id,
    notes,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, path), {
      userId: user.uid,
      symbol: item.symbol,
      notes: item.notes || '',
      createdAt: item.createdAt,
    });
    return item;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export async function removeWatchlistItemFromFirestore(symbol: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const id = symbol.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
  const path = `users/${user.uid}/watchlists/${id}`;

  try {
    await deleteDoc(doc(db, path));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export function subscribeToUserWatchlist(callback: (items: WatchlistItem[]) => void): Unsubscribe | null {
  const user = auth.currentUser;
  if (!user) return null;

  const path = `users/${user.uid}/watchlists`;
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: WatchlistItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            symbol: data.symbol,
            notes: data.notes,
            createdAt: data.createdAt,
          };
        });
        callback(items);
      },
      (error) => {
        console.error('Watchlist snapshot error:', error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

// Backtest Report Firestore API
export async function saveBacktestReportToFirestore(
  strategyName: string,
  totalTrades: number,
  winRate: number,
  profitFactor: number,
  configSummary?: string
): Promise<SavedBacktest | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const id = `bt_${Date.now()}`;
  const path = `users/${user.uid}/backtests/${id}`;
  const item: SavedBacktest = {
    id,
    strategyName,
    totalTrades,
    winRate,
    profitFactor,
    configSummary,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, path), {
      userId: user.uid,
      strategyName: item.strategyName,
      totalTrades: item.totalTrades,
      winRate: item.winRate,
      profitFactor: item.profitFactor,
      configSummary: item.configSummary || '',
      createdAt: item.createdAt,
    });
    return item;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export function subscribeToUserBacktests(callback: (items: SavedBacktest[]) => void): Unsubscribe | null {
  const user = auth.currentUser;
  if (!user) return null;

  const path = `users/${user.uid}/backtests`;
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: SavedBacktest[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            strategyName: data.strategyName,
            totalTrades: data.totalTrades,
            winRate: data.winRate,
            profitFactor: data.profitFactor,
            configSummary: data.configSummary,
            createdAt: data.createdAt,
          };
        });
        callback(items);
      },
      (error) => {
        console.error('Backtest snapshot error:', error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

// Price Alerts Firestore API
export async function savePriceAlertToFirestore(
  symbol: string,
  targetPrice: number,
  condition: 'ABOVE' | 'BELOW'
): Promise<SavedPriceAlert | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const sym = symbol.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
  const id = `alert_${sym}_${Date.now()}`;
  const path = `users/${user.uid}/alerts/${id}`;
  const alertItem: SavedPriceAlert = {
    id,
    symbol: sym,
    targetPrice,
    condition,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, path), {
      userId: user.uid,
      symbol: alertItem.symbol,
      targetPrice: alertItem.targetPrice,
      condition: alertItem.condition,
      createdAt: alertItem.createdAt,
    });
    return alertItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export async function deletePriceAlertFromFirestore(alertId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const path = `users/${user.uid}/alerts/${alertId}`;
  try {
    await deleteDoc(doc(db, path));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export function subscribeToUserPriceAlerts(callback: (items: SavedPriceAlert[]) => void): Unsubscribe | null {
  const user = auth.currentUser;
  if (!user) return null;

  const path = `users/${user.uid}/alerts`;
  try {
    const q = query(collection(db, path));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: SavedPriceAlert[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            symbol: data.symbol,
            targetPrice: data.targetPrice,
            condition: data.condition,
            createdAt: data.createdAt,
          };
        });
        callback(items);
      },
      (error) => {
        console.error('Alerts snapshot error:', error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

// User Settings Firestore API
export async function saveUserPreferencesToFirestore(prefs: SavedUserPreferences): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const path = `users/${user.uid}/settings/default_preferences`;
  try {
    await setDoc(doc(db, path), {
      userId: user.uid,
      ...prefs,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function loadUserPreferencesFromFirestore(): Promise<SavedUserPreferences | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const path = `users/${user.uid}/settings/default_preferences`;
  try {
    const docSnap = await getDoc(doc(db, path));
    if (docSnap.exists()) {
      return docSnap.data() as SavedUserPreferences;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
