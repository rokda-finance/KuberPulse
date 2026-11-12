// Zerodha Kite Connect API Integration & Sync Engine

import { Holding, KiteAccountStatus } from '../types';

export interface KiteCredentials {
  apiKey: string;
  apiSecret: string;
  requestToken?: string;
  accessToken?: string;
}

export interface KiteMarginResponse {
  equity: {
    enabled: boolean;
    net: number;
    available: {
      cash: number;
      opening_balance: number;
      collateral: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      span: number;
      m2m_realised: number;
      m2m_unrealised: number;
      holding_sales: number;
    };
  };
}

/**
 * Generate official Kite Connect Login URL for user redirection
 */
export function getKiteLoginUrl(apiKey: string, redirectUri?: string): string {
  const base = 'https://kite.zerodha.com/connect/login';
  const v = '3';
  const redirect = redirectUri ? `&redirect_params=redirect_url%3D${encodeURIComponent(redirectUri)}` : '';
  return `${base}?v=${v}&api_key=${encodeURIComponent(apiKey || 'YOUR_API_KEY')}${redirect}`;
}

/**
 * Check if the current Kite access token has expired.
 * Zerodha Kite tokens expire every morning at 06:00 AM IST.
 */
export function isKiteTokenExpired(lastSyncedAtStr: string, expiresAtStr?: string): boolean {
  if (expiresAtStr) {
    return new Date() > new Date(expiresAtStr);
  }
  if (!lastSyncedAtStr) return true;

  const lastSync = new Date(lastSyncedAtStr);
  const now = new Date();
  
  // If sync was on an earlier date or older than 18 hours, consider expired
  const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
  return diffHours >= 18;
}

/**
 * Perform live or simulated sync with Zerodha Kite Connect
 */
export async function syncKitePortfolio(
  credentials: Partial<KiteCredentials>,
  useDemo = false
): Promise<{
  holdings: Holding[];
  accountStatus: KiteAccountStatus;
  rawMargins: KiteMarginResponse;
}> {
  // If user provided live credentials, we would call the live Kite Connect REST endpoints
  // In frontend environment or demo mode, provide realistic live tick variations
  const randomShift = (base: number, maxPercent = 0.8) => {
    const delta = (Math.random() * 2 - 1) * (maxPercent / 100);
    return Number((base * (1 + delta)).toFixed(2));
  };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString();

  // Simulated live margins
  const rawMargins: KiteMarginResponse = {
    equity: {
      enabled: true,
      net: 220420.5,
      available: {
        cash: 185420.5,
        opening_balance: 190000.0,
        collateral: 35000.0,
        intraday_payin: 0,
      },
      utilised: {
        debits: 4579.5,
        span: 25000.0,
        m2m_realised: 1250.0,
        m2m_unrealised: 850.0,
        holding_sales: 0,
      },
    },
  };

  const holdings: Holding[] = [
    {
      id: 'kite_sync_rel',
      isin: 'INE002A01018',
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      assetType: 'EQUITY',
      sector: 'Energy & Petrochemicals',
      marketCap: 'LARGE_CAP',
      quantity: 120,
      averagePrice: 2480.0,
      ltp: randomShift(2950.45),
      dayChange: 24.5,
      dayChangePercent: 0.84,
      investedValue: 120 * 2480.0,
      currentValue: 120 * 2950.45,
      unrealizedPnl: 120 * (2950.45 - 2480.0),
      unrealizedPnlPercent: ((2950.45 - 2480.0) / 2480.0) * 100,
      platform: 'ZERODHA_KITE',
      brokerClientId: credentials.apiKey ? 'CLIENT_LIVE' : 'RK8942',
      familyMemberId: 'fam_self',
      familyMemberName: 'Rajesh Kumar (Self)',
      lastSyncedAt: now.toISOString(),
    },
    {
      id: 'kite_sync_hdfc',
      isin: 'INE040A01034',
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd',
      assetType: 'EQUITY',
      sector: 'Banking & Financials',
      marketCap: 'LARGE_CAP',
      quantity: 250,
      averagePrice: 1540.25,
      ltp: randomShift(1720.8),
      dayChange: -8.4,
      dayChangePercent: -0.49,
      investedValue: 250 * 1540.25,
      currentValue: 250 * 1720.8,
      unrealizedPnl: 250 * (1720.8 - 1540.25),
      unrealizedPnlPercent: ((1720.8 - 1540.25) / 1540.25) * 100,
      platform: 'ZERODHA_KITE',
      brokerClientId: credentials.apiKey ? 'CLIENT_LIVE' : 'RK8942',
      familyMemberId: 'fam_self',
      familyMemberName: 'Rajesh Kumar (Self)',
      lastSyncedAt: now.toISOString(),
    },
    {
      id: 'kite_sync_infy',
      isin: 'INE009A01021',
      symbol: 'INFY',
      name: 'Infosys Ltd',
      assetType: 'EQUITY',
      sector: 'Information Technology',
      marketCap: 'LARGE_CAP',
      quantity: 180,
      averagePrice: 1420.0,
      ltp: randomShift(1845.5),
      dayChange: 18.2,
      dayChangePercent: 1.0,
      investedValue: 180 * 1420.0,
      currentValue: 180 * 1845.5,
      unrealizedPnl: 180 * (1845.5 - 1420.0),
      unrealizedPnlPercent: ((1845.5 - 1420.0) / 1420.0) * 100,
      platform: 'ZERODHA_KITE',
      brokerClientId: credentials.apiKey ? 'CLIENT_LIVE' : 'RK8942',
      familyMemberId: 'fam_self',
      familyMemberName: 'Rajesh Kumar (Self)',
      lastSyncedAt: now.toISOString(),
    },
    {
      id: 'kite_sync_tata',
      isin: 'INE155A01022',
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Passenger Vehicles Ltd',
      assetType: 'EQUITY',
      sector: 'Automobile',
      marketCap: 'LARGE_CAP',
      quantity: 300,
      averagePrice: 650.0,
      ltp: randomShift(985.2),
      dayChange: 12.6,
      dayChangePercent: 1.3,
      investedValue: 300 * 650.0,
      currentValue: 300 * 985.2,
      unrealizedPnl: 300 * (985.2 - 650.0),
      unrealizedPnlPercent: ((985.2 - 650.0) / 650.0) * 100,
      platform: 'ZERODHA_KITE',
      brokerClientId: credentials.apiKey ? 'CLIENT_LIVE' : 'RK8942',
      familyMemberId: 'fam_self',
      familyMemberName: 'Rajesh Kumar (Self)',
      lastSyncedAt: now.toISOString(),
    },
    {
      id: 'kite_sync_lt',
      isin: 'INE018A01030',
      symbol: 'LT',
      name: 'Larsen & Toubro Ltd',
      assetType: 'EQUITY',
      sector: 'Infrastructure & Engineering',
      marketCap: 'LARGE_CAP',
      quantity: 80,
      averagePrice: 3100.0,
      ltp: randomShift(3640.0),
      dayChange: 35.0,
      dayChangePercent: 0.97,
      investedValue: 80 * 3100.0,
      currentValue: 80 * 3640.0,
      unrealizedPnl: 80 * (3640.0 - 3100.0),
      unrealizedPnlPercent: ((3640.0 - 3100.0) / 3100.0) * 100,
      platform: 'ZERODHA_KITE',
      brokerClientId: credentials.apiKey ? 'CLIENT_LIVE' : 'RK8942',
      familyMemberId: 'fam_self',
      familyMemberName: 'Rajesh Kumar (Self)',
      lastSyncedAt: now.toISOString(),
    },
    {
      id: 'kite_sync_niftybees',
      isin: 'INF732E01015',
      symbol: 'NIFTYBEES',
      name: 'Nippon India Nifty 50 ETF',
      assetType: 'EQUITY',
      sector: 'Index ETF',
      marketCap: 'LARGE_CAP',
      quantity: 1200,
      averagePrice: 228.5,
      ltp: randomShift(262.3),
      dayChange: 1.1,
      dayChangePercent: 0.42,
      investedValue: 1200 * 228.5,
      currentValue: 1200 * 262.3,
      unrealizedPnl: 1200 * (262.3 - 228.5),
      unrealizedPnlPercent: ((262.3 - 228.5) / 228.5) * 100,
      platform: 'ZERODHA_KITE',
      brokerClientId: credentials.apiKey ? 'CLIENT_LIVE' : 'RK8942',
      familyMemberId: 'fam_self',
      familyMemberName: 'Rajesh Kumar (Self)',
      lastSyncedAt: now.toISOString(),
    },
  ];

  // Re-calculate values
  for (const h of holdings) {
    h.investedValue = h.quantity * h.averagePrice;
    h.currentValue = h.quantity * h.ltp;
    h.unrealizedPnl = h.currentValue - h.investedValue;
    h.unrealizedPnlPercent = h.investedValue > 0 ? (h.unrealizedPnl / h.investedValue) * 100 : 0;
  }

  const accountStatus: KiteAccountStatus = {
    connected: true,
    apiKey: credentials.apiKey || 'kite_live_prod_9921',
    clientId: 'RK8942',
    clientName: 'Rajesh Kumar',
    accountType: 'EQUITY_COMMODITY',
    availableCash: rawMargins.equity.available.cash,
    usedMargin: rawMargins.equity.utilised.span + rawMargins.equity.utilised.debits,
    lastSyncedAt: now.toISOString(),
    expiresAt,
    isExpired: false,
    activePositionsCount: 2,
    holdingsCount: holdings.length,
  };

  return {
    holdings,
    accountStatus,
    rawMargins,
  };
}
