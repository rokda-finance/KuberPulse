// Types for KuberPulse Indian Wealth Management

export type AssetType =
  | 'EQUITY'
  | 'MUTUAL_FUND'
  | 'DEBT_FD'
  | 'PPF'
  | 'EPF'
  | 'GOLD_SGB'
  | 'REAL_ESTATE'
  | 'CASH_MARGIN';

export type MarketCap =
  | 'LARGE_CAP'
  | 'MID_CAP'
  | 'SMALL_CAP'
  | 'MICRO_CAP'
  | 'GOVERNMENT_SOVEREIGN'
  | 'NOT_APPLICABLE';

export type BrokerPlatform =
  | 'ZERODHA_KITE'
  | 'ZERODHA_CONSOLE'
  | 'GROWW'
  | 'UPSTOX'
  | 'ANGEL_ONE'
  | 'KUVERA'
  | 'CAMS_CAS'
  | 'KFINTECH_CAS'
  | 'MANUAL_BANK_FD'
  | 'MANUAL_GOVT_SCHEME'
  | 'MANUAL_PHYSICAL';

export type FamilyRole = 'SELF' | 'SPOUSE' | 'PARENT' | 'CHILD' | 'HUF';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: FamilyRole;
  panNumber?: string;
  colorHex: string;
}

export interface Holding {
  id: string;
  isin: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  sector: string;
  marketCap: MarketCap;
  quantity: number;
  averagePrice: number;
  ltp: number;
  dayChange: number;
  dayChangePercent: number;
  investedValue: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  platform: BrokerPlatform;
  brokerClientId?: string;
  familyMemberId: string;
  familyMemberName?: string;
  folioNumber?: string;
  importBatchId?: string;
  lastSyncedAt: string;
}

export interface BrokerBreakdownItem {
  platform: BrokerPlatform;
  quantity: number;
  averagePrice: number;
  investedValue: number;
  currentValue: number;
  familyMemberName: string;
  folioNumber?: string;
}

export interface ConsolidatedAsset {
  isin: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  sector: string;
  marketCap: MarketCap;
  ltp: number;
  dayChange: number;
  dayChangePercent: number;
  totalQuantity: number;
  weightedAvgPrice: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  portfolioWeightPercent: number;
  brokers: BrokerBreakdownItem[];
  familyMemberNames: string[];
}

export interface AllocationSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PortfolioSummary {
  totalNetWorth: number;
  totalInvested: number;
  totalCurrent: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  xirr: number;
  availableCash: number;
  assetAllocation: AllocationSlice[];
  marketCapAllocation: AllocationSlice[];
  sectorAllocation: AllocationSlice[];
  brokerAllocation: AllocationSlice[];
  familyAllocation: AllocationSlice[];
}

export interface KiteAccountStatus {
  connected: boolean;
  apiKey: string;
  clientId: string;
  clientName: string;
  accountType: 'EQUITY_COMMODITY' | 'INVESTOR';
  availableCash: number;
  usedMargin: number;
  lastSyncedAt: string;
  expiresAt: string;
  isExpired: boolean;
  activePositionsCount: number;
  holdingsCount: number;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  fileSize: number;
  platform: BrokerPlatform;
  recordCount: number;
  timestamp: string;
  status: 'ACTIVE' | 'ROLLED_BACK';
  holdingIds: string[];
  familyMemberId: string;
}

export interface ManualAsset {
  id: string;
  assetType: 'DEBT_FD' | 'PPF' | 'EPF' | 'GOLD_SGB' | 'REAL_ESTATE';
  name: string;
  institutionName: string;
  accountNumber?: string;
  investedAmount: number;
  currentValue: number;
  interestRate?: number;
  startDate?: string;
  maturityDate?: string;
  notes?: string;
  familyMemberId: string;
  familyMemberName?: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  category: 'RETIREMENT' | 'HOUSE' | 'EDUCATION' | 'EMERGENCY' | 'VEHICLE' | 'WEALTH';
  targetAmount: number;
  currentSaved: number;
  targetDate: string;
  linkedAssetIsins: string[];
  monthlySip: number;
  color: string;
}

export interface CashflowExpenseItem {
  category: string;
  amount: number;
}

export interface CashflowMonth {
  monthYear: string; // e.g. "2026-11"
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number; // in %
  categories: CashflowExpenseItem[];
}
