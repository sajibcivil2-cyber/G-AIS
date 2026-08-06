import fs from 'fs';
let content = fs.readFileSync('src/utils/databaseStorage.ts', 'utf8');

const oldDecl = `export async function loadDatabaseFromStorage(): Promise<DseStockData[] | null> {`;
const newDecl = `export interface LoadDatabaseResult {
  stocks: DseStockData[];
  repairedSymbols: string[];
  droppedSymbols: string[];
}

export async function loadDatabaseFromStorage(): Promise<LoadDatabaseResult | null> {`;

content = content.replace(oldDecl, newDecl);

const oldRet1 = `        if (cleanStocks.length > 0) {
          return cleanStocks;
        }`;
const newRet1 = `        if (cleanStocks.length > 0) {
          return { stocks: cleanStocks, repairedSymbols, droppedSymbols };
        }`;

content = content.replace(oldRet1, newRet1);

const oldRet2 = `        const { stocks: cleanStocks } = validateAndRepairDatabase(parsed as DseStockData[]);
        if (cleanStocks.length > 0) {
          return cleanStocks;
        }`;
const newRet2 = `        const { stocks: cleanStocks, repairedSymbols, droppedSymbols } = validateAndRepairDatabase(parsed as DseStockData[]);
        if (cleanStocks.length > 0) {
          return { stocks: cleanStocks, repairedSymbols, droppedSymbols };
        }`;

content = content.replace(oldRet2, newRet2);

fs.writeFileSync('src/utils/databaseStorage.ts', content);
