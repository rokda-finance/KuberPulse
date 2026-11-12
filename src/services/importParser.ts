// Multi-Platform & Multi-Account Import Engine
// Supports Zerodha Console, Groww, Upstox, CAMS/KFintech CAS, and Generic CSV/XLSX

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Holding, BrokerPlatform, AssetType, MarketCap } from '../types';

export interface ParsedHoldingRecord {
  symbol: string;
  name: string;
  isin: string;
  assetType: AssetType;
  sector: string;
  marketCap: MarketCap;
  quantity: number;
  averagePrice: number;
  ltp: number;
  folioNumber?: string;
  platform: BrokerPlatform;
}

export interface ParseResult {
  platformDetected: BrokerPlatform;
  records: ParsedHoldingRecord[];
  errors: string[];
  rawHeaders: string[];
  rawRows: Record<string, any>[];
}

// Master metadata mapping for common Indian securities
const SECURITY_MAP: Record<
  string,
  { name: string; isin: string; sector: string; marketCap: MarketCap; type: AssetType }
> = {
  RELIANCE: {
    name: 'Reliance Industries Ltd',
    isin: 'INE002A01018',
    sector: 'Energy & Petrochemicals',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  HDFCBANK: {
    name: 'HDFC Bank Ltd',
    isin: 'INE040A01034',
    sector: 'Banking & Financials',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  INFY: {
    name: 'Infosys Ltd',
    isin: 'INE009A01021',
    sector: 'Information Technology',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  TCS: {
    name: 'Tata Consultancy Services Ltd',
    isin: 'INE467B01029',
    sector: 'Information Technology',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  TATAMOTORS: {
    name: 'Tata Motors Passenger Vehicles Ltd',
    isin: 'INE155A01022',
    sector: 'Automobile',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  SBIN: {
    name: 'State Bank of India',
    isin: 'INE062A01020',
    sector: 'PSU Banks',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  ITC: {
    name: 'ITC Limited',
    isin: 'INE154A01025',
    sector: 'FMCG & Cigarettes',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  LT: {
    name: 'Larsen & Toubro Ltd',
    isin: 'INE018A01030',
    sector: 'Infrastructure & Engineering',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  BHARTIARTL: {
    name: 'Bharti Airtel Ltd',
    isin: 'INE397D01024',
    sector: 'Telecommunications',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  ICICIBANK: {
    name: 'ICICI Bank Ltd',
    isin: 'INE090A01021',
    sector: 'Banking & Financials',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  POLYCAB: {
    name: 'Polycab India Ltd',
    isin: 'INE455K01017',
    sector: 'Consumer Electricals',
    marketCap: 'MID_CAP',
    type: 'EQUITY',
  },
  TATAELXSI: {
    name: 'Tata Elxsi Ltd',
    isin: 'INE670A01012',
    sector: 'IT & Design',
    marketCap: 'MID_CAP',
    type: 'EQUITY',
  },
  CDSL: {
    name: 'Central Depository Services Ltd',
    isin: 'INE736A01011',
    sector: 'Financial Market Infra',
    marketCap: 'MID_CAP',
    type: 'EQUITY',
  },
  NIFTYBEES: {
    name: 'Nippon India Nifty 50 BeES ETF',
    isin: 'INF732E01015',
    sector: 'Index ETF',
    marketCap: 'LARGE_CAP',
    type: 'EQUITY',
  },
  GOLDBEES: {
    name: 'Nippon India ETF Gold BeES',
    isin: 'INF204KB14I2',
    sector: 'Commodity ETF',
    marketCap: 'GOVERNMENT_SOVEREIGN',
    type: 'GOLD_SGB',
  },
  PPFAS_FLEXI: {
    name: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    isin: 'INF879O01019',
    sector: 'Flexi Cap Fund',
    marketCap: 'LARGE_CAP',
    type: 'MUTUAL_FUND',
  },
  MIRAE_LM: {
    name: 'Mirae Asset Large & Midcap Fund - Direct Growth',
    isin: 'INF769K01EZ2',
    sector: 'Large & Mid Cap',
    marketCap: 'MID_CAP',
    type: 'MUTUAL_FUND',
  },
  HDFC_TOP100: {
    name: 'HDFC Top 100 Fund - Direct Plan Growth',
    isin: 'INF179K01BE2',
    sector: 'Large Cap Mutual Fund',
    marketCap: 'LARGE_CAP',
    type: 'MUTUAL_FUND',
  },
  NIPPON_SMALLCAP: {
    name: 'Nippon India Small Cap Fund - Direct Growth',
    isin: 'INF204K01E18',
    sector: 'Small Cap Mutual Fund',
    marketCap: 'SMALL_CAP',
    type: 'MUTUAL_FUND',
  },
};

/**
 * Clean numeric string into float (removes commas, ₹, spaces)
 */
function parseNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Auto-detect platform from headers or content
 */
export function detectPlatform(headers: string[], firstRows: any[]): BrokerPlatform {
  const headerStr = headers.map((h) => h.toLowerCase().trim()).join(' ');

  if (headerStr.includes('cams') || headerStr.includes('folio') || headerStr.includes('scheme name')) {
    return 'CAMS_CAS';
  }
  if (headerStr.includes('groww') || (headerStr.includes('isin') && headerStr.includes('units') && headerStr.includes('avg price'))) {
    return 'GROWW';
  }
  if (headerStr.includes('upstox') || (headerStr.includes('scrip') && headerStr.includes('avg. cost'))) {
    return 'UPSTOX';
  }
  if (
    headerStr.includes('symbol') &&
    (headerStr.includes('isin') || headerStr.includes('quantity available')) &&
    (headerStr.includes('buy avg') || headerStr.includes('average price'))
  ) {
    return 'ZERODHA_CONSOLE';
  }
  return 'ZERODHA_CONSOLE';
}

/**
 * Parse CSV or Excel file data
 */
export async function parseInvestmentFile(
  file: File,
  forcedPlatform?: BrokerPlatform
): Promise<ParseResult> {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  let rawRows: Record<string, any>[] = [];
  let rawHeaders: string[] = [];

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (jsonData.length > 0) {
      // Find header row (skip preamble if any)
      let headerIdx = 0;
      for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (Array.isArray(row) && row.some((c) => String(c).toLowerCase().includes('symbol') || String(c).toLowerCase().includes('isin') || String(c).toLowerCase().includes('scheme') || String(c).toLowerCase().includes('quantity') || String(c).toLowerCase().includes('units'))) {
          headerIdx = i;
          break;
        }
      }
      rawHeaders = (jsonData[headerIdx] || []).map((h) => String(h || '').trim());
      const dataRows = jsonData.slice(headerIdx + 1);
      rawRows = dataRows
        .filter((r) => Array.isArray(r) && r.some((c) => c !== undefined && c !== null && String(c).trim() !== ''))
        .map((row) => {
          const obj: Record<string, any> = {};
          rawHeaders.forEach((h, colIdx) => {
            if (h) obj[h] = row[colIdx];
          });
          return obj;
        });
    }
  } else {
    // CSV
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: 'greedy' });
    rawHeaders = parsed.meta.fields || [];
    rawRows = parsed.data as Record<string, any>[];
  }

  const detected = forcedPlatform || detectPlatform(rawHeaders, rawRows.slice(0, 5));
  const records: ParsedHoldingRecord[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    try {
      const rec = parseRow(row, detected, rawHeaders);
      if (rec && rec.quantity > 0) {
        records.push(rec);
      }
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message || 'Error parsing record'}`);
    }
  }

  return {
    platformDetected: detected,
    records,
    errors,
    rawHeaders,
    rawRows,
  };
}

/**
 * Helper to match key regardless of casing or symbols
 */
function findCol(row: Record<string, any>, candidates: string[]): any {
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const candNorm = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k of keys) {
      const kNorm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (kNorm === candNorm || kNorm.includes(candNorm)) {
        return row[k];
      }
    }
  }
  return undefined;
}

function parseRow(
  row: Record<string, any>,
  platform: BrokerPlatform,
  headers: string[]
): ParsedHoldingRecord | null {
  // Extract Symbol / Ticker / Scheme Name
  const rawSymbol =
    findCol(row, ['symbol', 'ticker', 'instrument', 'scrip', 'scrip name', 'scheme name', 'asset name', 'stock', 'particulars']) ||
    '';
  const rawIsin = findCol(row, ['isin', 'isin code', 'security isin']) || '';
  const rawQty = findCol(row, ['quantity', 'qty', 'units', 'quantity available', 'balance units', 'shares']) || 0;
  const rawAvgPrice = findCol(row, ['buy avg', 'avg price', 'average price', 'buy price', 'cost price', 'avg cost', 'nav on date']) || 0;
  const rawLtp = findCol(row, ['ltp', 'last price', 'current price', 'cmp', 'nav', 'previous close', 'market price']) || 0;
  const rawFolio = findCol(row, ['folio', 'folio number', 'folio no']) || '';

  const cleanSymbol = String(rawSymbol).trim().toUpperCase();
  const cleanIsin = String(rawIsin).trim().toUpperCase();
  const quantity = parseNumber(rawQty);
  const averagePrice = parseNumber(rawAvgPrice);
  let ltp = parseNumber(rawLtp);

  if (!cleanSymbol && !cleanIsin) return null;
  if (quantity <= 0) return null;

  // Metadata enrichment from canonical Indian dictionary
  const matchedMeta =
    SECURITY_MAP[cleanSymbol] ||
    Object.values(SECURITY_MAP).find((m) => m.isin === cleanIsin);

  const name =
    matchedMeta?.name ||
    findCol(row, ['name', 'company name', 'scheme', 'asset']) ||
    cleanSymbol;
  const isin = matchedMeta?.isin || cleanIsin || `IN999${cleanSymbol.substring(0, 7)}01`;
  const assetType: AssetType =
    matchedMeta?.type ||
    (platform === 'CAMS_CAS' || platform === 'KFINTECH_CAS' || name.toLowerCase().includes('fund')
      ? 'MUTUAL_FUND'
      : 'EQUITY');
  const sector = matchedMeta?.sector || 'Diversified Indian Equities';
  const marketCap: MarketCap = matchedMeta?.marketCap || 'LARGE_CAP';

  if (ltp <= 0) {
    // If LTP not present in export, fall back to average price or 10% premium
    ltp = averagePrice > 0 ? Number((averagePrice * 1.08).toFixed(2)) : 100;
  }

  return {
    symbol: cleanSymbol || (matchedMeta ? Object.keys(SECURITY_MAP).find((k) => SECURITY_MAP[k] === matchedMeta) || 'ASSET' : 'ASSET'),
    name,
    isin,
    assetType,
    sector,
    marketCap,
    quantity,
    averagePrice: averagePrice > 0 ? averagePrice : ltp,
    ltp,
    folioNumber: rawFolio ? String(rawFolio).trim() : undefined,
    platform,
  };
}

/**
 * Generate Sample Files for quick testing
 */
export function generateSampleCsv(platform: 'ZERODHA' | 'GROWW' | 'UPSTOX' | 'CAMS'): string {
  if (platform === 'ZERODHA') {
    return `Symbol,ISIN,Quantity Available,Discrepant Quantity,Buy Avg,Previous Close
TCS,INE467B01029,45,0,3850.50,4210.00
BHARTIARTL,INE397D01024,120,0,1180.00,1650.25
ICICIBANK,INE090A01021,200,0,940.00,1260.40
CDSL,INE736A01011,100,0,1450.00,2180.00
GOLDBEES,INF204KB14I2,500,0,52.20,68.45`;
  }
  if (platform === 'GROWW') {
    return `Scheme / Company Name,ISIN,Units,Avg Price,Current Price
Parag Parikh Flexi Cap Fund - Direct Growth,INF879O01019,2500.50,55.40,78.95
HDFC Top 100 Fund - Direct Plan Growth,INF179K01BE2,1850.00,820.00,1150.40
Nippon India Small Cap Fund - Direct Growth,INF204K01E18,3200.75,95.50,162.20
Tata Elxsi Ltd,INE670A01012,25,6800.00,7450.00`;
  }
  if (platform === 'UPSTOX') {
    return `Scrip Name,Instrument,Quantity,Avg. Cost,LTP
SBIN,INE062A01020,350,560.00,825.40
ITC,INE154A01025,600,390.00,472.15
POLYCAB,INE455K01017,40,4950.00,6850.00`;
  }
  // CAMS CAS
  return `Folio Number,Scheme Name,ISIN,Balance Units,Cost Value,NAV,Market Value
10984521/44,Parag Parikh Flexi Cap Fund - Direct Growth,INF879O01019,4500.00,240000.00,78.95,355275.00
89104523/12,Mirae Asset Large & Midcap Fund - Direct Growth,INF769K01EZ2,2200.00,210000.00,138.60,304920.00
44512098/91,HDFC Top 100 Fund - Direct Plan Growth,INF179K01BE2,1100.00,920000.00,1150.40,1265440.00`;
}
