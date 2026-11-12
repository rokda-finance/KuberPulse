import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Users,
  Building,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  parseInvestmentFile,
  generateSampleCsv,
  ParsedHoldingRecord,
} from '../../services/importParser';
import { BrokerPlatform, FamilyMember, Holding } from '../../types';
import { formatINR } from '../../lib/formatters';

interface SmartImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  familyMembers: FamilyMember[];
  onCommitImport: (
    records: ParsedHoldingRecord[],
    fileName: string,
    fileSize: number,
    platform: BrokerPlatform,
    targetMemberId: string
  ) => void;
}

export const SmartImportWizard: React.FC<SmartImportWizardProps> = ({
  isOpen,
  onClose,
  familyMembers,
  onCommitImport,
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [selectedPlatform, setSelectedPlatform] = useState<BrokerPlatform>('ZERODHA_CONSOLE');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    familyMembers[0]?.id || 'fam_self'
  );
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<ParsedHoldingRecord[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseErrors([]);

    try {
      const res = await parseInvestmentFile(selectedFile, selectedPlatform);
      setParsedRecords(res.records);
      setParseErrors(res.errors);
      setStep('preview');
    } catch (err: any) {
      setParseErrors([err.message || 'Failed to parse file.']);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadSample = (type: 'ZERODHA' | 'GROWW' | 'UPSTOX' | 'CAMS') => {
    const csvData = generateSampleCsv(type);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sample_${type}_Holdings.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (!file || parsedRecords.length === 0) return;
    onCommitImport(
      parsedRecords,
      file.name,
      file.size,
      selectedPlatform,
      selectedMemberId
    );
    onClose();
  };

  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Smart Import Engine</h2>
              <p className="text-xs text-slate-400">
                Consolidate CSV, Excel, or CAMS statements across family accounts
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

        {/* Wizard Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 'upload' ? (
            <>
              {/* Target Family Member & Platform Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Family Member */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Assign to Family Member:
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.relationship})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Holdings will be tagged under this person's tax PAN.
                  </p>
                </div>

                {/* Source Platform */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Source Platform / Format:
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ZERODHA_CONSOLE">Zerodha Console Holdings / Tax P&L</option>
                    <option value="GROWW">Groww Holdings Export (.csv/.xlsx)</option>
                    <option value="UPSTOX">Upstox Portfolio Export</option>
                    <option value="CAMS_CAS">CAMS / KFintech CAS Mutual Funds</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Auto-normalizes columns, weighted avg prices, and ISINs.
                  </p>
                </div>
              </div>

              {/* Drag-and-Drop Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelected(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.tsv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Drop your portfolio file here, or{' '}
                      <span className="text-emerald-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports .CSV and Excel .XLSX files (Zerodha Console, Groww, Upstox, CAMS)
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample Files for Immediate Testing */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quick Test Samples (Download & Drop Above):</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('ZERODHA')}
                    className="flex items-center justify-center space-x-1.5 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3 text-blue-400" />
                    <span>Zerodha Console</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('GROWW')}
                    className="flex items-center justify-center space-x-1.5 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3 text-teal-400" />
                    <span>Groww Holdings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('UPSTOX')}
                    className="flex items-center justify-center space-x-1.5 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3 text-purple-400" />
                    <span>Upstox Scrip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSample('CAMS')}
                    className="flex items-center justify-center space-x-1.5 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 hover:text-white transition-colors"
                  >
                    <Download className="w-3 h-3 text-amber-400" />
                    <span>CAMS CAS (MF)</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Step 2: Verification & Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">File: </span>
                  <span className="font-semibold text-white">{file?.name}</span>
                  <span className="text-slate-500 ml-2">
                    ({parsedRecords.length} assets parsed)
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready to Merge</span>
                </div>
              </div>

              {parseErrors.length > 0 && (
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Warnings while parsing:</span>
                  </div>
                  {parseErrors.slice(0, 3).map((err, idx) => (
                    <div key={idx} className="text-[11px] text-amber-400/80">
                      • {err}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Symbol / ISIN</th>
                      <th className="py-2.5 px-3">Asset Name</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Buy Price</th>
                      <th className="py-2.5 px-3 text-right">Current Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div>{r.symbol}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.isin}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-[11px] truncate max-w-[200px]">
                          {r.name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-tabular text-slate-200">
                          {r.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-tabular text-slate-300">
                          {formatINR(r.averagePrice, true)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-tabular font-semibold text-emerald-400">
                          {formatINR(r.quantity * r.ltp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Target Profile: <strong className="text-white">{selectedMember?.name}</strong>
                </span>
                <span>
                  Source: <strong className="text-emerald-400">{selectedPlatform}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          {step === 'upload' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <div className="text-xs text-slate-500">
                Automated reconciliation & ISIN matching on submit
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Back to File Upload
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
              >
                <span>Commit & Reconcile ({parsedRecords.length} Assets)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
