import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Code2,
  FileCode,
  ArrowUpRight,
  Filter,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { AuditResult, AuditIssue, IssueCategory, IssueSeverity } from '../types';

interface QualityDashboardProps {
  audit: AuditResult;
  onRunAiAudit: () => void;
  isAiAuditing: boolean;
  onViewFileInInspector?: (filePath: string) => void;
}

export const QualityDashboard: React.FC<QualityDashboardProps> = ({
  audit,
  onRunAiAudit,
  isAiAuditing,
  onViewFileInInspector,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      case 'B+':
      case 'B':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
      case 'C':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    }
  };

  const filteredIssues = audit.issues.filter((issue) => {
    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;
    return matchesCategory && matchesSeverity;
  });

  const highSeverityCount = audit.issues.filter((i) => i.severity === 'High').length;
  const mediumSeverityCount = audit.issues.filter((i) => i.severity === 'Medium').length;
  const lowSeverityCount = audit.issues.filter((i) => i.severity === 'Low').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scorecard Hero Box */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Overall Quality Index
              </span>
              <span className="text-xs text-slate-400">Checked at {audit.analyzedAt}</span>
            </div>

            <div className="flex items-center gap-6">
              <div
                className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center font-extrabold ${getGradeColor(
                  audit.overallGrade
                )}`}
              >
                <span className="text-3xl tracking-tight">{audit.overallGrade}</span>
                <span className="text-xs font-medium opacity-80">{audit.overallScore}/100</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100">{highSeverityCount}</strong> Critical Flags
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100">{mediumSeverityCount}</strong> Medium Warnings
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-slate-100">{lowSeverityCount}</strong> Minor Notices
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
              {audit.summary}
            </p>
          </div>

          <button
            id="run-deep-ai-audit-btn"
            onClick={onRunAiAudit}
            disabled={isAiAuditing}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAiAuditing ? 'animate-spin' : ''}`} />
            {isAiAuditing ? 'Running Gemini AI Deep Audit...' : 'Re-Run Gemini AI Deep Audit'}
          </button>
        </div>

        {/* 6 Metric Breakdown Bars */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              6-Dimensional Quality Breakdown
            </h3>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              Cross-Checked Standard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricBar label="Architecture & Design Cleanliness" score={audit.scores.architecture} />
            <MetricBar label="AI-Slop & Anti-Pattern Control" score={audit.scores.antiPattern} />
            <MetricBar label="Performance & Bundle Efficiency" score={audit.scores.performance} />
            <MetricBar label="Accessibility & UX Standards" score={audit.scores.accessibility} />
            <MetricBar label="Security & Data Protection" score={audit.scores.security} />
            <MetricBar label="Output & Visual DOM Quality" score={audit.scores.outputQuality} />
          </div>

          {/* Strengths bullet points */}
          {audit.strengths.length > 0 && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl p-3.5 space-y-1.5 mt-4">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Verified Quality Strengths
              </h4>
              <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1 list-disc list-inside">
                {audit.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Filterable Issues List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Output & Code Quality Audits ({filteredIssues.length} Items)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed findings with inline recommendations and suggested code fixes.
            </p>
          </div>

          {/* Category & Severity Filter Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border-none font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Architecture">Architecture</option>
              <option value="AntiPattern">Anti-Pattern</option>
              <option value="Performance">Performance</option>
              <option value="Accessibility">Accessibility</option>
              <option value="Security">Security</option>
              <option value="OutputQuality">Output Quality</option>
            </select>

            <select
              id="severity-filter-select"
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border-none font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Severities</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="Low">Low Severity</option>
            </select>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 space-y-2">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
            <p className="text-sm font-semibold">No issues matching selected filters.</p>
            <p className="text-xs text-slate-400">All checks in this view pass quality standards!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => {
              const isExpanded = expandedIssueId === issue.id;
              return (
                <div
                  key={issue.id}
                  id={`issue-card-${issue.id}`}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div
                    onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}
                    className="p-4 flex items-start justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <SeverityBadge severity={issue.severity} />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {issue.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {issue.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {issue.description}
                        </p>
                        {issue.file && (
                          <div className="flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                            <FileCode className="w-3.5 h-3.5" />
                            <span>{issue.file}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="text-slate-400 hover:text-slate-200 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded Fix & Code Snippet View */}
                  {isExpanded && (
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Recommended Action:
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {issue.recommendation}
                        </p>
                      </div>

                      {issue.suggestedFix && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Code2 className="w-3.5 h-3.5" />
                            Suggested Code Fix:
                          </span>
                          <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800">
                            <code>{issue.suggestedFix}</code>
                          </pre>
                        </div>
                      )}

                      {issue.file && onViewFileInInspector && (
                        <button
                          onClick={() => onViewFileInInspector(issue.file!)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                        >
                          View {issue.file} in File Tree Inspector
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const MetricBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  let color = 'bg-emerald-500';
  if (score < 60) color = 'bg-rose-500';
  else if (score < 80) color = 'bg-amber-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span className="font-bold">{score}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500 rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
};

const SeverityBadge: React.FC<{ severity: IssueSeverity }> = ({ severity }) => {
  switch (severity) {
    case 'High':
      return (
        <span className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          High
        </span>
      );
    case 'Medium':
      return (
        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Med
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Low
        </span>
      );
  }
};
