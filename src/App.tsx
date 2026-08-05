import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUploadZone } from './components/FileUploadZone';
import { QualityDashboard } from './components/QualityDashboard';
import { FileTreeInspector } from './components/FileTreeInspector';
import { AuditReportExport } from './components/AuditReportExport';
import { DseBacktester } from './components/DseBacktester';
import { ExtractedFile, AuditResult, SampleProject } from './types';
import { parseZipFile } from './utils/zipParser';
import { runStaticAnalysis } from './utils/staticAnalyzer';
import { extractStockDataFromExtractedFiles, extractStockDataFromExtractedFilesAsync } from './utils/dseBacktestEngine';

export default function App() {
  const [projectFiles, setProjectFiles] = useState<ExtractedFile[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAiAuditing, setIsAiAuditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspector' | 'report' | 'dse_backtester'>('dse_backtester');
  const [inspectedFilePath, setInspectedFilePath] = useState<string | undefined>(undefined);

  // Handle uploaded ZIP archive
  const handleZipUploaded = async (file: File) => {
    try {
      setIsProcessing(true);
      const extracted = await parseZipFile(file);
      const name = file.name.replace(/\.zip$/i, '');
      setProjectFiles(extracted);
      setProjectName(name);

      // Check if uploaded ZIP contains stock data CSVs
      const stockData = await extractStockDataFromExtractedFilesAsync(extracted);
      if (stockData.length > 0) {
        setActiveTab('dse_backtester');
      } else {
        // Run instant static code quality analysis
        const staticAudit = runStaticAnalysis(extracted, name);
        setAuditResult(staticAudit);
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      console.error('Failed to parse ZIP file:', err);
      alert('Failed to parse the ZIP file. Please ensure it is a valid zip archive.');
    } finally {
      setIsProcessing(false);
    }
  };



  // Handle selected pre-loaded sample project
  const handleSelectSample = (sample: SampleProject) => {
    setProjectFiles(sample.files);
    setProjectName(sample.name);
    const staticAudit = runStaticAnalysis(sample.files, sample.name);
    setAuditResult(staticAudit);
    setActiveTab('dashboard');
  };

  // Run Gemini AI Deep Audit via Express server proxy
  const handleRunAiAudit = async () => {
    if (projectFiles.length === 0) return;

    try {
      setIsAiAuditing(true);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectFiles,
          projectMeta: { name: projectName },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const aiData = await response.json();

      if (aiData.scores && aiData.overallScore !== undefined) {
        // Merge AI deep audit with static findings
        setAuditResult((prev) => {
          if (!prev) return prev;
          const mergedIssues = [...prev.issues];

          if (aiData.criticalIssues && Array.isArray(aiData.criticalIssues)) {
            aiData.criticalIssues.forEach((issue: any, idx: number) => {
              mergedIssues.unshift({
                id: `ai-issue-${Date.now()}-${idx}`,
                title: issue.title || 'AI Flagged Recommendation',
                category: issue.category || 'Architecture',
                severity: issue.severity || 'Medium',
                file: issue.file,
                description: issue.description || '',
                recommendation: issue.recommendation || '',
                suggestedFix: issue.suggestedFix || '',
              });
            });
          }

          return {
            ...prev,
            overallScore: Math.round((prev.overallScore + aiData.overallScore) / 2),
            overallGrade: aiData.overallGrade || prev.overallGrade,
            summary: aiData.summary || prev.summary,
            scores: {
              architecture: Math.round((prev.scores.architecture + (aiData.scores.architecture || 90)) / 2),
              antiPattern: Math.round((prev.scores.antiPattern + (aiData.scores.antiPattern || 90)) / 2),
              performance: Math.round((prev.scores.performance + (aiData.scores.performance || 90)) / 2),
              accessibility: Math.round((prev.scores.accessibility + (aiData.scores.accessibility || 90)) / 2),
              security: Math.round((prev.scores.security + (aiData.scores.security || 90)) / 2),
              outputQuality: Math.round((prev.scores.outputQuality + (aiData.scores.outputQuality || 90)) / 2),
            },
            strengths: Array.from(new Set([...prev.strengths, ...(aiData.strengths || [])])),
            issues: mergedIssues,
            actionableFixes: Array.from(new Set([...prev.actionableFixes, ...(aiData.actionableFixes || [])])),
            analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });
      }
    } catch (err: any) {
      console.error('AI Audit Error:', err);
      alert('AI Audit Error: ' + (err.message || 'Failed to communicate with AI server.'));
    } finally {
      setIsAiAuditing(false);
    }
  };

  const handleReset = () => {
    setProjectFiles([]);
    setProjectName('');
    setAuditResult(null);
    setActiveTab('dashboard');
  };

  const handleViewFileInInspector = (filePath: string) => {
    setInspectedFilePath(filePath);
    setActiveTab('inspector');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        currentProjectName={projectName}
        totalFiles={projectFiles.length}
        overallGrade={auditResult?.overallGrade}
        overallScore={auditResult?.overallScore}
        onReset={handleReset}
        onRunAiAudit={handleRunAiAudit}
        isAiAuditing={isAiAuditing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'dse_backtester' ? (
          <DseBacktester uploadedFiles={projectFiles} />
        ) : projectFiles.length === 0 ? (
          <FileUploadZone
            onZipUploaded={handleZipUploaded}
            onSelectSample={handleSelectSample}
            isProcessing={isProcessing}
          />
        ) : (
          <div>
            {activeTab === 'dashboard' && auditResult && (
              <QualityDashboard
                audit={auditResult}
                onRunAiAudit={handleRunAiAudit}
                isAiAuditing={isAiAuditing}
                onViewFileInInspector={handleViewFileInInspector}
              />
            )}

            {activeTab === 'inspector' && (
              <FileTreeInspector
                files={projectFiles}
                selectedFilePath={inspectedFilePath}
                onSelectFile={(path) => setInspectedFilePath(path)}
              />
            )}

            {activeTab === 'report' && auditResult && (
              <AuditReportExport audit={auditResult} projectName={projectName} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Web App Output Quality & Code Inspector — Enterprise Audit Tool</span>
          <span className="text-slate-600">Cross-checking Code, Performance, Security & Output Quality</span>
        </div>
      </footer>
    </div>
  );
}
