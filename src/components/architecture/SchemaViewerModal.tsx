import React, { useState } from 'react';
import { X, Database, Copy, Check, Server, Shield, Layers, Code2 } from 'lucide-react';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRISMA_SCHEMA_TEXT = `// Prisma Database Schema for KuberPulse - Unified Indian Wealth Management
// Designed for PostgreSQL / Supabase with relational ledger and multi-family support

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum AssetType {
  EQUITY
  MUTUAL_FUND
  DEBT_FD
  PPF
  EPF
  GOLD_SGB
  REAL_ESTATE
  CASH_MARGIN
}

enum MarketCap {
  LARGE_CAP
  MID_CAP
  SMALL_CAP
  MICRO_CAP
  GOVERNMENT_SOVEREIGN
  NOT_APPLICABLE
}

enum BrokerPlatform {
  ZERODHA_KITE
  ZERODHA_CONSOLE
  GROWW
  UPSTOX
  ANGEL_ONE
  KUVERA
  CAMS_CAS
  KFINTECH_CAS
  MANUAL_BANK_FD
  MANUAL_GOVT_SCHEME
  MANUAL_PHYSICAL
}

enum FamilyRole {
  SELF
  SPOUSE
  PARENT
  CHILD
  HUF
  OTHER
}

// 1. Users & Family Sub-Accounts (Multi-PAN Support)
model User {
  id              String            @id @default(uuid())
  email           String            @unique
  name            String
  panNumber       String?
  currency        String            @default("INR")
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  familyMembers   FamilyMember[]
  brokerConnections BrokerConnection[]
  holdings        Holding[]
  transactions    Transaction[]
  importLogs      ImportLog[]
  manualAssets    ManualAsset[]
  financialGoals  FinancialGoal[]
  cashflows       CashflowRecord[]
}

model FamilyMember {
  id              String         @id @default(uuid())
  userId          String
  name            String
  relationship    FamilyRole     @default(SELF)
  panNumber       String?
  colorHex        String         @default("#10b981")
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  holdings        Holding[]
  manualAssets    ManualAsset[]
  transactions    Transaction[]
}

// 2. Broker Connection (Encrypted Kite OAuth Tokens at Rest)
model BrokerConnection {
  id              String         @id @default(uuid())
  userId          String
  broker          BrokerPlatform @default(ZERODHA_KITE)
  brokerClientId  String
  accountNickName String         @default("Primary Zerodha")
  apiKeyEncrypted String?        // AES-256-GCM
  apiSecretEncrypted String?
  accessTokenEncrypted String?   // Daily 6:00 AM IST cycle
  tokenExpiresAt  DateTime?
  lastSyncedAt    DateTime?
  status          String         @default("DISCONNECTED")
  availableMargin Decimal        @default(0.0) @db.Decimal(14, 2)
  usedMargin      Decimal        @default(0.0) @db.Decimal(14, 2)
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  holdings        Holding[]
}

// 3. Master Asset Catalog (ISIN & Ticker Canonical Mapping)
model Asset {
  id              String         @id @default(uuid())
  isin            String         @unique // e.g. INE002A01018
  symbol          String         // e.g. "RELIANCE"
  exchange        String         @default("NSE")
  name            String
  assetType       AssetType      @default(EQUITY)
  sector          String         @default("Diversified")
  marketCap       MarketCap      @default(LARGE_CAP)
  lastTradedPrice Decimal        @default(0.0) @db.Decimal(12, 2)
  dayChange       Decimal        @default(0.0) @db.Decimal(12, 2)
  dayChangePercent Decimal       @default(0.0) @db.Decimal(6, 2)
  holdings        Holding[]
  transactions    Transaction[]
}

// 4. Holdings Ledger (Relational Position per User, Account & Member)
model Holding {
  id                  String            @id @default(uuid())
  userId              String
  familyMemberId      String
  assetId             String
  brokerConnectionId  String?
  platform            BrokerPlatform
  folioNumber         String?
  quantity            Decimal           @db.Decimal(14, 4)
  averageBuyPrice     Decimal           @db.Decimal(12, 2)
  investedValue       Decimal           @db.Decimal(14, 2)
  currentValue        Decimal           @db.Decimal(14, 2)
  unrealizedPnl       Decimal           @db.Decimal(14, 2)
  importBatchId       String?
  lastSyncedAt        DateTime          @default(now())

  user                User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  familyMember        FamilyMember      @relation(fields: [familyMemberId], references: [id], onDelete: Cascade)
  asset               Asset             @relation(fields: [assetId], references: [id], onDelete: Cascade)
  importLog           ImportLog?        @relation(fields: [importBatchId], references: [id], onDelete: SetNull)
}

// 5. Import Audit & 1-Click Rollback Logs
model ImportLog {
  id              String         @id @default(uuid())
  userId          String
  fileName        String
  fileSize        Int
  platform        BrokerPlatform
  recordCount     Int
  status          String         @default("SUCCESS")
  createdAt       DateTime       @default(now())
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  holdings        Holding[]
  transactions    Transaction[]
}`;

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'architecture'>('schema');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PRISMA_SCHEMA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/60">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Prisma Schema & Relational Architecture
              </h2>
              <p className="text-xs text-slate-400">
                PostgreSQL Ledger Design • ISIN Deduplication • Encrypted Kite Auth
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

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 justify-between items-center">
          <div className="flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'schema'
                  ? 'border-purple-500 text-purple-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              prisma/schema.prisma
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'architecture'
                  ? 'border-purple-500 text-purple-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Ledger Architecture & Deduplication Specs
            </button>
          </div>

          {activeTab === 'schema' && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Schema</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs">
          {activeTab === 'schema' ? (
            <pre className="bg-slate-950 p-4 rounded-xl text-slate-300 overflow-x-auto border border-slate-800 leading-relaxed">
              <code>{PRISMA_SCHEMA_TEXT}</code>
            </pre>
          ) : (
            <div className="space-y-6 font-sans text-slate-300">
              {/* Architecture Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
                    <Layers className="w-4 h-4" />
                    <span>ISIN Deduplication Engine</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Assets are mapped to canonical 12-character ISINs (e.g. <code>INE002A01018</code> for Reliance). When holdings exist in multiple brokers (e.g. 120 in Zerodha, 50 in Groww), the engine computes weighted average buy prices:
                    <br />
                    <code>Avg = Σ(Qty_i × Price_i) / Σ(Qty_i)</code>
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs">
                    <Shield className="w-4 h-4" />
                    <span>Zero-Knowledge Token Security</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zerodha Kite API secrets and daily access tokens are encrypted at rest using AES-256-GCM. Never logs sensitive credentials. Enforces Zerodha's mandatory daily 6:00 AM IST token expiration cycle.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-purple-400 font-semibold text-xs">
                    <Server className="w-4 h-4" />
                    <span>Transactional Batch Rollbacks</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every uploaded CSV/Excel or CAMS statement creates an <code>ImportLog</code> entry with a unique batch UUID. Users can 1-click rollback any import to instantly delete all associated holdings without corrupting the historical ledger.
                  </p>
                </div>
              </div>

              {/* Multi-Family Tagging */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-sm">
                  Family Multi-Profile & Multi-PAN Tax Segregation
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Indian families often invest under distinct PAN cards for tax efficiency (Section 112A LTCG exemptions, 80C limits, senior citizen tax slabs). KuberPulse maintains relational <code>FamilyMember</code> records. Each asset holding tracks both the broker source and the family member owner, allowing both individual tax filing views and a single unified net worth balance sheet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
