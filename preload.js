const { contextBridge } = require('electron');

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  app: 'serwaah-portal'
});
