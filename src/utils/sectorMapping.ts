import { DseStockData } from '../types';

/**
 * Authoritative DSE Sector Map for individual companies and similar-name ticker families.
 * Resolves ambiguities between conglomerates, sister concerns, and tickers with identical prefixes.
 */
export const EXPLICIT_SECTOR_MAP: Record<string, string> = {
  // --- APEX FAMILY ---
  'APEXFOODS': 'Food & Allied',
  'APEXTANRY': 'Tannery Industries',
  'APEXFOOT': 'Tannery Industries',
  'APEXADELFT': 'Tannery Industries',
  'APEXSPINN': 'Textile',

  // --- BEXIMCO FAMILY ---
  'BEXIMCO': 'Miscellaneous',
  'BXPHARMA': 'Pharmaceuticals & Chemicals',
  'BEXIMCOTXT': 'Textile',
  'BXPYSYN': 'Textile',
  'BEXGSUKUK': 'Corporate Bond',

  // --- MONNO FAMILY ---
  'MONNOCERA': 'Ceramic Sector',
  'MONNOFABR': 'Textile',
  'MONNOFAB': 'Textile',
  'MONNOSTAF': 'Textile',
  'MONNOAGML': 'Engineering',
  'MONNOAGRO': 'Engineering',

  // --- FU-WANG FAMILY ---
  'FUWANGCER': 'Ceramic Sector',
  'FUWANGFOOD': 'Food & Allied',
  'FUWANGAO': 'Food & Allied',

  // --- SQUARE FAMILY ---
  'SQURPHARMA': 'Pharmaceuticals & Chemicals',
  'SQUAREPHAR': 'Pharmaceuticals & Chemicals',
  'SQUARETEXT': 'Textile',
  'SQUARETEX': 'Textile',

  // --- PRIME FAMILY ---
  'PRIMEBANK': 'Bank',
  'PRIMEINS': 'Insurance General',
  'PRIMEISLAMI': 'Insurance General',
  'PRIMEFIN': 'Financial Institution',
  'PRIMETEX': 'Textile',
  'PRIMELIFE': 'Insurance Life',
  'PRIME1ICBA': 'Mutual Funds',

  // --- EASTERN / EBL FAMILY ---
  'EBL': 'Bank',
  'EASTERNBNK': 'Bank',
  'EBL1STMF': 'Mutual Funds',
  'EBLNRBMF': 'Mutual Funds',
  'EASTERNINS': 'Insurance General',
  'EASTERNI': 'Insurance General',
  'EASTLUB': 'Fuel & Power',
  'ECABLES': 'Engineering',
  'EASTERNCBL': 'Engineering',
  'EHL': 'Services & Real Estate',

  // --- MEGHNA FAMILY ---
  'MEGHNALIFE': 'Insurance Life',
  'MEGHNAINS': 'Insurance General',
  'MEGHNACEM': 'Cement',
  'MPETROLEUM': 'Fuel & Power',
  'MEGCONMILK': 'Food & Allied',
  'MEGHNAPET': 'Food & Allied',
  'MEGHNABAN': 'Food & Allied',

  // --- SONALI FAMILY ---
  'SONALIANSH': 'Jute',
  'SONALIPAPR': 'Paper & Printing',
  'SONALILIFE': 'Insurance Life',
  'SONARLIFE': 'Insurance Life',
  'ICBSONALI1': 'Mutual Funds',

  // --- DESH FAMILY ---
  'DESHBANDHU': 'Engineering',
  'DESHBANDH': 'Engineering',
  'DESHGARM': 'Textile',
  'DESCO': 'Fuel & Power',

  // --- NAVANA FAMILY ---
  'NAVANACNG': 'Engineering',
  'NAVANAPHAR': 'Pharmaceuticals & Chemicals',

  // --- ARAMIT FAMILY ---
  'ARAMIT': 'Engineering',
  'ARAMITCEM': 'Cement',
  'ARAMITFOOT': 'Tannery Industries',

  // --- NATIONAL / NBL FAMILY ---
  'NBL': 'Bank',
  'NATLIFEINS': 'Insurance Life',
  'NLI1STMF': 'Mutual Funds',
  'NATIONALPOL': 'Engineering',
  'NAVIPOLY': 'Engineering',
  'NHFIL': 'Financial Institution',
  'NTLTUBE': 'Engineering',
  'NATFEED': 'Food & Allied',

  // --- STANDARD FAMILY ---
  'STANDARD': 'Bank',
  'STANDBANKL': 'Bank',
  'STANDARDIN': 'Insurance General',
  'STANDARINS': 'Insurance General',
  'STANCERAM': 'Ceramic Sector',

  // --- CITY FAMILY ---
  'CITYBANK': 'Bank',
  'CITYINS': 'Insurance General',
  'CITYGENINS': 'Insurance General',

  // --- ISLAMI FAMILY ---
  'ISLAMIBANK': 'Bank',
  'IBBL': 'Bank',
  'ISLAMICFIN': 'Financial Institution',
  'ISLAMIINS': 'Insurance General',
  'FAREASTLIF': 'Insurance Life',
  'FAREASTFIN': 'Financial Institution',
  'FAREASTINS': 'Insurance General',

  // --- MERCANTILE FAMILY ---
  'MERCANBANK': 'Bank',
  'MBL': 'Bank',
  'MERCANINS': 'Insurance General',
  'MERCINS': 'Insurance General',
  'MBL1STMF': 'Mutual Funds',

  // --- RUPALI FAMILY ---
  'RUPALIBANK': 'Bank',
  'RUPALIINS': 'Insurance General',
  'RUPALILIFE': 'Insurance Life',

  // --- JANATA FAMILY ---
  'JANATAINS': 'Insurance General',
  '1JANATAMF': 'Mutual Funds',

  // --- JAMUNA FAMILY ---
  'JAMUNABANK': 'Bank',
  'JAMUNAOIL': 'Fuel & Power',

  // --- DHAKA FAMILY ---
  'DHAKABANK': 'Bank',
  'DHAKAAINS': 'Insurance General',
  'DHAKAINS': 'Insurance General',

  // --- EXIM FAMILY ---
  'EXIMBANK': 'Bank',
  'EXIM1STMF': 'Mutual Funds',
  'EXIMINS': 'Insurance General',

  // --- PREMIER FAMILY ---
  'PREMIERBAN': 'Bank',
  'PREMIERLEA': 'Financial Institution',
  'PREMIERCEM': 'Cement',

  // --- PADMA FAMILY ---
  'PADMAOIL': 'Fuel & Power',
  'PADMALIFE': 'Insurance Life',

  // --- SANDHANI FAMILY ---
  'SANDHANI': 'Insurance Life',
  'SANDHANINS': 'Insurance Life',

  // --- UNION FAMILY ---
  'UNIONBANK': 'Bank',
  'UNIONCAP': 'Financial Institution',
  'UNIONINS': 'Insurance General',

  // --- FIRST FAMILY ---
  'FIRSTSBANK': 'Bank',
  'FSIBL': 'Bank',
  'FIRSTFIN': 'Financial Institution',
  '1STPRIMFMF': 'Mutual Funds',
  '1STPRIMFMA': 'Mutual Funds',

  // --- GLOBAL FAMILY ---
  'GLOBALBANK': 'Bank',
  'GIB': 'Bank',
  'GLOBALINS': 'Insurance General',
  'LRGLOBMF1': 'Mutual Funds',

  // --- CRYSTAL / CONTINENTAL / CENTRAL FAMILY ---
  'CRYSTALINS': 'Insurance General',
  'CONTININS': 'Insurance General',
  'CENTRALINS': 'Insurance General',
  'CENTRALPH': 'Pharmaceuticals & Chemicals',

  // --- SHAHJALAL FAMILY ---
  'SHAHJABANK': 'Bank',
  'SJIBL': 'Bank',
  'SHAHJIBAZA': 'Fuel & Power',

  // --- UNITED FAMILY ---
  'UCB': 'Bank',
  'UCBNK': 'Bank',
  'UPGDCL': 'Fuel & Power',
  'UNITEDFIN': 'Financial Institution',
  'UNITEDAIR': 'Travel & Leisure',

  // --- PARAMOUNT FAMILY ---
  'PARAMOUNT': 'Textile',
  'PARAMOUNTT': 'Textile',
  'PTL': 'Textile',
  'PARAMOUT': 'Insurance General',
  'PARAMOUNTINS': 'Insurance General',

  // --- MALEK FAMILY ---
  'MALEKSPIN': 'Textile',

  // --- AAMRA FAMILY ---
  'AAMRANET': 'IT Sector',
  'AAMRATECH': 'IT Sector',

  // --- OLYMPIC FAMILY ---
  'OLYMPIC': 'Food & Allied',
  'OLYMPICEX': 'Textile',

  // --- SERVICES & REAL ESTATE & MISCELLANEOUS ---
  'SAMORITA': 'Services & Real Estate',
  'SAIFPOWER': 'Services & Real Estate',
  'MIRAKHTER': 'Miscellaneous',
  'BERGERPBL': 'Miscellaneous',
  'BSC': 'Miscellaneous',
  'SINOBANGLA': 'Miscellaneous',

  // --- MUTUAL FUNDS EXPLICIT LIST ---
  'ICBAMCL2ND': 'Mutual Funds',
  'ICBAMCL24': 'Mutual Funds',
  'ICBAGRANI1': 'Mutual Funds',
  'ICBEPMF1S1': 'Mutual Funds',
  'ICB3RDNRB': 'Mutual Funds',
  'PF1STMF': 'Mutual Funds',
  'IFILISLMF1': 'Mutual Funds',
  'AIBL1STIMF': 'Mutual Funds',
  'CAPMBDWSMF': 'Mutual Funds',
  'CAPMIBBAMF': 'Mutual Funds',
  'FBFIF': 'Mutual Funds',
  'PHPMF1': 'Mutual Funds',
  'RELIANCE1': 'Mutual Funds',
  'SEMLFBSLGF': 'Mutual Funds',
  'SEMLIBBLSF': 'Mutual Funds',
  'SEMLLECMF': 'Mutual Funds',
  'TRUSTB1MF': 'Mutual Funds',
  'TRUSTB1ST': 'Mutual Funds',
  'VAMLBDMF1': 'Mutual Funds',
  'VAMLRBBF': 'Mutual Funds',
  'ATCSLGF': 'Mutual Funds',
  'DBH1STMF': 'Mutual Funds',
  'GREENDELMF': 'Mutual Funds',
  'IFIC1STMF': 'Mutual Funds',
  'NCCBLMF1': 'Mutual Funds',
  'NCCBLMUTUALFUND': 'Mutual Funds',
  'POPULAR1MF': 'Mutual Funds',
  'SEBL1STMF': 'Mutual Funds',
  'ABB1STMF': 'Mutual Funds',
  'GRAMEEN2': 'Mutual Funds',
  'GRAMEENS2': 'Mutual Funds',
  'ABBA1STMF': 'Mutual Funds',

  // --- TEXTILES & SPINNING ---
  'SHASHADENIM': 'Textile',
  'SHASHDENIM': 'Textile',
  'TOSRIFA': 'Textile',
  'ARGONDENIM': 'Textile',
  'SIMTEX': 'Textile',
  'MATINSPINN': 'Textile',
  'ZAHEENSPN': 'Textile',
  'GENERATION': 'Textile',
  'METROSPIN': 'Textile',
  'PACIFICDEN': 'Textile',
  'ALHAJTEX': 'Textile',
  'KATTALI': 'Textile',
  'NURANI': 'Textile',
  'QUEENSOUTH': 'Textile',
  'REGENT': 'Textile',
  'RNSPIN': 'Textile',
  'SAIHAMCOT': 'Textile',
  'SAIHAMTEX': 'Textile',
  'SHEPHERD': 'Textile',
  'TALLUSPIN': 'Textile',
  'MLSPECTRA': 'Textile',
  'DULAMIACOT': 'Textile',
  'FAMILYTEX': 'Textile',
  'MITHUNKNIT': 'Textile',
  'VFSTDL': 'Textile',
  'HWAWELL': 'Textile',
  'ESQUIRE': 'Textile',
  'EVINCE': 'Textile',
  'MAKSONSPIN': 'Textile',
  'SAFKOSPINN': 'Textile',

  // --- IT SECTOR ---
  'ADNTEL': 'IT Sector',
  'GENEXIL': 'IT Sector',
  'AGNI': 'IT Sector',
  'AGNISYSTEM': 'IT Sector',
  'EGEN': 'IT Sector',
  'EGENERATN': 'IT Sector',
  'BDCOM': 'IT Sector',
  'INTECH': 'IT Sector',
  'DAFODILCOM': 'IT Sector',
  'INFOSYS': 'IT Sector',
};

// Aliases and legacy fixes
EXPLICIT_SECTOR_MAP['Diversified / Textiles'] = 'Miscellaneous';
EXPLICIT_SECTOR_MAP['Diversified'] = 'Miscellaneous';

/**
 * Overwrites auto-inferred sector categories for stocks with explicit definitions.
 * Evaluates both ticker symbol and company name to guarantee clean representation.
 * @param stocks Array of active stock datasets
 * @returns Array of stocks with corrected sectors
 */
export function applySectorOverrides(stocks: DseStockData[]): DseStockData[] {
  if (!stocks || !Array.isArray(stocks)) return [];

  return stocks.map((stock) => {
    if (!stock || !stock.symbol) return stock;
    const symbol = stock.symbol.toUpperCase().trim().replace(/[^A-Z0-9_\-]/g, '');
    const cleanSym = symbol.replace(/_/g, '');

    // 1. Direct explicit lookup by symbol
    if (EXPLICIT_SECTOR_MAP[cleanSym]) {
      let finalSector = EXPLICIT_SECTOR_MAP[cleanSym];
      if (finalSector && finalSector.toLowerCase().includes('diversified')) {
        finalSector = 'Miscellaneous';
      }
      return {
        ...stock,
        sector: finalSector,
      };
    }

    // 2. Disambiguate similar name groups by name/symbol heuristics
    const target = `${cleanSym} ${(stock.name || '').toUpperCase()}`;
    let resolvedSector = stock.sector;

    // Apex group disambiguation
    if (cleanSym.startsWith('APEX') || target.includes('APEX')) {
      if (target.includes('FOOD')) resolvedSector = 'Food & Allied';
      else if (target.includes('SPIN') || target.includes('KNIT') || target.includes('TEX')) resolvedSector = 'Textile';
      else if (target.includes('TAN') || target.includes('FOOT') || target.includes('SHOE') || target.includes('ADEL')) resolvedSector = 'Tannery Industries';
    }
    // Monno group disambiguation
    else if (cleanSym.startsWith('MONNO') || target.includes('MONNO')) {
      if (target.includes('CERA') || target.includes('CERAMIC')) resolvedSector = 'Ceramic Sector';
      else if (target.includes('FAB') || target.includes('TEXT')) resolvedSector = 'Textile';
      else if (target.includes('AGRO') || target.includes('MACH') || target.includes('AGML')) resolvedSector = 'Engineering';
    }
    // Fu-Wang group disambiguation
    else if (cleanSym.startsWith('FUWANG') || target.includes('FU-WANG') || target.includes('FUWANG')) {
      if (target.includes('CER') || target.includes('CERAMIC')) resolvedSector = 'Ceramic Sector';
      else if (target.includes('FOOD')) resolvedSector = 'Food & Allied';
    }
    // Square group disambiguation
    else if (cleanSym.startsWith('SQUR') || cleanSym.startsWith('SQUARE') || target.includes('SQUARE')) {
      if (target.includes('PHARM') || target.includes('PHARMA')) resolvedSector = 'Pharmaceuticals & Chemicals';
      else if (target.includes('TEXT') || target.includes('TEX') || target.includes('YARN')) resolvedSector = 'Textile';
    }
    // Beximco group disambiguation
    else if (cleanSym.startsWith('BEX') || cleanSym.startsWith('BX') || target.includes('BEXIMCO')) {
      if (target.includes('PHARM') || cleanSym === 'BXPHARMA') resolvedSector = 'Pharmaceuticals & Chemicals';
      else if (target.includes('TEXT') || target.includes('SYNTH') || cleanSym === 'BEXIMCOTXT' || cleanSym === 'BXPYSYN') resolvedSector = 'Textile';
      else if (target.includes('SUKUK')) resolvedSector = 'Corporate Bond';
      else if (cleanSym === 'BEXIMCO') resolvedSector = 'Miscellaneous';
    }
    // Prime group disambiguation
    else if (cleanSym.startsWith('PRIME') || target.includes('PRIME')) {
      if (target.includes('BANK') && !target.includes('MF') && !target.includes('ICBA')) resolvedSector = 'Bank';
      else if (target.includes('LIFE')) resolvedSector = 'Insurance Life';
      else if (target.includes('INS') || target.includes('ISLAMI')) resolvedSector = 'Insurance General';
      else if (target.includes('FIN')) resolvedSector = 'Financial Institution';
      else if (target.includes('TEX') || target.includes('SPIN')) resolvedSector = 'Textile';
      else if (target.includes('MF') || target.includes('ICBA')) resolvedSector = 'Mutual Funds';
    }
    // Meghna group disambiguation
    else if (cleanSym.startsWith('MEGH') || cleanSym === 'MPETROLEUM' || target.includes('MEGHNA')) {
      if (target.includes('LIFE')) resolvedSector = 'Insurance Life';
      else if (target.includes('INS')) resolvedSector = 'Insurance General';
      else if (target.includes('CEM')) resolvedSector = 'Cement';
      else if (target.includes('PETROLEUM') || cleanSym === 'MPETROLEUM') resolvedSector = 'Fuel & Power';
      else if (target.includes('COND') || target.includes('MILK') || target.includes('PET') || target.includes('BAN')) resolvedSector = 'Food & Allied';
    }
    // Sonali group disambiguation
    else if (cleanSym.startsWith('SONALI') || cleanSym.startsWith('SONAR') || target.includes('SONALI')) {
      if (target.includes('ANSH') || target.includes('JUTE')) resolvedSector = 'Jute';
      else if (target.includes('PAPR') || target.includes('PAPER')) resolvedSector = 'Paper & Printing';
      else if (target.includes('LIFE') || target.includes('INS')) resolvedSector = 'Insurance Life';
      else if (target.includes('MF') || target.includes('ICB')) resolvedSector = 'Mutual Funds';
    }
    // Desh group disambiguation
    else if (cleanSym.startsWith('DESH') || target.includes('DESH')) {
      if (target.includes('BANDHU') || target.includes('POLY')) resolvedSector = 'Engineering';
      else if (target.includes('GARM') || target.includes('TEXT')) resolvedSector = 'Textile';
    }
    // Paramount group disambiguation
    else if (cleanSym.startsWith('PARAM') || target.includes('PARAMOUNT')) {
      if (target.includes('INS')) resolvedSector = 'Insurance General';
      else resolvedSector = 'Textile';
    }
    // Malek Spinning
    else if (cleanSym === 'MALEKSPIN' || target.includes('MALEK SPINNING')) {
      resolvedSector = 'Textile';
    }

    if (resolvedSector && resolvedSector.toLowerCase().includes('diversified')) {
      resolvedSector = 'Miscellaneous';
    }

    return {
      ...stock,
      sector: resolvedSector || stock.sector || 'Miscellaneous',
    };
  });
}

