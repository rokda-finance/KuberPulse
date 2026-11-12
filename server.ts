import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import {
  loadDatabase,
  saveDatabase,
  resetDatabase,
  resolveDataDir,
} from './server/storage.ts';
import { encryptSecret, decryptSecret } from './server/crypto.ts';
import { executeKiteSync } from './server/kiteApi.ts';
import { Holding, ImportBatch, ManualAsset, FinancialGoal, CashflowMonth, FamilyMember } from './src/types/index.ts';

export interface StartServerOptions {
  port?: number;
  host?: string;
  dataDir?: string;
  distDir?: string;
}

export async function startServer(options: StartServerOptions = {}): Promise<{
  server: http.Server;
  port: number;
  url: string;
}> {
  const port = options.port ?? Number(process.env.PORT || 3000);
  const host = options.host ?? process.env.HOST ?? '0.0.0.0';
  const dataDir = options.dataDir ?? resolveDataDir();
  const distDir = options.distDir ?? process.env.KUBERPULSE_DIST_DIR ?? path.resolve(process.cwd(), 'dist');

  process.env.KUBERPULSE_DATA_DIR = dataDir;

  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '10mb' }));

  // 1. Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, dataDir, mode: process.env.NODE_ENV || 'development' });
  });

  // 2. Load full persisted portfolio ledger (never exposing encrypted secrets)
  app.get('/api/state', (_req, res) => {
    const db = loadDatabase(dataDir);
    res.json({
      familyMembers: db.familyMembers,
      holdings: db.holdings,
      manualAssets: db.manualAssets,
      goals: db.goals,
      cashflows: db.cashflows,
      importBatches: db.importBatches,
      kiteStatus: db.kiteStatus,
    });
  });

  // 3. Commit imported CSV/XLSX batch
  app.post('/api/holdings/import', (req, res) => {
    const { holdings: incomingHoldings, batch } = req.body as {
      holdings: Holding[];
      batch: ImportBatch;
    };

    if (!Array.isArray(incomingHoldings) || !batch) {
      return res.status(400).json({ error: 'Invalid import payload' });
    }

    const db = loadDatabase(dataDir);
    db.holdings = [...db.holdings, ...incomingHoldings];
    db.importBatches = [batch, ...db.importBatches];
    saveDatabase(db, dataDir);

    return res.json({ ok: true, batch, addedCount: incomingHoldings.length });
  });

  // 4. 1-Click Rollback of an imported batch
  app.post('/api/import-batches/:id/rollback', (req, res) => {
    const batchId = req.params.id;
    const db = loadDatabase(dataDir);

    db.holdings = db.holdings.filter((h) => h.importBatchId !== batchId);
    db.importBatches = db.importBatches.map((b) =>
      b.id === batchId ? { ...b, status: 'ROLLED_BACK' } : b
    );
    saveDatabase(db, dataDir);

    return res.json({ ok: true, batchId });
  });

  // 5. Manual non-broker assets CRUD
  app.post('/api/manual-assets', (req, res) => {
    const asset = req.body as ManualAsset;
    if (!asset?.id || !asset?.name) {
      return res.status(400).json({ error: 'Invalid manual asset' });
    }
    const db = loadDatabase(dataDir);
    db.manualAssets = [asset, ...db.manualAssets];
    saveDatabase(db, dataDir);
    return res.json({ ok: true, asset });
  });

  app.delete('/api/manual-assets/:id', (req, res) => {
    const db = loadDatabase(dataDir);
    db.manualAssets = db.manualAssets.filter((m) => m.id !== req.params.id);
    saveDatabase(db, dataDir);
    return res.json({ ok: true });
  });

  // 6. Financial goals
  app.post('/api/goals', (req, res) => {
    const goal = req.body as FinancialGoal;
    if (!goal?.id || !goal?.title) {
      return res.status(400).json({ error: 'Invalid goal' });
    }
    const db = loadDatabase(dataDir);
    db.goals = [...db.goals, goal];
    saveDatabase(db, dataDir);
    return res.json({ ok: true, goal });
  });

  // 7. Cash flow logs
  app.post('/api/cashflows', (req, res) => {
    const record = req.body as CashflowMonth;
    if (!record?.monthYear) {
      return res.status(400).json({ error: 'Invalid cashflow record' });
    }
    const db = loadDatabase(dataDir);
    db.cashflows = [
      record,
      ...db.cashflows.filter((c) => c.monthYear !== record.monthYear),
    ];
    saveDatabase(db, dataDir);
    return res.json({ ok: true, record });
  });

  // 8. Family member profiles
  app.post('/api/family-members', (req, res) => {
    const member = req.body as FamilyMember;
    if (!member?.id || !member?.name) {
      return res.status(400).json({ error: 'Invalid family member' });
    }
    const db = loadDatabase(dataDir);
    db.familyMembers = [...db.familyMembers, member];
    saveDatabase(db, dataDir);
    return res.json({ ok: true, member });
  });

  // 9. Zerodha Kite Connect v3 Sync & AES-256-GCM Encrypted Token Persistence
  app.post('/api/kite/sync', async (req, res) => {
    try {
      const { apiKey, apiSecret, requestToken } = (req.body || {}) as {
        apiKey?: string;
        apiSecret?: string;
        requestToken?: string;
      };

      const db = loadDatabase(dataDir);

      const resolvedApiKey =
        apiKey ||
        (db.kiteCredentials?.apiKeyEncrypted
          ? decryptSecret(db.kiteCredentials.apiKeyEncrypted, dataDir)
          : db.kiteStatus.apiKey);
      const resolvedApiSecret =
        apiSecret ||
        (db.kiteCredentials?.apiSecretEncrypted
          ? decryptSecret(db.kiteCredentials.apiSecretEncrypted, dataDir)
          : '');
      const resolvedAccessToken = db.kiteCredentials?.accessTokenEncrypted
        ? decryptSecret(db.kiteCredentials.accessTokenEncrypted, dataDir)
        : '';

      const syncRes = await executeKiteSync({
        apiKey: resolvedApiKey,
        apiSecret: resolvedApiSecret,
        requestToken,
        accessToken: resolvedAccessToken,
      });

      // Persist encrypted credentials at rest if live credentials were used
      if (apiKey || apiSecret || syncRes.accessToken) {
        db.kiteCredentials = {
          apiKeyEncrypted: resolvedApiKey
            ? encryptSecret(resolvedApiKey, dataDir)
            : db.kiteCredentials?.apiKeyEncrypted,
          apiSecretEncrypted: resolvedApiSecret
            ? encryptSecret(resolvedApiSecret, dataDir)
            : db.kiteCredentials?.apiSecretEncrypted,
          accessTokenEncrypted: syncRes.accessToken
            ? encryptSecret(syncRes.accessToken, dataDir)
            : db.kiteCredentials?.accessTokenEncrypted,
        };
      }

      const nonKiteHoldings = db.holdings.filter((h) => h.platform !== 'ZERODHA_KITE');
      db.holdings = [...syncRes.holdings, ...nonKiteHoldings];
      db.kiteStatus = syncRes.accountStatus;
      saveDatabase(db, dataDir);

      return res.json({
        ok: true,
        mode: syncRes.mode,
        holdings: syncRes.holdings,
        accountStatus: syncRes.accountStatus,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Kite sync failed' });
    }
  });

  // 10. Reset ledger back to seeded Indian demo portfolio
  app.post('/api/reset-demo', (_req, res) => {
    const fresh = resetDatabase(dataDir);
    res.json({
      familyMembers: fresh.familyMembers,
      holdings: fresh.holdings,
      manualAssets: fresh.manualAssets,
      goals: fresh.goals,
      cashflows: fresh.cashflows,
      importBatches: fresh.importBatches,
      kiteStatus: fresh.kiteStatus,
    });
  });

  // Static / Vite middleware mounting
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const templatePath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  return new Promise((resolve) => {
    httpServer.listen(port, host, () => {
      const address = httpServer.address();
      const boundPort = typeof address === 'object' && address ? address.port : port;
      const url = `http://127.0.0.1:${boundPort}`;
      console.log(`KuberPulse server listening on ${url}`);
      resolve({ server: httpServer, port: boundPort, url });
    });
  });
}

if (!process.env.KUBERPULSE_EMBEDDED) {
  startServer().catch((err) => {
    console.error('Failed to start KuberPulse server:', err);
    process.exit(1);
  });
}
