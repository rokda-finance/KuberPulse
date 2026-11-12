import { Holding, KiteAccountStatus } from '../src/types/index.ts';
import { syncKitePortfolio } from '../src/services/kiteConnect.ts';
import { computeKiteChecksum } from './crypto.ts';

interface LiveSyncParams {
  apiKey?: string;
  apiSecret?: string;
  requestToken?: string;
  accessToken?: string;
}

/**
 * Performs live Zerodha Kite Connect v3 token exchange and portfolio sync if
 * valid live credentials are supplied, or falls back to sandbox live tick sync.
 */
export async function executeKiteSync(params: LiveSyncParams): Promise<{
  holdings: Holding[];
  accountStatus: KiteAccountStatus;
  accessToken?: string;
  mode: 'LIVE_API' | 'SANDBOX';
}> {
  const { apiKey, apiSecret, requestToken, accessToken: existingToken } = params;

  // Attempt real Kite Connect v3 REST calls only when user supplies real non-demo key + token
  const isRealKey = Boolean(apiKey && apiKey !== 'kite_live_prod_9921' && (requestToken || existingToken));

  if (isRealKey && apiKey) {
    try {
      let accessToken = existingToken || '';

      if (requestToken && apiSecret) {
        const checksum = computeKiteChecksum(apiKey, requestToken, apiSecret);
        const tokenResp = await fetch('https://api.kite.trade/session/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Kite-Version': '3',
          },
          body: new URLSearchParams({
            api_key: apiKey,
            request_token: requestToken,
            checksum,
          }),
        });

        const tokenJson = (await tokenResp.json()) as any;
        if (!tokenResp.ok || tokenJson.status !== 'success') {
          throw new Error(tokenJson.message || 'Kite session token exchange failed');
        }
        accessToken = tokenJson.data.access_token;
      }

      if (accessToken) {
        const authHeader = `token ${apiKey}:${accessToken}`;
        const [holdingsResp, marginsResp] = await Promise.all([
          fetch('https://api.kite.trade/portfolio/holdings', {
            headers: { Authorization: authHeader, 'X-Kite-Version': '3' },
          }),
          fetch('https://api.kite.trade/user/margins', {
            headers: { Authorization: authHeader, 'X-Kite-Version': '3' },
          }),
        ]);

        const holdingsJson = (await holdingsResp.json()) as any;
        const marginsJson = (await marginsResp.json()) as any;

        if (!holdingsResp.ok || holdingsJson.status !== 'success') {
          throw new Error(holdingsJson.message || 'Failed to fetch Kite holdings');
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 14 * 60 * 60 * 1000).toISOString();

        const mappedHoldings: Holding[] = (holdingsJson.data || []).map((item: any, idx: number) => {
          const qty = Number(item.quantity || 0) + Number(item.t1_quantity || 0);
          const avg = Number(item.average_price || 0);
          const ltp = Number(item.last_price || avg);
          const inv = qty * avg;
          const cur = qty * ltp;
          const pnl = cur - inv;

          return {
            id: `kite_live_${item.isin || item.tradingsymbol}_${idx}`,
            isin: item.isin || `IN999${String(item.tradingsymbol).slice(0, 6)}`,
            symbol: item.tradingsymbol,
            name: item.tradingsymbol,
            assetType: 'EQUITY',
            sector: 'NSE Listed Equity',
            marketCap: 'LARGE_CAP',
            quantity: qty,
            averagePrice: avg,
            ltp,
            dayChange: Number(item.day_change || 0),
            dayChangePercent: Number(item.day_change_percentage || 0),
            investedValue: inv,
            currentValue: cur,
            unrealizedPnl: pnl,
            unrealizedPnlPercent: inv > 0 ? (pnl / inv) * 100 : 0,
            platform: 'ZERODHA_KITE',
            brokerClientId: 'LIVE_KITE',
            familyMemberId: 'fam_self',
            familyMemberName: 'Rajesh Kumar (Self)',
            lastSyncedAt: now.toISOString(),
          };
        });

        const availableCash = Number(marginsJson?.data?.equity?.available?.cash || 0);
        const usedMargin = Number(marginsJson?.data?.equity?.utilised?.debits || 0);

        return {
          holdings: mappedHoldings,
          accessToken,
          mode: 'LIVE_API',
          accountStatus: {
            connected: true,
            apiKey,
            clientId: 'LIVE_KITE',
            clientName: 'Zerodha Live Account',
            accountType: 'EQUITY_COMMODITY',
            availableCash,
            usedMargin,
            lastSyncedAt: now.toISOString(),
            expiresAt,
            isExpired: false,
            activePositionsCount: 0,
            holdingsCount: mappedHoldings.length,
          },
        };
      }
    } catch (err) {
      throw err;
    }
  }

  // Fallback sandbox live tick simulation
  const sim = await syncKitePortfolio({ apiKey }, true);
  return {
    holdings: sim.holdings,
    accountStatus: sim.accountStatus,
    mode: 'SANDBOX',
  };
}
