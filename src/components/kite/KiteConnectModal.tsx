import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Key,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { KiteAccountStatus } from '../../types';
import { getKiteLoginUrl } from '../../services/kiteConnect';
import { formatINR } from '../../lib/formatters';

interface KiteConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  kiteStatus: KiteAccountStatus;
  isSyncing: boolean;
  onTriggerSync: (credentials?: { apiKey: string; apiSecret: string; requestToken?: string }) => void;
  onSimulateDemoSync: () => void;
}

export const KiteConnectModal: React.FC<KiteConnectModalProps> = ({
  isOpen,
  onClose,
  kiteStatus,
  isSyncing,
  onTriggerSync,
  onSimulateDemoSync,
}) => {
  const urlReqToken =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('request_token') || ''
      : '';
  const [activeTab, setActiveTab] = useState<'status' | 'credentials'>(
    urlReqToken ? 'credentials' : 'status'
  );
  const [apiKey, setApiKey] = useState(kiteStatus.apiKey || '');
  const [apiSecret, setApiSecret] = useState('');
  const [requestToken, setRequestToken] = useState(urlReqToken);

  if (!isOpen) return null;

  const handleOpenKiteOAuth = () => {
    const url = getKiteLoginUrl(apiKey || 'kite_live_prod_9921', window.location.origin);
    window.open(url, '_blank');
  };

  const handleConnectLive = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerSync({ apiKey, apiSecret, requestToken });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Zerodha Kite Connect</h2>
                <span className="text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.5 rounded">
                  v3 API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated live sync for Equity, Mutual Funds, Positions & Margins
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Connection Overview vs API Keys */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-3 text-xs font-medium border-b-2 mr-6 transition-colors ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Connection Status & Margins
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            API Credentials & OAuth Flow
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'status' ? (
            <>
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3 ${
                  kiteStatus.connected && !kiteStatus.isExpired
                    ? 'bg-emerald-950/30 border-emerald-800/60'
                    : 'bg-amber-950/30 border-amber-800/60'
                }`}
              >
                {kiteStatus.connected && !kiteStatus.isExpired ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {kiteStatus.connected && !kiteStatus.isExpired
                        ? 'Connected & Actively Syncing'
                        : 'Session Expired (Daily Refresh Required)'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Client ID: <strong className="text-white">{kiteStatus.clientId}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {kiteStatus.connected && !kiteStatus.isExpired
                      ? 'Live quotes and margin ledger are active. Access token valid until 06:00 AM IST tomorrow.'
                      : 'Zerodha Kite requires token renewal daily at 06:00 AM IST. Please re-authenticate or run demo sync.'}
                  </p>
                </div>
              </div>

              {/* Account Margins & Details Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Coins className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Available Cash Margin</span>
                  </div>
                  <div className="mt-1 text-base font-bold text-white font-tabular">
                    {formatINR(kiteStatus.availableCash, true)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Ready for deployment</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Utilised SPAN Margin</span>
                  </div>
                  <div className="mt-1 text-base font-bold text-slate-300 font-tabular">
                    {formatINR(kiteStatus.usedMargin, true)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {kiteStatus.activePositionsCount} Open F&O / Delivery positions
                  </div>
                </div>
              </div>

              {/* Quick Sync Action */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={onSimulateDemoSync}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Run Live Kite Sync (Now)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('credentials')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
                >
                  Reconfigure Keys
                </button>
              </div>
            </>
          ) : (
            /* Tab 2: Credentials Form */
            <form onSubmit={handleConnectLive} className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Security & Encryption Standards</span>
                </div>
                <p className="text-[11px]">
                  All Kite API secrets and tokens are encrypted with AES-256-GCM. We never store your Zerodha password or 2FA PIN.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kite Connect API Key
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="e.g. your_kite_api_key"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kite API Secret
                </label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Request Token (obtained from Zerodha login redirect)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={requestToken}
                    onChange={(e) => setRequestToken(e.target.value)}
                    placeholder="Enter request_token after login"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleOpenKiteOAuth}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium whitespace-nowrap"
                  >
                    <span>Login on Kite</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onSimulateDemoSync}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Or test with Instant Live Sandbox Data
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Exchange Token & Sync</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
