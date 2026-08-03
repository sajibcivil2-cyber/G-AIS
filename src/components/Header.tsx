import React from 'react';
import { ShieldCheck, Sparkles, FolderArchive, RefreshCw, TrendingUp } from 'lucide-react';

interface HeaderProps {
  currentProjectName?: string;
  totalFiles: number;
  overallGrade?: string;
  overallScore?: number;
  onReset: () => void;
  onRunAiAudit: () => void;
  isAiAuditing: boolean;
  activeTab: 'dashboard' | 'inspector' | 'report' | 'dse_backtester';
  setActiveTab: (tab: 'dashboard' | 'inspector' | 'report' | 'dse_backtester') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProjectName,
  totalFiles,
  overallGrade,
  overallScore,
  onReset,
  onRunAiAudit,
  isAiAuditing,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header id="app-header" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">Code Inspector & DSE Strategy Lab</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DSE Backtester Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Code Quality Audit & DSE Stock Volume Breakout Analyzer</p>
            </div>
          </div>

          {/* Project Summary Badge */}
          {currentProjectName && (
            <div className="hidden lg:flex items-center gap-4 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <FolderArchive className="w-4 h-4 text-indigo-400" />
                <span className="font-medium text-slate-200">{currentProjectName}</span>
                <span className="text-slate-500">({totalFiles} files)</span>
              </div>
              {overallScore !== undefined && (
                <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                  <span className="text-slate-400">Grade:</span>
                  <span className="font-bold text-emerald-400 text-sm">{overallGrade}</span>
                  <span className="font-semibold text-slate-300">({overallScore}/100)</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center gap-2">
            <nav className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                id="tab-dse-backtest-btn"
                onClick={() => setActiveTab('dse_backtester')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'dse_backtester'
                    ? 'bg-emerald-600 text-white shadow font-bold'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                🎯 Stock Screener & Strategy Lab
              </button>

              {totalFiles > 0 && (
                <>
                  <button
                    id="tab-dashboard-btn"
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                      activeTab === 'dashboard'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Quality Scorecard
                  </button>
                  <button
                    id="tab-inspector-btn"
                    onClick={() => setActiveTab('inspector')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                      activeTab === 'inspector'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Code & Files
                  </button>
                  <button
                    id="tab-report-btn"
                    onClick={() => setActiveTab('report')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                      activeTab === 'report'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Audit Report
                  </button>
                </>
              )}
            </nav>

            {totalFiles > 0 && (
              <>
                <button
                  id="ai-audit-btn"
                  onClick={onRunAiAudit}
                  disabled={isAiAuditing}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiAuditing ? 'animate-spin' : ''}`} />
                  {isAiAuditing ? 'Auditing...' : 'AI Cross-Check'}
                </button>

                <button
                  id="reset-project-btn"
                  onClick={onReset}
                  title="Upload another project"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

