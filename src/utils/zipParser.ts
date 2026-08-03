import JSZip from 'jszip';
import { ExtractedFile } from '../types';

const TEXT_EXTENSIONS = [
  'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'md', 'txt',
  'env', 'example', 'svg', 'xml', 'yaml', 'yml', 'toml', 'gitignore',
  'dockerfile', 'sh', 'cjs', 'mjs', 'lock', 'csv', 'tsv', 'dat', 'prn', 'log'
];

export async function parseZipFile(file: File): Promise<ExtractedFile[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const files: ExtractedFile[] = [];

  for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
    if (zipEntry.dir) continue;
    // Skip node_modules or dist/build caches if inside zip
    if (relativePath.includes('node_modules/') || relativePath.includes('.git/')) {
      continue;
    }

    const name = relativePath.split('/').pop() || relativePath;
    const ext = name.split('.').pop()?.toLowerCase() || '';

    const isText = TEXT_EXTENSIONS.includes(ext) || !ext;

    let content = '';
    let isBinary = !isText;

    if (isText) {
      try {
        content = await zipEntry.async('string');
      } catch {
        isBinary = true;
        content = '[Binary File]';
      }
    } else {
      content = '[Binary / Media Content]';
    }

    // Estimate size
    const uint8 = await zipEntry.async('uint8array');

    files.push({
      path: relativePath,
      name,
      size: uint8.byteLength,
      extension: ext,
      content,
      isBinary,
    });
  }

  // Sort files by path
  files.sort((a, b) => a.path.localeCompare(b.path));

  return files;
}
