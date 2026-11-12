import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Download,
  ExternalLink,
  ShieldAlert,
  Building2,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { ConsolidatedAsset, BrokerPlatform, AssetType } from '../../types';
import { formatINR, formatPercent, formatLakhCrore } from '../../lib/formatters';

interface HoldingsTableProps {
  consolidatedAssets: ConsolidatedAsset[];
  selectedMemberId: string | 'ALL';
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  consolidatedAssets,
  selectedMemberId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | AssetType>('ALL');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | BrokerPlatform>('ALL');
  const [sortField, setSortField] = useState<'value' | 'pnl' | 'dayChange' | 'name'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedIsin, setExpandedIsin] = useState<string | null>(null);

  // Platform label & badge helper
  const renderPlatformBadge = (platform: BrokerPlatform) => {
    switch (platform) {
      case 'ZERODHA_KITE':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800">
            Zerodha Kite
          </span>
        );
      case 'ZERODHA_CONSOLE':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-400 border border-sky-800">
            Zerodha (Console)
          </span>
        );
      case 'GROWW':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-950 text-teal-400 border border-teal-800">
            Groww
          </span>
        );
      case 'UPSTOX':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-400 border border-purple-800">
            Upstox
          </span>
        );
      case 'CAMS_CAS':
      case 'KFINTECH_CAS':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-400 border border-amber-800">
            CAMS / KFintech
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
            {platform}
          </span>
        );
    }
  };

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return consolidatedAssets
      .filter((asset) => {
        // Search query
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          asset.name.toLowerCase().includes(q) ||
          asset.symbol.toLowerCase().includes(q) ||
          asset.isin.toLowerCase().includes(q) ||
          asset.sector.toLowerCase().includes(q);

        // Type filter
        const matchesType = typeFilter === 'ALL' || asset.assetType === typeFilter;

        // Platform filter
        const matchesPlatform =
          platformFilter === 'ALL' ||
          asset.brokers.some((b) => b.platform === platformFilter);

        return matchesQuery && matchesType && matchesPlatform;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'value') diff = a.totalCurrentValue - b.totalCurrentValue;
        if (sortField === 'pnl') diff = a.totalPnlPercent - b.totalPnlPercent;
        if (sortField === 'dayChange') diff = a.dayChangePercent - b.dayChangePercent;
        if (sortField === 'name') diff = a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [consolidatedAssets, searchQuery, typeFilter, platformFilter, sortField, sortOrder]);

  const toggleSort = (field: 'value' | 'pnl' | 'dayChange' | 'name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Symbol',
      'ISIN',
      'Asset Name',
      'Asset Type',
      'Sector',
      'Total Quantity',
      'Weighted Avg Price (INR)',
      'LTP (INR)',
      'Invested Value (INR)',
      'Current Value (INR)',
      'Total P&L (INR)',
      'P&L %',
      'Brokers',
      'Family Owners',
    ];

    const rows = filteredAssets.map((a) => [
      a.symbol,
      a.isin,
      `"${a.name.replace(/"/g, '""')}"`,
      a.assetType,
      `"${a.sector}"`,
      a.totalQuantity,
      a.weightedAvgPrice.toFixed(2),
      a.ltp.toFixed(2),
      a.totalInvested.toFixed(2),
      a.totalCurrentValue.toFixed(2),
      a.totalPnl.toFixed(2),
      a.totalPnlPercent.toFixed(2),
      `"${a.brokers.map((b) => b.platform).join(', ')}"`,
      `"${a.familyMemberNames.join(', ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KuberPulse_Holdings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Ticker, ISIN, Company, or Sector..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Asset Types</option>
            <option value="EQUITY">Indian Equities</option>
            <option value="MUTUAL_FUND">Mutual Funds</option>
            <option value="GOLD_SGB">Gold / SGB</option>
          </select>

          {/* Broker Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Platforms</option>
            <option value="ZERODHA_KITE">Zerodha Kite</option>
            <option value="ZERODHA_CONSOLE">Zerodha Console</option>
            <option value="GROWW">Groww</option>
            <option value="UPSTOX">Upstox</option>
            <option value="CAMS_CAS">CAMS / KFintech</option>
          </select>

          {/* Export to CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700/60"
            title="Download CSV statement for Tax P&L"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 w-10"></th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-white"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Instrument / Asset</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Platform(s)</th>
              <th className="py-3 px-3">Owner(s)</th>
              <th className="py-3 px-3 text-right">Qty</th>
              <th className="py-3 px-3 text-right">Avg Price</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
                onClick={() => toggleSort('dayChange')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>LTP & Day</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-white"
                onClick={() => toggleSort('value')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Current Value</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-white"
                onClick={() => toggleSort('pnl')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Total P&L</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  No assets match your search filters.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const isExpanded = expandedIsin === asset.isin;
                const isAssetProfit = asset.totalPnl >= 0;
                const isAssetDayUp = asset.dayChange >= 0;
                const isMultiBroker = asset.brokers.length > 1;

                return (
                  <React.Fragment key={asset.isin}>
                    <tr
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-slate-800/20' : ''
                      }`}
                      onClick={() => setExpandedIsin(isExpanded ? null : asset.isin)}
                    >
                      {/* Expand Arrow */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </td>

                      {/* Name & Symbol & ISIN */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-[13px] flex items-center space-x-2">
                          <span>{asset.symbol}</span>
                          {isMultiBroker && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1 rounded font-normal">
                              Multi-Broker
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[200px] sm:max-w-[260px]">
                          {asset.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {asset.isin} • {asset.sector}
                        </div>
                      </td>

                      {/* Platforms */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {asset.brokers.map((b, idx) => (
                            <div key={idx}>{renderPlatformBadge(b.platform)}</div>
                          ))}
                        </div>
                      </td>

                      {/* Owners */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {asset.familyMemberNames.map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                            >
                              {name.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-right font-tabular text-slate-200">
                        {asset.assetType === 'MUTUAL_FUND'
                          ? asset.totalQuantity.toFixed(2)
                          : asset.totalQuantity}
                      </td>

                      {/* Weighted Avg Buy Price */}
                      <td className="py-3.5 px-3 text-right font-tabular text-slate-300">
                        {formatINR(asset.weightedAvgPrice, true)}
                        {isMultiBroker && (
                          <div className="text-[9px] text-slate-500">weighted avg</div>
                        )}
                      </td>

                      {/* LTP & Day's change */}
                      <td className="py-3.5 px-3 text-right font-tabular">
                        <div className="font-semibold text-white">
                          {formatINR(asset.ltp, true)}
                        </div>
                        <div
                          className={`text-[10px] font-medium ${
                            isAssetDayUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatPercent(asset.dayChangePercent)}
                        </div>
                      </td>

                      {/* Current Value */}
                      <td className="py-3.5 px-4 text-right font-tabular">
                        <div className="font-bold text-white text-[13px]">
                          {formatINR(asset.totalCurrentValue)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formatLakhCrore(asset.totalCurrentValue)}
                        </div>
                      </td>

                      {/* Total P&L */}
                      <td className="py-3.5 px-4 text-right font-tabular">
                        <div
                          className={`font-bold ${
                            isAssetProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatINR(asset.totalPnl)}
                        </div>
                        <div
                          className={`text-[10px] font-semibold ${
                            isAssetProfit ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {formatPercent(asset.totalPnlPercent)}
                        </div>
                      </td>

                      {/* Portfolio Weight */}
                      <td className="py-3.5 px-3 text-right font-tabular text-slate-400">
                        {asset.portfolioWeightPercent.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Expandable Broker Ledger Breakdown */}
                    {isExpanded && (
                      <tr className="bg-slate-950/70 border-y border-slate-800">
                        <td colSpan={10} className="p-4">
                          <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-2">
                              <span>
                                Multi-Account Ledger Breakdown for {asset.symbol} ({asset.isin})
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {asset.brokers.length} Account Source(s)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                              {asset.brokers.map((broker, bIdx) => (
                                <div
                                  key={bIdx}
                                  className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    {renderPlatformBadge(broker.platform)}
                                    <span className="text-[11px] font-medium text-emerald-400">
                                      {broker.familyMemberName}
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-slate-400 text-[11px]">
                                    <span>Quantity:</span>
                                    <span className="font-tabular text-slate-200">
                                      {broker.quantity}
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-slate-400 text-[11px]">
                                    <span>Buy Avg Price:</span>
                                    <span className="font-tabular text-slate-200">
                                      {formatINR(broker.averagePrice, true)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-slate-400 text-[11px]">
                                    <span>Invested:</span>
                                    <span className="font-tabular text-slate-200">
                                      {formatINR(broker.investedValue)}
                                    </span>
                                  </div>

                                  <div className="flex justify-between text-slate-400 text-[11px] border-t border-slate-800/80 pt-1">
                                    <span>Current Value:</span>
                                    <span className="font-tabular font-semibold text-white">
                                      {formatINR(broker.currentValue)}
                                    </span>
                                  </div>

                                  {broker.folioNumber && (
                                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                      <span>Folio:</span>
                                      <span>{broker.folioNumber}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
