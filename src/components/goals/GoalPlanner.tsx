import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  PlusCircle,
  Calendar,
  CheckCircle2,
  TrendingUp,
  X,
  ArrowRight,
} from 'lucide-react';
import { FinancialGoal, Holding } from '../../types';
import { formatINR, formatLakhCrore, formatDate } from '../../lib/formatters';

interface GoalPlannerProps {
  goals: FinancialGoal[];
  holdings: Holding[];
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
}

export const GoalPlanner: React.FC<GoalPlannerProps> = ({
  goals,
  holdings,
  onAddGoal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FinancialGoal['category']>('RETIREMENT');
  const [targetAmount, setTargetAmount] = useState<number | ''>('');
  const [currentSaved, setCurrentSaved] = useState<number | ''>('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlySip, setMonthlySip] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount || !targetDate) return;

    onAddGoal({
      title,
      category,
      targetAmount: Number(targetAmount),
      currentSaved: currentSaved ? Number(currentSaved) : 0,
      targetDate,
      linkedAssetIsins: [],
      monthlySip: monthlySip ? Number(monthlySip) : 10000,
      color: '#10b981',
    });

    setTitle('');
    setTargetAmount('');
    setCurrentSaved('');
    setTargetDate('');
    setMonthlySip('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Goal-Based Wealth Planning</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Track milestones, target dates, corpus progress, and monthly SIP requirements
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Add Financial Goal</span>
        </button>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const progressPercent = Math.min(
            (goal.currentSaved / goal.targetAmount) * 100,
            100
          );
          const shortfall = Math.max(goal.targetAmount - goal.currentSaved, 0);

          return (
            <div
              key={goal.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded">
                    {goal.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-2">{goal.title}</h4>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Target Corpus</span>
                  <div className="text-sm font-bold text-white font-tabular">
                    {formatINR(goal.targetAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {formatLakhCrore(goal.targetAmount)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">
                    Saved:{' '}
                    <strong className="text-emerald-400 font-tabular">
                      {formatINR(goal.currentSaved)}
                    </strong>
                  </span>
                  <span className="font-bold text-white font-tabular">
                    {progressPercent.toFixed(1)}% Achieved
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">Shortfall</div>
                  <div className="font-semibold text-rose-400 font-tabular mt-0.5">
                    {formatINR(shortfall)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Target Date</div>
                  <div className="font-semibold text-slate-300 mt-0.5">
                    {formatDate(goal.targetDate)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Recommended SIP</div>
                  <div className="font-semibold text-emerald-400 font-tabular mt-0.5">
                    {formatINR(goal.monthlySip)}/mo
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Create Financial Goal</span>
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
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Children's College Fund"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="RETIREMENT">Retirement (FIRE)</option>
                    <option value="HOUSE">House / Real Estate</option>
                    <option value="EDUCATION">Education</option>
                    <option value="EMERGENCY">Emergency Fund</option>
                    <option value="VEHICLE">Vehicle / Travel</option>
                    <option value="WEALTH">Wealth Creation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Target Corpus (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) =>
                      setTargetAmount(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="e.g. 5000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Already Saved (₹)
                  </label>
                  <input
                    type="number"
                    value={currentSaved}
                    onChange={(e) =>
                      setCurrentSaved(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="e.g. 1200000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Planned Monthly SIP (₹)
                </label>
                <input
                  type="number"
                  value={monthlySip}
                  onChange={(e) =>
                    setMonthlySip(e.target.value ? Number(e.target.value) : '')
                  }
                  placeholder="e.g. 25000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
