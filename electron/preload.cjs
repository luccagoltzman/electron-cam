const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  isElectron: true,
});
