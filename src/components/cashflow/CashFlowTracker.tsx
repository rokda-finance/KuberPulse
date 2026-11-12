import React, { useState } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  X,
  Sparkles,
} from 'lucide-react';
import { CashflowMonth } from '../../types';
import { formatINR, formatPercent } from '../../lib/formatters';

interface CashFlowTrackerProps {
  cashflows: CashflowMonth[];
  onAddCashflow: (record: CashflowMonth) => void;
}

export const CashFlowTracker: React.FC<CashFlowTrackerProps> = ({
  cashflows,
  onAddCashflow,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthYear, setMonthYear] = useState('2026-12');
  const [income, setIncome] = useState<number | ''>('');
  const [expenses, setExpenses] = useState<number | ''>('');
  const [sipAmount, setSipAmount] = useState<number | ''>('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');
  const [livingAmount, setLivingAmount] = useState<number | ''>('');

  const currentMonth = cashflows[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income || !expenses) return;

    const inc = Number(income);
    const exp = Number(expenses);
    const sav = inc - exp;
    const rate = inc > 0 ? (sav / inc) * 100 : 0;

    const categories = [
      { category: 'Mutual Fund SIPs & Equity', amount: sipAmount ? Number(sipAmount) : 0 },
      { category: 'Rent / Home Loan EMI', amount: rentAmount ? Number(rentAmount) : 0 },
      { category: 'Living, Groceries & Bills', amount: livingAmount ? Number(livingAmount) : 0 },
    ].filter((c) => c.amount > 0);

    onAddCashflow({
      monthYear,
      income: inc,
      expenses: exp,
      savings: sav,
      savingsRate: Number(rate.toFixed(2)),
      categories,
    });

    setIncome('');
    setExpenses('');
    setSipAmount('');
    setRentAmount('');
    setLivingAmount('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Income, Expenses & Savings Rate Tracker</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor cash inflow vs outflow to ensure high SIP investment velocity
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Log Monthly Cash Flow</span>
        </button>
      </div>

      {/* Highlights for Latest Month */}
      {currentMonth && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Monthly Inflow (Income)</div>
            <div className="text-lg font-bold text-white font-tabular mt-1">
              {formatINR(currentMonth.income)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Salary + Dividends + Rents</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Total Outflow (Expenses)</div>
            <div className="text-lg font-bold text-rose-400 font-tabular mt-1">
              {formatINR(currentMonth.expenses)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Living + Discretionary</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Net Investible Savings</div>
            <div className="text-lg font-bold text-emerald-400 font-tabular mt-1">
              {formatINR(currentMonth.savings)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Deployed into assets</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400">Savings Rate</div>
            <div className="text-lg font-bold text-emerald-400 font-tabular mt-1">
              {currentMonth.savingsRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-emerald-500/80 font-medium mt-1">
              Target: &gt; 50% for aggressive wealth
            </div>
          </div>
        </div>
      )}

      {/* Historical Monthly Ledger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 font-semibold text-xs text-white">
          Monthly Ledger History
        </div>

        <div className="divide-y divide-slate-800">
          {cashflows.map((m) => (
            <div key={m.monthYear} className="p-4 sm:p-5 hover:bg-slate-800/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{m.monthYear}</span>
                    <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                      {m.savingsRate.toFixed(1)}% Savings Rate
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-4">
                    <span>
                      Income: <strong className="text-slate-200">{formatINR(m.income)}</strong>
                    </span>
                    <span>
                      Expenses: <strong className="text-rose-400">{formatINR(m.expenses)}</strong>
                    </span>
                    <span>
                      Saved: <strong className="text-emerald-400">{formatINR(m.savings)}</strong>
                    </span>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="w-full sm:w-48">
                  <div className="text-[11px] text-slate-500 flex justify-between mb-1">
                    <span>Saved Ratio</span>
                    <span className="font-tabular font-semibold text-white">
                      {m.savingsRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(m.savingsRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Categorized Spends */}
              {m.categories && m.categories.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {m.categories.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 text-[11px]"
                    >
                      <div className="text-slate-400 truncate">{c.category}</div>
                      <div className="font-semibold text-white font-tabular mt-0.5">
                        {formatINR(c.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Cashflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Log Monthly Cash Flow</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Month (YYYY-MM) *
                </label>
                <input
                  type="month"
                  required
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monthly Total Inflow / Income (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={income}
                  onChange={(e) => setIncome(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 350000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monthly Total Outflow / Expenses (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 150000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-400">
                  Categorized Breakdown (Optional)
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Mutual Fund SIPs & Investments (₹)
                  </label>
                  <input
                    type="number"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 80000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Rent / Home Loan EMI (₹)
                  </label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 40000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Groceries, Living & Bills (₹)
                  </label>
                  <input
                    type="number"
                    value={livingAmount}
                    onChange={(e) =>
                      setLivingAmount(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="e.g. 20000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Save Cashflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
