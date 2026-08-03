import React from 'react';
import { Download, Printer, CheckSquare, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { AuditResult } from '../types';

interface AuditReportExportProps {
  audit: AuditResult;
  projectName: string;
}

export const AuditReportExport: React.FC<AuditReportExportProps> = ({ audit, projectName }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${projectName.toLowerCase().replace(/\s+/g, '-')}-audit-report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Executive Quality & Output Audit Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Formal technical evaluation for {projectName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="print-report-btn"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button
            id="download-json-report-btn"
            onClick={handleDownloadJson}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow transition-all"
          >
            <Download className="w-4 h-4" />
            Download JSON Report
          </button>
        </div>
      </div>

      {/* Report Document Body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-8 shadow-sm print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Web App Output Quality Certificate
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{projectName}</h1>
            <p className="text-xs text-slate-500">Timestamp: {audit.analyzedAt}</p>
          </div>

          <div className="text-right space-y-1">
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{audit.overallGrade}</div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Score: {audit.overallScore} / 100
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            1. Executive Assessment
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {audit.summary}
          </p>
        </div>

        {/* Score Matrix Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            2. Dimension Scorecard Matrix
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ScoreCardCell title="Architecture Cleanliness" score={audit.scores.architecture} />
            <ScoreCardCell title="AI Anti-Pattern Control" score={audit.scores.antiPattern} />
            <ScoreCardCell title="Performance & Bundle Size" score={audit.scores.performance} />
            <ScoreCardCell title="Accessibility & UX" score={audit.scores.accessibility} />
            <ScoreCardCell title="Security & Secrets" score={audit.scores.security} />
            <ScoreCardCell title="Output DOM & Quality" score={audit.scores.outputQuality} />
          </div>
        </div>

        {/* Developer Action Plan Checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-indigo-500" />
            3. Prioritized Developer Remediation Checklist
          </h3>

          <div className="space-y-2">
            {audit.actionableFixes.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                No critical fixes required. Project adheres to standard best practices!
              </p>
            ) : (
              audit.actionableFixes.map((fix, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{fix}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreCardCell: React.FC<{ title: string; score: number }> = ({ title, score }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl space-y-1">
    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{title}</div>
    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{score}%</div>
  </div>
);
