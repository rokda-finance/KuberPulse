import React from 'react';
import { X, History, RotateCcw, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { ImportBatch, FamilyMember } from '../../types';
import { formatDate } from '../../lib/formatters';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: ImportBatch[];
  familyMembers: FamilyMember[];
  onRollbackBatch: (batchId: string) => void;
}

export const ImportHistoryModal: React.FC<ImportHistoryModalProps> = ({
  isOpen,
  onClose,
  batches,
  familyMembers,
  onRollbackBatch,
}) => {
  if (!isOpen) return null;

  const memberMap = new Map(familyMembers.map((m) => [m.id, m.name]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Audit & Rollback Logs</h2>
              <p className="text-xs text-slate-400">
                1-Click Rollback for any imported CSV / Excel batch
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {batches.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No manual import batches yet.</p>
              <p className="text-xs mt-1">
                When you import files via the Smart Import Engine, they will appear here with instant undo capability.
              </p>
            </div>
          ) : (
            batches.map((batch) => {
              const isRolledBack = batch.status === 'ROLLED_BACK';
              const memberName = memberMap.get(batch.familyMemberId) || 'Family Member';

              return (
                <div
                  key={batch.id}
                  className={`border rounded-xl p-4 transition-all ${
                    isRolledBack
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-xs sm:text-sm">
                          {batch.fileName}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {batch.platform}
                        </span>
                        {isRolledBack ? (
                          <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.5 rounded font-medium">
                            Rolled Back
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-medium">
                            Active Ledger
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-400 flex flex-wrap items-center gap-2">
                        <span>Owner: <strong className="text-slate-300">{memberName}</strong></span>
                        <span>•</span>
                        <span>{batch.recordCount} records</span>
                        <span>•</span>
                        <span>{formatDate(batch.timestamp)}</span>
                      </div>
                    </div>

                    {!isRolledBack && (
                      <button
                        type="button"
                        onClick={() => onRollbackBatch(batch.id)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/80 rounded-lg text-xs font-medium transition-colors"
                        title="Remove all holdings from this batch"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo / Rollback</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
