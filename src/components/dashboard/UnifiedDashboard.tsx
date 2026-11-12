import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Coins,
  Shield,
  Layers,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Building,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { PortfolioSummary, AllocationSlice, FamilyMember } from '../../types';
import { formatINR, formatLakhCrore, formatPercent } from '../../lib/formatters';

interface UnifiedDashboardProps {
  summary: PortfolioSummary;
  familyMembers: FamilyMember[];
  selectedMemberId: string | 'ALL';
  activeTab: 'holdings' | 'goals' | 'cashflow' | 'manual';
  onTabChange: (tab: 'holdings' | 'goals' | 'cashflow' | 'manual') => void;
  holdingsCount: number;
  goalsCount: number;
  manualCount: number;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  summary,
  familyMembers,
  selectedMemberId,
  activeTab,
  onTabChange,
  holdingsCount,
  goalsCount,
  manualCount,
}) => {
  const [allocationMode, setAllocationMode] = useState<
    'asset' | 'marketCap' | 'sector' | 'broker' | 'family'
  >('asset');

  const isProfit = summary.unrealizedPnl >= 0;
  const isDayPositive = summary.dayChange >= 0;

  // Select active allocation slices based on mode
  let currentSlices: AllocationSlice[] = summary.assetAllocation;
  if (allocationMode === 'marketCap') currentSlices = summary.marketCapAllocation;
  if (allocationMode === 'sector') currentSlices = summary.sectorAllocation;
  if (allocationMode === 'broker') currentSlices = summary.brokerAllocation;
  if (allocationMode === 'family') currentSlices = summary.familyAllocation;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as AllocationSlice;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
          <div className="font-semibold text-white flex items-center space-x-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            ></span>
            <span>{data.name}</span>
          </div>
          <div className="mt-1 text-slate-300 font-tabular font-medium">
            {formatINR(data.value)} ({data.percentage.toFixed(1)}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Net Worth */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Net Worth</span>
            <div className="p-1 rounded bg-emerald-950/60 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-white tracking-tight font-tabular">
            {formatINR(summary.totalNetWorth)}
          </div>
          <div className="mt-1 flex items-center space-x-1 text-xs">
            <span className="text-slate-500">{formatLakhCrore(summary.totalNetWorth)}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">All Assets & Cash</span>
          </div>
        </div>

        {/* Invested Capital */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Invested Capital</span>
            <div className="p-1 rounded bg-blue-950/60 text-blue-400">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-white tracking-tight font-tabular">
            {formatINR(summary.totalInvested)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Book cost basis
          </div>
        </div>

        {/* Total Unrealized P&L */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Unrealized Gain</span>
            <div
              className={`p-1 rounded ${
                isProfit ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
              }`}
            >
              {isProfit ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div
            className={`mt-2 text-xl font-bold tracking-tight font-tabular ${
              isProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatINR(summary.unrealizedPnl)}
          </div>
          <div
            className={`mt-1 text-xs font-semibold ${
              isProfit ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {formatPercent(summary.unrealizedPnlPercent)} overall
          </div>
        </div>

        {/* Day's Change */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Day's Change</span>
            <div
              className={`p-1 rounded ${
                isDayPositive ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400'
              }`}
            >
              {isDayPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div
            className={`mt-2 text-xl font-bold tracking-tight font-tabular ${
              isDayPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatINR(summary.dayChange)}
          </div>
          <div
            className={`mt-1 text-xs font-semibold ${
              isDayPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {formatPercent(summary.dayChangePercent)} (Today)
          </div>
        </div>

        {/* Portfolio XIRR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Blended XIRR</span>
            <div className="p-1 rounded bg-amber-950/60 text-amber-400">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-amber-400 tracking-tight font-tabular">
            {summary.xirr.toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Annualized return
          </div>
        </div>

        {/* Available Cash & Margins */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Liquid Cash / Margin</span>
            <div className="p-1 rounded bg-cyan-950/60 text-cyan-400">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-cyan-400 tracking-tight font-tabular">
            {formatINR(summary.availableCash)}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Zerodha Kite ledger
          </div>
        </div>
      </div>

      {/* 2. Interactive Asset Allocation Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Portfolio Allocation & Exposure</h3>
            <span className="text-xs text-slate-400">
              ({selectedMemberId === 'ALL' ? 'Combined Family' : 'Selected Profile'})
            </span>
          </div>

          {/* Allocation Toggle Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setAllocationMode('asset')}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                allocationMode === 'asset'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Asset Class
            </button>
            <button
              type="button"
              onClick={() => setAllocationMode('marketCap')}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                allocationMode === 'marketCap'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Market Cap
            </button>
            <button
              type="button"
              onClick={() => setAllocationMode('sector')}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                allocationMode === 'sector'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sector Exposure
            </button>
            <button
              type="button"
              onClick={() => setAllocationMode('broker')}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                allocationMode === 'broker'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Broker / Platform
            </button>
            {selectedMemberId === 'ALL' && (
              <button
                type="button"
                onClick={() => setAllocationMode('family')}
                className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                  allocationMode === 'family'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Family Share
              </button>
            )}
          </div>
        </div>

        {/* Visual Chart + Breakdown Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-center">
          {/* Donut Chart (5 cols) */}
          <div className="lg:col-span-5 h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentSlices}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {currentSlices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total</span>
              <span className="text-sm font-bold text-white font-tabular">
                {formatLakhCrore(summary.totalNetWorth)}
              </span>
            </div>
          </div>

          {/* Slices Legend & Progress Bars (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {currentSlices.map((slice, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      ></span>
                      <span className="font-medium text-slate-200 truncate">{slice.name}</span>
                    </div>
                    <span className="font-bold text-emerald-400 font-tabular ml-2">
                      {slice.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-tabular">{formatINR(slice.value)}</span>
                    <span className="text-slate-500">{formatLakhCrore(slice.value)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(slice.percentage, 100)}%`,
                        backgroundColor: slice.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation View Switcher (Unified Holdings, Goals, Cash Flow, Manual Assets) */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4">
        <button
          type="button"
          onClick={() => onTabChange('holdings')}
          className={`flex items-center space-x-2 pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'holdings'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Unified Holdings</span>
          <span className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-full">
            {holdingsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('manual')}
          className={`flex items-center space-x-2 pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>FDs, PPF & Gold</span>
          <span className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-full">
            {manualCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('goals')}
          className={`flex items-center space-x-2 pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'goals'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Financial Goals</span>
          <span className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded-full">
            {goalsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('cashflow')}
          className={`flex items-center space-x-2 pb-3 px-2 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'cashflow'
              ? 'border-emerald-500 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Cash Flow & Savings</span>
        </button>
      </div>
    </div>
  );
};
