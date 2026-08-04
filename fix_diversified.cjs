const fs = require('fs');
let file = fs.readFileSync('src/utils/sectorMapping.ts', 'utf8');

if (!file.includes("EXPLICIT_SECTOR_MAP['Diversified / Textiles']")) {
  file += `
// Override legacy cached 'Diversified' sectors
EXPLICIT_SECTOR_MAP['Diversified / Textiles'] = 'Miscellaneous';
EXPLICIT_SECTOR_MAP['Diversified'] = 'Miscellaneous';
`;
  fs.writeFileSync('src/utils/sectorMapping.ts', file);
}
