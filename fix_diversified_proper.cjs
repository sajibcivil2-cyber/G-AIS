const fs = require('fs');
let file = fs.readFileSync('src/utils/sectorMapping.ts', 'utf8');

file = file.replace(/return \{/g, `
      let finalSector = EXPLICIT_SECTOR_MAP[symbol] || stock.sector;
      if (finalSector && finalSector.toLowerCase().includes('diversified')) {
        finalSector = 'Miscellaneous';
      }
      return {`);
      
file = file.replace(/sector: EXPLICIT_SECTOR_MAP\[symbol\],/g, `sector: finalSector,`);
      
file = file.replace(/return stock;/g, `
    let finalSector = stock.sector;
    if (finalSector && finalSector.toLowerCase().includes('diversified')) {
      finalSector = 'Miscellaneous';
      return { ...stock, sector: finalSector };
    }
    return stock;`);

fs.writeFileSync('src/utils/sectorMapping.ts', file);
