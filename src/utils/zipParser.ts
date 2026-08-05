import JSZip from 'jszip';
import { ExtractedFile } from '../types';

const TEXT_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'md', 'txt',
  'env', 'example', 'svg', 'xml', 'yaml', 'yml', 'toml', 'gitignore',
  'dockerfile', 'sh', 'cjs', 'mjs', 'lock', 'csv', 'tsv', 'dat', 'prn', 'log'
];

export async function parseZipFile(file: File, onProgress?: (processed: number, total: number) => void): Promise<ExtractedFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const files: ExtractedFile[] = [];

  const entries = Object.entries(loadedZip.files).filter(([path, entry]) => {
    if (entry.dir) return false;
    if (path.includes('node_modules/') || path.includes('.git/') || path.includes('__MACOSX/')) {
      return false;
    }
    return true;
  });

  const total = entries.length;
  let count = 0;

  for (const [relativePath, zipEntry] of entries) {
    count++;
    if (onProgress && (count % 10 === 0 || count === total)) {
      onProgress(count, total);
    }

    // Yield to main thread every 20 files to keep UI smooth and avoid browser lockup
    if (count % 20 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const name = relativePath.split('/').pop() || relativePath;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const isText = TEXT_EXTENSIONS.includes(ext) || !ext;

    let content = '';
    let isBinary = !isText;
    let size = 0;

    if (isText) {
      try {
        content = await zipEntry.async('string');
        size = content.length;
      } catch {
        isBinary = true;
        content = '[Binary File]';
      }
    } else {
      content = '[Binary / Media Content]';
    }

    if (isBinary) {
      try {
        const uint8 = await zipEntry.async('uint8array');
        size = uint8.byteLength;
      } catch {
        size = 0;
      }
    }

    files.push({
      path: relativePath,
      name,
      size,
      extension: ext,
      content,
      isBinary,
    });
  }

  // Sort files by path
  files.sort((a, b) => a.path.localeCompare(b.path));

  return files;
}
