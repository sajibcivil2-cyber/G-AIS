import fs from 'fs';
let content = fs.readFileSync('src/components/DseBacktester.tsx', 'utf8');

const oldBlock = `        const savedStocks = await loadDatabaseFromStorage();
        if (savedStocks && savedStocks.length > 0) {`;
        
const newBlock = `        const loadResult = await loadDatabaseFromStorage();
        if (loadResult && loadResult.stocks.length > 0) {
          const { stocks: savedStocks, repairedSymbols, droppedSymbols } = loadResult;
          
          if (repairedSymbols.length > 0 || droppedSymbols.length > 0) {
            setDataQualityNotice(\`Database verification complete. Automatically repaired \${repairedSymbols.length} corrupted ticker(s). Dropped \${droppedSymbols.length} unrecoverable ticker(s).\`);
            setTimeout(() => setDataQualityNotice(null), 10000);
          }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/DseBacktester.tsx', content);
