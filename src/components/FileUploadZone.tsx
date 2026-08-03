import React, { useState, useRef } from 'react';
import { UploadCloud, FileArchive, CheckCircle2, ArrowRight, ShieldCheck, Code2, Zap, Layers, Sparkles } from 'lucide-react';
import { SampleProject } from '../types';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';

interface FileUploadZoneProps {
  onZipUploaded: (file: File) => void;
  onSelectSample: (sample: SampleProject) => void;
  isProcessing: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onZipUploaded,
  onSelectSample,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip') || file.type.includes('zip')) {
        onZipUploaded(file);
      } else {
        alert('Please upload a valid .zip file containing your web app source code.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onZipUploaded(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Hero Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Enterprise Web App Output Quality & Code Inspector
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Analyze & Cross-Check Web App Output Quality
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-slate-600 dark:text-slate-400">
          Upload your raw web application files in a <strong className="text-slate-800 dark:text-slate-200">.ZIP folder</strong> or test with pre-loaded projects to perform deep 6-dimensional code hygiene, output rendering, security, and accessibility checks.
        </p>
      </div>

      {/* ZIP Drag & Drop Upload Zone */}
      <div
        id="zip-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip,application/zip,application/x-zip-compressed"
          className="hidden"
          id="zip-file-input"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            {isProcessing ? (
              <UploadCloud className="w-8 h-8 animate-bounce text-indigo-500" />
            ) : (
              <FileArchive className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isProcessing ? 'Extracting ZIP & Analyzing Files...' : 'Drop your Web App .ZIP archive here'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports React, Vite, Next.js, Express, HTML/CSS/JS, TypeScript, and Node projects
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Browse ZIP File
          </button>
        </div>
      </div>

      {/* Analysis Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3 items-start">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Security & Secret Protection</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detects exposed API keys, active tokens, unsafe innerHTML, and missing CSP headers.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3 items-start">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Anti-Pattern & Cliché Detector</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Flags generic AI purple gradients, bloated nested cards, missing IDs, and silent error catches.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-3 items-start">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Performance & UX Cross-Check</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Analyzes infinite re-render risks, missing image alt tags, touch target sizing, and accessibility.
            </p>
          </div>
        </div>
      </div>

      {/* Pre-loaded Sample Projects Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Or Select a Pre-loaded Sample Web App Project to Analyze Immediately:
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">3 Presets Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_PROJECTS.map((sample) => (
            <div
              key={sample.id}
              id={`sample-project-${sample.id}`}
              onClick={() => onSelectSample(sample)}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {sample.badge}
                  </span>
                  <span className="text-[10px] text-slate-400">{sample.files.length} Files</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {sample.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {sample.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Run Quality Cross-Check</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
