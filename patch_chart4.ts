import fs from 'fs';
let content = fs.readFileSync('src/components/DseVolumeBreakoutChart.tsx', 'utf8');

const oldChips = `                    { id: 'Harmonic Pattern (C-to-D)', label: 'Harmonic C-to-D', icon: '💎' },`;
const newChips = `                    { id: 'Harmonic Pattern (C-to-D)', label: 'Harmonic C-to-D', icon: '💎' },
                    { id: 'Harmonic Pattern (D-Reversal)', label: 'Harmonic D-Reversal', icon: '🎯' },`;

content = content.replace(oldChips, newChips);
fs.writeFileSync('src/components/DseVolumeBreakoutChart.tsx', content);
