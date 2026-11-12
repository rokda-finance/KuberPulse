import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  FamilyMember,
  Holding,
  ManualAsset,
  FinancialGoal,
  CashflowMonth,
  ImportBatch,
  KiteAccountStatus,
} from '../src/types/index.ts';
import {
  INITIAL_FAMILY_MEMBERS,
  INITIAL_HOLDINGS,
  INITIAL_MANUAL_ASSETS,
  INITIAL_GOALS,
  INITIAL_CASHFLOWS,
  INITIAL_KITE_STATUS,
} from '../src/lib/sampleData.ts';

export interface PersistedKiteCredentials {
  apiKeyEncrypted?: string;
  apiSecretEncrypted?: string;
  accessTokenEncrypted?: string;
}

export interface LedgerDatabase {
  version: number;
  updatedAt: string;
  familyMembers: FamilyMember[];
  holdings: Holding[];
  manualAssets: ManualAsset[];
  goals: FinancialGoal[];
  cashflows: CashflowMonth[];
  importBatches: ImportBatch[];
  kiteStatus: KiteAccountStatus;
  kiteCredentials?: PersistedKiteCredentials;
}

export function resolveDataDir(): string {
  if (process.env.KUBERPULSE_DATA_DIR) {
    return process.env.KUBERPULSE_DATA_DIR;
  }
  return path.join(os.homedir(), '.kuberpulse');
}

function createInitialDatabase(): LedgerDatabase {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    familyMembers: INITIAL_FAMILY_MEMBERS,
    holdings: INITIAL_HOLDINGS,
    manualAssets: INITIAL_MANUAL_ASSETS,
    goals: INITIAL_GOALS,
    cashflows: INITIAL_CASHFLOWS,
    importBatches: [
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
    ],
    kiteStatus: INITIAL_KITE_STATUS,
  };
}

export function loadDatabase(dataDir = resolveDataDir()): LedgerDatabase {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'kuberpulse-ledger.json');

  if (!fs.existsSync(dbPath)) {
    const initial = createInitialDatabase();
    saveDatabase(initial, dataDir);
    return initial;
  }

  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(raw) as LedgerDatabase;
    return parsed;
  } catch {
    const fallback = createInitialDatabase();
    saveDatabase(fallback, dataDir);
    return fallback;
  }
}

/**
 * Atomic write (write to temp file then rename) to prevent ledger corruption on crash.
 */
export function saveDatabase(db: LedgerDatabase, dataDir = resolveDataDir()): void {
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'kuberpulse-ledger.json');
  const tmpPath = path.join(dataDir, `kuberpulse-ledger.${process.pid}.tmp`);

  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpPath, dbPath);
}

export function resetDatabase(dataDir = resolveDataDir()): LedgerDatabase {
  const fresh = createInitialDatabase();
  saveDatabase(fresh, dataDir);
  return fresh;
}
