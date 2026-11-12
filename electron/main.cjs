const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const net = require('net');

let mainWindow = null;
let serverInstance = null;

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.once('close', () => resolve(true)).close())
      .listen(port, '127.0.0.1');
  });
}

async function createDesktopWindow() {
  process.env.NODE_ENV = 'production';
  process.env.KUBERPULSE_EMBEDDED = '1';
  process.env.KUBERPULSE_DATA_DIR = app.getPath('userData');
  process.env.KUBERPULSE_DIST_DIR = path.join(__dirname, '..', 'dist');

  // Prefer port 3000 so Zerodha Kite Connect OAuth redirect URL (http://localhost:3000) works reliably
  const port = (await isPortFree(3000)) ? 3000 : 0;

  const { startServer } = require(path.join(__dirname, '..', 'dist-server', 'server.cjs'));
  const started = await startServer({
    port,
    host: '127.0.0.1',
    dataDir: process.env.KUBERPULSE_DATA_DIR,
    distDir: process.env.KUBERPULSE_DIST_DIR,
  });

  serverInstance = started.server;
  const appUrl = `http://localhost:${started.port}`;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'KuberPulse — Indian Wealth & Portfolio Tracker',
    backgroundColor: '#070a12',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links (except localhost OAuth callbacks) in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const menuTemplate = [
    {
      label: 'KuberPulse',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Open Local Data Folder',
          click: () => shell.openPath(app.getPath('userData')),
        },
        {
          label: 'Reset Demo Portfolio',
          click: async () => {
            const choice = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['Cancel', 'Reset Ledger'],
              defaultId: 0,
              title: 'Reset Local Ledger',
              message: 'Reset all holdings, goals, and cash flows back to the seeded sample dataset?',
            });
            if (choice.response === 1) {
              await fetch(`${appUrl}/api/reset-demo`, { method: 'POST' });
              mainWindow.reload();
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  await mainWindow.loadURL(appUrl);
}

app.whenReady().then(createDesktopWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createDesktopWindow();
  }
});

app.on('will-quit', () => {
  if (serverInstance) {
    serverInstance.close();
  }
});
