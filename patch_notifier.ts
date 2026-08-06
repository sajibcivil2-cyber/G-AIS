import fs from 'fs';
let content = fs.readFileSync('src/components/PatternScanNotifier.tsx', 'utf8');

const oldPatternsList = `      'Harmonic Pattern (C-to-D)',
      'Box Range Consolidation',`;

const newPatternsList = `      'Harmonic Pattern (C-to-D)',
      'Harmonic Pattern (D-Reversal)',
      'Box Range Consolidation',`;

content = content.replace(oldPatternsList, newPatternsList);

const oldSwitch = `      case 'Harmonic Pattern (C-to-D)':
        return { icon: '🦋', label: 'Harmonic C-to-D', color: 'text-rose-400 bg-rose-500/20 border-rose-500/40' };`;

const newSwitch = `      case 'Harmonic Pattern (C-to-D)':
        return { icon: '🦋', label: 'Harmonic C-to-D', color: 'text-rose-400 bg-rose-500/20 border-rose-500/40' };
      case 'Harmonic Pattern (D-Reversal)':
        return { icon: '🎯', label: 'Harmonic D-Reversal', color: 'text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/40' };`;

content = content.replace(oldSwitch, newSwitch);

fs.writeFileSync('src/components/PatternScanNotifier.tsx', content);
