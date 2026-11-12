import React, { useState } from 'react';
import {
  X,
  Building,
  PlusCircle,
  Trash2,
  Calendar,
  Percent,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ManualAsset, FamilyMember, AssetType } from '../../types';
import { formatINR, formatLakhCrore, formatDate } from '../../lib/formatters';

interface ManualAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualAssets: ManualAsset[];
  familyMembers: FamilyMember[];
  onAddAsset: (asset: Omit<ManualAsset, 'id'>) => void;
  onDeleteAsset: (id: string) => void;
}

export const ManualAssetModal: React.FC<ManualAssetModalProps> = ({
  isOpen,
  onClose,
  manualAssets,
  familyMembers,
  onAddAsset,
  onDeleteAsset,
}) => {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [assetType, setAssetType] = useState<ManualAsset['assetType']>('DEBT_FD');
  const [name, setName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [investedAmount, setInvestedAmount] = useState<number | ''>('');
  const [currentValue, setCurrentValue] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [maturityDate, setMaturityDate] = useState('');
  const [notes, setNotes] = useState('');
  const [familyMemberId, setFamilyMemberId] = useState(familyMembers[0]?.id || 'fam_self');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !investedAmount || !currentValue) return;

    const member = familyMembers.find((m) => m.id === familyMemberId);

    onAddAsset({
      assetType,
      name,
      institutionName: institutionName || 'Bank / Govt',
      accountNumber: accountNumber || undefined,
      investedAmount: Number(investedAmount),
      currentValue: Number(currentValue),
      interestRate: interestRate ? Number(interestRate) : undefined,
      maturityDate: maturityDate || undefined,
      notes: notes || undefined,
      familyMemberId,
      familyMemberName: member?.name || 'Self',
    });

    // Reset
    setName('');
    setInstitutionName('');
    setAccountNumber('');
    setInvestedAmount('');
    setCurrentValue('');
    setInterestRate('');
    setMaturityDate('');
    setNotes('');
    setView('list');
  };

  const getBadgeColor = (type: ManualAsset['assetType']) => {
    switch (type) {
      case 'DEBT_FD':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      case 'PPF':
      case 'EPF':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'GOLD_SGB':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'REAL_ESTATE':
        return 'bg-purple-950 text-purple-400 border-purple-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Non-Broker Assets Ledger</h2>
              <p className="text-xs text-slate-400">
                Fixed Deposits, PPF, EPF, Sovereign Gold Bonds & Real Estate
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

        {/* Subheader Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 justify-between items-center">
          <div className="flex">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`py-3 text-xs font-medium border-b-2 mr-6 transition-colors ${
                view === 'list'
                  ? 'border-amber-500 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Current Assets ({manualAssets.length})
            </button>
            <button
              type="button"
              onClick={() => setView('add')}
              className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                view === 'add'
                  ? 'border-amber-500 text-amber-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              + Add New Non-Broker Asset
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {view === 'list' ? (
            <div className="space-y-3">
              {manualAssets.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-sm">No non-broker assets recorded yet.</p>
                  <button
                    type="button"
                    onClick={() => setView('add')}
                    className="mt-2 text-xs text-amber-400 hover:underline"
                  >
                    + Add your first FD or PPF account
                  </button>
                </div>
              ) : (
                manualAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{asset.name}</span>
                        <span
                          className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded ${getBadgeColor(
                            asset.assetType
                          )}`}
                        >
                          {asset.assetType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                        <span>Institution: <strong className="text-slate-300">{asset.institutionName}</strong></span>
                        {asset.interestRate && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-semibold">{asset.interestRate}% p.a.</span>
                          </>
                        )}
                        {asset.maturityDate && (
                          <>
                            <span>•</span>
                            <span>Matures {formatDate(asset.maturityDate)}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-slate-300">{asset.familyMemberName}</span>
                      </div>
                      {asset.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">{asset.notes}</div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-bold text-white text-sm font-tabular">
                          {formatINR(asset.currentValue)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-tabular">
                          Cost: {formatINR(asset.investedAmount)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteAsset(asset.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Add Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Asset Category
                  </label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="DEBT_FD">Bank Fixed Deposit (FD)</option>
                    <option value="PPF">Public Provident Fund (PPF)</option>
                    <option value="EPF">Employees Provident Fund (EPF / VPF)</option>
                    <option value="GOLD_SGB">Sovereign Gold Bond / Physical Gold</option>
                    <option value="REAL_ESTATE">Real Estate / Land / Property</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assign to Family Member
                  </label>
                  <select
                    value={familyMemberId}
                    onChange={(e) => setFamilyMemberId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.relationship})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Asset / Deposit Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. SBI 5-Yr Tax Saver FD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Institution / Bank / Issuer
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. State Bank of India"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Invested Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={investedAmount}
                    onChange={(e) => setInvestedAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 500000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Current Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 580000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 7.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Maturity Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account / Folio Reference
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. ****8901"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Compounding Terms
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Quarterly compounding, renews automatically."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20"
                >
                  Save Asset
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
