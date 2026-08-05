import { DseStockData } from '../types';

export const EXPLICIT_SECTOR_MAP: Record<string, string> = {
  // Mutual Funds often misclassified as Food & Allied due to AMCL or other keywords
  'ICBAMCL2ND': 'Mutual Funds',
  'ICBAMCL24': 'Mutual Funds',
  'ICBAGRANI1': 'Mutual Funds',
  'ICBEPMF1S1': 'Mutual Funds',
  'ICBSONALI1': 'Mutual Funds',
  'ICB3RDNRB': 'Mutual Funds',
  'PF1STMF': 'Mutual Funds',
  'PRIME1ICBA': 'Mutual Funds',
  'IFILISLMF1': 'Mutual Funds',
  'AIBL1STIMF': 'Mutual Funds',
  'CAPMBDWSMF': 'Mutual Funds',
  'CAPMIBBAMF': 'Mutual Funds',
  'FBFIF': 'Mutual Funds',
  'LRGLOBMF1': 'Mutual Funds',
  'MBL1STMF': 'Mutual Funds',
  'NLI1STMF': 'Mutual Funds',
  'PHPMF1': 'Mutual Funds',
  'RELIANCE1': 'Mutual Funds',
  'SEMLFBSLGF': 'Mutual Funds',
  'SEMLIBBLSF': 'Mutual Funds',
  'SEMLLECMF': 'Mutual Funds',
  'TRUSTB1MF': 'Mutual Funds',
  'VAMLBDMF1': 'Mutual Funds',
  'VAMLRBBF': 'Mutual Funds',
  'ATCSLGF': 'Mutual Funds',
  'DBH1STMF': 'Mutual Funds',
  'EBLNRBMF': 'Mutual Funds',
  'EXIM1STMF': 'Mutual Funds',
  'GREENDELMF': 'Mutual Funds',
  '1STPRIMFMA': 'Mutual Funds',
  'EBL1STMF': 'Mutual Funds',
  'IFIC1STMF': 'Mutual Funds',
  'NCCBLMUTUALFUND': 'Mutual Funds',
  'POPULAR1MF': 'Mutual Funds',
  'SEBL1STMF': 'Mutual Funds',
  'ABB1STMF': 'Mutual Funds',
  'GRAMEEN2': 'Mutual Funds',
  'GRAMEENS2': 'Mutual Funds',
  'ABBA1STMF': 'Mutual Funds',
  'PRIMEINS': 'Insurance General',
  'MONNOFABR': 'Textile',
  'SHASHADENIM': 'Textile',
  'SHASHDENIM': 'Textile',
};

/**
 * Overwrites auto-inferred sector categories for stocks with explicit definitions.
 * @param stocks Array of active stock datasets
 * @returns Array of stocks with corrected sectors
 */
export function applySectorOverrides(stocks: DseStockData[]): DseStockData[] {
  return stocks.map((stock) => {
    const symbol = stock.symbol.toUpperCase();
    if (EXPLICIT_SECTOR_MAP[symbol]) {
      
      let finalSector = EXPLICIT_SECTOR_MAP[symbol] || stock.sector;
      if (finalSector && finalSector.toLowerCase().includes('diversified')) {
        finalSector = 'Miscellaneous';
      }
      return {
        ...stock,
        sector: finalSector,
      };
    }
    
    let finalSector = stock.sector;
    if (finalSector && finalSector.toLowerCase().includes('diversified')) {
      finalSector = 'Miscellaneous';
      return { ...stock, sector: finalSector };
    }
    return stock;
  });
}

// Explicit mapping for MIRAKHTER
EXPLICIT_SECTOR_MAP['MIRAKHTER'] = 'Miscellaneous';

// Override legacy cached 'Diversified' sectors
EXPLICIT_SECTOR_MAP['Diversified / Textiles'] = 'Miscellaneous';
EXPLICIT_SECTOR_MAP['Diversified'] = 'Miscellaneous';
