import React from 'react';
import { Header } from './components/Header';
import { DseBacktester } from './components/DseBacktester';

export default function App() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 pb-16">
        <DseBacktester />
      </main>

      <footer className="border-t border-slate-900 py-6 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>DSE Strategy Lab — Volume Breakout Screener &amp; Backtester</span>
          <span className="text-slate-600">Not investment advice. Verify signals against live market data before trading.</span>
        </div>
      </footer>
    </div>
  );
}
