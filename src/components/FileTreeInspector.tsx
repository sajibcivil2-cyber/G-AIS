import React, { useState } from 'react';
import { FileCode, FileText, Folder, File, Code, Eye, Copy, Check, Info } from 'lucide-react';
import { ExtractedFile } from '../types';

interface FileTreeInspectorProps {
  files: ExtractedFile[];
  selectedFilePath?: string;
  onSelectFile?: (filePath: string) => void;
}

export const FileTreeInspector: React.FC<FileTreeInspectorProps> = ({
  files,
  selectedFilePath,
  onSelectFile,
}) => {
  const [activePath, setActivePath] = useState<string>(selectedFilePath || files[0]?.path || '');
  const [copied, setCopied] = useState(false);

  const currentFile = files.find((f) => f.path === activePath) || files[0];

  const handleSelect = (path: string) => {
    setActivePath(path);
    if (onSelectFile) onSelectFile(path);
  };

  const copyCode = () => {
    if (currentFile && !currentFile.isBinary) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-4 min-h-[600px]">
        {/* Left Sidebar: Interactive File Tree */}
        <div className="lg:col-span-1 border-r border-slate-800 bg-slate-950/60 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              Project Files ({files.length})
            </span>
          </div>

          <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
            {files.map((file) => {
              const isActive = file.path === activePath;
              return (
                <div
                  key={file.path}
                  id={`file-tree-item-${file.path.replace(/[/.]/g, '-')}`}
                  onClick={() => handleSelect(file.path)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer font-mono transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileIcon extension={file.extension} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans ml-2">{formatFileSize(file.size)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900">
          {currentFile ? (
            <>
              {/* Code Viewer Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 font-mono text-xs text-slate-200">
                  <FileIcon extension={currentFile.extension} />
                  <span className="font-bold">{currentFile.path}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-sans">
                    {formatFileSize(currentFile.size)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!currentFile.isBinary && (
                    <button
                      id="copy-code-btn"
                      onClick={copyCode}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Source</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Code Content */}
              <div className="p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-900 flex-1 max-h-[550px] overflow-y-auto">
                {currentFile.isBinary ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-2">
                    <Info className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium">Binary or Media file preview not supported.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <tbody>
                      {currentFile.content.split('\n').map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="w-10 select-none text-slate-600 text-right pr-4 py-0.5 font-mono text-[11px] border-r border-slate-800">
                            {idx + 1}
                          </td>
                          <td className="pl-4 py-0.5 whitespace-pre font-mono text-slate-200">
                            {line || ' '}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="p-10 text-center text-slate-500">Select a file from the tree to view source code.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const FileIcon: React.FC<{ extension: string }> = ({ extension }) => {
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <Code className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'json':
      return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    case 'html':
      return <FileText className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case 'css':
      return <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
};
