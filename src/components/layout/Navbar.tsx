import React, { useState } from 'react';
import {
  Wallet,
  RefreshCw,
  UploadCloud,
  PlusCircle,
  Database,
  History,
  ShieldCheck,
  AlertCircle,
  Users,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { FamilyMember, KiteAccountStatus } from '../../types';
import { formatINR } from '../../lib/formatters';

interface NavbarProps {
  totalNetWorth: number;
  familyMembers: FamilyMember[];
  selectedMemberId: string | 'ALL';
  onSelectMember: (id: string | 'ALL') => void;
  kiteStatus: KiteAccountStatus;
  isSyncingKite: boolean;
  onSyncKite: () => void;
  onOpenKiteModal: () => void;
  onOpenImportModal: () => void;
  onOpenManualModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenSchemaModal: () => void;
  onOpenAddMemberModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalNetWorth,
  familyMembers,
  selectedMemberId,
  onSelectMember,
  kiteStatus,
  isSyncingKite,
  onSyncKite,
  onOpenKiteModal,
  onOpenImportModal,
  onOpenManualModal,
  onOpenHistoryModal,
  onOpenSchemaModal,
  onOpenAddMemberModal,
}) => {
  const [memberMenuOpen, setMemberMenuOpen] = useState(false);

  const activeMember = familyMembers.find((m) => m.id === selectedMemberId);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Kuber<span className="text-emerald-400">Pulse</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  India Wealth
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Unified Multi-Broker & Family Ledger
              </p>
            </div>
          </div>

          {/* Quick Net Worth Ticker */}
          <div className="hidden lg:flex items-center px-3.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg">
            <span className="text-xs text-slate-400 mr-2">Family Net Worth:</span>
            <span className="text-sm font-bold text-white font-tabular">
              {formatINR(totalNetWorth)}
            </span>
          </div>

          {/* Controls: Family Switcher, Kite Status, Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Family Member Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMemberMenuOpen(!memberMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[120px] truncate">
                  {selectedMemberId === 'ALL'
                    ? 'All Family'
                    : activeMember?.name.split(' ')[0] || 'Member'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {memberMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setMemberMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Portfolio View
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectMember('ALL')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                      selectedMemberId === 'ALL'
                        ? 'text-emerald-400 font-semibold bg-emerald-950/30'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Combined Family Portfolio</span>
                    </span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      All
                    </span>
                  </button>

                  {familyMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => onSelectMember(member.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition-colors ${
                        selectedMemberId === member.id
                          ? 'text-emerald-400 font-semibold bg-emerald-950/30'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: member.colorHex }}
                        ></span>
                        <span className="truncate">{member.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {member.relationship.toLowerCase()}
                      </span>
                    </button>
                  ))}

                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={onOpenAddMemberModal}
                      className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800/80 flex items-center space-x-2"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Family Member</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Kite Connect Status & Live Sync Button */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={onOpenKiteModal}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                  kiteStatus.connected && !kiteStatus.isExpired
                    ? 'bg-slate-900 border-emerald-500/30 text-emerald-300 hover:bg-slate-800'
                    : 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-950/70'
                }`}
                title="Zerodha Kite Connect status"
              >
                {kiteStatus.connected && !kiteStatus.isExpired ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden md:inline font-medium">Kite Live</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline font-medium">Kite Session Expired</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onSyncKite}
                disabled={isSyncingKite}
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                title="Sync Zerodha Kite now"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncingKite ? 'animate-spin text-emerald-400' : ''}`}
                />
                <span className="hidden sm:inline">Sync Kite</span>
              </button>
            </div>

            {/* Smart Import Button */}
            <button
              type="button"
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            {/* Quick Actions (Manual Asset, History, Architecture) */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={onOpenManualModal}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Add Non-broker asset (FD, PPF, Gold, Real Estate)"
              >
                <PlusCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenHistoryModal}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Batch Import Audit & 1-Click Rollback"
              >
                <History className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenSchemaModal}
                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="View Database Architecture & Prisma Schema"
              >
                <Database className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
