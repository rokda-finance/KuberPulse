# Changelog

All notable changes to **KuberPulse** will be documented in this file.

## [v1.0.0-alpha.1] - First Alpha Release

> **Status:** Alpha Pre-Release (`v1.0.0-alpha.1`). Intended for early testing, self-hosted demos, and feedback before Beta/GA.

### Included in Alpha v1
- **Unified Multi-Broker Wealth Dashboard**:
  - Real-time KPI summary cards (Total Net Worth, Invested Capital, Unrealized Gain, Day's Change, Blended XIRR, Liquid Cash Margin) with Indian `en-IN` Rupee (`₹`) and Lakh/Crore formatting.
  - Interactive Recharts donut breakdowns by Asset Class, Market Cap, Sector Exposure, Broker/Platform, and Family Share.
- **ISIN-Based Holdings Consolidation**:
  - Merges overlapping holdings across Zerodha Kite, Groww, and Upstox using weighted-average buy price math and expandable per-broker ledger rows.
- **Smart Import Wizard & 1-Click Rollback**:
  - CSV/XLSX parser (`papaparse` + `xlsx`) supporting Zerodha Console, Groww, Upstox, and CAMS/KFintech CAS formats with pre-commit reconciliation previews, sample file downloads, and 1-click batch undo.
- **Zerodha Kite Connect v3 Integration**:
  - OAuth login flow, server-side SHA-256 request token checksum exchange, live holdings & margins sync, and sandbox fallback mode.
- **Multi-PAN Family Profiles, Non-Broker Assets, Goals & Cash Flow**:
  - Household filtering across `Self`, `Spouse`, `Parent`, `Child`, and `HUF` profiles.
  - Dedicated trackers for Fixed Deposits, PPF/EPF, Sovereign Gold Bonds (SGB), Real Estate, FIRE/Education milestones, and monthly savings velocity.
- **Persistent Self-Hosted Backend & Desktop Packaging**:
  - Express + Vite unified server (`server.ts`) storing atomic JSON ledger data locally (`~/.kuberpulse/kuberpulse-ledger.json`) with AES-256-GCM encrypted Kite credentials (`server/crypto.ts`).
  - Electron desktop wrapper (`electron/main.cjs`) and `electron-builder.yml` supporting Windows (`.exe` NSIS/Portable), macOS (`.dmg`/`.zip`), and Linux (`.AppImage`/`.deb`).
  - Automated GitHub Actions release pipeline (`.github/workflows/release.yml`) for cross-platform Alpha pre-release builds.

### Known Alpha Limitations
- Active runtime uses an atomic local JSON ledger (`~/.kuberpulse/kuberpulse-ledger.json`); the PostgreSQL Prisma schema (`prisma/schema.prisma`) is included as a relational blueprint for upcoming multi-tenant cloud sync.
- Alpha desktop installers built via GitHub Actions are unsigned (`CSC_IDENTITY_AUTO_DISCOVERY=false`), so Windows SmartScreen or macOS Gatekeeper may prompt on first launch.
