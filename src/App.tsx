/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Navbar } from './components/layout/Navbar';
import { UnifiedDashboard } from './components/dashboard/UnifiedDashboard';
import { HoldingsTable } from './components/holdings/HoldingsTable';
import { SmartImportWizard } from './components/import/SmartImportWizard';
import { ImportHistoryModal } from './components/import/ImportHistoryModal';
import { KiteConnectModal } from './components/kite/KiteConnectModal';
import { ManualAssetModal } from './components/manual/ManualAssetModal';
import { GoalPlanner } from './components/goals/GoalPlanner';
import { CashFlowTracker } from './components/cashflow/CashFlowTracker';
import { SchemaViewerModal } from './components/architecture/SchemaViewerModal';
import { AddFamilyMemberModal } from './components/family/AddFamilyMemberModal';

import {
  INITIAL_FAMILY_MEMBERS,
  INITIAL_HOLDINGS,
  INITIAL_MANUAL_ASSETS,
  INITIAL_GOALS,
  INITIAL_CASHFLOWS,
  INITIAL_KITE_STATUS,
} from './lib/sampleData';
import {
  Holding,
  ManualAsset,
  FinancialGoal,
  CashflowMonth,
  FamilyMember,
  ImportBatch,
  KiteAccountStatus,
  BrokerPlatform,
} from './types';
import { consolidateHoldings, computePortfolioSummary } from './lib/financialMath';
import { syncKitePortfolio } from './services/kiteConnect';
import { ParsedHoldingRecord } from './services/importParser';
import { CheckCircle2, RotateCcw, AlertCircle, Info } from 'lucide-react';

export default function App() {
  // Family & Member Selection
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(INITIAL_FAMILY_MEMBERS);
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'ALL'>('ALL');

  // Core Ledger State
  const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
  const [manualAssets, setManualAssets] = useState<ManualAsset[]>(INITIAL_MANUAL_ASSETS);
  const [goals, setGoals] = useState<FinancialGoal[]>(INITIAL_GOALS);
  const [cashflows, setCashflows] = useState<CashflowMonth[]>(INITIAL_CASHFLOWS);

  // Broker Status & Live Sync
  const [kiteStatus, setKiteStatus] = useState<KiteAccountStatus>(INITIAL_KITE_STATUS);
  const [isSyncingKite, setIsSyncingKite] = useState(false);

  // Import Batches for Audit & Rollback
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([
    {
      id: 'batch_seed_groww',
      fileName: 'Groww_Holdings_Priya_Q3.csv',
      fileSize: 4210,
      platform: 'GROWW',
      recordCount: 2,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'ACTIVE',
      holdingIds: ['h_rel_groww', 'h_ppfas_groww'],
      familyMemberId: 'fam_spouse',
    },
  ]);

  // Active Dashboard View Tab
  const [activeTab, setActiveTab] = useState<'holdings' | 'goals' | 'cashflow' | 'manual'>('holdings');

  // Modals
  const [isKiteModalOpen, setIsKiteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered holdings based on selected family member
  const activeHoldings = useMemo(() => {
    if (selectedMemberId === 'ALL') return holdings;
    return holdings.filter((h) => h.familyMemberId === selectedMemberId);
  }, [holdings, selectedMemberId]);

  const activeManualAssets = useMemo(() => {
    if (selectedMemberId === 'ALL') return manualAssets;
    return manualAssets.filter((m) => m.familyMemberId === selectedMemberId);
  }, [manualAssets, selectedMemberId]);

  // Consolidated holdings (deduplicating multi-broker holdings across family)
  const consolidatedAssets = useMemo(() => {
    return consolidateHoldings(activeHoldings, familyMembers);
  }, [activeHoldings, familyMembers]);

  // Computed Portfolio Summary (Total Net Worth, XIRR, Allocation slices)
  const portfolioSummary = useMemo(() => {
    const cash = selectedMemberId === 'ALL' || selectedMemberId === 'fam_self'
      ? kiteStatus.availableCash
      : 0;
    return computePortfolioSummary(activeHoldings, activeManualAssets, cash, familyMembers);
  }, [activeHoldings, activeManualAssets, kiteStatus.availableCash, familyMembers, selectedMemberId]);

  // 1. Kite Live Sync Handler
  const handleSyncKite = async () => {
    setIsSyncingKite(true);
    try {
      const res = await syncKitePortfolio({ apiKey: kiteStatus.apiKey }, true);
      setKiteStatus(res.accountStatus);

      // Merge updated live prices into Kite holdings
      setHoldings((prev) => {
        const nonKiteHoldings = prev.filter((h) => h.platform !== 'ZERODHA_KITE');
        return [...res.holdings, ...nonKiteHoldings];
      });

      showToast('Zerodha Kite Connect live quotes and margins synced successfully.');
    } catch (err: any) {
      showToast('Kite Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSyncingKite(false);
    }
  };

  // 2. Commit Imported File Batch
  const handleCommitImport = (
    records: ParsedHoldingRecord[],
    fileName: string,
    fileSize: number,
    platform: BrokerPlatform,
    targetMemberId: string
  ) => {
    const batchId = `batch_${Date.now()}`;
    const targetMember = familyMembers.find((m) => m.id === targetMemberId);
    const newHoldingIds: string[] = [];

    const newHoldings: Holding[] = records.map((rec, idx) => {
      const hId = `h_imp_${batchId}_${idx}`;
      newHoldingIds.push(hId);

      const investedValue = rec.quantity * rec.averagePrice;
      const currentValue = rec.quantity * rec.ltp;
      const unrealizedPnl = currentValue - investedValue;
      const unrealizedPnlPercent = investedValue > 0 ? (unrealizedPnl / investedValue) * 100 : 0;

      return {
        id: hId,
        isin: rec.isin,
        symbol: rec.symbol,
        name: rec.name,
        assetType: rec.assetType,
        sector: rec.sector,
        marketCap: rec.marketCap,
        quantity: rec.quantity,
        averagePrice: rec.averagePrice,
        ltp: rec.ltp,
        dayChange: Number((rec.ltp * 0.005).toFixed(2)),
        dayChangePercent: 0.5,
        investedValue,
        currentValue,
        unrealizedPnl,
        unrealizedPnlPercent,
        platform: rec.platform,
        familyMemberId: targetMemberId,
        familyMemberName: targetMember?.name || 'Self',
        folioNumber: rec.folioNumber,
        importBatchId: batchId,
        lastSyncedAt: new Date().toISOString(),
      };
    });

    setHoldings((prev) => [...prev, ...newHoldings]);

    const newBatch: ImportBatch = {
      id: batchId,
      fileName,
      fileSize,
      platform,
      recordCount: records.length,
      timestamp: new Date().toISOString(),
      status: 'ACTIVE',
      holdingIds: newHoldingIds,
      familyMemberId: targetMemberId,
    };

    setImportBatches((prev) => [newBatch, ...prev]);
    showToast(`Successfully imported ${records.length} assets from ${fileName}`);
  };

  // 3. Rollback / Undo Import Batch
  const handleRollbackBatch = (batchId: string) => {
    const targetBatch = importBatches.find((b) => b.id === batchId);
    if (!targetBatch) return;

    // Remove holdings tied to this batch
    setHoldings((prev) => prev.filter((h) => h.importBatchId !== batchId));

    // Update batch status
    setImportBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: 'ROLLED_BACK' as const } : b))
    );

    showToast(`Batch "${targetBatch.fileName}" has been rolled back. Ledger restored.`);
  };

  // 4. Manual Asset CRUD
  const handleAddManualAsset = (newAsset: Omit<ManualAsset, 'id'>) => {
    const id = `m_${Date.now()}`;
    setManualAssets((prev) => [{ ...newAsset, id }, ...prev]);
    showToast(`Added ${newAsset.name} to wealth ledger.`);
  };

  const handleDeleteManualAsset = (id: string) => {
    setManualAssets((prev) => prev.filter((m) => m.id !== id));
    showToast('Non-broker asset removed from portfolio.');
  };

  // 5. Goals CRUD
  const handleAddGoal = (newGoal: Omit<FinancialGoal, 'id'>) => {
    const id = `g_${Date.now()}`;
    setGoals((prev) => [...prev, { ...newGoal, id }]);
    showToast(`Goal "${newGoal.title}" created.`);
  };

  // 6. Cashflow CRUD
  const handleAddCashflow = (newCashflow: CashflowMonth) => {
    setCashflows((prev) => [
      newCashflow,
      ...prev.filter((c) => c.monthYear !== newCashflow.monthYear),
    ]);
    showToast(`Cash flow recorded for ${newCashflow.monthYear}`);
  };

  // 7. Add Family Member
  const handleAddFamilyMember = (newMember: Omit<FamilyMember, 'id'>) => {
    const id = `fam_${Date.now()}`;
    setFamilyMembers((prev) => [...prev, { ...newMember, id }]);
    showToast(`Added family member: ${newMember.name}`);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Navigation */}
      <Navbar
        totalNetWorth={portfolioSummary.totalNetWorth}
        familyMembers={familyMembers}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        kiteStatus={kiteStatus}
        isSyncingKite={isSyncingKite}
        onSyncKite={handleSyncKite}
        onOpenKiteModal={() => setIsKiteModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Unified Dashboard (Summary Cards + Asset Allocation Charts + View Switcher) */}
        <UnifiedDashboard
          summary={portfolioSummary}
          familyMembers={familyMembers}
          selectedMemberId={selectedMemberId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          holdingsCount={consolidatedAssets.length}
          goalsCount={goals.length}
          manualCount={activeManualAssets.length}
        />

        {/* Tab View Render */}
        {activeTab === 'holdings' && (
          <HoldingsTable
            consolidatedAssets={consolidatedAssets}
            selectedMemberId={selectedMemberId}
          />
        )}

        {activeTab === 'manual' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Non-Broker Assets (FD, PPF, Gold & Real Estate)</h3>
                <p className="text-xs text-slate-400">Fixed deposits and sovereign assets with maturity tracking</p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
              >
                + Add / Manage Assets
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeManualAssets.map((asset) => (
                <div key={asset.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">{asset.name}</span>
                    <span className="text-[10px] bg-slate-800 text-amber-400 border border-amber-900 px-2 py-0.5 rounded font-mono">
                      {asset.assetType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Institution: <span className="text-slate-200">{asset.institutionName}</span>
                    {asset.interestRate && ` • ${asset.interestRate}% p.a.`}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      Cost: <span className="font-tabular text-slate-300">₹{asset.investedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-sm font-bold text-white font-tabular">
                      ₹{asset.currentValue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <GoalPlanner
            goals={goals}
            holdings={activeHoldings}
            onAddGoal={handleAddGoal}
          />
        )}

        {activeTab === 'cashflow' && (
          <CashFlowTracker
            cashflows={cashflows}
            onAddCashflow={handleAddCashflow}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">KuberPulse</span>
            <span>•</span>
            <span>Institutional Indian Wealth Management & Multi-Broker Ledger</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              className="text-emerald-400 hover:underline"
            >
              PostgreSQL Prisma Schema
            </button>
            <button
              type="button"
              onClick={() => setIsKiteModalOpen(true)}
              className="hover:text-slate-300"
            >
              Zerodha Kite Connect v3
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="hover:text-slate-300"
            >
              Batch Rollbacks
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <KiteConnectModal
        isOpen={isKiteModalOpen}
        onClose={() => setIsKiteModalOpen(false)}
        kiteStatus={kiteStatus}
        isSyncing={isSyncingKite}
        onTriggerSync={handleSyncKite}
        onSimulateDemoSync={handleSyncKite}
      />

      <SmartImportWizard
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        familyMembers={familyMembers}
        onCommitImport={handleCommitImport}
      />

      <ManualAssetModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        manualAssets={manualAssets}
        familyMembers={familyMembers}
        onAddAsset={handleAddManualAsset}
        onDeleteAsset={handleDeleteManualAsset}
      />

      <ImportHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        batches={importBatches}
        familyMembers={familyMembers}
        onRollbackBatch={handleRollbackBatch}
      />

      <SchemaViewerModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <AddFamilyMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddFamilyMember}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 bg-slate-900 border border-emerald-500/50 rounded-xl shadow-2xl text-xs text-white animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
