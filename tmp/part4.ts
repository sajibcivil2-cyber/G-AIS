export function inferDseSector(symbol: string, rawSector?: string, rawName?: string): string {
  if (rawSector && rawSector.trim().length > 2) {
    const cleanRaw = rawSector.trim();
    const lower = cleanRaw.toLowerCase();
    if (!INVALID_SECTOR_KEYWORDS.some(kw => lower.includes(kw))) {
      return cleanRaw;
    }
  }

  const sym = symbol.toUpperCase().replace(/[^A-Z0-9_]/g, '');

  // Direct check for numbered sector formats (e.g. 11_IT_Sector, 01_Bank, 20_Textile)
  if (/^\d{2}_/.test(sym)) {
    const stripped = sym.replace(/^\d{2}_/, '').replace(/_/g, ' ');
    if (/BANK/i.test(stripped)) return 'Bank';
    if (/FINAN/i.test(stripped)) return 'Financial Institution';
    if (/PHARMA/i.test(stripped)) return 'Pharmaceuticals & Chemicals';
    if (/TEXT/i.test(stripped)) return 'Textile';
    if (/INSURANCE.*LIFE/i.test(stripped)) return 'Insurance Life';
    if (/INSUR/i.test(stripped)) return 'Insurance General';
    if (/CEM/i.test(stripped)) return 'Cement';
    if (/CERAM/i.test(stripped)) return 'Ceramic Sector';
    if (/FUEL|POWER/i.test(stripped)) return 'Fuel & Power';
    if (/ENGIN/i.test(stripped)) return 'Engineering';
    if (/FOOD/i.test(stripped)) return 'Food & Allied';
    if (/IT/i.test(stripped)) return 'IT Sector';
    if (/PAPER/i.test(stripped)) return 'Paper & Printing';
    if (/TANNERY|LEATH/i.test(stripped)) return 'Tannery Industries';
    if (/TRAVEL|LEISU/i.test(stripped)) return 'Travel & Leisure';
    if (/SERVI|REAL/i.test(stripped)) return 'Services & Real Estate';
    if (/TELE/i.test(stripped)) return 'Telecommunication';
    if (/MUTUAL|FUND/i.test(stripped)) return 'Mutual Funds';
    if (/JUTE/i.test(stripped)) return 'Jute';
    if (/BOND|DEBENTURE/i.test(stripped)) return 'Corporate Bond';
    if (/MISC/i.test(stripped)) return 'Miscellaneous';
    return stripped;
  }

  const cleanSym = sym.replace(/_/g, '');

  // 1. Direct DSE Lookup
  if (DSE_SECTOR_MAP[cleanSym]) {
    return DSE_SECTOR_MAP[cleanSym];
  }

  // 2. Pattern & Name Heuristics
  const target = `${cleanSym} ${(rawName || '').toUpperCase()}`;

  if (/MUTUAL|FUND|MF\b|MF1|GRAMEEN2|GRAMEENS2|EBL1ST|IFIC1ST|NCCBL|1STPR|POPULAR1MF|SEBL|ICBAMCL|ICBEP|ICBSONALI|ICB3RD|PF1ST|PRIME1|IFILISL|AIBL1ST|CAPM|FBFIF|ICBAGRANI|LRGLOB|MBL1ST|NLI1ST|PHPMF|RELIANCE1|SEML|TRUSTB1|VAML|ATCSLGF|DBH1ST|EBLNRB|EXIM1ST|GREENDEL/i.test(target)) return 'Mutual Funds';
  if (/BANK|BNK|ISLAMIBANK|DUTCHBANGL|PUBALIBANK|BRACBANK|PRIMEBANK|CITYBANK|DHAKABANK|EXIMBANK|JAMUNABANK|MIDLANDBNK|NCCBANK|NRBBANK|ONEBANK|SBACBANK|SHAHJABANK|SIBL|TRUSTBANK|UCB|UTTARABANK|MERCANBANK|SOUTHEASTB/i.test(target)) return 'Bank';
  if (/FIN|LEASE|CAPITAL|HOLDING|FINANCE|IPDC|IDLC|DBH|GSP|LANKABA|MIDAS|BAY|PHOENIXFIN|FASFIN|BIFC|NHFIL|PLFSL/i.test(target)) return 'Financial Institution';
  if (/PHARM|CHEM|LAB|DRUG|BIO|MED|SQUR|RENATA|ACI|MARICO|BEACON|IBN|ORION|ACME|ADVENT|SILCO|KOHINOOR|KEYA|SALVO|WATA|TECHNODRUG|JMI/i.test(target)) return 'Pharmaceuticals & Chemicals';
  if (/TEX|SPIN|DENIM|FABRIC|GARMENT|WOVEN|KNIT|COT|ENVOY|SQUARE|SIMTEX|MATIN|PACIFIC|MODERN|REGENT|RNSPIN|SAIHAM|SHEPHERD|TALLU|MONNOFAB|SHASHA/i.test(target)) return 'Textile';
  if (/LIFE|SANDHANI/i.test(target)) return 'Insurance Life';
  if (/\bINS\b|INSURANCE|GREENDELT|RELIANCINS|ASIAINS|BGIC|PRAGATIINS|PROVATIINS|REPUBLICA|NITOLINS|SONARBAINS|FAREASTINS|FEDERALINS|JANATAINS|KARNAPHULI|PEOPLESINS|RUPALIINS|SENAKALYAN|PRIMEINS|CENTRALINS|CONTININS|PARAMOUT|CITYINS|STANDARDIN|AGRANIINS|ASIAPACINS|CRYSTALINS|DHAKAAINS|EXIMINS|GLOBALINS|ISLAMIINS|MERCANINS|PROGRESSIVE|UNIONINS/i.test(target)) return 'Insurance General';
  if (/CEM|CEMENT|LHBL|HEIDELB|CROWN|MISEM|CONFID|ARAMIT/i.test(target)) return 'Cement';
  if (/CERAMIC|\bRAK\b|RAKCERAMIC|\bSHIN\b|SHINECPA|MONNOCERA|FUWANGCER/i.test(target)) return 'Ceramic Sector';
  if (/POWER|GAS|OIL|PETRO|ENERGY|GRID|ELECTRIC|TITAS|JAMUNAOIL|PADMA|DESCO|UPGDCL|SUMMIT|MJL|KPCL|DORIN|BARAKA|SHAHJIBAZA|LINDE/i.test(target)) return 'Fuel & Power';
  if (/STEEL|ISPAT|AUTO|CABLE|ENGINEER|METAL|PIPE|ALLOY|BSRM|GPH|WALTON|SINGER|KDS|AFTAB|RUNNER|COPPER|OIMEX|RSRM|BBS|ANWAR|DESH|ECABLE/i.test(target)) return 'Engineering';
  if (/FOOD|FEED|AGRO|BEV|ALLIED|SUGAR|SEA|POULTRY|GRAIN|BATBC|OLYMPIC|LOVELLO|EMERALD|FINEFOODS|AMCLPRAN|FUWANGFOOD|BEACHHATCH|RAHIMA|ZEAL/i.test(target)) return 'Food & Allied';
  if (/\bIT\b|\bITC\b|TECH|CYBER|SOFTWARE|ADN|GENEX|AAMRA|BDCOM|AGNI|INTECH|E-GEN|DAFODILCOM/i.test(target)) return 'IT Sector';
  if (/PAPER|PULP|PRINT|BOARD|HAKKANI|SONALI|BPPAPER/i.test(target)) return 'Paper & Printing';
  if (/LEATHER|TANRY|SHOE|FOOT|BATA|FORTUNE|SAMATA|APEX/i.test(target)) return 'Tannery Industries';
  if (/HOTEL|RESORT|TRAVEL|LEISURE|PEARL|PENINSULA|SEAPEARL/i.test(target)) return 'Travel & Leisure';
  if (/EHL|SAMORITA|EASTERN|REAL|SERVI|SAIFPOWER/i.test(target)) return 'Services & Real Estate';
  if (/\bGP\b|TELE|ROBI|BSCCL|GRAMEENPHONE/i.test(target)) return 'Telecommunication';

  if (/JUTE|SONALIANSH|NORTHERN|JUTESPINN/i.test(target)) return 'Jute';
  if (/BOND|DEBENTURE/i.test(target)) return 'Corporate Bond';
  return 'Miscellaneous';
}

export function isSectorOrMarketIndex(symbol: string): boolean {
  const sym = symbol.trim().toUpperCase();
  if (!sym) return false;
  if (/^(DSEX|DSES|DS30|CSE|CASPI|CSX)$/i.test(sym)) return true;
  if (/^\d{2}/.test(sym)) return true; // BDShare uses 00DSEX, 01Bank, etc.
  if (/_Sector$/i.test(sym) || /_Funds$/i.test(sym) || /_Bond$/i.test(sym) || /_Index$/i.test(sym)) return true;
  return false;
}

// Numeric cleaner for CSV data (removes commas, quotes, BDT symbols, whitespace)
export function cleanNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const str = String(val)
    .replace(/["'\s]/g, '')
    .replace(/BDT|Tk|TK|BDT\b/gi, '')
    .replace(/,/g, '')
    .trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

// CSV / JSON Custom DSE Stock Dataset Parser (Single or Multi-stock)
export function parseCustomDseStockFile(fileContent: string, fileName: string): DseStockData | null {
  const parsed = parseCustomDseStockFiles(fileContent, fileName);
  return parsed.length > 0 ? parsed[0] : null;
}

export function parseCustomDseStockFiles(fileContent: string, fileName: string): DseStockData[] {
  const results: DseStockData[] = [];
  try {
    if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(fileContent);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => {
        if (item.symbol && Array.isArray(item.candles) ) {
          const candleMap = new Map<string, DseStockCandle>();
          item.candles.forEach((c: DseStockCandle) => {
            const normDate = normalizeDateString(c.date);
            const open = cleanNumber(c.open, 0);
            const close = cleanNumber(c.close, open);
            const high = Math.max(cleanNumber(c.high, open), open, close);
            const low = Math.min(cleanNumber(c.low, open), open, close);
            const volume = cleanNumber(c.volume, 100000);
            candleMap.set(normDate, { date: normDate, open, high, low, close, volume });
          });
          const sorted = Array.from(candleMap.values()).sort(
            (a, b) => a.date.localeCompare(b.date)
          );
          results.push({
            ...item,
            sector: inferDseSector(item.symbol, item.sector, item.name),
            candles: sorted,
          });
        }
      });
      return results;
    }

    // CSV Parsing (Supports multi-stock CSV or single stock CSV)
    const lines = fileContent.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 1) return [];

    // Auto-detect delimiter (comma, tab, semicolon, pipe)
    const sampleLine = lines[0];
    let delimiter = ',';
    if (sampleLine.includes('\t')) delimiter = '\t';
    else if (sampleLine.includes(';') && sampleLine.split(';').length > sampleLine.split(',').length) delimiter = ';';
    else if (sampleLine.includes('|') && sampleLine.split('|').length > sampleLine.split(',').length) delimiter = '|';

    const headerParts = lines[0].toLowerCase().split(delimiter).map((h) => h.replace(/["'\s]/g, '').trim());
    const hasHeader = headerParts.some((h) => h.includes('date') || h.includes('close') || h.includes('symbol') || h.includes('ticker') || h.includes('ltp') || h.includes('price'));
    const startIdx = hasHeader ? 1 : 0;

    // Detect column indexes if header exists
    let symbolCol = -1;
    let sectorCol = -1;
    let nameCol = -1;
    let dateCol = 0;
    let openCol = 1;
    let highCol = 2;
    let lowCol = 3;
    let closeCol = 4;
    let volCol = 5;

    if (hasHeader) {
      // Symbol
      headerParts.forEach((col, idx) => {
        if (/^(symbol|ticker|trading_code|scrip|code|stock)$/i.test(col) || (symbolCol < 0 && (col.includes('symbol') || col.includes('ticker') || col.includes('scrip') || col.includes('code')))) {
          symbolCol = idx;
        }
      });

      // Date
      headerParts.forEach((col, idx) => {
        if (/^(date|dt|trading_date|time|pub_date)$/i.test(col) || col.includes('date') || col.includes('time')) {
          dateCol = idx;
        }
      });

      // Sector
      headerParts.forEach((col, idx) => {
        if (/^(sector|industry|category|group)$/i.test(col) || col.includes('sector') || col.includes('industry')) {
          sectorCol = idx;
        }
      });

      // Company Name
      headerParts.forEach((col, idx) => {
        if (/^(company|name|title|company_name|company_title)$/i.test(col) || col.includes('company') || col.includes('name')) {
          nameCol = idx;
        }
      });

      // Close / LTP (Explicitly ignore YCP, Previous Close, Change, Avg)
      headerParts.forEach((col, idx) => {
        const isYcp = col.includes('ycp') || col.includes('prev') || col.includes('yesterday') || col.includes('change') || col.includes('avg');
        if (!isYcp) {
          if (/^(close|ltp|cp|last|closing_price|close_price|last_price|last_traded_price)$/i.test(col)) {
            closeCol = idx;
          } else if (closeCol < 0 && (col.includes('close') || col.includes('ltp'))) {
            closeCol = idx;
          }
        }
      });

      // Open
      headerParts.forEach((col, idx) => {
        if (/^(open|op|opening_price|open_price)$/i.test(col) || (openCol < 0 && col.includes('open'))) {
          openCol = idx;
        }
      });

      // High
      headerParts.forEach((col, idx) => {
        if (/^(high|max|high_price|max_price)$/i.test(col) || (highCol < 0 && col.includes('high'))) {
          highCol = idx;
        }
      });

      // Low
      headerParts.forEach((col, idx) => {
        if (/^(low|min|low_price|min_price)$/i.test(col) || (lowCol < 0 && col.includes('low'))) {
          lowCol = idx;
        }
      });

      // Volume / Turnover
      headerParts.forEach((col, idx) => {
        if (/^(volume|vol|total_volume|qty|quantity|trades|no_of_trades|turnover|value)$/i.test(col) || (volCol < 0 && (col.includes('vol') || col.includes('trade') || col.includes('turnover')))) {
          volCol = idx;
        }
      });
    } else {
      // Headerless CSV detection
      // Check first data line format: e.g. "1JANATAMF,20260803,4.2,4.3,4.1,4.2,4856046,630,20.15,150143"
      const sampleParts = lines[0].split(delimiter).map((p) => p.replace(/["'\s]/g, '').trim());
      if (sampleParts.length >= 6) {
        const isPart0Ticker = /^[A-Za-z0-9_\-\.\&]+$/.test(sampleParts[0]) && isNaN(Number(sampleParts[0]));
        const isPart1Date = /^\d{8}$/.test(sampleParts[1]) || /^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(sampleParts[1]) || /^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(sampleParts[1]);

        if (isPart0Ticker && isPart1Date) {
          symbolCol = 0;
          dateCol = 1;
          openCol = 2;
          highCol = 3;
          lowCol = 4;
          closeCol = 5;
          volCol = 6;
        }
      }
    }

    // Group by Symbol
    const stockMap = new Map<string, DseStockCandle[]>();
    const symbolMetaMap = new Map<string, { sector?: string; name?: string }>();

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim());
      if (parts.length < 4) continue;

      const rawSym = symbolCol >= 0 && parts[symbolCol] ? parts[symbolCol].trim().replace(/["']/g, '') : '';
      const sym = rawSym.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');

      // Skip market/sector index summary lines from tradeable individual stock lists
      // sector parsing allowed

      const rawSector = sectorCol >= 0 && parts[sectorCol] ? parts[sectorCol].replace(/["']/g, '') : undefined;
      const rawName = nameCol >= 0 && parts[nameCol] ? parts[nameCol].replace(/["']/g, '') : undefined;

      const rawDate = parts[dateCol] ? parts[dateCol].replace(/["']/g, '') : `2026-08-03`;
      const date = normalizeDateString(rawDate);

      let open = cleanNumber(parts[openCol], 0);
      let close = cleanNumber(parts[closeCol], open);
      if (open === 0) open = close;
      if (close === 0) close = open;

      let high = cleanNumber(parts[highCol], Math.max(open, close));
      let low = cleanNumber(parts[lowCol], Math.min(open, close));

      // Standardize OHLC envelope integrity
      high = Math.max(high, open, close);
      low = Math.min(low, open, close);

      const volume = cleanNumber(parts[volCol], 100000);

      if (close > 0) {
        const targetSym = sym || fileName.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DSE_STOCK';
        if (!stockMap.has(targetSym)) {
          stockMap.set(targetSym, []);
        }
        stockMap.get(targetSym)!.push({ date, open, high, low, close, volume });

        if (!symbolMetaMap.has(targetSym)) {
          symbolMetaMap.set(targetSym, { sector: rawSector, name: rawName });
        } else {
          const currentMeta = symbolMetaMap.get(targetSym)!;
          if (!currentMeta.sector && rawSector) currentMeta.sector = rawSector;
          if (!currentMeta.name && rawName) currentMeta.name = rawName;
        }
      }
    }

    stockMap.forEach((rawCandles, sym) => {
      if (rawCandles.length > 0) {
        // Deduplicate by date and sort chronologically ascending
        const candleMap = new Map<string, DseStockCandle>();
        rawCandles.forEach((c) => candleMap.set(c.date, c));

        const sortedCandles = Array.from(candleMap.values()).sort(
          (a, b) => a.date.localeCompare(b.date)
        );

        const meta = symbolMetaMap.get(sym) || {};
        const assignedSector = inferDseSector(sym, meta.sector, meta.name);
        const assignedName = meta.name || `${sym} PLC`;

        results.push({
          symbol: sym,
          name: assignedName,
          sector: assignedSector,
          yoyGrowthPct: 8.0,
          peRatio: 12.5,
          avgTurnoverBdtMillion: 60.0,
          candles: sortedCandles,
        });
      }
    });
  } catch (err) {
    console.error('Error parsing custom DSE stock file:', err);
  }
  return results;
}

// Extract stock datasets from an array of uploaded ZIP/Folder files
export function filterActiveStocks(stocks: DseStockData[]): DseStockData[] {
  // Find global max date across all stocks
  let globalMaxDate = '1970-01-01';
  for (const s of stocks) {
    if (s.candles.length > 0) {
      const lastDate = s.candles[s.candles.length - 1].date;
      if (lastDate > globalMaxDate) {
        globalMaxDate = lastDate;
      }
    }
  }

  // Set a cutoff date to 30 days prior to the max date
  const maxDateObj = new Date(globalMaxDate);
  const cutoffDateObj = new Date(maxDateObj);
  cutoffDateObj.setDate(maxDateObj.getDate() - 30);
  const cutoffDateStr = cutoffDateObj.toISOString().split('T')[0];

  return stocks.filter(s => {
    // 1. Exclude bonds, bills, mutual funds, SME, OTC, and specific closed companies
    const symbolUpper = s.symbol.toUpperCase();
    const nameUpper = (s.name || '').toUpperCase();
    
    if (isSectorOrMarketIndex(symbolUpper)) {
      return false;
    }

    if (
      symbolUpper.includes('BOND') || 
      symbolUpper.includes('TBOND') || 
      symbolUpper.includes('PBOND') || 
      symbolUpper.includes('BILL') ||
      symbolUpper.endsWith('MF') ||
      symbolUpper.endsWith('MF1') ||
      symbolUpper.includes('MUTUAL') ||
      symbolUpper.includes('FUND') ||
      symbolUpper.includes('DEB') ||
      symbolUpper.includes('YOUSUF') ||
      symbolUpper.includes('-SME') ||
      symbolUpper.includes('-OTC') ||
      nameUpper.includes('BOND') ||
      nameUpper.includes('MUTUAL FUND') ||
      nameUpper.includes('YOUSUF') ||
      (s.sector && s.sector.toUpperCase().includes('MUTUAL FUND')) ||
      (s.sector && s.sector.toUpperCase().includes('CORPORATE BOND'))
    ) {
      return false;
    }

    // 2. Exclude closed companies or delisted stocks (data not updated recently)
    if (s.candles.length === 0) return false;
    
    const lastDate = s.candles[s.candles.length - 1].date;
    if (lastDate < cutoffDateStr) {
      return false;
    }

    // 3. Ensure the stock actually traded (volume > 0) in the last 30 days
    let recentTradeFound = false;
    for (let i = s.candles.length - 1; i >= 0; i--) {
      const candle = s.candles[i];
      if (candle.date < cutoffDateStr) break;
      if (candle.volume > 0) {
        recentTradeFound = true;
        break;
      }
    }

    if (!recentTradeFound) {
      return false;
    }

    // 4. Ensure there is no massive gap (e.g. > 100 days) in the recent trading history, which indicates suspension/delisting
    let hasHugeGap = false;
    for (let i = s.candles.length - 1; i > 0; i--) {
      // Only check the last 50 candles to save performance
      if (s.candles.length - i > 50) break;
      
      const curr = new Date(s.candles[i].date).getTime();
      const prev = new Date(s.candles[i-1].date).getTime();
      const gapDays = (curr - prev) / (1000 * 3600 * 24);
      
      if (gapDays > 100) {
        hasHugeGap = true;
        break;
      }
    }

    if (hasHugeGap) {
      return false;
    }

    return true;
  });
}

// Merges multiple raw stock dataset arrays across files, aligns dates, deduplicates symbols, and applies sector overrides
export function mergeAndProcessStockDatasets(rawStocks: DseStockData[]): DseStockData[] {
  if (!rawStocks || rawStocks.length === 0) return [];

  const stockMap = new Map<string, DseStockData>();

  for (const stock of rawStocks) {
    if (!stock || !stock.symbol) continue;
    const sym = stock.symbol.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
    if (!sym || isSectorOrMarketIndex(sym)) continue;

    if (!stockMap.has(sym)) {
      const candleMap = new Map<string, DseStockCandle>();
      (stock.candles || []).forEach((c) => {
        if (c && c.date) {
          const normDate = normalizeDateString(c.date);
          candleMap.set(normDate, { ...c, date: normDate });
        }
      });
      const sortedCandles = Array.from(candleMap.values()).sort(
        (a, b) => a.date.localeCompare(b.date)
      );
      const assignedSector = inferDseSector(sym, stock.sector, stock.name);
      stockMap.set(sym, {
        ...stock,
        symbol: sym,
        name: stock.name || `${sym} PLC`,
        sector: assignedSector,
        candles: sortedCandles,
      });
    } else {
      const existing = stockMap.get(sym)!;
      const candleMap = new Map<string, DseStockCandle>();
      existing.candles.forEach((c) => candleMap.set(c.date, c));
      (stock.candles || []).forEach((c) => {
        if (c && c.date) {
          const normDate = normalizeDateString(c.date);
          candleMap.set(normDate, { ...c, date: normDate });
        }
      });

      const mergedCandles = Array.from(candleMap.values()).sort(
        (a, b) => a.date.localeCompare(b.date)
      );

      const assignedSector = inferDseSector(
        sym,
        stock.sector && stock.sector !== 'Miscellaneous' ? stock.sector : existing.sector,
        stock.name || existing.name
      );

      stockMap.set(sym, {
        ...existing,
        name: stock.name && stock.name !== `${sym} PLC` ? stock.name : existing.name,
        sector: assignedSector,
        candles: mergedCandles,
      });
    }
  }

  const mergedList = Array.from(stockMap.values());
  const activeList = filterActiveStocks(mergedList);
  return activeList;
}

export function extractStockDataFromExtractedFiles(files: ExtractedFile[]): DseStockData[] {
  const rawStocks: DseStockData[] = [];

  for (const file of files) {
    const ext = file.extension.toLowerCase();
    if (['csv', 'tsv', 'json', 'txt', 'dat', 'prn'].includes(ext) && file.content && !file.isBinary) {
      const parsed = parseCustomDseStockFiles(file.content, file.name);
      rawStocks.push(...parsed);
    }
  }

  return mergeAndProcessStockDatasets(rawStocks);
}

export async function extractStockDataFromExtractedFilesAsync(
  files: ExtractedFile[],
  onProgress?: (processed: number, total: number) => void
): Promise<DseStockData[]> {
  const rawStocks: DseStockData[] = [];
  const validFiles = files.filter(
    (file) =>
      ['csv', 'tsv', 'json', 'txt', 'dat', 'prn'].includes(file.extension.toLowerCase()) &&
      file.content &&
      !file.isBinary
  );

  const total = validFiles.length;
  let count = 0;

  for (const file of validFiles) {
    count++;
    if (onProgress && (count % 10 === 0 || count === total)) {
      onProgress(count, total);
    }
    // Yield every 15 files to keep the browser responsive
    if (count % 15 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
    try {
      const parsed = parseCustomDseStockFiles(file.content, file.name);
      rawStocks.push(...parsed);
    } catch (err) {
      console.error(`Error parsing extracted file ${file.name}:`, err);
    }
  }

  return mergeAndProcessStockDatasets(rawStocks);
}

// Early Trend Ignition Detector (Stage 1 Coil & Stage 2 Ignition)
export function detectEarlyTrendIgnition(candles: DseStockCandle[]): EarlyTrendAnalysis {
  if (!candles || candles.length < 15) {
    return {
      stage: 'BASE_ACCUMULATION',
      stageLabel: 'Base Accumulation',
      isEarlyTrend: false,
      score: 30,
      signals: ['Base structure forming'],
    };
  }

  const n = candles.length;
  const latest = candles[n - 1];
  const last5 = candles.slice(n - 5);
  const last20 = candles.slice(n - 20);

  // 5-day Moving Average vs 20-day Moving Average
  const ma5 = last5.reduce((s, c) => s + c.close, 0) / 5;
  const ma20 = last20.reduce((s, c) => s + c.close, 0) / 20;
  const is5Above20 = ma5 >= ma20;

  // OBV Accumulation Slope check over last 5 trading days
  let obvSlope = 0;
  for (let i = Math.max(1, n - 6); i < n; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) obvSlope += candles[i].volume;
    else if (diff < 0) obvSlope -= candles[i].volume;
  }
  const isObvRising = obvSlope > 0;

  // 5-day Volatility Compression Range (tight coil)
  const maxH5 = Math.max(...last5.map((c) => c.high));
  const minL5 = Math.min(...last5.map((c) => c.low));
  const range5Pct = minL5 > 0 ? ((maxH5 - minL5) / minL5) * 100 : 10;
  const isTightCoil = range5Pct <= 4.2;

  // Relative Volume (20-day ADV)
  const prev19Vol = last20.slice(0, 19).reduce((s, c) => s + c.volume, 0) / 19;
  const rvol = prev19Vol > 0 ? latest.volume / prev19Vol : 1.0;
  const isPocketPivot = rvol >= 1.25 && rvol <= 2.2 && latest.close > latest.open;
  const isFullBreakout = rvol > 2.2 && latest.close > latest.open;

  const signalsList: string[] = [];
  let score = 20;

  // Higher-low structure over last 3 swing points (proves stepping-up accumulation)
  const swingLows: number[] = [];
  for (let i = n - 15; i < n - 1; i++) {
    if (i < 1 || i >= n - 1) continue;
    if (candles[i].low < candles[i - 1].low && candles[i].low < candles[i + 1].low) {
      swingLows.push(candles[i].low);
    }
  }
  const hasHigherLows = swingLows.length >= 2 && swingLows[swingLows.length - 1] > swingLows[swingLows.length - 2];

  if (hasHigherLows) {
    score += 15;
    signalsList.push('Higher-low structure confirms stepped accumulation');
  }

  if (is5Above20) {
    score += 25;
    signalsList.push('5d MA Golden Crossover above 20d MA');
  }
  if (isObvRising) {
    score += 20;
    signalsList.push('OBV slope positive (institutional accumulation)');
  }
  if (isTightCoil) {
    score += 25;
    signalsList.push(`Tight pre-breakout coil (${range5Pct.toFixed(1)}% 5d range)`);
  }
  if (isPocketPivot) {
    score += 20;
    signalsList.push(`Pocket Pivot early volume expansion (${rvol.toFixed(1)}x ADV)`);
  } else if (isFullBreakout) {
    score += 15;
    signalsList.push(`Full volume surge breakout (${rvol.toFixed(1)}x ADV)`);
  }

  let stage: EarlyTrendAnalysis['stage'] = 'BASE_ACCUMULATION';
  let stageLabel = 'Base Accumulation';
  let isEarlyTrend = false;

  if (isFullBreakout && is5Above20) {
    stage = 'STAGE_3_FULL_BREAKOUT';
    stageLabel = 'Stage 3: Full Breakout';
    isEarlyTrend = false;
  } else if (score >= 65 || (is5Above20 && isObvRising && isPocketPivot)) {
    stage = 'STAGE_2_IGNITION';
    stageLabel = 'Stage 2: Early Trend Ignition';
    isEarlyTrend = true;
  } else if (isTightCoil || (is5Above20 && isObvRising)) {
    stage = 'STAGE_1_EARLY_COIL';
    stageLabel = 'Stage 1: Pre-Breakout Coil';
    isEarlyTrend = true;
  }

  return {
    stage,
    stageLabel,
    isEarlyTrend,
    score: Math.min(100, score),
    signals: signalsList,
  };
}

// High-Profit Decision-Making DSE Stock Screener Engine
//
// Sector-level "money flow" — recent BDT turnover (price x volume) vs. the prior period,
// aligned to actual market trading dates. This mirrors the methodology SectorMoneyFlowMatrix
// already uses, so the screener's sector bonus and the Money Flow panel tell the same story
// instead of two different numbers for "which sector is hot right now":
//  - Turnover (price x volume), not raw share count — a sector of higher-priced names
//    trading fewer shares but more capital should register as strong, not flat.
//  - Aligned by calendar date across all stocks, not each stock's own last-N candles — a
//    stock with data gaps or a shorter history would otherwise be compared against a
//    different window than its peers.
//  - Non-equity sectors (mutual funds, bonds) excluded — their volume shouldn't influence
//    equity stock scoring.
//  - A minimum absolute turnover floor before trusting a swing, so a thinly-traded sector's
//    tiny absolute move doesn't register as a dramatic "+400% rotation".
const NON_EQUITY_SECTORS = new Set([
  'MUTUAL FUNDS',
  'MUTUAL FUND',
  'CORPORATE BOND',
  'TREASURY BOND',
  'BONDS',
  'DEBENTURES',
  'GOVT TREASURY BOND',
]);
const MIN_SECTOR_TURNOVER_FLOOR_BDT = 1_000_000; // 10 lakh BDT — below this, treat the reading as too thin to trust

export function computeSectorMomentum(stocks: DseStockData[]): Record<string, SectorMomentumStat> {
  const allDatesSet = new Set<string>();
  stocks.forEach((s) => {
    if (!s.sector || NON_EQUITY_SECTORS.has(s.sector.toUpperCase())) return;
    (s.candles || []).forEach((c) => { if (c?.date) allDatesSet.add(c.date); });
  });
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  if (sortedDates.length < 10) return {};

  const recentDates = new Set(sortedDates.slice(-5));
  const pastDates = new Set(sortedDates.slice(-10, -5));

  const raw = new Map<string, { currentTurnover: number; pastTurnover: number }>();

  stocks.forEach((s) => {
    if (!s.sector || NON_EQUITY_SECTORS.has(s.sector.toUpperCase()) || !s.candles) return;
    if (!raw.has(s.sector)) raw.set(s.sector, { currentTurnover: 0, pastTurnover: 0 });
    const cur = raw.get(s.sector)!;
    s.candles.forEach((c) => {
      if (!c?.date) return;
      const turnover = c.close * c.volume;
      if (recentDates.has(c.date)) cur.currentTurnover += turnover;
      else if (pastDates.has(c.date)) cur.pastTurnover += turnover;
    });
  });

  const result: Record<string, SectorMomentumStat> = {};
  raw.forEach((data, sector) => {
    if (data.pastTurnover < MIN_SECTOR_TURNOVER_FLOOR_BDT) return;
    const momentumPct = ((data.currentTurnover - data.pastTurnover) / data.pastTurnover) * 100;
    result[sector] = {
      sector,
      momentumPct: Number(momentumPct.toFixed(1)),
      currentVol: Number(data.currentTurnover.toFixed(0)),
      pastVol: Number(data.pastTurnover.toFixed(0)),
    };
  });
  return result;
}

const MIN_RELIABLE_SAMPLE = 3;

function edgeConfidenceFromSampleSize(n: number): 'Low' | 'Medium' | 'High' {
  if (n >= 10) return 'High';
  if (n >= MIN_RELIABLE_SAMPLE) return 'Medium';
  return 'Low';
}

export function runDseStockScreener(
  stocks: DseStockData[],
  config: BacktestConfig,
  edgeStats?: PatternEdgeStat[],
  sectorMomentum?: Record<string, SectorMomentumStat>
): ScreenerStockCandidate[] {
  const candidates: ScreenerStockCandidate[] = [];

  for (const stock of stocks) {
    if (!stock.candles || stock.candles.length < 20) continue;

    // Run backtest to gather historical win rate & performance on this stock
    const singleStockBacktest = runDseVolumeBreakoutBacktest([stock], config);
    const winRate = singleStockBacktest.winRatePct;
    const totalSignals = singleStockBacktest.totalSignals;

    // Latest candle & 20d moving averages
    const candles = stock.candles;
    const latest = candles[candles.length - 1];
    const prevCandles = candles.slice(-21, -1);

    const sumVol20 = prevCandles.reduce((acc, c) => acc + c.volume, 0);
    const avgVol20 = prevCandles.length > 0 ? sumVol20 / prevCandles.length : 100000;

    const sumClose20 = prevCandles.reduce((acc, c) => acc + c.close, 0);
    const ma20Price = prevCandles.length > 0 ? sumClose20 / prevCandles.length : latest.close;

    const rvol20 = avgVol20 > 0 ? Number((latest.volume / avgVol20).toFixed(2)) : 1.0;

    // Technical Metrics & Volatility Contraction
    const isPriceGreen = latest.close > latest.open;
    const isVolumeSurge = rvol20 >= config.volumeSurgeMultiplier && isPriceGreen;

    // Early Trend Ignition Analysis
    const earlyTrend = detectEarlyTrendIgnition(candles);

    const techPattern = detectTechnicalPattern(candles, candles.length - 1);
    const harmonic = detectHarmonicPattern(candles, candles.length - 1);
    const canonicalPattern: TechnicalPatternType = harmonic
      ? 'Harmonic Pattern (C-to-D)'
      : techPattern.detectedPattern;

    // Check last 5 days volatility range (VCP / Narrow Range)
    const last5 = candles.slice(-5);
    const maxHigh5 = Math.max(...last5.map((c) => c.high));
    const minLow5 = Math.min(...last5.map((c) => c.low));
    const range5Pct = minLow5 > 0 ? ((maxHigh5 - minLow5) / minLow5) * 100 : 10;
    const isTightConsolidation = range5Pct <= 4.0; // tight 4% range in 5 days

    // Volume dry-up check
    const isVolumeDryUp = rvol20 <= 0.6;

    // Fundamentals Check
    const passesYoy = stock.yoyGrowthPct >= config.minYoyGrowthPct;
    const passesTurnover = stock.avgTurnoverBdtMillion >= config.minTurnoverMillionBdt;

    // Calculate Profit Potential Score (0 - 100)
    let score = 0;

    // 1. Volume Surge & Price Action (35 pts max)
    if (isVolumeSurge) score += 35;
    else if (rvol20 >= 1.5 && isPriceGreen) score += 25;
    else if (earlyTrend.isEarlyTrend) score += 28; // Early trend ignition bonus
    else if (isVolumeDryUp && isTightConsolidation) score += 28; // Pre-breakout coil
    else if (latest.close > ma20Price) score += 15;

    // 2. Volatility Contraction & Pattern Quality (20 pts max)
    if (isTightConsolidation) score += 20;
    else if (range5Pct <= 7.0) score += 12;

    // 3. YoY Fundamental Growth & Revenue Momentum (20 pts max)
    if (stock.yoyGrowthPct >= 10.0) score += 20;
    else if (stock.yoyGrowthPct >= 6.0) score += 15;
    else if (stock.yoyGrowthPct >= config.minYoyGrowthPct) score += 10;

    // 4. Historical Backtest Win Rate on this Stock (15 pts max)
    const hasReliableOwnHistory = totalSignals >= MIN_RELIABLE_SAMPLE;
    if (hasReliableOwnHistory) {
      if (winRate >= 75) score += 15;
      else if (winRate >= 60) score += 10;
      else if (winRate >= 50) score += 5;
    }

    // 5. Liquidity & Valuation P/E Safety (10 pts max)
    if (stock.peRatio < 15 && stock.peRatio > 0) score += 5;
    if (passesTurnover) score += 5;

    // 6. Sector Momentum
    const sectorMomentumPct = sectorMomentum?.[stock.sector]?.momentumPct;
    if (sectorMomentumPct !== undefined) {
      if (sectorMomentumPct >= 20) score += 10;
      else if (sectorMomentumPct >= 10) score += 6;
      else if (sectorMomentumPct >= 5) score += 3;
    }

    // Cap score at 100
    let profitPotentialScore = Math.min(100, score);

    // Decision Status Determination
    let decisionStatus: ScreenerStockCandidate['decisionStatus'] = 'NEUTRAL';

    if (profitPotentialScore >= 70 && (isVolumeSurge || (rvol20 >= 2.0 && isPriceGreen)) && passesYoy && passesTurnover) {
      decisionStatus = 'STRONG_BUY';
    } else if ((earlyTrend.stage === 'STAGE_2_IGNITION' || earlyTrend.stage === 'STAGE_1_EARLY_COIL') && passesYoy) {
      decisionStatus = 'EARLY_TREND_IGNITION';
    } else if (profitPotentialScore >= 55 || (isVolumeDryUp && isTightConsolidation && passesYoy)) {
      decisionStatus = 'WATCHLIST_BREAKOUT';
    } else if (profitPotentialScore >= 40 || latest.close > ma20Price) {
      decisionStatus = 'CONSOLIDATING_ACCUMULATION';
    }

    // Trade Setup Planning
    let entryPrice = latest.close;
    let targetProfitPct = config.targetProfitPct || 15;
    let stopLossPct = config.stopLossPct || 5;

    let targetPrice = Number((entryPrice * (1 + targetProfitPct / 100)).toFixed(2));
    let stopLossPrice = Number((entryPrice * (1 - stopLossPct / 100)).toFixed(2));
    let riskRewardRatio = Number((targetProfitPct / stopLossPct).toFixed(2));

    // Catalysts list
    const catalysts: string[] = [];
    if (earlyTrend.isEarlyTrend) catalysts.push(`🌱 ${earlyTrend.stageLabel}`);
    if (isVolumeSurge) catalysts.push(`🔥 Massive ${rvol20}x ADV Volume Surge`);
    if (isTightConsolidation) catalysts.push(`⚡ Tight Volatility Contraction (${range5Pct.toFixed(1)}% Range)`);
    if (isVolumeDryUp) catalysts.push(`💧 Institutional Supply Dry-up (0.${Math.round(rvol20 * 10)}x Vol)`);
    if (stock.yoyGrowthPct >= 8.0) catalysts.push(`📈 Strong YoY Revenue Growth (+${stock.yoyGrowthPct}%)`);
    if (stock.peRatio < 14) catalysts.push(`🛡️ Attractive P/E Valuation (${stock.peRatio}x)`);
    if (hasReliableOwnHistory && winRate >= 65) catalysts.push(`🏆 ${winRate.toFixed(0)}% Historical Signal Win Rate (${totalSignals} trades)`);
    if (sectorMomentumPct !== undefined && sectorMomentumPct >= 10) catalysts.push(`🌊 ${stock.sector} sector money flow +${sectorMomentumPct.toFixed(0)}%`);

    // Pattern description
    let pattern = 'Consolidation Base';
    if (earlyTrend.stage === 'STAGE_2_IGNITION') pattern = 'Early Trend Ignition (MA Cross + OBV Accumulation)';
    else if (isTightConsolidation && isVolumeSurge) pattern = 'VCP Breakout (Vol Contraction Pattern)';
    else if (isTightConsolidation) pattern = 'Narrow Range Coiling (NR7 / Compression)';
    else if (isVolumeSurge) pattern = 'Volume Surge Momentum';
    else if (latest.close > ma20Price) pattern = '20d Moving Average Uptrend Support';
    let reasoning = 'Stock is maintaining healthy price structure above 20d MA with stable turnover.';
    let finalDetectedPattern = techPattern.detectedPattern;
    let finalPatternConfidence = techPattern.patternConfidence;
    let finalPatternDescription = techPattern.patternDescription;

    if (harmonic) {
      if (harmonic.patternType === 'BEARISH_C_TO_D') {
        finalDetectedPattern = 'Harmonic Pattern (C-to-D)';
        finalPatternConfidence = 95;
        finalPatternDescription = `${harmonic.subtype} Pattern: C-Point Entry at ৳${harmonic.entryPrice.toFixed(2)} ➔ Target D-Point Exit at ৳${harmonic.dTargetPrice.toFixed(2)} (+${harmonic.potentialGainPct}% Gain, R:R ${harmonic.riskRewardRatio}:1).`;
        pattern = `${harmonic.subtype} (C-to-D Swing)`;
        catalysts.unshift(`💎 ${harmonic.subtype} Pattern (Point C Entry ➔ Point D Exit)`);
        
        if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
          entryPrice = harmonic.entryPrice;
          targetPrice = harmonic.dTargetPrice;
          stopLossPrice = harmonic.stopLossPrice;
          targetProfitPct = harmonic.potentialGainPct;
          stopLossPct = harmonic.potentialRiskPct;
          riskRewardRatio = harmonic.riskRewardRatio;
          decisionStatus = 'STRONG_BUY';
          profitPotentialScore = Math.min(100, profitPotentialScore + 35);
          reasoning = `Harmonic C-to-D Strategy: ${harmonic.subtype} setup! Buy at Point C (৳${harmonic.entryPrice.toFixed(2)}), Target Point D at ৳${harmonic.dTargetPrice.toFixed(2)} (+${harmonic.potentialGainPct}% gain). Stop Loss at ৳${harmonic.stopLossPrice.toFixed(2)}.`;
        }
      } else {
        finalDetectedPattern = 'Harmonic Pattern (D-Reversal)' as any;
        finalPatternConfidence = 95;
        finalPatternDescription = `${harmonic.subtype} Pattern: D-Point Entry at ৳${harmonic.entryPrice.toFixed(2)} ➔ Target Exit at ৳${harmonic.dTargetPrice.toFixed(2)} (+${harmonic.potentialGainPct}% Gain, R:R ${harmonic.riskRewardRatio}:1).`;
        pattern = `${harmonic.subtype} (D-Reversal)` as any;
        catalysts.unshift(`🎯 ${harmonic.subtype} Pattern (Point D Reversal Entry)`);
        
        if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
          entryPrice = harmonic.entryPrice;
          targetPrice = harmonic.dTargetPrice;
          stopLossPrice = harmonic.stopLossPrice;
          targetProfitPct = harmonic.potentialGainPct;
          stopLossPct = harmonic.potentialRiskPct;
          riskRewardRatio = harmonic.riskRewardRatio;
          decisionStatus = 'STRONG_BUY';
          profitPotentialScore = Math.min(100, profitPotentialScore + 35);
          reasoning = `Harmonic D-Reversal Strategy: ${harmonic.subtype} setup! Buy at Point D (৳${harmonic.entryPrice.toFixed(2)}), Target Exit at ৳${harmonic.dTargetPrice.toFixed(2)} (+${harmonic.potentialGainPct}% gain). Stop Loss at ৳${harmonic.stopLossPrice.toFixed(2)}.`;
        }
      }
    } else if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
      profitPotentialScore = Math.max(15, profitPotentialScore - 30);
    }

    // Edge Analysis Factor — always start from this stock's own backtest sample so the
    // confidence badge is never silent. A candidate with only 1-2 historical trades should
    // visibly say "Low confidence", not show nothing (silence reads as neutral, not unproven).
    let historicalEdgeWinRate = winRate;
    let patternEdgeBonus = 0;
    let edgeSampleSize = totalSignals;
    let edgeConfidence: 'Low' | 'Medium' | 'High' = edgeConfidenceFromSampleSize(totalSignals);

    if (edgeStats && edgeStats.length > 0) {
      // Find matching pattern using finalDetectedPattern instead of loose string matches
      let matchedPatternEdge = edgeStats.find(e => e.pattern === finalDetectedPattern);

      if (matchedPatternEdge) {
        // Market-wide edge for this exact pattern (any sector, any stock)
        if (matchedPatternEdge.count >= MIN_RELIABLE_SAMPLE && matchedPatternEdge.winRate >= 60) {
          patternEdgeBonus += 8;
          historicalEdgeWinRate = Math.max(historicalEdgeWinRate, matchedPatternEdge.winRate);
          if (matchedPatternEdge.count > edgeSampleSize) {
            edgeSampleSize = matchedPatternEdge.count;
            edgeConfidence = edgeConfidenceFromSampleSize(edgeSampleSize);
          }
        }

        // Find sector edge specifically
        const sectorEdge = matchedPatternEdge.sectorEdges.find(se => se.sector === stock.sector);

        // Minimum sample size gating (3+ trades)
        if (sectorEdge && sectorEdge.count >= 3) {
           if (sectorEdge.count > edgeSampleSize) {
             edgeSampleSize = sectorEdge.count;
             edgeConfidence = edgeConfidenceFromSampleSize(edgeSampleSize);
           }

           if (sectorEdge.winRate >= 60) {
             patternEdgeBonus += 15;
             historicalEdgeWinRate = Math.max(historicalEdgeWinRate, sectorEdge.winRate);
           }
        }

        // Stock-specific edge (strongest signal — this exact setup has worked on this
        // exact stock before)
        const stockEdge = matchedPatternEdge.stockEdges?.find(se => se.symbol === stock.symbol);
        if (stockEdge && stockEdge.count >= 3 && stockEdge.winRate >= 70) {
           patternEdgeBonus += 25;
           historicalEdgeWinRate = Math.max(historicalEdgeWinRate, stockEdge.winRate);
           if (stockEdge.count > edgeSampleSize) {
             edgeSampleSize = stockEdge.count;
             edgeConfidence = edgeConfidenceFromSampleSize(edgeSampleSize);
           }
        }
      }
    }

    if (patternEdgeBonus > 0) {
       profitPotentialScore = Math.min(100, profitPotentialScore + patternEdgeBonus);
       catalysts.push(`🎯 Pattern-Sector Edge (${historicalEdgeWinRate.toFixed(0)}% Win Prob)`);
    }
    if (decisionStatus === 'STRONG_BUY') {
      reasoning = `High-probability entry setup! Stock exploded with ${rvol20}x 20d ADV volume surge, breaking out from tight consolidation. Planned R:R is ${riskRewardRatio}:1 with +${targetProfitPct}% profit potential.`;
    } else if (decisionStatus === 'EARLY_TREND_IGNITION') {
      reasoning = `Early Trend Ignition detected! 5d MA crossed above 20d MA with rising OBV accumulation prior to major volume breakout. Ideal early-stage entry before broad market awareness.`;
    } else if (decisionStatus === 'WATCHLIST_BREAKOUT') {
      reasoning = `Volume dry-up with tight volatility coiling. Institutional accumulation in progress — set alert for volume expansion above ${Math.round(avgVol20 * config.volumeSurgeMultiplier).toLocaleString()} shares.`;
    } else if (decisionStatus === 'CONSOLIDATING_ACCUMULATION') {
      reasoning = `Stock building a macro base above 20d MA. Fundamentals (+${stock.yoyGrowthPct}% YoY) support future momentum.`;
    }

    // Recommended capital allocation percentage based on conviction
    let recommendedPositionSizePct = 10;
    if (decisionStatus === 'STRONG_BUY') recommendedPositionSizePct = 15;
    if (decisionStatus === 'EARLY_TREND_IGNITION') recommendedPositionSizePct = 14;
    if (decisionStatus === 'WATCHLIST_BREAKOUT') recommendedPositionSizePct = 12;

    

    candidates.push({
      symbol: stock.symbol,
      stockName: stock.name,
      sector: stock.sector,
      stock,
      decisionStatus,
      profitPotentialScore,
      latestClose: latest.close,
      latestDate: latest.date,
      latestVolume: latest.volume,
      avgVolume20: Math.round(avgVol20),
      rvol20,
      ma20Price: Number(ma20Price.toFixed(2)),
      entryPrice,
      targetPrice,
      stopLossPrice,
      riskRewardRatio,
      potentialGainPct: targetProfitPct,
      potentialRiskPct: stopLossPct,
      keyCatalysts: catalysts.length > 0 ? catalysts : ['Stable Price & Volume Base'],
      breakoutPattern: pattern,
      detectedPattern: finalDetectedPattern,
      patternConfidence: finalPatternConfidence,
      patternDescription: finalPatternDescription,
      historicalWinRate: Math.round(historicalEdgeWinRate),
      edgeSampleSize: edgeSampleSize > 0 ? edgeSampleSize : 0,
      edgeConfidence,
      tradeSetupReasoning: reasoning,
      recommendedPositionSizePct,
      peRatio: stock.peRatio,
      yoyGrowthPct: stock.yoyGrowthPct,
      avgTurnoverBdtMillion: stock.avgTurnoverBdtMillion,
      earlyTrendStage: earlyTrend.stage,
      earlyTrendSignals: earlyTrend.signals,
      harmonicDetails: harmonic || undefined,
      sectorMomentumPct,
    });
  }

  // Sort candidates by Harmonic Priority if in HARMONIC_C_ENTRY_D_EXIT strategy mode, otherwise by Profit Potential Score
  if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
    candidates.sort((a, b) => {
      const aHasH = a.harmonicDetails ? 1 : 0;
      const bHasH = b.harmonicDetails ? 1 : 0;
      if (aHasH !== bHasH) return bHasH - aHasH;
      return b.profitPotentialScore - a.profitPotentialScore;
    });
  } else {
    candidates.sort((a, b) => b.profitPotentialScore - a.profitPotentialScore);
  }

  return candidates;
}

export function evaluateStockForScreener(
  stock: DseStockData,
  config: BacktestConfig,
  signals?: BreakoutSignal[],
  edgeStats?: PatternEdgeStat[],
  sectorMomentum?: Record<string, SectorMomentumStat>
): ScreenerStockCandidate | null {
  const candidates = runDseStockScreener([stock], config, edgeStats, sectorMomentum);
  return candidates.length > 0 ? candidates[0] : null;
}

// NOTE: A "Data Integrity & Anomaly Detection" block used to live here. It compared
// uploaded prices against a hardcoded, frozen dictionary of ~17 "benchmark" prices
// mislabeled as a "DSE Official Realtime Website Feed", and offered to silently overwrite
// real uploaded closing prices with those stale hardcoded numbers. It was never actually
// mounted anywhere in the app (dead code), but removed entirely rather than fixed — there
// is no sound way to auto-correct prices without a real, legitimately-sourced live feed,
// and dsebd.org's robots.txt disallows automated access. If real price validation is
// needed, source it from a licensed data provider and treat any correction as something a
// human reviews, never an automatic overwrite.


// Basic sector momentum check - if the majority of stocks in the sector are seeing volume > 20d avg


export function calculateEdgeStats(signals: BreakoutSignal[]): PatternEdgeStat[] {
  const patterns = new Map<string, {
    count: number;
    wins: number;
    totalReturn: number;
    sectors: Record<string, { count: number; wins: number; totalReturn: number; stocks: Set<string> }>;
    stocks: Record<string, { count: number; wins: number; totalReturn: number }>;
  }>();

  signals.forEach(sig => {
    if (sig.status === 'In Progress') return; // Only count resolved trades
    
    if (!patterns.has(sig.detectedPattern)) {
      patterns.set(sig.detectedPattern, { count: 0, wins: 0, totalReturn: 0, sectors: {}, stocks: {} });
    }
    
    const stats = patterns.get(sig.detectedPattern)!;
    stats.count += 1;
    const isWin = sig.status === 'Target Hit';
    if (isWin) stats.wins += 1;
    stats.totalReturn += sig.realizedGainPct || 0;

    // Sector Stats
    if (!stats.sectors[sig.sector]) {
      stats.sectors[sig.sector] = { count: 0, wins: 0, totalReturn: 0, stocks: new Set() };
    }
    const sectorStats = stats.sectors[sig.sector];
    sectorStats.count += 1;
    if (isWin) sectorStats.wins += 1;
    sectorStats.totalReturn += sig.realizedGainPct || 0;
    sectorStats.stocks.add(sig.symbol);

    // Stock Stats
    if (!stats.stocks[sig.symbol]) {
      stats.stocks[sig.symbol] = { count: 0, wins: 0, totalReturn: 0 };
    }
    const stockStats = stats.stocks[sig.symbol];
    stockStats.count += 1;
    if (isWin) stockStats.wins += 1;
    stockStats.totalReturn += sig.realizedGainPct || 0;
  });

  return Array.from(patterns.entries()).map(([pattern, data]) => {
    const winRate = data.count > 0 ? (data.wins / data.count) * 100 : 0;
    const avgReturn = data.count > 0 ? data.totalReturn / data.count : 0;
    
    const sectorEdges = Object.entries(data.sectors).map(([sector, sData]) => ({
      sector,
      count: sData.count,
      wins: sData.wins,
      winRate: sData.count > 0 ? (sData.wins / sData.count) * 100 : 0,
      avgReturn: sData.count > 0 ? sData.totalReturn / sData.count : 0,
      stocks: Array.from(sData.stocks)
    })).sort((a, b) => b.winRate - a.winRate);

    const stockEdges = Object.entries(data.stocks).map(([symbol, sData]) => ({
      symbol,
      count: sData.count,
      wins: sData.wins,
      winRate: sData.count > 0 ? (sData.wins / sData.count) * 100 : 0,
      avgReturn: sData.count > 0 ? sData.totalReturn / sData.count : 0,
    })).sort((a, b) => b.winRate - a.winRate);

    return {
      pattern,
      count: data.count,
      wins: data.wins,
      winRate,
      avgReturn,
      sectorEdges,
      stockEdges
    };
  }).sort((a, b) => b.winRate - a.winRate);
}

// Technical Indicator Calculations & Utilities
export function computeSma(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += prices[j];
      }
      result.push(sum / period);
    }
  }
  return result;
}

export function computeEma(prices: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += prices[j];
      prevEma = sum / period;
      result.push(prevEma);
    } else {
      if (prevEma !== null) {
        prevEma = prices[i] * k + prevEma * (1 - k);
        result.push(prevEma);
      } else {
        result.push(null);
      }
    }
  }
  return result;
}

export function computeRsi(prices: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (prices.length <= period) return prices.map(() => null);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(null);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      const change = prices[i] - prices[i - 1];
      const gain = change >= 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

export function computeMacd(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEma = computeEma(prices, fastPeriod);
  const slowEma = computeEma(prices, slowPeriod);

  const macdLine: (number | null)[] = prices.map((_, i) => {
    if (fastEma[i] === null || slowEma[i] === null) return null;
    return fastEma[i]! - slowEma[i]!;
  });

  const validMacdValues = macdLine.filter((v): v is number => v !== null);
  const validSignal = computeEma(validMacdValues, signalPeriod);

  let validIdx = 0;
  const signalLine: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
      histogram.push(null);
    } else {
      const sigVal = validSignal[validIdx++];
      signalLine.push(sigVal);
      if (sigVal !== null) {
        histogram.push(macdLine[i]! - sigVal);
      } else {
        histogram.push(null);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

export function computeAtr(candles: DseStockCandle[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (candles.length === 0) return [];

  const trs: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trs.push(tr);
  }

  let atr: number | null = null;
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += trs[j];
      atr = sum / period;
      result.push(atr);
    } else {
      atr = (atr! * (period - 1) + trs[i]) / period;
      result.push(atr);
    }
  }
  return result;
}

export function computeBollingerBands(prices: number[], period = 20, multiplier = 2): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const sma = computeSma(prices, period);
  const upper: (number | null)[] = [];
  const middle = sma;
  const lower: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        variance += Math.pow(prices[j] - sma[i]!, 2);
      }
      const stdDev = Math.sqrt(variance / period);
      upper.push(sma[i]! + multiplier * stdDev);
      lower.push(sma[i]! - multiplier * stdDev);
    }
  }

  return { upper, middle, lower };
}

export interface EquityCurvePoint {
  tradeIndex: number;
  date: string;
  symbol: string;
  tradeReturnPct: number;
  portfolioValue: number;
  cumulativeGainPct: number;
}

export function computeEquityCurve(signals: BreakoutSignal[], initialCapital = 100000, positionSizePct = 20): EquityCurvePoint[] {
  const sortedSignals = [...signals]
    .filter(s => s.status !== 'In Progress')
    .sort((a, b) => new Date(a.breakoutDate).getTime() - new Date(b.breakoutDate).getTime());

  let currentCapital = initialCapital;
  const points: EquityCurvePoint[] = [
    {
      tradeIndex: 0,
      date: sortedSignals[0]?.breakoutDate || new Date().toISOString().split('T')[0],
      symbol: 'START',
      tradeReturnPct: 0,
      portfolioValue: initialCapital,
      cumulativeGainPct: 0,
    }
  ];

  sortedSignals.forEach((sig, idx) => {
    const positionSize = currentCapital * (positionSizePct / 100);
    const returnPct = sig.realizedGainPct || 0;
    const profitLoss = positionSize * (returnPct / 100);
    currentCapital += profitLoss;

    const cumulativeGainPct = ((currentCapital - initialCapital) / initialCapital) * 100;
    points.push({
      tradeIndex: idx + 1,
      date: sig.breakoutDate,
      symbol: sig.symbol,
      tradeReturnPct: returnPct,
      portfolioValue: Math.round(currentCapital),
      cumulativeGainPct: parseFloat(cumulativeGainPct.toFixed(2)),
    });
  });

  return points;
}

// ===================================================
// EXPANDED DSE MARKET UNIVERSE & ASYNC SCREENER ENGINE
// ===================================================

export function generateFullDseMarketUniverse(): DseStockData[] {
  const fullListDefs: Array<{
    symbol: string;
    name: string;
    sector: string;
    basePrice: number;
    peRatio: number;
    yoyGrowthPct: number;
    turnover: number;
    pattern?: string;
  }> = [
    // Pharmaceuticals & Chemicals
    { symbol: 'SQURPHARMA', name: 'Square Pharmaceuticals PLC', sector: 'Pharmaceuticals & Chemicals', basePrice: 219.7, peRatio: 11.2, yoyGrowthPct: 7.8, turnover: 145.5, pattern: 'Bullish Flag' },
    { symbol: 'RENATA', name: 'Renata PLC', sector: 'Pharmaceuticals & Chemicals', basePrice: 470.2, peRatio: 18.4, yoyGrowthPct: 6.2, turnover: 65.0, pattern: 'Harmonic Pattern (C-to-D)' },
    { symbol: 'BEACONPHAR', name: 'Beacon Pharmaceuticals PLC', sector: 'Pharmaceuticals & Chemicals', basePrice: 185.0, peRatio: 22.1, yoyGrowthPct: 9.5, turnover: 125.0, pattern: 'Inverse Head & Shoulders' },
    { symbol: 'ORIONPHARM', name: 'Orion Pharma Ltd.', sector: 'Pharmaceuticals & Chemicals', basePrice: 78.5, peRatio: 12.2, yoyGrowthPct: 10.5, turnover: 85.8, pattern: 'Bullish Pennant' },
    { symbol: 'ACMELAB', name: 'The ACME Laboratories Ltd.', sector: 'Pharmaceuticals & Chemicals', basePrice: 84.0, peRatio: 11.8, yoyGrowthPct: 8.2, turnover: 72.4, pattern: 'Cup & Handle' },
    { symbol: 'MARICO', name: 'Marico Bangladesh Limited', sector: 'Pharmaceuticals & Chemicals', basePrice: 2450.0, peRatio: 21.5, yoyGrowthPct: 12.4, turnover: 45.0, pattern: 'VCP Compression' },
    { symbol: 'NAVANAPHAR', name: 'Navana Pharmaceuticals PLC', sector: 'Pharmaceuticals & Chemicals', basePrice: 92.5, peRatio: 15.6, yoyGrowthPct: 14.1, turnover: 58.0, pattern: 'Double Bottom' },
    { symbol: 'SILVAPHAR', name: 'Silva Pharmaceuticals Ltd.', sector: 'Pharmaceuticals & Chemicals', basePrice: 18.4, peRatio: 16.8, yoyGrowthPct: 5.2, turnover: 24.5, pattern: 'Falling Wedge Breakout' },
    { symbol: 'IBNSINA', name: 'The IBN SINA Pharmaceutical Industry PLC', sector: 'Pharmaceuticals & Chemicals', basePrice: 285.0, peRatio: 13.5, yoyGrowthPct: 9.1, turnover: 38.2, pattern: 'Bullish Flag' },
    { symbol: 'CENTRALPHARM', name: 'Central Pharmaceuticals Ltd.', sector: 'Pharmaceuticals & Chemicals', basePrice: 14.2, peRatio: 28.4, yoyGrowthPct: 2.1, turnover: 18.0 },
    { symbol: 'ACTIVEFINE', name: 'Active Fine Chemicals Ltd.', sector: 'Pharmaceuticals & Chemicals', basePrice: 16.8, peRatio: 24.1, yoyGrowthPct: 3.4, turnover: 29.0 },
    { symbol: 'PHARMAID', name: 'Pharma Aids Ltd.', sector: 'Pharmaceuticals & Chemicals', basePrice: 480.0, peRatio: 19.2, yoyGrowthPct: 8.8, turnover: 15.4 },

    // Banking Sector
    { symbol: 'BRACBANK', name: 'BRAC Bank PLC', sector: 'Bank', basePrice: 42.5, peRatio: 7.8, yoyGrowthPct: 11.4, turnover: 185.0, pattern: 'VCP Compression' },
    { symbol: 'CITYBANK', name: 'The City Bank PLC', sector: 'Bank', basePrice: 24.8, peRatio: 5.2, yoyGrowthPct: 5.9, turnover: 92.4, pattern: 'Double Bottom' },
    { symbol: 'EBL', name: 'Eastern Bank PLC', sector: 'Bank', basePrice: 31.2, peRatio: 6.1, yoyGrowthPct: 8.2, turnover: 64.0, pattern: 'Cup & Handle' },
    { symbol: 'ISLAMIBANK', name: 'Islami Bank Bangladesh PLC', sector: 'Bank', basePrice: 32.6, peRatio: 8.5, yoyGrowthPct: 4.8, turnover: 110.0, pattern: 'Bullish Flag' },
    { symbol: 'NBL', name: 'National Bank Limited', sector: 'Bank', basePrice: 8.5, peRatio: 14.2, yoyGrowthPct: -1.2, turnover: 35.0 },
    { symbol: 'ONEBANK', name: 'ONE Bank PLC', sector: 'Bank', basePrice: 9.8, peRatio: 6.8, yoyGrowthPct: 3.5, turnover: 28.0, pattern: 'Rounding Bottom' },
    { symbol: 'PUBALIBANK', name: 'Pubali Bank PLC', sector: 'Bank', basePrice: 29.5, peRatio: 5.5, yoyGrowthPct: 7.2, turnover: 52.0, pattern: 'MA 10/20/30 Crossover' },
    { symbol: 'UCBNK', name: 'United Commercial Bank PLC', sector: 'Bank', basePrice: 13.8, peRatio: 6.9, yoyGrowthPct: 4.2, turnover: 41.0 },
    { symbol: 'PRIMEBANK', name: 'Prime Bank PLC', sector: 'Bank', basePrice: 22.4, peRatio: 5.8, yoyGrowthPct: 6.8, turnover: 48.0, pattern: 'Bullish Pennant' },
    { symbol: 'DUTCHBANGL', name: 'Dutch-Bangla Bank PLC', sector: 'Bank', basePrice: 58.0, peRatio: 7.2, yoyGrowthPct: 9.8, turnover: 88.0, pattern: 'VCP Compression' },
    { symbol: 'EXIMBANK', name: 'EXIM Bank Agricultural', sector: 'Bank', basePrice: 10.4, peRatio: 6.4, yoyGrowthPct: 3.8, turnover: 32.0 },
    { symbol: 'JAMUNABANK', name: 'Jamuna Bank PLC', sector: 'Bank', basePrice: 23.6, peRatio: 5.1, yoyGrowthPct: 7.9, turnover: 44.0, pattern: 'Double Bottom' },
    { symbol: 'MERCANBANK', name: 'Mercantile Bank PLC', sector: 'Bank', basePrice: 12.8, peRatio: 5.9, yoyGrowthPct: 4.5, turnover: 29.5 },
    { symbol: 'IFIC', name: 'IFIC Bank PLC', sector: 'Bank', basePrice: 11.2, peRatio: 7.4, yoyGrowthPct: 3.1, turnover: 36.0 },

    // Financial Institutions
    { symbol: 'IDLC', name: 'IDLC Finance PLC', sector: 'Financial Institution', basePrice: 46.8, peRatio: 10.2, yoyGrowthPct: 6.5, turnover: 62.0, pattern: 'Falling Wedge Breakout' },
    { symbol: 'LANKABAFIN', name: 'LankaBangla Finance PLC', sector: 'Financial Institution', basePrice: 26.4, peRatio: 12.8, yoyGrowthPct: 5.1, turnover: 78.0, pattern: 'Cup & Handle' },
    { symbol: 'IPDC', name: 'IPDC Finance PLC', sector: 'Financial Institution', basePrice: 34.2, peRatio: 14.1, yoyGrowthPct: 7.2, turnover: 42.0, pattern: 'Bullish Flag' },
    { symbol: 'BAYLEASING', name: 'Bay Leasing & Investment Ltd.', sector: 'Financial Institution', basePrice: 18.5, peRatio: 18.0, yoyGrowthPct: 2.4, turnover: 19.0 },
    { symbol: 'DBH', name: 'DBH Finance PLC', sector: 'Financial Institution', basePrice: 48.0, peRatio: 9.4, yoyGrowthPct: 8.5, turnover: 25.0, pattern: 'VCP Compression' },
    { symbol: 'GSPFINANCE', name: 'GSP Finance Company Ltd.', sector: 'Financial Institution', basePrice: 15.2, peRatio: 19.5, yoyGrowthPct: 1.8, turnover: 14.0 },

    // Telecommunication
    { symbol: 'GP', name: 'Grameenphone Ltd.', sector: 'Telecommunication', basePrice: 260.0, peRatio: 10.5, yoyGrowthPct: 8.5, turnover: 180.4, pattern: 'VCP Compression' },
    { symbol: 'ROBI', name: 'Robi Axiata Limited', sector: 'Telecommunication', basePrice: 28.5, peRatio: 14.8, yoyGrowthPct: 11.2, turnover: 165.0, pattern: 'Bullish Flag' },

    // Engineering
    { symbol: 'BSRMSTEEL', name: 'BSRM Steels Limited', sector: 'Engineering', basePrice: 58.5, peRatio: 9.2, yoyGrowthPct: 8.5, turnover: 145.8, pattern: 'Symmetrical Triangle' },
    { symbol: 'WALTONBD', name: 'Walton Hi-Tech Industries PLC', sector: 'Engineering', basePrice: 720.0, peRatio: 16.5, yoyGrowthPct: 13.8, turnover: 95.0, pattern: 'Harmonic Pattern (C-to-D)' },
    { symbol: 'SINGERBD', name: 'Singer Bangladesh Limited', sector: 'Engineering', basePrice: 142.0, peRatio: 15.2, yoyGrowthPct: 6.9, turnover: 55.0, pattern: 'Cup & Handle' },
    { symbol: 'NAHEEACP', name: 'Nahee Aluminum Composite Panel Ltd.', sector: 'Engineering', basePrice: 48.5, peRatio: 12.4, yoyGrowthPct: 9.8, turnover: 38.0, pattern: 'Double Bottom' },
    { symbol: 'AAMRATECH', name: 'aamra technologies limited', sector: 'IT Sector', basePrice: 38.5, peRatio: 18.2, yoyGrowthPct: 12.5, turnover: 55.8, pattern: 'MA 10/20/30 Crossover' },
    { symbol: 'GPHISPAT', name: 'GPH Ispat Ltd.', sector: 'Engineering', basePrice: 44.5, peRatio: 11.5, yoyGrowthPct: 7.4, turnover: 68.0, pattern: 'Bullish Pennant' },
    { symbol: 'KDSALTD', name: 'KDS Accessories Limited', sector: 'Engineering', basePrice: 62.0, peRatio: 13.1, yoyGrowthPct: 8.9, turnover: 32.0, pattern: 'VCP Compression' },
    { symbol: 'RUNNERAUTO', name: 'Runner Automobiles PLC', sector: 'Engineering', basePrice: 36.8, peRatio: 17.4, yoyGrowthPct: 4.5, turnover: 28.0 },

    // Fuel & Power
    { symbol: 'TITASGAS', name: 'Titas Gas Transmission & Distribution', sector: 'Fuel & Power', basePrice: 34.5, peRatio: 8.2, yoyGrowthPct: 3.5, turnover: 88.0, pattern: 'Rounding Bottom' },
    { symbol: 'MPETROLEUM', name: 'Meghna Petroleum Limited', sector: 'Fuel & Power', basePrice: 215.0, peRatio: 6.8, yoyGrowthPct: 10.2, turnover: 75.0, pattern: 'VCP Compression' },
    { symbol: 'PADMAOIL', name: 'Padma Oil Company Limited', sector: 'Fuel & Power', basePrice: 228.0, peRatio: 7.1, yoyGrowthPct: 9.8, turnover: 82.0, pattern: 'Bullish Flag' },
    { symbol: 'UPGDCL', name: 'United Power Generation & Distribution', sector: 'Fuel & Power', basePrice: 198.0, peRatio: 11.4, yoyGrowthPct: 8.1, turnover: 112.0, pattern: 'Cup & Handle' },
    { symbol: 'SUMITPOWER', name: 'Summit Power Limited', sector: 'Fuel & Power', basePrice: 26.4, peRatio: 7.9, yoyGrowthPct: 4.5, turnover: 46.0 },
    { symbol: 'MJLBD', name: 'MJL Bangladesh PLC', sector: 'Fuel & Power', basePrice: 89.5, peRatio: 10.8, yoyGrowthPct: 8.9, turnover: 58.0, pattern: 'Double Bottom' },
    { symbol: 'DOREENPWR', name: 'Doreen Power Generations and Systems', sector: 'Fuel & Power', basePrice: 42.0, peRatio: 9.5, yoyGrowthPct: 6.2, turnover: 34.0 },

    // Cement
    { symbol: 'LHBL', name: 'LafargeHolcim Bangladesh Ltd.', sector: 'Cement', basePrice: 58.1, peRatio: 12.0, yoyGrowthPct: 6.8, turnover: 110.5, pattern: 'Cup & Handle' },
    { symbol: 'CONFIDCEM', name: 'Confidence Cement PLC', sector: 'Cement', basePrice: 68.9, peRatio: 12.5, yoyGrowthPct: 7.2, turnover: 68.4, pattern: 'Harmonic Pattern (C-to-D)' },
    { symbol: 'HEIDELBCEM', name: 'Heidelberg Materials Bangladesh PLC', sector: 'Cement', basePrice: 225.0, peRatio: 14.8, yoyGrowthPct: 5.4, turnover: 42.0, pattern: 'VCP Compression' },
    { symbol: 'MISEMENT', name: 'Premier Cement Mills PLC', sector: 'Cement', basePrice: 52.0, peRatio: 11.8, yoyGrowthPct: 7.8, turnover: 38.0, pattern: 'Bullish Flag' },
    { symbol: 'CROWNCEM', name: 'Crown Cement PLC', sector: 'Cement', basePrice: 64.5, peRatio: 10.9, yoyGrowthPct: 8.2, turnover: 48.0, pattern: 'Falling Wedge Breakout' },

    // Food & Allied
    { symbol: 'BATBC', name: 'British American Tobacco Bangladesh', sector: 'Food & Allied', basePrice: 252.5, peRatio: 9.8, yoyGrowthPct: 5.4, turnover: 98.2, pattern: 'Cup & Handle' },
    { symbol: 'OLYMPIC', name: 'Olympic Industries Ltd.', sector: 'Food & Allied', basePrice: 154.2, peRatio: 13.1, yoyGrowthPct: 9.1, turnover: 82.0, pattern: 'Bullish Flag' },
    { symbol: 'UNILEVERCL', name: 'Unilever Consumer Care Ltd.', sector: 'Food & Allied', basePrice: 2150.0, peRatio: 24.5, yoyGrowthPct: 11.5, turnover: 32.0, pattern: 'VCP Compression' },
    { symbol: 'BEACHHATCH', name: 'Beach Hatchery Ltd.', sector: 'Food & Allied', basePrice: 68.5, peRatio: 22.4, yoyGrowthPct: 15.8, turnover: 64.0, pattern: 'Bullish Pennant' },
    { symbol: 'FINEFOODS', name: 'Fine Foods Limited', sector: 'Food & Allied', basePrice: 112.0, peRatio: 28.0, yoyGrowthPct: 18.2, turnover: 55.0, pattern: 'Harmonic Pattern (C-to-D)' },
    { symbol: 'APEXFOODS', name: 'Apex Foods Limited', sector: 'Food & Allied', basePrice: 245.0, peRatio: 16.2, yoyGrowthPct: 8.4, turnover: 28.0 },
    { symbol: 'FUWANGFOOD', name: 'Fu-Wang Food Limited', sector: 'Food & Allied', basePrice: 28.4, peRatio: 21.0, yoyGrowthPct: 4.2, turnover: 45.0 },

    // IT Sector
    { symbol: 'ADNTEL', name: 'ADN Telecom Limited', sector: 'IT Sector', basePrice: 118.5, peRatio: 15.2, yoyGrowthPct: 11.2, turnover: 75.8, pattern: 'VCP Compression' },
    { symbol: 'AAMRANET', name: 'aamra networks limited', sector: 'IT Sector', basePrice: 52.4, peRatio: 14.1, yoyGrowthPct: 10.8, turnover: 48.0, pattern: 'Double Bottom' },
    { symbol: 'GENEXIL', name: 'Genex Infosys Limited', sector: 'IT Sector', basePrice: 64.8, peRatio: 16.8, yoyGrowthPct: 13.5, turnover: 92.0, pattern: 'Bullish Flag' },
    { symbol: 'AGNI', name: 'Agni Systems Limited', sector: 'IT Sector', basePrice: 26.5, peRatio: 18.5, yoyGrowthPct: 7.2, turnover: 34.0, pattern: 'Falling Wedge Breakout' },
    { symbol: 'EGEN', name: 'eGeneration Limited', sector: 'IT Sector', basePrice: 38.2, peRatio: 17.9, yoyGrowthPct: 9.4, turnover: 26.0 },

    // Textile
    { symbol: 'ALLTEX', name: 'Alltex Industries Ltd.', sector: 'Textile', basePrice: 18.5, peRatio: 16.2, yoyGrowthPct: 3.5, turnover: 42.1, pattern: 'Bullish Flag' },
    { symbol: 'ENVOYTEX', name: 'Envoy Textiles Limited', sector: 'Textile', basePrice: 44.8, peRatio: 11.2, yoyGrowthPct: 8.5, turnover: 58.0, pattern: 'VCP Compression' },
    { symbol: 'MLSPECTRA', name: 'ML Dyeing Limited', sector: 'Textile', basePrice: 21.4, peRatio: 15.4, yoyGrowthPct: 5.2, turnover: 32.0 },
    { symbol: 'SQUARETEXT', name: 'Square Textile PLC', sector: 'Textile', basePrice: 65.0, peRatio: 8.9, yoyGrowthPct: 9.4, turnover: 64.0, pattern: 'Cup & Handle' },
    { symbol: 'PARAMOUNT', name: 'Paramount Textile PLC', sector: 'Textile', basePrice: 68.2, peRatio: 10.5, yoyGrowthPct: 11.8, turnover: 72.0, pattern: 'Double Bottom' },
    { symbol: 'MALEKSPIN', name: 'Malek Spinning Mills Ltd.', sector: 'Textile', basePrice: 32.4, peRatio: 9.8, yoyGrowthPct: 7.9, turnover: 41.0, pattern: 'Bullish Pennant' },

    // Insurance
    { symbol: 'EIL', name: 'Express Insurance Limited', sector: 'Insurance', basePrice: 28.5, peRatio: 14.2, yoyGrowthPct: 4.5, turnover: 35.8, pattern: 'Rounding Bottom' },
    { symbol: 'DELTALIFE', name: 'Delta Life Insurance Co. Ltd.', sector: 'Insurance', basePrice: 125.0, peRatio: 18.5, yoyGrowthPct: 8.2, turnover: 48.0, pattern: 'VCP Compression' },
    { symbol: 'GREENDELTA', name: 'Green Delta Insurance Co. Ltd.', sector: 'Insurance', basePrice: 72.5, peRatio: 12.1, yoyGrowthPct: 7.8, turnover: 36.0, pattern: 'Cup & Handle' },
    { symbol: 'ASIAINS', name: 'Asia Insurance Limited', sector: 'Insurance', basePrice: 48.0, peRatio: 15.4, yoyGrowthPct: 5.6, turnover: 24.0 },
    { symbol: 'NITOLINS', name: 'Nitol Insurance Co. Ltd.', sector: 'Insurance', basePrice: 38.5, peRatio: 13.8, yoyGrowthPct: 6.2, turnover: 22.0, pattern: 'Bullish Flag' },
    { symbol: 'PROGATIINS', name: 'Pragati Insurance Ltd.', sector: 'Insurance', basePrice: 64.0, peRatio: 11.9, yoyGrowthPct: 8.0, turnover: 29.0 },

    // Ceramic Sector
    { symbol: 'FUWANGCER', name: 'Fuwang Ceramic Industry Ltd.', sector: 'Ceramic Sector', basePrice: 22.0, peRatio: 19.5, yoyGrowthPct: 4.8, turnover: 55.4, pattern: 'Cup & Handle' },
    { symbol: 'RAKCERAMIC', name: 'RAK Ceramics (Bangladesh) Ltd.', sector: 'Ceramic Sector', basePrice: 38.5, peRatio: 14.2, yoyGrowthPct: 6.8, turnover: 42.0, pattern: 'Double Bottom' },
    { symbol: 'MONNOCERA', name: 'Monno Ceramic Industries Ltd.', sector: 'Ceramic Sector', basePrice: 94.0, peRatio: 22.0, yoyGrowthPct: 5.4, turnover: 38.0 },

    // Travel & Leisure
    { symbol: 'UNIQUEHRL', name: 'Unique Hotel & Resorts PLC', sector: 'Travel & Leisure', basePrice: 54.2, peRatio: 11.4, yoyGrowthPct: 15.2, turnover: 95.5, pattern: 'Falling Wedge Breakout' },
    { symbol: 'PENINSULA', name: 'The Peninsula Chittagong PLC', sector: 'Travel & Leisure', basePrice: 24.8, peRatio: 16.5, yoyGrowthPct: 8.4, turnover: 28.0 },
    { symbol: 'SEAPEARL', name: 'Sea Pearl Beach Resort & Spa PLC', sector: 'Travel & Leisure', basePrice: 98.5, peRatio: 18.2, yoyGrowthPct: 22.4, turnover: 145.0, pattern: 'Harmonic Pattern (C-to-D)' },

    // Paper & Printing
    { symbol: 'SONALIPAPR', name: 'Sonali Paper & Board Mills Ltd.', sector: 'Paper & Printing', basePrice: 285.0, peRatio: 24.0, yoyGrowthPct: 14.8, turnover: 115.0, pattern: 'Bullish Flag' },
    { symbol: 'HAKKANIPUL', name: 'Hakkani Pulp & Paper Mills Ltd.', sector: 'Paper & Printing', basePrice: 62.0, peRatio: 26.5, yoyGrowthPct: 6.2, turnover: 34.0 },
    { symbol: 'BPPAPER', name: 'Bashundhara Paper Mills Limited', sector: 'Paper & Printing', basePrice: 48.5, peRatio: 15.8, yoyGrowthPct: 9.1, turnover: 58.0, pattern: 'VCP Compression' },

    // Tannery Industries
    { symbol: 'APEXTANRY', name: 'Apex Tannery Limited', sector: 'Tannery Industries', basePrice: 118.0, peRatio: 19.4, yoyGrowthPct: 5.8, turnover: 28.0 },
    { symbol: 'BATASHOE', name: 'Bata Shoe Company (Bangladesh) Ltd.', sector: 'Tannery Industries', basePrice: 950.0, peRatio: 22.5, yoyGrowthPct: 7.4, turnover: 32.0, pattern: 'Double Bottom' },
    { symbol: 'FORTUNE', name: 'Fortune Shoes Limited', sector: 'Tannery Industries', basePrice: 44.5, peRatio: 16.8, yoyGrowthPct: 11.2, turnover: 128.0, pattern: 'Bullish Pennant' },

    // Services & Real Estate
    { symbol: 'EHL', name: 'Eastern Housing Limited', sector: 'Services & Real Estate', basePrice: 88.5, peRatio: 12.4, yoyGrowthPct: 10.5, turnover: 78.0, pattern: 'VCP Compression' },
    { symbol: 'SAIFPOWER', name: 'Saif Powertec Limited', sector: 'Services & Real Estate', basePrice: 24.2, peRatio: 18.0, yoyGrowthPct: 7.8, turnover: 62.0, pattern: 'Cup & Handle' },

    // Mutual Funds
    { symbol: 'GRAMEEN2', name: 'Grameen One : Scheme Two', sector: 'Mutual Funds', basePrice: 16.8, peRatio: 8.2, yoyGrowthPct: 6.4, turnover: 18.0, pattern: 'Rounding Bottom' },
    { symbol: 'EBL1STMF', name: 'EBL First Mutual Fund', sector: 'Mutual Funds', basePrice: 7.8, peRatio: 6.5, yoyGrowthPct: 4.8, turnover: 12.0 },
    { symbol: 'AIBL1STIMF', name: 'AIBL 1st Islamic Mutual Fund', sector: 'Mutual Funds', basePrice: 8.2, peRatio: 7.1, yoyGrowthPct: 5.1, turnover: 14.0 },

    // Miscellaneous
    { symbol: 'BEXIMCO', name: 'Beximco Limited', sector: 'Miscellaneous', basePrice: 23.2, peRatio: 14.5, yoyGrowthPct: 4.1, turnover: 210.0, pattern: 'Double Bottom' },
    { symbol: 'BSC', name: 'Bangladesh Shipping Corporation', sector: 'Miscellaneous', basePrice: 118.5, peRatio: 8.8, yoyGrowthPct: 14.2, turnover: 165.0, pattern: 'Bullish Flag' },
    { symbol: 'BERGERPBL', name: 'Berger Paints Bangladesh Ltd.', sector: 'Miscellaneous', basePrice: 1780.0, peRatio: 24.8, yoyGrowthPct: 9.8, turnover: 42.0, pattern: 'VCP Compression' }
  ];

  return fullListDefs.map((def, idx) => {
    // Generate 380 daily candles per stock with realistic variation
    const volFactor = 0.05 + ((idx * 7) % 10) * 0.01;
    const freq = 3.0 + ((idx * 3) % 5) * 0.4;
    const candles = generateRealisticCandles(
      def.basePrice,
      380,
      volFactor,
      freq,
      '2026-08-02',
      def.pattern
    );

    return {
      symbol: def.symbol,
      name: def.name,
      sector: def.sector,
      yoyGrowthPct: def.yoyGrowthPct,
      peRatio: def.peRatio,
      avgTurnoverBdtMillion: def.turnover,
      candles,
    };
  });
}

export async function runDseStockScreenerAsync(
  stocks: DseStockData[],
  config: BacktestConfig,
  edgeStats?: PatternEdgeStat[],
  onProgress?: (processed: number, total: number) => void
): Promise<ScreenerStockCandidate[]> {
  const allCandidates: ScreenerStockCandidate[] = [];
  const chunkSize = 15;
  const total = stocks.length;

  for (let i = 0; i < total; i += chunkSize) {
    const chunk = stocks.slice(i, i + chunkSize);
    const candidates = runDseStockScreener(chunk, config, edgeStats);
    allCandidates.push(...candidates);

    if (onProgress) {
      onProgress(Math.min(i + chunkSize, total), total);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Final sorting based on strategy config
  if (config.strategyType === 'HARMONIC_C_ENTRY_D_EXIT') {
    allCandidates.sort((a, b) => {
      const aHasH = a.harmonicDetails ? 1 : 0;
      const bHasH = b.harmonicDetails ? 1 : 0;
      if (aHasH !== bHasH) return bHasH - aHasH;
      return b.profitPotentialScore - a.profitPotentialScore;
    });
  } else {
    allCandidates.sort((a, b) => b.profitPotentialScore - a.profitPotentialScore);
  }

  return allCandidates;
}
