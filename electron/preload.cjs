const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('kuberPulseDesktop', {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
  },
});
